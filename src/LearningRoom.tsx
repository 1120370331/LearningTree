import { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, ClipboardList, FileText, GitBranch, HelpCircle, ListChecks, Pencil, Save, ShieldCheck, Sparkles, UnlockKeyhole, X } from "lucide-react";
import type { Data, QuizQuestion, Session } from "./domain";
import { Empty } from "./components";
import { evidence, newlyUnlocked } from "./progression";
import { lessons } from "./lessons";
import { gradeQuiz } from "./quiz";
import { skillIcon } from "./skill-icons";
import type { Actions } from "./pages";
import "./learning-room.css";

export function LearningRoom({data,nodeId,actions}:{data:Data;nodeId:string|null;actions:Actions}) {
  const topic=data.nodes.find(n=>n.id===nodeId);
  const [mode,setMode]=useState<"read"|"quiz"|"result">("read");
  const [note,setNote]=useState(topic?.note??"");
  const [noteSaved,setNoteSaved]=useState(false);
  const [questionIndex,setQuestionIndex]=useState(0);
  const [questions,setQuestions]=useState<QuizQuestion[]>([]);
  const [answers,setAnswers]=useState<number[]>([]);
  const [confidence,setConfidence]=useState(3);
  const [error,setError]=useState("");
  const [result,setResult]=useState<{session:Session;unlocked:{id:string;title:string}[];verified:boolean;score:number|null}|null>(null);
  const [onlyWrong,setOnlyWrong]=useState(false);
  const startedAt=useRef(Date.now()), submitting=useRef(false);
  useEffect(()=>setNote(topic?.note??""),[topic?.note]);
  if(!topic) return <Empty title="这个知识点已不存在" action="返回技能树" onAction={()=>actions.navigate("trees")}>选择一个知识点，继续学习。</Empty>;
  const course=data.trees.find(t=>t.id===topic.treeId);
  const Icon=skillIcon(topic.title);
  const demoLesson=data.demo?lessons[topic.id]:undefined;
  const content=topic.content || demoLesson?.content || (topic.answer ? `## 核心概念\n\n${topic.question}\n\n${topic.answer}\n\n## 练习与思考\n\n用你自己的例子解释这个概念，再把疑问记在旁边。` : "");
  const quiz=topic.quiz.length?topic.quiz:demoLesson?.quiz??[];
  const headings=content.split("\n").flatMap((line,i)=>line.startsWith("## ")?[{title:line.slice(3),id:`section-${i+1}`}]:[]);
  const answered=answers.filter(a=>a>=0).length;
  function startQuiz(){if(note!==topic!.note&&!actions.saveNote(topic!.id,note))return;setQuestions(structuredClone(quiz));setAnswers(quiz.map(()=>-1));setQuestionIndex(0);setError("");setResult(null);setOnlyWrong(false);submitting.current=false;setMode("quiz");window.scrollTo({top:0});}
  function submit(){
    if(submitting.current || !topic) return;
    if(JSON.stringify(quiz)!==JSON.stringify(questions)){setError("题目内容已更新，请返回学习界面重新开始测验。");return;}
    submitting.current=true;
    try {
      const session=gradeQuiz(topic.id,questions,answers,(Date.now()-startedAt.current)/60000,confidence);
      const next={...data,sessions:[...data.sessions,session]};
      if(!actions.recordQuiz(session)){submitting.current=false;setError("成绩尚未保存。你的答案已保留，请重试。");return;}
      const progress=evidence(next,topic.id);
      setResult({session,unlocked:newlyUnlocked(data,next).map(n=>({id:n.id,title:n.title})),verified:progress.verified,score:progress.score});
      setMode("result");window.scrollTo({top:0});
    } catch(error){submitting.current=false;setError(error instanceof Error?error.message:"提交失败，请重试");}
  }
  function backToReading(){if(mode!=="quiz" || answered===0 || window.confirm("返回学习会放弃当前未提交的答案，是否继续？")){setMode("read");setError("");window.scrollTo({top:0});}}
  const current=questions[questionIndex];
  return <div className="learning-room">
    <div className="lesson-breadcrumb"><button onClick={()=>actions.select(topic.id)}><ArrowLeft size={15}/>技能树</button><ChevronRight size={12}/><span>{course?.title}</span><ChevronRight size={12}/><strong>{topic.title}</strong></div>
    <div className="lesson-heading"><div className="lesson-title"><span className="lesson-icon"><Icon size={25}/></span><div><span className="section-kicker">{mode==="read"?"LEARN & UNDERSTAND":mode==="quiz"?"CHECK YOUR UNDERSTANDING":"YOUR LEARNING FEEDBACK"}</span><h1>{mode==="read"?topic.title:mode==="quiz"?`${topic.title} · 课后测验`:"测验反馈"}</h1></div></div><div className="learning-steps"><span className={mode==="read"?"active":"done"}><i>{mode!=="read"?<Check size={11}/>:1}</i>学习</span><ChevronRight size={11}/><span className={mode==="quiz"?"active":mode==="result"?"done":""}><i>{mode==="result"?<Check size={11}/>:2}</i>测验</span><ChevronRight size={11}/><span className={mode==="result"?"active":""}><i>3</i>反馈</span></div></div>
    {mode==="read"?<div className="lesson-layout"><article className="lesson-article"><div className="lesson-article-top"><span><BookOpen size={14}/>学习内容</span><button className="text-button" onClick={()=>actions.topic(topic.treeId,topic)}><Pencil size={12}/>编辑内容</button></div>{content?<div className="markdown-content"><Markdown components={{h2:({node,children})=><h2 id={`section-${node?.position?.start.line}`}>{children}</h2>,a:({href,children})=><a href={href} target="_blank" rel="noreferrer">{children}</a>}}>{content}</Markdown></div>:<Empty title="为这个知识点添加学习内容" action="编辑学习内容" onAction={()=>actions.topic(topic.treeId,topic)}>可以粘贴 Markdown 讲义、概念解释和练习，再配置下方的测验题。</Empty>}
      {topic.resource&&<a className="lesson-resource" href={topic.resource} target="_blank" rel="noreferrer"><FileText size={19}/><span><strong>继续阅读学习资料</strong><small>在新标签页中打开你保存的资料</small></span><ArrowRight size={16}/></a>}
      <div className="reading-end"><ShieldCheck size={22}/><div><strong>读完了，试着验证一下。</strong><p>{quiz.length?`本节有 ${quiz.length} 道题。提交后可以查看逐题解析和新解锁的节点。`:"这个节点还没有测验题。你可以在编辑器中添加题目、选项和解析。"}</p></div></div>
    </article><aside className="lesson-aside"><section className="lesson-toc"><h3><ListChecks size={16}/>本节导航</h3>{headings.map((h,i)=><a key={h.id} href={`#${h.id}`}><small>{String(i+1).padStart(2,"0")}</small>{h.title}</a>)}</section><section className="lesson-notes"><h3><Pencil size={15}/>我的笔记</h3><p>写一个自己的例子，或记下还没弄懂的地方。</p><textarea aria-label="本节学习笔记" maxLength={4000} rows={7} placeholder="我的理解是…" value={note} onChange={e=>{setNote(e.target.value);setNoteSaved(false);}}/><div><span>{note.length}/4000</span><button className="button small" onClick={()=>setNoteSaved(actions.saveNote(topic.id,note))}>{noteSaved?<Check size={13}/>:<Save size={13}/>} {noteSaved?"已保存":"保存笔记"}</button></div></section><div className="lesson-rule"><Sparkles size={17}/><p>最近自测正确率达到 80%，且累计至少 5 题，即可点亮节点和后续路线。</p></div></aside></div>:mode==="quiz"&&current?<div className="quiz-layout"><section className="question-card"><div className="question-meta"><span>单项选择</span><strong>第 {questionIndex+1} 题 <small>/ {questions.length}</small></strong></div><div className="quiz-progress"><i style={{width:`${answered/questions.length*100}%`}}/></div><h2>{current.prompt}</h2><fieldset className="quiz-options"><legend className="sr-only">选择一个答案</legend>{current.options.map((option,index)=><label key={index} className={answers[questionIndex]===index?"chosen":""}><input type="radio" name={`question-${current.id}`} checked={answers[questionIndex]===index} onChange={()=>setAnswers(prev=>prev.map((a,i)=>i===questionIndex?index:a))}/><span className="option-letter">{String.fromCharCode(65+index)}</span><span>{option}</span>{answers[questionIndex]===index&&<CheckCircle2 size={17}/>}</label>)}</fieldset><p className="quiz-question-hint"><HelpCircle size={13}/>提交全部题目后统一展示答案与解析。</p>{error&&<p className="form-error" role="alert">{error}</p>}</section><aside className="quiz-aside"><section className="question-navigation"><h3>答题进度<span>{answered}/{questions.length}</span></h3><div>{questions.map((q,i)=><button key={q.id} className={`${answers[i]>=0?"answered":""} ${questionIndex===i?"current":""}`} onClick={()=>setQuestionIndex(i)} aria-label={`跳到第 ${i+1} 题`}>{i+1}</button>)}</div><p>蓝色表示已作答，可随时回看并修改。</p></section><section className="quiz-confidence"><h3>对本节内容有多大信心？</h3><p>自我感受会与实际成绩分开记录。</p><div>{[1,2,3,4,5].map(n=><button key={n} aria-label={`信心 ${n} 分`} aria-pressed={confidence===n} className={confidence===n?"selected":""} onClick={()=>setConfidence(n)}>{n}</button>)}</div><span>1 不太确定<span>5 很有把握</span></span></section></aside></div>:result?<div className="assessment-result"><section className="result-summary"><div className={`result-score ${(result.session.correct??0)/result.session.total!>=.8?"passed":""}`}><strong>{Math.round((result.session.correct??0)/result.session.total!*100)}<small>%</small></strong><span>本次正确率</span></div><div><span className="section-kicker">ASSESSMENT COMPLETE</span><h2>{result.unlocked.length?"验证通过，新路线已解锁。":result.verified?"继续保持，理解更扎实了。":"找到了薄弱点，就是下一步的起点。"}</h2><p>答对 {result.session.correct} / {result.session.total} 题 · 近期加权正确率 {result.score}% · 本次记录 {result.session.minutes} 分钟</p><span className="result-rule">{result.verified?"节点已通过验证。接下来可以学习新节点，或用间隔复习巩固记忆。":"先回看错题解析，再学习一次。节点验证需要近期加权正确率 ≥ 80% 且累计至少 5 题。"}</span></div></section>{result.unlocked.length>0&&<section className="new-paths"><h3><UnlockKeyhole size={17}/>新解锁的节点</h3><div>{result.unlocked.map(n=><button key={n.id} onClick={()=>actions.learn(n.id)}><GitBranch size={17}/><span>{n.title}<small>点击开始学习</small></span><ArrowRight size={15}/></button>)}</div></section>}<section className="answer-review"><div className="answer-review-heading"><h2><ClipboardList size={17}/>逐题反馈</h2><button className={`button small ${onlyWrong?"active":""}`} aria-pressed={onlyWrong} onClick={()=>setOnlyWrong(v=>!v)}>{onlyWrong?"查看全部":"只看错题"}</button></div>{result.session.quizAnswers?.map((answer,i)=>(onlyWrong&&answer.isCorrect)?null:<article className={answer.isCorrect?"correct":"incorrect"} key={i}><div><span>{answer.isCorrect?<Check size={16}/>:<X size={16}/>}</span><h3>{i+1}. {answer.question}</h3></div><p><span>你的答案</span>{answer.selected}</p>{!answer.isCorrect&&<p><span>正确答案</span>{answer.correct}</p>}<div className="answer-explanation"><strong>解析</strong><p>{answer.explanation||"对照正确答案，重新解释你的判断依据。"}</p></div></article>)}{onlyWrong&&result.session.correct===result.session.total&&<div className="no-errors"><CheckCircle2 size={25}/><p>这次全部答对了。</p></div>}</section></div>:null}
    <div className="learning-bottom-bar"><div className="learning-bottom-inner"><div className="bottom-learning-status"><span><Icon size={18}/></span><div><strong>{topic.title}</strong><small>{mode==="read"?"先理解，再验证。准备好后进入本节测验。":mode==="quiz"?`已完成 ${answered} / ${questions.length} 题`:"成绩已保存，学习树已同步更新。"}</small></div></div><div className="bottom-learning-actions">{mode==="read"?<>{quiz.length>0&&<span className="quiz-count">{quiz.length} 道测验题</span>}<button className="button primary" onClick={quiz.length?startQuiz:()=>actions.topic(topic.treeId,topic)}><ClipboardList size={16}/>{quiz.length?"开始测验":"添加测验题"}<ArrowRight size={15}/></button></>:mode==="quiz"?<><button className="text-button" onClick={backToReading}>返回学习</button><button className="button" disabled={questionIndex===0} onClick={()=>setQuestionIndex(i=>i-1)}>上一题</button>{questionIndex===questions.length-1?<button className="button primary" disabled={answered!==questions.length} onClick={submit}>提交测验<Check size={15}/></button>:<button className="button primary" disabled={answers[questionIndex]<0} onClick={()=>setQuestionIndex(i=>i+1)}>下一题<ArrowRight size={15}/></button>}</>:<><button className="button" onClick={backToReading}><BookOpen size={15}/>返回学习</button><button className="button primary" onClick={()=>actions.select(topic.id)}>查看技能树<ArrowRight size={15}/></button></>}</div></div></div>
  </div>;
}
