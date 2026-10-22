import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Background, BackgroundVariant, BaseEdge, Handle, MiniMap, Panel, Position, ReactFlow, ReactFlowProvider, getSmoothStepPath, useReactFlow, useViewport, type Edge, type EdgeProps, type Node, type NodeProps, type Viewport } from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import { Check, Crosshair, Expand, LockKeyhole, Minus, Plus, Route, Scan, Trophy } from "lucide-react";
import { evidence, nextSkill, routeTo, skillLabels, skillState, type SkillState } from "./progression";
import type { Data, Tree } from "./domain";
import { skillIcon } from "./skill-icons";
import "@xyflow/react/dist/style.css";
import "./skill-tree.css";

type SkillNode = Node<{ title: string; state: SkillState; rank: number; score: number | null; active: boolean; dim: boolean; due: boolean }, "skill">;
const nodeTypes = { skill: SkillNodeView };
const edgeTypes = { circuit: CircuitEdge };
const viewports = new Map<string, Viewport>();

function SkillNodeView({ data }: NodeProps<SkillNode>) {
  const Icon=skillIcon(data.title);
  return <div className={`skill-node ${data.state} ${data.active ? "is-selected" : ""} ${data.dim ? "is-dim" : ""}`}>
    <Handle type="target" position={Position.Left} />
    <div className="skill-emblem">
      <div className="skill-orbit" />
      <div className="skill-hex"><Icon size={27} strokeWidth={1.5}/></div>
      {data.state === "locked" ? <span className="skill-badge"><LockKeyhole size={10}/></span> : data.rank>=2 ? <span className="skill-badge"><Check size={12}/></span> : data.due && <span className="skill-due" title="有待复习题目"/>}
    </div>
    <strong>{data.title}</strong>
    <div className="skill-rank" aria-label={`成长阶段 ${data.rank} / 3`}>{[1,2,3].map(n=><i key={n} className={data.rank>=n ? "earned" : ""}/>)}</div>
    <span className="skill-state">{data.score!==null ? `自测 ${data.score}%` : skillLabels[data.state]}</span>
    <Handle type="source" position={Position.Right}/>
  </div>;
}
function CircuitEdge(props: EdgeProps) {
  const [path]=getSmoothStepPath({ ...props, borderRadius:18, offset:28 });
  return <><BaseEdge path={path} style={props.style} interactionWidth={0}/>{props.data?.active===true && <path d={path} className="route-energy" fill="none"/>}</>;
}
function buildGraph(data: Data, tree: Tree, selected: string | undefined, routeOnly: boolean, compact: boolean) {
  const topics=data.nodes.filter(n=>n.treeId===tree.id);
  const graph=new dagre.graphlib.Graph().setDefaultEdgeLabel(()=>({}));
  graph.setGraph({ rankdir:"LR", ranksep:65, nodesep:35, marginx:80, marginy:70 });
  topics.forEach(n=>graph.setNode(n.id,{width:170,height:150}));
  topics.forEach(n=>{ if(n.parentId) graph.setEdge(n.parentId,n.id); });
  dagre.layout(graph);
  const route=new Set(selected ? routeTo(data,selected).map(n=>n.id) : []);
  const now=Date.now();
  const nodes: SkillNode[]=topics.map(n=>{
    const p=graph.node(n.id), progress=evidence(data,n.id);
    return { id:n.id,type:"skill", position:{x:p.x-85,y:p.y-75},width:170,height:150, draggable:false, focusable:true, ariaLabel:`${n.title}，${skillLabels[skillState(data,n)]}`, data:{title:n.title,state:skillState(data,n),rank:progress.rank,score:progress.score,active:selected===n.id,dim:routeOnly&&!route.has(n.id),due:!!n.question&&!!n.answer&&new Date(n.card.due).getTime()<=now} };
  });
  const edges: Edge[]=topics.filter(n=>n.parentId).map(n=>{
    const active=route.has(n.id)&&route.has(n.parentId!);
    const unlocked=skillState(data,n)!=="locked";
    return {id:`${n.parentId}:${n.id}`,source:n.parentId!,target:n.id,type:"circuit",data:{active:active&&!compact},style:{stroke:active?"#367af5":unlocked?"#87ace7":"#d5dfec",strokeWidth:active?2.5:1.5,strokeDasharray:unlocked?undefined:"4 6",opacity:routeOnly&&!active ? 0.15 : 1} as CSSProperties};
  });
  return {nodes,edges};
}

