import { uid, type QuizQuestion, type Session } from "./domain";

export function gradeQuiz(nodeId:string, questions:QuizQuestion[], selections:number[], minutes:number, confidence:number, now=new Date()):Session {
  if(!questions.length || questions.length!==selections.length || questions.some((q,i)=>!Number.isInteger(selections[i]) || selections[i]<0 || selections[i]>=q.options.length)) throw new Error("请完成所有题目后再提交");
  const quizAnswers=questions.map((q,i)=>({question:q.prompt,selected:q.options[selections[i]],correct:q.options[q.correctIndex],explanation:q.explanation,isCorrect:selections[i]===q.correctIndex}));
  return {id:uid(),nodeId,at:now.toISOString(),minutes:Math.max(1,Math.min(720,Math.round(minutes))),confidence,correct:quizAnswers.filter(a=>a.isCorrect).length,total:questions.length,note:`完成节点测验：${quizAnswers.filter(a=>a.isCorrect).length}/${questions.length}。`,quizAnswers};
}
