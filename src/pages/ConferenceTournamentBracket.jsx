import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {ChevronDown,ChevronLeft,Maximize2,Minus,Plus,Trophy} from "lucide-react";
import {useNavigate,useParams,useSearchParams} from "react-router-dom";
import PageHeader from "../components/PageHeader";
import acc from "../assets/conference-badges/acc.png";
import american from "../assets/conference-badges/american.png";
import big12 from "../assets/conference-badges/big-12.png";
import bigEast from "../assets/conference-badges/big-east.png";
import bigTen from "../assets/conference-badges/big-ten.png";
import cusa from "../assets/conference-badges/c-usa.png";
import coastal from "../assets/conference-badges/coastal.png";
import ivy from "../assets/conference-badges/ivy.png";
import mac from "../assets/conference-badges/mac.png";
import mountainWest from "../assets/conference-badges/mountain-west.png";
import ovc from "../assets/conference-badges/ovc.png";
import sec from "../assets/conference-badges/sec.png";
import sunBelt from "../assets/conference-badges/sun-belt.png";
import westCoast from "../assets/conference-badges/west-coast.png";
import "../styles/conferenceTournamentBracket.css";
const API_URL="https://script.google.com/macros/s/AKfycbwoKZvZRLo7POCjuaD56mvYKaL_AZdfbG04xkoF0XZKqiGYZjD3TmEFuNK8tDwr_K4B/exec";
const DEFAULT_SEASON=2027,CANVAS_W=2480,CANVAS_H=980,CARD_W=250,CARD_H=104;
const CONFIG={acc:["ACC Tournament",12,acc],american:["AAC Tournament",12,american],"big-12":["Big 12 Tournament",12,big12],"big-east":["Big East Tournament",12,bigEast],"big-ten":["Big Ten Tournament",12,bigTen],ivy:["Ivy League Tournament",12,ivy],mac:["MAC Tournament",12,mac],"mountain-west":["Mountain West Tournament",12,mountainWest],sec:["SEC Tournament",12,sec],"sun-belt":["Sun Belt Tournament",12,sunBelt],coastal:["Coastal Tournament",16,coastal],"c-usa":["Conference USA Tournament",16,cusa],ovc:["Ohio Valley Tournament",16,ovc],"west-coast":["West Coast Tournament",16,westCoast]};
const LAYOUT={left:{r1:{x:30,ys:[115,315,565,765]},qf:{x:400,ys:[215,665]},sf:{x:780,ys:[440]}},right:{r1:{x:2200,ys:[115,315,565,765]},qf:{x:1830,ys:[215,665]},sf:{x:1450,ys:[440]}},champ:{x:1115,y:440}};
function clean(v){return String(v??"").trim();}function seasonLabel(s){return `${s-1}–${String(s).slice(-2)}`;}
function TeamLine({team,final=false,winner=false}){const name=clean(team?.name)||"TBD",seed=Number(team?.seed)||0,rank=Number(team?.rank)||0,score=team?.score??"—",projected=team?.projectedScore??"—";return <div className={`ctb-team${name==="TBD"?" ctb-team--tbd":""}${final&&!winner?" ctb-team--loser":""}${winner?" ctb-team--winner":""}`}><span className="ctb-seed">{seed||"—"}</span><span className="ctb-logo">{team?.logoUrl?<img src={team.logoUrl} alt=""/>:<span>?</span>}</span><span className="ctb-team-copy"><strong>{rank?`#${rank} · `:""}{name}</strong><small>{clean(team?.coachName)||"Matchup pending"}</small></span><span className="ctb-score"><strong>{score}</strong><small>Proj {projected}</small></span></div>;}
function Matchup({game,onOpen,clickable}){if(!game)return <div className="ctb-matchup ctb-matchup--empty"><TeamLine team={null}/><TeamLine team={null}/><div className="ctb-status">MATCHUP PENDING</div></div>;const final=clean(game.status).toLowerCase()==="final",winner=clean(game.winnerFranchiseId),isWinner=t=>final&&winner&&clean(t?.franchiseId)===winner;const content=<><TeamLine team={game.team1} final={final} winner={isWinner(game.team1)}/><TeamLine team={game.team2} final={final} winner={isWinner(game.team2)}/><div className="ctb-status">{clean(game.status)||"Scheduled"}{clickable?" · VIEW GAME":""}</div></>;return clickable?<button type="button" className="ctb-matchup" onClick={()=>onOpen(game)}>{content}</button>:<div className="ctb-matchup ctb-matchup--archive">{content}</div>;}
function Card({x,y,game,onOpen,clickable,champ=false}){return <div className={`ctb-card${champ?" ctb-card--champ":""}`} style={{left:x,top:y}}><Matchup game={game} onOpen={onOpen} clickable={clickable}/></div>;}
function Connector({fromX,fromY,toX,toY,direction}){const sx=direction==="right"?fromX+CARD_W:fromX,ex=direction==="right"?toX:toX+CARD_W,sy=fromY+CARD_H/2,ey=toY+CARD_H/2,mx=sx+(ex-sx)*.5;return <path d={`M ${sx} ${sy} H ${mx} V ${ey} H ${ex}`}/>;}
function Winner(game){const id=clean(game?.winnerFranchiseId);return [game?.team1,game?.team2].find(t=>clean(t?.franchiseId)===id)||null;}
export default function ConferenceTournamentBracket(){
const navigate=useNavigate();
const routeParams=useParams();
const searchTuple=useSearchParams();
const params=searchTuple[0];
const conferenceSlug=routeParams.conferenceSlug||"acc";
const season=Number(params.get("season"))||DEFAULT_SEASON;
const config=CONFIG[conferenceSlug]||CONFIG.acc;
const eventName=config[0];
const size=config[1];
const conferenceBadge=config[2];
const [games,setGames]=useState([]);
const [loading,setLoading]=useState(true);
const [error,setError]=useState("");
const viewportRef=useRef(null);
const drag=useRef({});
const [scale,setScale]=useState(.45);
useEffect(()=>{
let cancelled=false;
setLoading(true);
setError("");
(async()=>{
try{
const all=[];
for(const week of [15,16,17,18]){
const response=await fetch(`${API_URL}?action=scores&season=${season}&week=${week}`);
if(!response.ok)throw new Error(`Week ${week}: HTTP ${response.status}`);
const payload=await response.json();
if(payload?.ok===false)throw new Error(payload.error||`Unable to load Week ${week}.`);
all.push(...(Array.isArray(payload?.games)?payload.games:[]));
}
if(!cancelled)setGames(all.filter(game=>clean(game?.eventName).toLowerCase()===eventName.toLowerCase()));
}catch(err){
if(!cancelled)setError(err?.message||"Unable to load Conference Tournament bracket.");
}finally{
if(!cancelled)setLoading(false);
}
})();
return()=>{cancelled=true;};
},[season,eventName]);
const rounds=useMemo(()=>({
r1:games.filter(game=>clean(game?.round).toLowerCase()==="1st round"),
qf:games.filter(game=>clean(game?.round).toLowerCase()==="quarterfinals"),
sf:games.filter(game=>clean(game?.round).toLowerCase()==="semifinals"),
champ:games.find(game=>clean(game?.round).toLowerCase()==="championship")||null
}),[games]);
const split=useMemo(()=>{
const half=size===16?4:2;
return{r1L:rounds.r1.slice(0,half),r1R:rounds.r1.slice(half),qfL:rounds.qf.slice(0,2),qfR:rounds.qf.slice(2,4),sfL:rounds.sf.slice(0,1),sfR:rounds.sf.slice(1,2)};
},[rounds,size]);
const current=season===DEFAULT_SEASON;
const openGame=game=>{
if(!game?.gameId)return;
navigate(`/scores/${encodeURIComponent(game.gameId)}`,{state:{fromEvent:"conference-tournaments",eventSeason:season,returnTo:`/events/conference-tournaments/${conferenceSlug}?season=${season}`}});
};
const fit=useCallback(()=>{
const el=viewportRef.current;
if(!el)return;
const next=Math.max(.34,Math.min(.92,(el.clientWidth-24)/CANVAS_W,(el.clientHeight-24)/CANVAS_H));
setScale(next);
requestAnimationFrame(()=>{const node=viewportRef.current;if(node){node.scrollLeft=0;node.scrollTop=0;}});
},[]);
useEffect(()=>{if(!loading&&!error)requestAnimationFrame(fit);},[loading,error,fit]);
const zoom=delta=>setScale(value=>Math.max(.30,Math.min(1.5,+(value+delta).toFixed(2))));
const pointerDown=event=>{
if(event.pointerType==="touch"||!viewportRef.current)return;
const el=viewportRef.current;
drag.current={on:true,x:event.clientX,y:event.clientY,l:el.scrollLeft,t:el.scrollTop};
el.setPointerCapture?.(event.pointerId);
};
const pointerMove=event=>{
if(!drag.current.on||event.pointerType==="touch"||!viewportRef.current)return;
const el=viewportRef.current;
el.scrollLeft=drag.current.l-(event.clientX-drag.current.x);
el.scrollTop=drag.current.t-(event.clientY-drag.current.y);
};
const stop=()=>{drag.current.on=false;};
const leftR1=size===16?LAYOUT.left.r1.ys:[355,745];
const rightR1=size===16?LAYOUT.right.r1.ys:[355,745];
const leftFirstX=size===12?80:LAYOUT.left.r1.x;
const rightFirstX=size===12?2150:LAYOUT.right.r1.x;
const leftQuarterX=size===12?400:LAYOUT.left.qf.x;
const rightQuarterX=size===12?1830:LAYOUT.right.qf.x;
const quarterYs=size===12?[175,565]:LAYOUT.left.qf.ys;
const semiY=size===12?(quarterYs[0]+quarterYs[1])/2:LAYOUT.left.sf.ys[0];
const finalY=size===12?semiY:LAYOUT.champ.y;
const connectors=[];
if(size===12){
leftR1.forEach((y,i)=>connectors.push(<Connector key={`l1${i}`} fromX={leftFirstX} fromY={y} toX={leftQuarterX} toY={quarterYs[i]} direction="right"/>));
rightR1.forEach((y,i)=>connectors.push(<Connector key={`r1${i}`} fromX={rightFirstX} fromY={y} toX={rightQuarterX} toY={quarterYs[i]} direction="left"/>));
}else{
leftR1.forEach((y,i)=>connectors.push(<Connector key={`l1${i}`} fromX={leftFirstX} fromY={y} toX={leftQuarterX} toY={quarterYs[Math.floor(i/2)]} direction="right"/>));
rightR1.forEach((y,i)=>connectors.push(<Connector key={`r1${i}`} fromX={rightFirstX} fromY={y} toX={rightQuarterX} toY={quarterYs[Math.floor(i/2)]} direction="left"/>));
}
quarterYs.forEach((y,i)=>connectors.push(<Connector key={`lq${i}`} fromX={leftQuarterX} fromY={y} toX={LAYOUT.left.sf.x} toY={semiY} direction="right"/>));
quarterYs.forEach((y,i)=>connectors.push(<Connector key={`rq${i}`} fromX={rightQuarterX} fromY={y} toX={LAYOUT.right.sf.x} toY={semiY} direction="left"/>));
connectors.push(<Connector key="lf" fromX={LAYOUT.left.sf.x} fromY={semiY} toX={LAYOUT.champ.x} toY={finalY} direction="right"/>);
connectors.push(<Connector key="rf" fromX={LAYOUT.right.sf.x} fromY={semiY} toX={LAYOUT.champ.x} toY={finalY} direction="left"/>);
const champion=Winner(rounds.champ);
const leftFinalist=Winner(split.sfL[0])||(rounds.champ?.team1||null);
const rightFinalist=Winner(split.sfR[0])||(rounds.champ?.team2||null);
return <div className="ctb-page">
<PageHeader title={eventName} description={`${size}-team conference championship · Weeks 15–18`} imageSrc={conferenceBadge} imageAlt={`${eventName} badge`} accent="events" size="compact"/>
<div className="ctb-toolbar"><button type="button" onClick={()=>navigate("/events/conference-tournaments")}><ChevronLeft size={17}/>Conference Tournaments</button><label className="ctb-season"><span>SEASON</span><div><select value={season} onChange={event=>navigate(`/events/conference-tournaments/${conferenceSlug}?season=${event.target.value}`)}><option value="2027">2026–27</option><option value="2026">2025–26</option></select><ChevronDown size={15}/></div></label></div>
{loading?<div className="ctb-state">Loading bracket…</div>:error?<div className="ctb-state ctb-state--error">{error}</div>:<div className="ctb-shell">
<div className="ctb-controls"><button type="button" onClick={()=>zoom(-.12)}><Minus size={15}/></button><button type="button" className="ctb-fit" onClick={fit}><Maximize2 size={14}/>FIT BRACKET</button><button type="button" onClick={()=>zoom(.12)}><Plus size={15}/></button><span>{Math.round(scale*100)}%</span></div>
<div className="ctb-viewport" ref={viewportRef} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={stop} onPointerLeave={stop}>
<div className="ctb-stage" style={{width:CANVAS_W*scale,height:CANVAS_H*scale}}><div className="ctb-canvas" style={{transform:`scale(${scale})`}}>
<div className="ctb-title"><span>{seasonLabel(season)}</span><strong>{eventName.toUpperCase()}</strong></div>
{[["WEEK 15","FIRST ROUND",leftFirstX],["WEEK 16","QUARTERFINALS",leftQuarterX],["WEEK 17","SEMIFINALS",780],["WEEK 17","SEMIFINALS",1450],["WEEK 16","QUARTERFINALS",rightQuarterX],["WEEK 15","FIRST ROUND",rightFirstX]].map(item=><div key={item[2]} className="ctb-round" style={{left:item[2]}}><span>{item[0]}</span><strong>{item[1]}</strong></div>)}
<svg className="ctb-connectors" width={CANVAS_W} height={CANVAS_H}>{connectors}</svg>{size===12?<><div className="ctb-bye" style={{left:leftQuarterX,top:150}}>TOP 4 SEEDS ENTER QUARTERFINALS</div><div className="ctb-bye" style={{left:rightQuarterX,top:150}}>TOP 4 SEEDS ENTER QUARTERFINALS</div></>:null}
{leftR1.map((y,i)=><Card key={`lr${i}`} x={leftFirstX} y={y} game={split.r1L[i]} onOpen={openGame} clickable={current}/>)}
{rightR1.map((y,i)=><Card key={`rr${i}`} x={rightFirstX} y={y} game={split.r1R[i]} onOpen={openGame} clickable={current}/>)}
{quarterYs.map((y,i)=><Card key={`lq${i}`} x={leftQuarterX} y={y} game={split.qfL[i]} onOpen={openGame} clickable={current}/>)}
{quarterYs.map((y,i)=><Card key={`rq${i}`} x={rightQuarterX} y={y} game={split.qfR[i]} onOpen={openGame} clickable={current}/>)}
<Card x={LAYOUT.left.sf.x} y={semiY} game={split.sfL[0]} onOpen={openGame} clickable={current}/>
<Card x={LAYOUT.right.sf.x} y={semiY} game={split.sfR[0]} onOpen={openGame} clickable={current}/>
{leftFinalist?.logoUrl?<div className="ctb-finalist" style={{left:780,top:semiY-108}}><img src={leftFinalist.logoUrl} alt={`${leftFinalist.name} finalist`}/><span>FINALIST</span></div>:null}{rightFinalist?.logoUrl?<div className="ctb-finalist" style={{left:1450,top:semiY-108}}><img src={rightFinalist.logoUrl} alt={`${rightFinalist.name} finalist`}/><span>FINALIST</span></div>:null}<div className="ctb-champ-label" style={{top:finalY-104}}><Trophy size={20}/><span>WEEK 18</span><strong>CHAMPIONSHIP</strong></div>
<Card x={LAYOUT.champ.x} y={finalY} game={rounds.champ} onOpen={openGame} clickable={current} champ/>
{champion?<div className="ctb-champion" style={{top:finalY+130}}><span>CONFERENCE CHAMPION</span>{champion.logoUrl?<img src={champion.logoUrl} alt=""/>:null}<strong>{champion.name}</strong><small>{champion.coachName}</small></div>:null}
</div></div></div>
<div className="ctb-hint">DRAG TO PAN · USE + / − TO ZOOM</div>
</div>}
</div>;
}
