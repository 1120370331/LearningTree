import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowRight, ChevronDown, Settings2, BookOpen, Check, ChevronRight, Clock3, Crosshair, Flag, GitBranch, Layers3, List, LockKeyhole, Network, Pencil, Play, Plus, Route, ShieldCheck, Sparkles, Target, Trash2, Trophy } from "lucide-react";
import type { Data, Topic } from "./domain";
import { dateText, dueText, Empty } from "./components";
import { evidence, nextSkill, routeTo, skillLabels, skillState } from "./progression";
import { skillIcon } from "./skill-icons";
import { SkillTree } from "./SkillTree";
import type { Actions } from "./pages";

export function Trees({data,actions,treeId,setTreeId,selectedId}: {data:Data;actions:Actions;treeId:string;setTreeId:(id:string)=>void;selectedId:string|null}) {
  const [menuOpen,setMenuOpen]=useState(false);
  const [routeOnly,setRouteOnly]=useState(false);
  const navigationRef=useRef<HTMLDivElement>(null);
  const tree=data.trees.find(t=>t.id===treeId) ?? data.trees[0];
  const nodes=data.nodes.filter(n=>n.treeId===tree?.id);
  const selected=nodes.find(n=>n.id===selectedId) ?? (tree ? nextSkill(data,tree.id):undefined);
  const cleared=nodes.filter(n=>evidence(data,n.id).verified).length;
  useEffect(()=>{setRouteOnly(false);setMenuOpen(false);},[treeId]);
  useEffect(()=>{
    const close=(event:PointerEvent)=>{if(navigationRef.current&&!navigationRef.current.contains(event.target as globalThis.Node))setMenuOpen(false);};
    const escape=(event:KeyboardEvent)=>{if(event.key==="Escape")setMenuOpen(false);};
    document.addEventListener("pointerdown",close);document.addEventListener("keydown",escape);
    return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",escape);};
  },[]);
  return <div className="constellation-workspace">
    <section className="constellation-stage" aria-label="项目技能地图">
      <div className="project-navigation" ref={navigationRef}>
        <button className="project-switcher" aria-label="项目导航" aria-expanded={menuOpen} aria-controls="project-menu" onClick={()=>setMenuOpen(v=>!v)}><span className="project-logo"><Network size={20}/></span><span><small>LEARNINGTREE / PROJECT</small><strong>{tree?.title??"选择学习项目"}</strong></span><ChevronDown size={16}/></button>
        {menuOpen&&<div className="project-menu" id="project-menu"><div className="project-menu-title">我的学习项目</div>{data.trees.map(t=><button key={t.id} className={tree?.id===t.id?"active":""} onClick={()=>{setTreeId(t.id);setMenuOpen(false);}}><GitBranch size={16}/><span>{t.title}<small>{data.nodes.filter(n=>n.treeId===t.id).length} 个节点</small></span>{tree?.id===t.id&&<Check size={14}/>}</button>)}<button onClick={()=>{setMenuOpen(false);actions.tree();}}><Plus size={16}/><span>新建学习项目</span></button><div className="project-menu-divider"/>{[{page:"home" as const,title:"学习概览",icon:Layers3},{page:"reviews" as const,title:"复习挑战",icon:BookOpen},{page:"feedback" as const,title:"学习反馈",icon:Target},{page:"journal" as const,title:"学习日志",icon:List},{page:"settings" as const,title:"偏好与数据",icon:Settings2}].map(item=><button key={item.page} onClick={()=>actions.navigate(item.page)}><item.icon size={16}/><span>{item.title}</span><ChevronRight size={13}/></button>)}{tree&&<><div className="project-menu-divider"/><button onClick={()=>{setMenuOpen(false);actions.tree(tree);}}><Pencil size={15}/><span>编辑当前项目</span></button><button className="menu-danger" onClick={()=>{setMenuOpen(false);actions.deleteTree(tree.id);}}><Trash2 size={15}/><span>删除当前项目</span></button></>}</div>}
        {tree&&<div className="project-caption"><span>{cleared} / {nodes.length} 已验证</span><span className="caption-divider"/>{data.demo?<span>示例项目</span>:<span>个人学习项目</span>}</div>}
      </div>
      {tree?<><div className="map-quick-actions"><button className={`map-quick-button ${routeOnly?"active":""}`} aria-label="只看当前路线" aria-pressed={routeOnly} onClick={()=>setRouteOnly(v=>!v)}><Route size={16}/><span>当前路线</span></button><button className="map-quick-button" onClick={()=>actions.topic(tree.id)}><Plus size={16}/><span>添加节点</span></button></div><SkillTree data={data} tree={tree} selected={selected?.id} onSelect={actions.select} routeOnly={routeOnly}/></>:<div className="new-project-map"><Empty title="创建你的第一个学习项目" action="新建学习项目" onAction={()=>actions.tree()}>从学习目标出发，组织内容、测验和成长路线。</Empty></div>}
    </section>
    <section className="command-center" aria-label="任务指挥台"><SkillInspector key={selected?.id??"none"} data={data} node={selected} actions={actions} onLearn={actions.learn}/></section>
  </div>;
}
function SkillInspector({data,node,actions,onLearn}:{data:Data;node:Topic|undefined;actions:Actions;onLearn:(id:string)=>void}) {
  const [tab,setTab]=useState("mission");
  if(!node) return <aside className="skill-inspector"><div className="inspector-empty"><Crosshair size={30}/><h3>选择一个知识点</h3><p>在地图中查看它的前置路线、学习任务和成长证据。</p></div></aside>;
  const progress=evidence(data,node.id),state=skillState(data,node),Icon=skillIcon(node.title),path=routeTo(data,node.id);
  const parent=data.nodes.find(n=>n.id===node.parentId);
  const sessions=data.sessions.filter(s=>s.nodeId===node.id).sort((a,b)=>b.at.localeCompare(a.at));
  const reviews=data.reviews.filter(r=>r.nodeId===node.id).sort((a,b)=>b.at.localeCompare(a.at));
  return <aside className="skill-inspector"><div className="inspector-top"><span className="command-title"><Crosshair size={13}/>任务指挥台</span><button className="icon-button" aria-label="编辑知识点" onClick={()=>actions.topic(node.treeId,node)}><Pencil size={15}/></button></div>
    <div className={`inspector-emblem ${state}`}><Icon size={30} strokeWidth={1.5}/>{progress.rank>=2&&<span><Check size={11}/></span>}</div><div className={`state-pill ${state}`}>{state==="locked"?<LockKeyhole size={11}/>:progress.rank>=2?<ShieldCheck size={12}/>:<Sparkles size={12}/>} {skillLabels[state]}</div><h2>{node.title}</h2>
    <div className="rank-milestones">{[{label:"探索",icon:BookOpen},{label:"验证",icon:ShieldCheck},{label:"巩固",icon:Trophy}].map((m,i)=><div key={m.label} className={progress.rank>=i+1?"earned":""}><span>{progress.rank>=i+1?<Check size={12}/>:<m.icon size={12}/>}</span><small>{m.label}</small></div>)}</div>
    <div className="inspector-tabs">{[["mission","学习任务"],["notes","笔记"],["history","历程"]].map(([key,label])=><button key={key} className={tab===key?"active":""} onClick={()=>setTab(key)}>{label}{key==="history"&&<small>{sessions.length+reviews.length}</small>}</button>)}</div>
    <div className="inspector-body">{tab==="mission"?<>
      <div className="mission-title"><Target size={14}/><h3>当前学习任务</h3></div><p className="challenge-copy">{node.question || `用自己的话解释「${node.title}」，然后完成一次自测。`}</p>
      <div className="requirements"><div className={progress.questions>=5?"met":""}><span>{progress.questions>=5?<Check size={12}/>:<span/>}</span><p>累计完成至少 5 道自测题</p><b>{Math.min(progress.questions,5)}/5</b></div><div className={progress.verified?"met":""}><span>{progress.verified?<Check size={12}/>:<span/>}</span><p>近期加权正确率达到 80%</p><b>{progress.score===null?"—":`${progress.score}%`}</b></div></div>
      <div className="verification-meter"><i style={{width:`${progress.score??0}%`}}/><span style={{left:"80%"}}/></div><p className="criteria-note">取最近 5 次自测；节点等级依据真实记录计算。</p>
      {parent&&<div className="prerequisite"><span><GitBranch size={13}/>前置路线</span><div className="route-crumbs">{path.slice(0,-1).map(p=><button key={p.id} onClick={()=>actions.select(p.id)} className={evidence(data,p.id).verified?"passed":""}>{evidence(data,p.id).verified?<Check size={11}/>:<LockKeyhole size={10}/>} {p.title}<ChevronRight size={11}/></button>)}</div></div>}
      {progress.verified&&node.question&&node.answer&&<button className="recall-callout" onClick={()=>actions.navigate("reviews")}><RotateIcon/><span>下一次主动回忆<strong>{dueText(node.card.due)}</strong></span><ArrowRight size={14}/></button>}
      <div className="inspector-metrics"><div><strong>{progress.minutes}<small> 分钟</small></strong><span>累计学习</span></div><div><strong>{sessions.length}<small> 次</small></strong><span>学习记录</span></div></div>
    </>:tab==="notes"?<><div className="mission-title"><BookOpen size={14}/><h3>我的理解</h3></div><p className="note-content">{node.note||"记下一个解释、一处困惑，或者你自己的例子。"}</p>{node.resource&&<a href={node.resource} target="_blank" rel="noreferrer" className="resource-link">打开学习资料<ArrowDownRight size={14}/></a>}<button className="button small" onClick={()=>actions.topic(node.treeId,node)}><Pencil size={13}/>编辑笔记和回忆题</button></>:<div className="node-timeline">{[...sessions.map(s=>({id:s.id,at:s.at,title:`学习 ${s.minutes} 分钟`,detail:s.total?`自测 ${s.correct}/${s.total} · ${s.note}`:s.note})),...reviews.map(r=>({id:r.id,at:r.at,title:"完成主动回忆",detail:["","没想起来","有些吃力","基本记得","轻松记得"][r.rating]}))].sort((a,b)=>b.at.localeCompare(a.at)).map(r=><article key={r.id}><i/><time>{dateText(r.at,true)}</time><strong>{r.title}</strong><p>{r.detail}</p></article>)}{!sessions.length&&!reviews.length&&<p className="empty-history">完成第一次探索，这里就会留下你的进步。</p>}</div>}</div>
    <div className="inspector-actions">{state==="locked"&&parent?<><button className="button primary" onClick={()=>actions.select(parent.id)}><LockKeyhole size={14}/>前往前置节点</button><button className="text-button" onClick={()=>onLearn(node.id)}>我想提前探索此节点<ArrowRight size={12}/></button></>:<><button className="button primary" onClick={()=>onLearn(node.id)}><Play size={14} fill="currentColor"/>开始学习<ArrowRight size={14}/></button><button className="button" onClick={()=>actions.study(node.id)}><Plus size={14}/>补记学习记录</button></>}<div className="inspector-secondary"><button onClick={()=>actions.topic(node.treeId,undefined,node.id)}><Plus size={12}/>延伸节点</button><button aria-label="删除这个知识点" onClick={()=>actions.deleteTopic(node.id)}><Trash2 size={13}/></button></div></div>
  </aside>;
}
function RotateIcon(){return <Clock3 size={17}/>;}