export function SkillTree(props: { data:Data; tree:Tree; onSelect:(id:string)=>void; compact?:boolean; selected?:string; routeOnly?:boolean }) {
  return <ReactFlowProvider key={props.tree.id}><MapView {...props}/></ReactFlowProvider>;
}
function MapView({data,tree,onSelect,compact=false,selected,routeOnly=false}: {data:Data;tree:Tree;onSelect:(id:string)=>void;compact?:boolean;selected?:string;routeOnly?:boolean}) {
  const [expanded,setExpanded]=useState(false);
  const [ready,setReady]=useState(false);
  const container=useRef<HTMLDivElement>(null);
  const flow=useReactFlow<SkillNode>();
  const {zoom}=useViewport();
  const effective=selected ?? nextSkill(data,tree.id)?.id;
  const graph=useMemo(()=>buildGraph(data,tree,effective,routeOnly,compact),[data,tree,effective,routeOnly,compact]);
  const reduced=typeof matchMedia!=="undefined"&&matchMedia("(prefers-reduced-motion: reduce)").matches;
  const focus=useCallback(()=>{
    const target=flow.getNode(effective??"");
    const rect=container.current?.getBoundingClientRect();
    if(target&&rect) {const scale=compact?0.72:0.9;flow.setViewport({x:rect.width/2-(target.position.x+170)*scale,y:rect.height/2-(target.position.y+60)*scale,zoom:scale},{duration:reduced?0:320});}
  },[flow,effective,compact,reduced]);
  const fit=useCallback(()=>flow.fitView({padding:compact?.17:.16,duration:reduced?0:420,maxZoom:1}),[flow,compact,reduced]);
  useEffect(()=>{
    if(!ready) return;
    const saved=viewports.get(`${tree.id}:${compact}`);
    const frame=requestAnimationFrame(()=>{
      if(saved) flow.setViewport(saved);
      else if(compact) flow.fitView({padding:.18,maxZoom:.85});
      else focus();
    });
    return ()=>cancelAnimationFrame(frame);
    // Only establish the camera on mount. Selecting a node must not reset the user's pan.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[ready,tree.id,compact]);
  useEffect(()=>{
    if(!expanded) return;
    const original=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return ()=>{document.body.style.overflow=original;};
  },[expanded]);
  return <div ref={container} className={`skill-map ${compact?"is-compact":""} ${expanded?"is-expanded":""}`} onKeyDown={event=>{
    if((event.target as HTMLElement).closest("input,textarea,select")) return;
    if(event.key==="Escape") setExpanded(false);
    if(event.key==="Enter"||event.key===" ") {
      const id=(event.target as HTMLElement).closest(".react-flow__node")?.getAttribute("data-id");
      if(id) {event.preventDefault();onSelect(id);}
    }
    if(event.key.toLowerCase()==="f") {event.preventDefault();fit();}
    if(event.key==="+") flow.zoomIn({duration:160});
    if(event.key==="-") flow.zoomOut({duration:160});
  }}>
    <ReactFlow<SkillNode> nodes={graph.nodes} edges={graph.edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onInit={()=>setReady(true)} onNodeClick={(_,node)=>onSelect(node.id)} onNodeDoubleClick={(_,node)=>flow.setCenter(node.position.x+85,node.position.y+75,{zoom:1.15,duration:reduced?0:300})} nodesDraggable={false} nodesConnectable={false} edgesFocusable={false} nodesFocusable={true} elementsSelectable={false} selectNodesOnDrag={false} panOnDrag={true} zoomOnScroll={true} zoomOnPinch={true} zoomOnDoubleClick={false} minZoom={.3} maxZoom={1.6} preventScrolling={!compact} onMoveEnd={(_,viewport)=>viewports.set(`${tree.id}:${compact}`,viewport)} colorMode="light" aria-label={`${tree.title}，可拖拽和缩放的技能地图`}>
      <Background variant={BackgroundVariant.Dots} color="#cfdbed" gap={24} size={1}/>
      {!compact && <Panel position="top-left" className="map-caption"><span className="map-live"/><span>SKILL CONSTELLATION</span><small>{graph.nodes.length} NODES</small></Panel>}
      {!compact && <Panel position="top-right"><button className="map-button" aria-label={expanded?"退出全屏地图":"展开全屏地图"} onClick={()=>setExpanded(v=>!v)}><Expand size={16}/></button></Panel>}
      {!compact && <MiniMap pannable zoomable nodeColor={n=>{const state=(n as SkillNode).data.state; return state==="verified"||state==="consolidated"?"#4f85e9":state==="locked"?"#d1dcea":"#9bbcf6";}} nodeStrokeWidth={0} nodeBorderRadius={4} maskColor="rgba(232,240,253,.65)" ariaLabel="技能树导航小地图"/>}
      <Panel position="bottom-left" className="map-bottom"><div className="map-controls"><button onClick={()=>flow.zoomOut({duration:160})} aria-label="缩小地图"><Minus size={16}/></button><span>{Math.round(zoom*100)}%</span><button onClick={()=>flow.zoomIn({duration:160})} aria-label="放大地图"><Plus size={16}/></button><i/><button onClick={fit} aria-label="适应全图" title="适应全图 · F"><Scan size={17}/></button><button onClick={focus} aria-label="定位当前节点" title="定位当前节点"><Crosshair size={17}/></button></div>{!compact && <span className="map-hint">拖动探索 · 滚轮缩放 · 双击聚焦</span>}</Panel>
      {!compact && <Panel position="top-center" className="map-legend"><span><i className="verified"/>已验证</span><span><i className="learning"/>探索中</span><span><i className="available"/>可挑战</span><span><LockKeyhole size={10}/>待解锁</span></Panel>}
      {!graph.nodes.length && <Panel position="top-center" className="empty-map"><Trophy size={34}/><h3>你的技能树从这里开始</h3><p>添加第一个知识点，建立自己的成长路线。</p></Panel>}
      {routeOnly && !compact && <Panel position="bottom-center" className="route-mode"><Route size={13}/>正在高亮前置路线</Panel>}
    </ReactFlow>
  </div>;
}
