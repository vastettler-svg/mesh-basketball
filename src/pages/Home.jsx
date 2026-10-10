import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Clock3, Radio, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import "../styles/home.css";
import "../styles/homeEvents.css";
import "../styles/homeQuickLinks.css";
import { basketballQuickLinks } from "../data/basketballQuickLinks";
import { BookOpen, ExternalLink, Star, Users, ClipboardList, History } from "lucide-react";
const quickLinkIcons={BookOpen,ExternalLink,Star,Users,ClipboardList,History};
const SCORES_API_URL="https://script.google.com/macros/s/AKfycbwoKZvZRLo7POCjuaD56mvYKaL_AZdfbG04xkoF0XZKqiGYZjD3TmEFuNK8tDwr_K4B/exec";
function normalizeStatus(status){
const value=String(status||"").trim().toLowerCase();
if(value==="final")return{id:"final",label:"Final"};
if(value.includes("progress")||value==="live"||value==="in progress")return{id:"live",label:"Live Matchup"};
return{id:"upcoming",label:"Upcoming"};
}
function teamInitial(team){
const words=String(team?.name||"MBA").trim().split(/\s+/).filter(Boolean);
return words.length>1?`${words[0][0]}${words[1][0]}`.toUpperCase():String(words[0]||"M").slice(0,2).toUpperCase();
}
function formatScore(value){
if(value===null||value===undefined||value==="")return"—";
const number=Number(value);
return Number.isFinite(number)?number.toFixed(1):"—";
}
function safeTeamColor(value,fallback="#ff7a1a"){
const color=String(value||"").trim();
return /^#[0-9a-f]{6}$/i.test(color)||/^#[0-9a-f]{3}$/i.test(color)?color:fallback;
}
function projectedWinProbability(team1Projection,team2Projection){
const team1=Number(team1Projection);
const team2=Number(team2Projection);
if(!Number.isFinite(team1)||!Number.isFinite(team2)||team1<0||team2<0)return null;
const difference=team1-team2;
const team1Raw=100/(1+Math.exp(-difference/59));
const team1Pct=Math.max(1,Math.min(99,Math.round(team1Raw)));
return{team1:team1Pct,team2:100-team1Pct,favored:difference===0?"even":difference>0?"team1":"team2"};
}
function StatusPill({status}){
const normalized=normalizeStatus(status);
const Icon=normalized.id==="live"?Radio:normalized.id==="final"?Trophy:Clock3;
return <span className={`home-gotw-status home-gotw-status-${normalized.id}`}><Icon size={11}/>{normalized.label}</span>;
}
function TeamSide({team,side}){
if(!team)return <div className={`home-gotw-team home-gotw-team-${side}`}><div className="home-gotw-logo home-gotw-logo-empty">TBD</div><strong>TBD</strong></div>;
const rank=Number(team.rank);
const showRank=Number.isFinite(rank)&&rank>0&&rank<=25;
return <div className={`home-gotw-team home-gotw-team-${side}`}>
{team.franchiseId?<Link className="home-gotw-logo-link" to={`/franchise/${encodeURIComponent(team.franchiseId)}`} aria-label={`Open ${team.name||"team"} franchise profile`}><div className="home-gotw-logo">{team.logoUrl?<img src={team.logoUrl} alt={`${team.name||"Team"} logo`} onError={(event)=>{event.currentTarget.style.display="none";event.currentTarget.nextElementSibling?.removeAttribute("hidden");}}/>:null}<span hidden={Boolean(team.logoUrl)}>{teamInitial(team)}</span>{showRank?<b className="home-gotw-logo-rank">#{rank}</b>:null}</div></Link>:<div className="home-gotw-logo">{team.logoUrl?<img src={team.logoUrl} alt={`${team.name||"Team"} logo`}/>:<span>{teamInitial(team)}</span>}{showRank?<b className="home-gotw-logo-rank">#{rank}</b>:null}</div>}
<div className="home-gotw-team-copy">
<strong>{team.franchiseId?<Link className="home-gotw-team-link" to={`/franchise/${encodeURIComponent(team.franchiseId)}`}>{team.name||"TBD"}</Link>:<>{team.name||"TBD"}</>}</strong>
{team.coachName?(team.coachId?<Link className="home-gotw-coach-link" to={`/coach/${encodeURIComponent(team.coachId)}`}>{team.coachName}</Link>:<span className="home-gotw-coach">{team.coachName}</span>):null}
<span className="home-gotw-record">OVR: {team.overallRecord||"0-0"} · CONF: {team.conferenceRecord||"0-0"}</span>
</div>
</div>;
}
function GameOfTheWeekCard({game}){
const status=normalizeStatus(game.status);
const probability=projectedWinProbability(game.team1?.projectedScore,game.team2?.projectedScore);
return <article className="home-gotw-card">
<div className="home-gotw-card-top"><StatusPill status={game.status}/><span className="home-gotw-week">Week {game.week}</span></div>
<div className="home-gotw-title">MESH GAME OF THE WEEK</div>
<div className="home-gotw-matchup">
<TeamSide team={game.team1} side="left"/>
<div className="home-gotw-center">
<div className="home-gotw-score"><strong>{formatScore(game.team1?.score)}</strong><span>–</span><strong>{formatScore(game.team2?.score)}</strong></div>
{status.id!=="final"?<div className="home-gotw-projections"><span>Proj: {formatScore(game.team1?.projectedScore)}</span><span>Proj: {formatScore(game.team2?.projectedScore)}</span></div>:null}
<span className={`home-gotw-center-status home-gotw-center-status-${status.id}`}>{status.id==="live"?"● LIVE":status.label.toUpperCase()}</span>
</div>
<TeamSide team={game.team2} side="right"/>
</div>
{status.id!=="final"&&probability?<div className="home-gotw-win"><div className="home-gotw-win-heading">WIN PROBABILITY</div><div className="home-gotw-win-values"><strong>{probability.team1}%</strong><strong>{probability.team2}%</strong></div><div className={`home-gotw-win-track home-gotw-win-track-${probability.favored}`}><span className="home-gotw-win-left" style={{width:`${probability.team1}%`,backgroundColor:probability.favored==="team1"?safeTeamColor(game.team1?.primaryColor):undefined}}/><i className="home-gotw-win-right" style={{width:`${probability.team2}%`,backgroundColor:probability.favored==="team2"?safeTeamColor(game.team2?.primaryColor):undefined}}/></div></div>:null}
<Link className="home-gotw-game-center" to={`/scores/${encodeURIComponent(game.gameId)}`}>VIEW GAME CENTER<ChevronRight size={14}/></Link>
</article>;
}
function rankedLabel(team){
const rank=Number(team?.rank);
return Number.isFinite(rank)&&rank>=1&&rank<=25?`#${rank} ${team?.name||"TBD"}`:team?.name||"TBD";
}
function completedGame(game){
const status=String(game?.status||"").trim().toLowerCase();
return status==="final"||(game?.team1?.score!==null&&game?.team1?.score!==undefined&&game?.team1?.score!==""&&game?.team2?.score!==null&&game?.team2?.score!==undefined&&game?.team2?.score!=="");
}
function winnerSide(game){
if(!completedGame(game))return null;
const a=Number(game?.team1?.score);
const b=Number(game?.team2?.score);
if(!Number.isFinite(a)||!Number.isFinite(b)||a===b)return null;
return a>b?"team1":"team2";
}
function storyImportance(game,mode){
const featured=Number(game?.featuredRank);
const r1=Number(game?.team1?.rank);
const r2=Number(game?.team2?.rank);
const ranked1=Number.isFinite(r1)&&r1>=1&&r1<=25;
const ranked2=Number.isFinite(r2)&&r2>=1&&r2<=25;
let score=0;
if(featured===1)score+=70;
else if(featured===2)score+=62;
else if(featured===3)score+=52;
if(ranked1&&ranked2)score+=90+Math.max(0,30-(r1+r2)/2);
else if(ranked1||ranked2)score+=48+Math.max(0,25-(ranked1?r1:r2));
if(game?.eventName||game?.tournamentName)score+=52;
if(game?.stageLabel&&String(game.stageLabel).toLowerCase()!=="regular season")score+=24;
if(mode==="recap"){
const side=winnerSide(game);
if(side){
const winnerRank=Number(game?.[side]?.rank);
const loserRank=Number(game?.[side==="team1"?"team2":"team1"]?.rank);
const winnerRanked=Number.isFinite(winnerRank)&&winnerRank>=1&&winnerRank<=25;
const loserRanked=Number.isFinite(loserRank)&&loserRank>=1&&loserRank<=25;
if(loserRanked&&(!winnerRanked||winnerRank>loserRank))score+=135;
const a=Number(game?.team1?.score),b=Number(game?.team2?.score);
if(Number.isFinite(a)&&Number.isFinite(b)){score+=Math.max(0,38-Math.abs(a-b)/2);score+=Math.max(a,b)/18;}
}
}
return score;
}
function meaningfulEvent(game){
const values=[game?.eventName,game?.tournamentName].map(value=>String(value||"").trim()).filter(Boolean);
return values.find(value=>!["regular season","regular-season","regularseason","conference game","non-conference"].includes(value.toLowerCase()))||"";
}
function recordText(team){
const overall=String(team?.overallRecord||"").trim();
const conference=String(team?.conferenceRecord||"").trim();
const zero=value=>/^0-0(?:-0)?$/.test(String(value||"").trim());
if(overall&&conference&&!zero(overall)&&!zero(conference))return`${overall} overall and ${conference} in conference play`;
if(overall&&!zero(overall))return`${overall} overall`;
if(conference&&!zero(conference))return`${conference} in conference play`;
return"";
}
function previewDetail(game,type){
const a=rankedLabel(game.team1),b=rankedLabel(game.team2);
const aRecord=recordText(game.team1),bRecord=recordText(game.team2);
const event=meaningfulEvent(game);
if(type==="GAME OF THE WEEK"){
const r1=Number(game.team1?.rank),r2=Number(game.team2?.rank);
if(Number.isFinite(r1)&&Number.isFinite(r2)&&r1>=1&&r1<=25&&r2>=1&&r2<=25)return`Separated by just ${Math.abs(r1-r2)} spot${Math.abs(r1-r2)===1?"":"s"} in the Top 25, ${a} and ${b} bring one of the week's most evenly ranked matchups into the marquee position.`;
return`${a} and ${b} were selected for the marquee Week ${game.week} matchup, putting both franchises at the center of the MESH Basketball schedule.`;
}
if(event)return`${event} gives this Week ${game.week} matchup added significance as ${a} and ${b} meet on the MESH Basketball schedule.`;
if(aRecord&&bRecord)return`${a} enters at ${aRecord}, while ${b} comes in at ${bRecord}. The result will add another data point to the developing Week ${game.week} standings picture.`;
if(aRecord)return`${a} enters the matchup at ${aRecord}. ${b} provides the next test as the Week ${game.week} schedule develops.`;
if(bRecord)return`${b} enters the matchup at ${bRecord}. ${a} provides the next test as the Week ${game.week} schedule develops.`;
if(type==="TOP 25 SPOTLIGHT")return`Both franchises carry Top 25 recognition into the matchup, putting ranking position directly in play when they meet.`;
if(type==="TOP 25 WATCH")return`A ranked franchise is on the floor in this matchup, giving the result a direct connection to the next MESH Basketball Top 25 picture.`;
if(type==="AROUND MESH"&&Number(game.featuredRank)>0)return`${a} and ${b} make the secondary featured slate, giving this matchup its own spotlight alongside the Game of the Week and the league-wide Top 25 story.`;
return`The matchup gives both franchises an opportunity to shape the Week ${game.week} league picture when they meet.`;
}
function recapDetail(game,winner,loser,upset){
const winnerRecord=recordText(winner),loserRecord=recordText(loser);
if(upset)return`${rankedLabel(loser)} entered the result with Top 25 status, making ${rankedLabel(winner)}'s victory one of the week's results most likely to reshape the rankings.`;
if(winnerRecord&&loserRecord)return`${rankedLabel(winner)} moves forward at ${winnerRecord}, while ${rankedLabel(loser)} leaves the matchup at ${loserRecord}.`;
if(winnerRecord)return`${rankedLabel(winner)} moves forward at ${winnerRecord} after securing the Week ${game.week} victory.`;
return`The result adds another completed matchup to the Week ${game.week} standings and ranking picture.`;
}
function buildWeekOneNo1Story(games){
for(const game of games){
for(const team of [game?.team1,game?.team2]){
if(Number(team?.rank)===1){
const opponent=team===game.team1?game.team2:game.team1;
const championText="The preseason No. 1 opens a new MESH Basketball season carrying the spotlight that comes with the top ranking and the defending national championship.";
return{id:`week1-no1-${team.franchiseId||team.name}`,gameId:game.gameId,type:"TOP 25 WATCH",title:`${team.name} opens the season at No. 1`,summary:`${team.name} begins Week 1 as the preseason No. 1 and defending MESH National Champion.`,detail:`${championText} ${opponent?.name?`${opponent.name} is first on the schedule as ${team.name} begins its title defense.`:""}`,footer:"Week 1 preview",teams:[team].filter(Boolean),accent:safeTeamColor(team?.primaryColor),generic:false};
}
}
}
return null;
}
function buildPreviewStory(game,index){
if(!game)return null;
const a=rankedLabel(game.team1);
const b=rankedLabel(game.team2);
const r1=Number(game.team1?.rank),r2=Number(game.team2?.rank);
const ranked1=Number.isFinite(r1)&&r1>=1&&r1<=25;
const ranked2=Number.isFinite(r2)&&r2>=1&&r2<=25;
const event=meaningfulEvent(game);
let type="AROUND MESH";
let title=`${a} and ${b} enter the weekly spotlight`;
if(Number(game.featuredRank)===1){type="GAME OF THE WEEK";title=`${a} and ${b} headline the week`;}
else if(ranked1&&ranked2){type="TOP 25 SPOTLIGHT";title=`${a} and ${b} collide in a Top 25 showdown`;}
else if(event){type="EVENT SPOTLIGHT";title=`${a} and ${b} take center stage in ${event}`;}
else if(Number(game.featuredRank)===2||Number(game.featuredRank)===3){type="AROUND MESH";title=`${a} and ${b} earn a featured Week ${game.week} spotlight`;}
else if(ranked1||ranked2){type="TOP 25 WATCH";title=`${ranked1?a:b} carries a ranking into a Week ${game.week} test`;}
const summary=type==="GAME OF THE WEEK"?`${a} and ${b} own the marquee spot on the Week ${game.week} MESH Basketball schedule.`:type==="TOP 25 SPOTLIGHT"?`Two ranked franchises meet as ${a} faces ${b}, giving the league another matchup with Top 25 implications.`:type==="EVENT SPOTLIGHT"?`${a} and ${b} meet with ${event} providing the backdrop for one of the week's notable league stories.`:type==="TOP 25 WATCH"?`${a} and ${b} meet in Week ${game.week}, with a ranked franchise putting its Top 25 position on the line.`:Number(game.featuredRank)>0?`${a} and ${b} were selected as one of Week ${game.week}'s featured MESH Basketball matchups.`:`${a} and ${b} bring one of the week's notable MESH Basketball matchups into focus.`;
return{id:`preview-${game.gameId}`,gameId:game.gameId,type,title,summary,detail:previewDetail(game,type),footer:`Week ${game.week} preview`,teams:[game.team1,game.team2].filter(Boolean),accent:safeTeamColor(game.team1?.primaryColor),generic:false};
}
function buildRecapStory(game){
if(!game)return null;
const side=winnerSide(game);
if(!side)return null;
const loserSide=side==="team1"?"team2":"team1";
const winner=game[side];
const loser=game[loserSide];
const wr=Number(winner?.rank),lr=Number(loser?.rank);
const winnerRanked=Number.isFinite(wr)&&wr>=1&&wr<=25;
const loserRanked=Number.isFinite(lr)&&lr>=1&&lr<=25;
const upset=loserRanked&&(!winnerRanked||wr>lr);
const winnerScore=formatScore(winner?.score),loserScore=formatScore(loser?.score);
const title=upset?`${rankedLabel(winner)} knocks off ${rankedLabel(loser)}`:Number(game.featuredRank)===1?`${rankedLabel(winner)} wins the Game of the Week`:`${rankedLabel(winner)} tops ${rankedLabel(loser)}`;
const summary=`${rankedLabel(winner)} finished Week ${game.week} with a ${winnerScore}–${loserScore} victory over ${rankedLabel(loser)}.${upset?" The result gives MESH Basketball one of the week's biggest Top 25 stories.":""}`;
return{id:`recap-${game.gameId}`,gameId:game.gameId,type:upset?"UPSET AFTERSHOCK":Number(game.featuredRank)===1?"GAME OF THE WEEK":"WEEKLY RECAP",title,summary,detail:recapDetail(game,winner,loser,upset),footer:`Week ${game.week} recap`,teams:[winner,loser].filter(Boolean),accent:safeTeamColor(winner?.primaryColor),generic:false};
}
function HeadlineCard({story}){
const[expanded,setExpanded]=useState(false);
return <article className="home-headline-card" style={{"--headline-accent":story.accent||"#ff7a1a"}}>
<div className="home-headline-accent"/>
<div className="home-headline-body">
<div className="home-headline-meta">
<div className="home-headline-identity"><div><span>{story.type}</span><small>{story.footer}</small></div><div className="home-headline-logos">{(story.teams||[]).length?(story.teams||[]).map((team,index)=>team?.logoUrl?(team.franchiseId?<Link className="home-headline-logo" key={`${team.franchiseId||team.name}-${index}`} to={`/franchise/${encodeURIComponent(team.franchiseId)}`} aria-label={`Open ${team.name||"team"} franchise profile`}><img src={team.logoUrl} alt={`${team.name||"Featured team"} logo`}/></Link>:<div className="home-headline-logo" key={`${team.name||"team"}-${index}`}><img src={team.logoUrl} alt={`${team.name||"Featured team"} logo`}/></div>):null):<div className="home-headline-logo home-headline-logo-mesh">MESH</div>}</div></div>
</div>
<h2>{story.title}</h2>
<p>{story.summary}</p>
{expanded&&story.detail?<div className="home-headline-more"><p>{story.detail}</p></div>:null}
<div className="home-headline-footer"><Link to={`/scores/${encodeURIComponent(story.gameId)}`}>Game Center<ChevronRight size={13}/></Link><button type="button" onClick={()=>setExpanded(value=>!value)}>{expanded?"Show Less":"See More"}</button></div>
</div>
</article>;
}
function scoreNumber(value){
const number=Number(value);
return Number.isFinite(number)?number:null;
}
function gameResult(game){
if(!completedGame(game))return null;
const a=scoreNumber(game?.team1?.score),b=scoreNumber(game?.team2?.score);
if(a===null||b===null||a===b)return null;
const winner=a>b?game.team1:game.team2;
const loser=a>b?game.team2:game.team1;
return{game,winner,loser,winnerScore:Math.max(a,b),loserScore:Math.min(a,b),margin:Math.abs(a-b)};
}
function upsetStrength(result){
const winnerRank=Number(result?.winner?.rank),loserRank=Number(result?.loser?.rank);
const winnerRanked=Number.isFinite(winnerRank)&&winnerRank>=1&&winnerRank<=25;
const loserRanked=Number.isFinite(loserRank)&&loserRank>=1&&loserRank<=25;
if(!loserRanked)return null;
if(!winnerRanked)return 100-loserRank;
if(winnerRank>loserRank)return winnerRank-loserRank;
return null;
}
function buildSpotlight(games){
const results=(games||[]).map(gameResult).filter(Boolean);
if(!results.length)return[];
const highest=[...results].sort((a,b)=>b.winnerScore-a.winnerScore||b.margin-a.margin)[0];
const biggest=[...results].sort((a,b)=>b.margin-a.margin||b.winnerScore-a.winnerScore)[0];
const closest=[...results].sort((a,b)=>a.margin-b.margin||b.winnerScore-a.winnerScore)[0];
const upsets=results.map(result=>({...result,upset:upsetStrength(result)})).filter(result=>result.upset!==null).sort((a,b)=>b.upset-a.upset||b.margin-a.margin);
const upset=upsets[0]||null;
return[
{id:"highest",label:"HIGHEST SCORE",result:highest,teams:[highest.winner,highest.loser],value:`${formatScore(highest.winnerScore)} PTS`,detail:`def. ${rankedLabel(highest.loser)}, ${formatScore(highest.winnerScore)}–${formatScore(highest.loserScore)}`,accent:safeTeamColor(highest.winner?.primaryColor)},
{id:"upset",label:"BIGGEST UPSET",result:upset,teams:upset?[upset.winner,upset.loser]:[],value:upset?`UPSET #${Number(upset.loser?.rank)>=1&&Number(upset.loser?.rank)<=25?Number(upset.loser.rank):""}`.trim():"—",detail:upset?`def. ${rankedLabel(upset.loser)}, ${formatScore(upset.winnerScore)}–${formatScore(upset.loserScore)}`:"No ranked upset was recorded this week.",accent:upset?safeTeamColor(upset.winner?.primaryColor):"#ff7a1a"},
{id:"biggest",label:"BIGGEST WIN",result:biggest,teams:[biggest.winner,biggest.loser],value:`+${formatScore(biggest.margin)}`,detail:`def. ${rankedLabel(biggest.loser)}, ${formatScore(biggest.winnerScore)}–${formatScore(biggest.loserScore)}`,accent:safeTeamColor(biggest.winner?.primaryColor)},
{id:"closest",label:"CLOSEST GAME",result:closest,teams:[closest.winner,closest.loser],value:`+${formatScore(closest.margin)}`,detail:`def. ${rankedLabel(closest.loser)}, ${formatScore(closest.winnerScore)}–${formatScore(closest.loserScore)}`,accent:safeTeamColor(closest.winner?.primaryColor)}
];
}
function SpotlightLogo({team}){
return <div className="home-spotlight-logo">{team?.logoUrl?<img src={team.logoUrl} alt={`${team.name||"Team"} logo`}/>:<span>{teamInitial(team)}</span>}</div>;
}
function SpotlightCard({item,week}){
const gameId=item?.result?.game?.gameId;
const content=<><div className="home-spotlight-accent" style={{background:item.accent}}/><div className="home-spotlight-body"><div className="home-spotlight-top"><span>{item.label}</span><strong>{item.value}</strong></div><div className="home-spotlight-main"><div className="home-spotlight-logos">{item.teams.map((team,index)=><div className={index===0?"home-spotlight-logo-wrap home-spotlight-logo-winner":"home-spotlight-logo-wrap home-spotlight-logo-opponent"} key={`${team?.franchiseId||team?.name||"team"}-${index}`}><SpotlightLogo team={team}/></div>)}</div><div className="home-spotlight-copy"><h3>{rankedLabel(item.teams[0])}</h3><p>{item.detail}</p></div><ChevronRight className="home-spotlight-chevron" size={17}/></div></div></>;
return gameId?<Link className="home-spotlight-card" to={`/scores/${encodeURIComponent(gameId)}`} aria-label={`Open Week ${week} ${item.label.toLowerCase()} Game Center`}>{content}</Link>:<article className="home-spotlight-card home-spotlight-card-disabled">{content}</article>;
}
function SpotlightEmptyCard({label,week}){
return <article className="home-spotlight-card home-spotlight-card-empty"><div className="home-spotlight-accent"/><div className="home-spotlight-body"><div className="home-spotlight-top"><span>{label}</span><strong>—</strong></div><div className="home-spotlight-empty-copy"><div className="home-spotlight-placeholder-logo">M</div><div><h3>Available after Week {week}</h3><p>This spotlight will populate when the week's games are final.</p></div></div></div></article>;
}
async function fetchScores(week,signal){
const url=new URL(SCORES_API_URL);
url.searchParams.set("action","scores");
if(week)url.searchParams.set("week",String(week));
const response=await fetch(url.toString(),{signal});
if(!response.ok)throw new Error(`API request failed with HTTP ${response.status}.`);
const payload=await response.json();
if(!payload?.ok)throw new Error(payload?.error||"Unable to load MESH Basketball scores.");
return payload;
}
const HOME_EVENTS=[
{slug:"ski-regionals",name:"SKI Regionals",start:2,end:4,color:"#67c7ff",detail:"23 regional tournaments"},
{slug:"ski-champions",name:"SKI Champions",start:5,end:9,color:"#428dff",detail:"Championship bracket"},
{slug:"mid-major-mayhem",name:"Mid Major Mayhem",start:5,end:10,color:"#20b486",detail:"64-team tournament"},
{slug:"invitational-tournaments",name:"Invitational Tournaments",start:6,end:8,color:"#a78bfa",detail:"23 invitational tournaments"},
{slug:"conference-challenger",name:"Conference Challenger",start:10,end:13,color:"#ff7a1a",detail:"Conference competition",ready:false},
{slug:"rivalry-week",name:"Rivalry Week",start:14,end:14,color:"#ef4444",detail:"Special rivalry matchups"},
{slug:"conference-tournaments",name:"Conference Tournaments",start:15,end:18,color:"#14b8a6",detail:"Conference championship brackets"},
{slug:"regional-showdowns",name:"Regional Showdowns",start:16,end:18,color:"#ec4899",detail:"23 regional tournaments"},
{slug:"national-postseason",name:"National Postseason",start:19,end:24,color:"#d4af37",detail:"March Madness · NIT · CBC · CBI"}
];
function HomeEvents({week}){
const active=HOME_EVENTS.filter(event=>week>=event.start&&week<=event.end);
return <section className="home-events-section" aria-label={`Week ${week} MESH events`}><div className="home-section-heading home-events-heading"><div><span>AROUND THE LEAGUE · WEEK {week}</span><h1>MESH Events</h1></div><Link to="/events">All Events<ChevronRight size={13}/></Link></div>{active.length?<div className="home-events-grid">{active.map(event=><Link key={event.slug} to={event.ready===false?"/events":`/events/${event.slug}`} className="home-events-card" style={{"--home-event-color":event.color}}><div className="home-events-mark"><Trophy size={21} strokeWidth={1.8}/></div><div className="home-events-copy"><span>{event.start===event.end?`WEEK ${event.start}`:`WEEKS ${event.start}–${event.end}`}</span><strong>{event.name}</strong><small>{event.detail}{event.ready===false?" · Preview available":""}</small></div><ChevronRight size={17} className="home-events-arrow"/></Link>)}</div>:<div className="home-events-empty">No special events scheduled for Week {week}. <Link to="/events">Explore the season calendar <ChevronRight size={12}/></Link></div>}</section>;
}
export default function Home(){
const[data,setData]=useState(null);
const[recapData,setRecapData]=useState(null);
const[loading,setLoading]=useState(true);
const[error,setError]=useState("");
const[selectedWeek,setSelectedWeek]=useState(null);
const[weekMenuOpen,setWeekMenuOpen]=useState(false);
useEffect(()=>{
const controller=new AbortController();
async function load(){
setLoading(true);setError("");
try{
const payload=await fetchScores(null,controller.signal);
setData(payload);
setSelectedWeek(current=>current??Number(payload.activeWeek||payload.week||1));
const active=Number(payload.activeWeek||payload.week||1);
if(active>1){
try{setRecapData(await fetchScores(active-1,controller.signal));}catch(recapError){if(recapError?.name!=="AbortError")setRecapData(null);}
}
}catch(err){
if(err?.name==="AbortError")return;
setData(null);setError(err?.message||"Unable to load the MESH Basketball home page.");
}finally{if(!controller.signal.aborted)setLoading(false);}
}
load();
return()=>controller.abort();
},[]);
const activeWeek=Number(data?.activeWeek||data?.week||1);
const displayedWeek=Number(selectedWeek||activeWeek);
const isCurrentWeek=displayedWeek===activeWeek;
useEffect(()=>{
if(!data||isCurrentWeek)return;
const controller=new AbortController();
async function loadSelected(){
setLoading(true);setError("");
try{const selectedPayload=await fetchScores(displayedWeek,controller.signal);setData(current=>({...current,...selectedPayload,activeWeek:current.activeWeek,lastCompletedWeek:current.lastCompletedWeek}));}
catch(err){if(err?.name!=="AbortError")setError(err?.message||`Unable to load Week ${displayedWeek}.`);}
finally{if(!controller.signal.aborted)setLoading(false);}
}
loadSelected();
return()=>controller.abort();
},[displayedWeek,isCurrentWeek]);
const gameOfTheWeek=useMemo(()=>data?.games?.find(game=>Number(game.featuredRank)===1)||null,[data]);
const day=new Date().getDay();
const currentMode=activeWeek<=1?"preview":day===1||day===2?"recap":"preview";
const headlineMode=isCurrentWeek?currentMode:"preview";
const headlineGames=headlineMode==="recap"?(recapData?.games||[]):(data?.games||[]);
const headlines=useMemo(()=>{
const candidates=headlineGames.filter(game=>headlineMode==="preview"||completedGame(game)).sort((a,b)=>storyImportance(b,headlineMode)-storyImportance(a,headlineMode));
const picked=[];
const usedPairs=new Set();
const usedTypes=new Set();
function markStory(story,game){
if(!story||picked.length>=3)return;
picked.push(story);usedTypes.add(story.type);
if(game)usedPairs.add([game.team1?.franchiseId,game.team2?.franchiseId].filter(Boolean).sort().join("|"));
}
function addGame(game){
if(!game||picked.length>=3)return;
const key=[game.team1?.franchiseId,game.team2?.franchiseId].filter(Boolean).sort().join("|");
if(usedPairs.has(key))return;
const story=headlineMode==="recap"?buildRecapStory(game):buildPreviewStory(game,picked.length);
markStory(story,game);
}
if(headlineMode==="preview"){
addGame(candidates.find(game=>Number(game.featuredRank)===1));
if(displayedWeek===1){
const no1=buildWeekOneNo1Story(candidates);
if(no1&&!picked.some(story=>(story.teams||[]).some(team=>team?.franchiseId&&team.franchiseId===no1.teams?.[0]?.franchiseId)))markStory(no1,null);
const around=[3,2].map(rank=>candidates.find(game=>Number(game.featuredRank)===rank&&!usedPairs.has([game.team1?.franchiseId,game.team2?.franchiseId].filter(Boolean).sort().join("|"))&&!([game.team1,game.team2].some(team=>team?.franchiseId&&team.franchiseId===no1?.teams?.[0]?.franchiseId)))).find(Boolean);
addGame(around);
}
}
for(const game of candidates){
if(picked.length>=3)break;
const preview=buildPreviewStory(game,picked.length);
if(headlineMode==="preview"&&Number(game.featuredRank)>1&&usedTypes.has(preview?.type))continue;
if(headlineMode==="preview"&&usedTypes.has(preview?.type)&&candidates.some(other=>!usedPairs.has([other.team1?.franchiseId,other.team2?.franchiseId].filter(Boolean).sort().join("|"))&&buildPreviewStory(other,picked.length)?.type!==preview?.type))continue;
addGame(game);
}
for(const game of candidates){if(picked.length>=3)break;addGame(game);}
return picked;
},[headlineGames,headlineMode]);
const weekOptions=useMemo(()=>Array.from({length:Math.max(1,activeWeek)},(_,index)=>index+1),[activeWeek]);
const spotlightWeek=isCurrentWeek?Number(data?.lastCompletedWeek||0):displayedWeek;
const spotlightGames=isCurrentWeek?(spotlightWeek>0&&spotlightWeek===displayedWeek?data?.games||[]:recapData?.games||[]):data?.games||[];
const spotlightItems=useMemo(()=>buildSpotlight(spotlightGames),[spotlightGames]);
const spotlightLabels=["HIGHEST SCORE","BIGGEST UPSET","BIGGEST WIN","CLOSEST GAME"];
return <section className="home-page">
<div className="home-week-menu"><button type="button" className="home-week-pill home-week-selector" onClick={()=>setWeekMenuOpen(open=>!open)} aria-expanded={weekMenuOpen}><strong>Week {displayedWeek}</strong><span>•</span><span>MESH Basketball</span><span className="home-week-caret">⌄</span></button>{weekMenuOpen?<div className="home-week-options">{weekOptions.map(week=><button type="button" key={week} className={week===displayedWeek?"home-week-option home-week-option-active":"home-week-option"} onClick={()=>{setSelectedWeek(week);setWeekMenuOpen(false);}}><span>Week {week}</span>{week===activeWeek?<small>Current</small>:null}</button>)}</div>:null}</div>
<div className="home-section-heading"><div><span>THIS WEEK IN MESH</span><h1>Game of the Week</h1></div><Link to="/scores">All Scores<ChevronRight size={13}/></Link></div>
{loading?<div className="home-gotw-loading"><div/><div/><div/></div>:null}
{!loading&&error?<div className="home-gotw-message"><strong>Home page unavailable</strong><span>{error}</span></div>:null}
{!loading&&!error&&gameOfTheWeek?<GameOfTheWeekCard game={gameOfTheWeek}/>:null}
{!loading&&!error&&!gameOfTheWeek?<div className="home-gotw-message"><strong>Game of the Week not selected yet</strong><span>Featured_Rank 1 has not been assigned for Week {displayedWeek}.</span></div>:null}
<div className="home-section-heading home-headlines-heading"><div><span>{headlineMode==="recap"?`BIGGEST STORIES FROM WEEK ${Math.max(1,activeWeek-1)}`:isCurrentWeek?`LOOKING AHEAD TO WEEK ${displayedWeek}`:`WEEK ${displayedWeek} ARCHIVE`}</span><h1>MESH Headlines</h1></div></div>
{!loading&&headlines.length>0?<div className="home-headlines-grid">{headlines.map(story=><HeadlineCard key={story.id} story={story}/>)}</div>:null}
{!loading&&headlines.length===0?<div className="home-gotw-message"><strong>Headlines are being written</strong><span>Stories will appear when Week {headlineMode==="recap"?Math.max(1,activeWeek-1):displayedWeek} matchups are available.</span></div>:null}
<div className="home-section-heading home-spotlight-heading"><div><span>STANDOUT PERFORMANCES & RESULTS</span><h1>Week {spotlightWeek||displayedWeek} · MESH Spotlight</h1></div></div>
{!loading?<div className="home-spotlight-grid">{spotlightItems.length?spotlightItems.map(item=><SpotlightCard key={item.id} item={item} week={spotlightWeek||displayedWeek}/>):spotlightLabels.map(label=><SpotlightEmptyCard key={label} label={label} week={displayedWeek}/>)}</div>:null}
<HomeEvents week={displayedWeek}/>
<section className="home-quicklinks"><div className="home-section-heading"><div><span>EXPLORE MESH</span><h1>Quick Links</h1></div><Link to="/more">View All<ChevronRight size={13}/></Link></div><div className="home-quicklinks-grid">{basketballQuickLinks.map(item=>{const Icon=quickLinkIcons[item.icon];return <Link key={item.id} to={item.id==="rules"?"/more/rules":item.id==="sleeper"?"/more/sleeper":item.id==="prestige"?"/more/prestige":item.id==="carousel"?"/more/coach-carousel":item.id==="draft"||item.id==="drafts"?"/more/draft":`/more#${item.id}`} className="home-quicklinks-card"><span className="home-quicklinks-icon"><Icon size={20}/></span><span className="home-quicklinks-copy"><strong>{item.name}</strong><small>{item.description}</small></span><ChevronRight size={16} className="home-quicklinks-arrow"/></Link>;})}</div></section>
</section>;
}
