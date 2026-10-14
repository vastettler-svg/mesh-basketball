import {useEffect,useMemo,useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import PageHeader from "../components/PageHeader";
import mbaLogo from "../assets/mba-logo.png";
import "../styles/conferenceChallenger.css";
const API_URL="https://script.google.com/macros/s/AKfycbwoKZvZRLo7POCjuaD56mvYKaL_AZdfbG04xkoF0XZKqiGYZjD3TmEFuNK8tDwr_K4B/exec";
const WEEKS=[10,11,12,13];
const PATCH_FILES=import.meta.glob('../assets/conference-badges/*',{eager:true,query:'?url',import:'default'});
const PATCHES=Object.fromEntries(Object.entries(PATCH_FILES).map(([path,url])=>[path.split('/').pop().replace(/\.[^.]+$/,'').toLowerCase(),url]));
const PATCH_NAMES={'mac':'mac','big 12':'big-12','big ten':'big-ten','big east':'big-east','american':'american','acc':'acc','sec':'sec','ivy':'ivy','coastal':'coastal','c-usa':'c-usa','conf-usa':'c-usa','mountain west':'mountain-west','mtn west':'mountain-west','sun belt':'sun-belt','ovc':'ovc','west coast':'west-coast','caa':'caa'};
function ConferencePatch({name}){const raw=String(name||'').toLowerCase().trim();const key=PATCH_NAMES[raw]||raw;const candidates=[key,key.replace(/-/g,''),key.replace(/ /g,'-'),key.replace(/ /g,''),raw.replace(/[^a-z0-9]/g,''),'big12','big-12','big_12','bigxii'];const src=candidates.map(x=>PATCHES[x]).find(Boolean);return src?<img className="cc-conference-patch" src={src} alt=""/>:null;}

const ROUND_ORDER={"Round 1":1,"Quarterfinal 1":2,"Quarterfinal 2":2,"Quarterfinal 3":2,"Quarterfinal 4":2,"Consolation 13":2,"Consolation 14":2,"Semifinal 1":3,"Semifinal 2":3,"Consolation 1":3,"Consolation 2":3,"Consolation 3":3,"Consolation 4":3,"13th Place":3,"Championship":4,"3rd Place":4,"5th Place":4,"7th Place":4,"9th Place":4,"11th Place":4};
function Logo({src,name}){return src?<img className="cc-logo" src={src} alt=""/>:<span className="cc-logo cc-logo--empty">{String(name||"?").slice(0,2)}</span>}
function Team({team}){return <span className="cc-team"><Logo src={team?.logoUrl} name={team?.name}/>{team?.id?<span>{team.name||team.id}</span>:<span>{team?.name||"Awaiting assignment"}</span>}</span>}
function weeklyRoundTitle(item){
 const week=Number(item.week);
 const round=String(item.round||'').trim();
 if(week===10&&/^Round\s*1$/i.test(round))return 'Main Bracket - Rd 1';
 if(week===11){
  if(/^Quarterfinal\s*\d+$/i.test(round))return 'Main Bracket Quarterfinal';
  if(/^Consolation\s*(13|14)$/i.test(round))return '9th Place Bracket - Quarterfinals';
 }
 if(week===12){
  if(/^Semifinal\s*[12]$/i.test(round))return 'Main Bracket Semifinals';
  if(/^Consolation\s*[12]$/i.test(round))return '5th Place Bracket - Semifinals';
  if(/^Consolation\s*[34]$/i.test(round))return '9th Place Bracket - Semifinals';
  if(/^13th Place$/i.test(round))return '13th Place';
 }
 return round||`WEEK ${week}`;
}
function SeriesCard({item,games,reps,season,compact=false}){const [expanded,setExpanded]=useState(false);const matching=useMemo(()=>{const a=reps.filter(x=>x.conference===item.conference1).sort((x,y)=>x.rank-y.rank),b=reps.filter(x=>x.conference===item.conference2).sort((x,y)=>x.rank-y.rank);const first=games.findIndex(g=>g.gameId===item.firstGameId);if(first>=0)return games.slice(first,first+12).filter(g=>g.week===item.week);if(a.length&&b.length)return games.filter(g=>g.week===item.week&&a.some(x=>x.franchiseId===g.team1.id||x.franchiseId===g.team2.id)&&b.some(x=>x.franchiseId===g.team1.id||x.franchiseId===g.team2.id));return[]},[item,games,reps]);return <article className={`cc-series${compact?" cc-series--compact":""}`}><div className="cc-series__top"><span>{weeklyRoundTitle(item)}</span><span className="cc-status">{item.status}</span></div><div className={`cc-side${item.winner&&item.winner!==item.conference1?" cc-side--loser":""}`}><span className="cc-seed">{item.seed1?`#${item.seed1}`:"–"}</span><ConferencePatch name={item.conference1}/><strong>{item.conference1||"TBD"}</strong>{item.wins1!=null&&item.wins2!=null&&item.wins1===item.wins2&&item.points1!=null&&<small className="cc-pf">PF: {Number(item.points1).toLocaleString()}</small>}<b>{item.wins1??"–"}</b></div><div className={`cc-side${item.winner&&item.winner!==item.conference2?" cc-side--loser":""}`}><span className="cc-seed">{item.seed2?`#${item.seed2}`:"–"}</span><ConferencePatch name={item.conference2}/><strong>{item.conference2||"TBD"}</strong>{item.wins1!=null&&item.wins2!=null&&item.wins1===item.wins2&&item.points2!=null&&<small className="cc-pf">PF: {Number(item.points2).toLocaleString()}</small>}<b>{item.wins2??"–"}</b></div>{!compact&&<button className="cc-expand" onClick={()=>setExpanded(x=>!x)} aria-expanded={expanded}>{expanded?"Hide":"View"} 12 matchups <span>{expanded?"⌃":"⌄"}</span></button>}{expanded&&!compact&&<div className="cc-games">{matching.length?matching.map((g,i)=>{const gameContent=<><div><span className="cc-rank">#{i+1}</span><span className={Number(g.team1.score)<Number(g.team2.score)?"cc-game-loser":""}><Team team={g.team1}/></span><b className={Number(g.team1.score)<Number(g.team2.score)?"cc-game-loser":""}>{g.team1.score??"–"}</b></div><div><span className="cc-rank"/><span className={Number(g.team2.score)<Number(g.team1.score)?"cc-game-loser":""}><Team team={g.team2}/></span><b className={Number(g.team2.score)<Number(g.team1.score)?"cc-game-loser":""}>{g.team2.score??"–"}</b></div></>;return season===2027&&g.gameId?<Link key={g.gameId||i} to={`/scores/${encodeURIComponent(g.gameId)}`} className="cc-game">{gameContent}</Link>:<div key={g.gameId||i} className="cc-game cc-game--static">{gameContent}</div>}):<p className="cc-muted">Individual games will appear when the matchup is assigned in Sheets.</p>}</div>}</article>}

function BracketNode({item,placeholder,mirror=false,flip=false}){return <div className={`cc-tree-node${mirror?" cc-tree-node--mirror":""}`}>{item?<>{(flip?[[item.conference2,item.seed2,item.wins2],[item.conference1,item.seed1,item.wins1]]:[[item.conference1,item.seed1,item.wins1],[item.conference2,item.seed2,item.wins2]]).map(([name,seed,wins],i)=><div key={i} className={`cc-tree-side${item.winner&&item.winner!==name?' is-loser':''}`}>{mirror?<><b>{wins??'–'}</b><span className="cc-tree-name">{name||'TBD'}</span><ConferencePatch name={name}/><span className="cc-tree-seed">{seed?`#${seed}`:'–'}</span></>:<><span className="cc-tree-seed">{seed?`#${seed}`:'–'}</span><ConferencePatch name={name}/><span className="cc-tree-name">{name||'TBD'}</span><b>{wins??'–'}</b></>}</div>)}</>:<div className="cc-tree-placeholder">{placeholder||'Awaiting matchup'}</div>}</div>}
function FullBracket({series}){
 const opening=series.filter(s=>Number(s.week)===10&&/^round 1$/i.test(String(s.round||''))).sort((a,b)=>(Number(a.seed1)||99)-(Number(b.seed1)||99));
 const quarters=[1,2,3,4].map(n=>series.find(s=>Number(s.week)===11&&String(s.round||'').toLowerCase()===`quarterfinal ${n}`));
 const semis=[1,2].map(n=>series.find(s=>Number(s.week)===12&&String(s.round||'').toLowerCase()===`semifinal ${n}`));
 const final=series.find(s=>Number(s.week)===13&&/^championship$/i.test(String(s.round||'')));
 const third=series.find(s=>Number(s.week)===13&&/^3rd place$/i.test(String(s.round||'')));
 // Seed order determines the opening-round feeder paths, including both byes.
 const bySeed=(seed)=>opening.find(s=>Number(s.seed1)===seed||Number(s.seed2)===seed);
 const leftOpen=[bySeed(8),bySeed(4),bySeed(5)];
 const rightOpen=[bySeed(7),bySeed(6),bySeed(3)];
 const columns=[16,235,454,673,892,1111,1330];const w=190,h=112;
 const nodes=[
  {id:'l1',c:0,y:156,item:leftOpen[0]},{id:'l2',c:0,y:306,item:leftOpen[1]},{id:'l3',c:0,y:459,item:leftOpen[2]},
  {id:'q1',c:1,y:72,item:quarters[0]},{id:'q2',c:1,y:368,item:quarters[1]},
  {id:'s1',c:2,y:220,item:semis[0]}, {id:'final',c:3,y:258,item:final},
  {id:'s2',c:4,y:220,item:semis[1]},
  {id:'q4',c:5,y:72,item:quarters[3]},{id:'q3',c:5,y:368,item:quarters[2]},
  {id:'r1',c:6,y:156,item:rightOpen[0]},{id:'r2',c:6,y:306,item:rightOpen[1]},{id:'r3',c:6,y:459,item:rightOpen[2]}
 ];
 const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
 const connections=[['l1','q1'],['l2','q2'],['l3','q2'],['q1','s1'],['q2','s1'],['s1','final'],['r1','q4'],['r2','q3'],['r3','q3'],['q3','s2'],['q4','s2'],['s2','final']];
 function connector(from,to){const a=byId[from],b=byId[to];const forward=a.c<b.c;const x1=columns[a.c]+(forward?w:0),x2=columns[b.c]+(forward?0:w),y1=a.y+h/2,y2=b.y+h/2,mid=(x1+x2)/2;return `M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`;}
 return <div className="cc-bracket"><p className="cc-muted">The Main Bracket advances from the outside toward the Week 13 championship. Swipe horizontally to view the full bracket.</p><div className="cc-bracket-scroll" role="region" aria-label="Conference Challenger main bracket" tabIndex={0}><div className="cc-tree cc-tree--aligned"><div className="cc-tree-title">Conference Challenger · Main Bracket</div><div className="cc-tree-board"><div className="cc-tree-week-labels">{[10,11,12,13,12,11,10].map((week,i)=><div key={i} style={{left:columns[i],width:w}}><strong>Week {week}</strong><span>{({10:"Round 1",11:"Quarterfinals",12:"Semifinals",13:"Championship"})[week]}</span></div>)}</div><svg className="cc-tree-connectors" viewBox="0 0 1536 620" preserveAspectRatio="none" aria-hidden="true">{connections.map(([from,to])=><path key={`${from}-${to}`} d={connector(from,to)}/>)}</svg>{final?.winner&&<div className="cc-tree-champion" style={{left:columns[3],width:w}}><ConferencePatch name={final.winner}/><strong>{final.winner}</strong></div>}{nodes.map(n=><div key={n.id} className="cc-tree-position" style={{left:columns[n.c],top:n.y,width:w}}><BracketNode item={n.item} mirror={n.c>3} flip={n.id==='q3'} placeholder={n.id==='final'?'Championship':n.id.startsWith('s')?'Semifinal':n.id.startsWith('q')?'Quarterfinal':'Opening round'}/></div>)}<div className="cc-tree-position cc-tree-third" style={{left:columns[3],top:440,width:w}}><div className="cc-tree-third-label">3RD PLACE</div><BracketNode item={third} placeholder="3rd Place"/></div></div><p className="cc-tree-note">Seeds #1 and #2 receive Week 10 byes and enter in Week 11. Bracket connectors follow each matchup's advancement path.</p></div></div><FifthPlaceBracket series={series}/><NinthPlaceBracket series={series}/></div>
}


function FifthPlaceBracket({series}){
 const find=(week,round)=>series.find(s=>Number(s.week)===week&&String(s.round||'').trim().toLowerCase()===round.toLowerCase());
 const semis=[find(12,'Consolation 1'),find(12,'Consolation 2')];
 const fifth=find(13,'5th Place'),seventh=find(13,'7th Place');
 if(![...semis,fifth,seventh].some(Boolean))return null;
 const w=205;
 const nodes=[{id:'left',x:38,y:235,item:semis[0]},{id:'fifth',x:306,y:195,item:fifth},{id:'right',x:574,y:235,item:semis[1]},{id:'seventh',x:306,y:447,item:seventh}];
 return <section className="cc-placement-bracket" aria-label="5th through 8th place bracket">
  <div className="cc-placement-frame">
   <header className="cc-placement-frame-header">
    <h3>Conference Challenger · 5th–8th Place Bracket</h3>
    <p>Conferences eliminated in the Main Bracket quarterfinals enter the Week 12 placement semifinals. Winners play for 5th place and losers play for 7th place in Week 13.</p>
   </header>
   <div className="cc-bracket-scroll" role="region" aria-label="5th through 8th place bracket" tabIndex={0}>
    <div className="cc-placement-board cc-placement-board--mirrored">
    <div className="cc-placement-heading" style={{left:38}}>Week 12<span>Semifinals</span></div>
    <div className="cc-placement-heading" style={{left:306}}>Week 13<span>5th Place</span></div>
    <div className="cc-placement-heading" style={{left:574}}>Week 12<span>Semifinals</span></div>
    <span className="cc-placement-label" style={{left:306,top:170,width:w}}>5TH PLACE</span>
    <svg viewBox="0 0 817 620" preserveAspectRatio="none" aria-hidden="true" className="cc-placement-lines">
     <path d="M 243 291 H 274 V 251 H 306"/><path d="M 574 291 H 543 V 251 H 511"/>
    </svg>
    {nodes.map(n=><div key={n.id} className="cc-placement-position" style={{left:n.x,top:n.y,width:w}}><BracketNode item={n.item} mirror={n.id==='right'} placeholder={n.id==='fifth'?'5th Place':n.id==='seventh'?'7th Place':'Awaiting semifinal'}/></div>)}
    <span className="cc-placement-label" style={{left:306,top:422,width:w}}>7TH PLACE</span>
    </div>
   </div>
  </div>
 </section>;
}
function NinthPlaceBracket({series}){
 const find=(week,round)=>series.find(s=>Number(s.week)===week&&String(s.round||'').trim().toLowerCase()===round.toLowerCase());
 const quarterLeft=find(11,'Consolation 13'),quarterRight=find(11,'Consolation 14');
 const semiLeft=find(12,'Consolation 3'),semiRight=find(12,'Consolation 4');
 const ninth=find(13,'9th Place'),eleventh=find(13,'11th Place');
 const thirteenth=find(12,'13th Place');
 if(![quarterLeft,quarterRight,semiLeft,semiRight,ninth,eleventh,thirteenth].some(Boolean))return null;
 const w=190;
 // Outside Week 11 games sit lower than their Week 12 feeders, as in the Main Bracket.
 const nodes=[
  {id:'ql',x:24,y:322,item:quarterLeft},
  {id:'sl',x:244,y:234,item:semiLeft},
  {id:'ninth',x:464,y:194,item:ninth},
  {id:'sr',x:684,y:234,item:semiRight},
  {id:'qr',x:904,y:322,item:quarterRight},
  {id:'eleventh',x:464,y:520,item:eleventh},
  {id:'thirteenth',x:244,y:520,item:thirteenth}
 ];
 return <section className="cc-placement-bracket" aria-label="9th through 14th place bracket">
  <div className="cc-placement-frame">
   <header className="cc-placement-frame-header">
    <h3>Conference Challenger · 9th–14th Place Bracket</h3>
    <p>The two highest-seeded conferences eliminated in the opening round receive Week 11 byes in this consolation bracket. The other four opening-round losers play in Week 11; the losers of those matchups meet for 13th place in Week 12. The remaining conferences compete for 9th through 12th place, with the 9th- and 11th-place games in Week 13.</p>
   </header>
   <div className="cc-bracket-scroll" role="region" aria-label="9th through 14th place bracket" tabIndex={0}>
    <div className="cc-ninth-board">
     {[{x:24,week:11,round:'Consolation'},{x:244,week:12,round:'Semifinals'},{x:464,week:13,round:'9th Place'},{x:684,week:12,round:'Semifinals'},{x:904,week:11,round:'Consolation'}].map((h,i)=><div key={i} className="cc-ninth-heading" style={{left:h.x,width:w}}>Week {h.week}<span>{h.round}</span></div>)}
     <svg viewBox="0 0 1118 830" preserveAspectRatio="none" aria-hidden="true" className="cc-ninth-lines">
      <path d="M 214 378 H 229 V 290 H 244"/>
      <path d="M 434 290 H 449 V 250 H 464"/>
      <path d="M 684 290 H 669 V 250 H 654"/>
      <path d="M 904 378 H 889 V 290 H 874"/>
     </svg>
     <span className="cc-placement-label" style={{left:464,top:169,width:w}}>9TH PLACE</span>
     {nodes.map(n=><div key={n.id} className="cc-placement-position" style={{left:n.x,top:n.y,width:w}}><BracketNode item={n.item} mirror={n.id==='sr'||n.id==='qr'} placeholder={n.id==='ninth'?'9th Place':n.id==='eleventh'?'11th Place':n.id==='thirteenth'?'13th Place':'Awaiting matchup'}/></div>)}
     <span className="cc-placement-label" style={{left:464,top:495,width:w}}>11TH PLACE</span>
     <span className="cc-placement-label" style={{left:244,top:495,width:w}}>13TH PLACE · WEEK 12</span>
    </div>
   </div>
  </div>
 </section>;
}
function FinalStandings({series,seeding}){
 const finals=series.filter(s=>(Number(s.week)===13||Number(s.week)===12&&/^13th place$/i.test(String(s.round||'')))&&s.winner);
 const seedMap=new Map(seeding.map(s=>[String(s.conference||'').toLowerCase(),s.seed]));
 const rows=[];
 for(const s of finals){const label=String(s.round||'');const place=/^championship$/i.test(label)?1:parseInt(label,10);if(!Number.isFinite(place))continue;const loser=s.winner===s.conference1?s.conference2:s.conference1;rows.push({place,name:s.winner},{place:place+1,name:loser});}
 rows.sort((a,b)=>a.place-b.place);
 const champion=rows.find(r=>r.place===1);const remaining=rows.filter(r=>r.place!==1);
 return <section className="cc-final"><h2>Final Conference Standings</h2>{rows.length?<><div className="cc-final-champion">{champion&&<><div className="cc-final-champion-label">CONFERENCE CHALLENGER CHAMPION</div><div className="cc-final-champion-rank">1ST PLACE</div><ConferencePatch name={champion.name}/><div className="cc-final-champion-name">{champion.name}</div>{seedMap.has(String(champion.name).toLowerCase())&&<div className="cc-final-champion-seed">Tournament Seed #{seedMap.get(String(champion.name).toLowerCase())}</div>}</>}</div><div className="cc-final-list">{remaining.map(r=><div key={r.place} className="cc-final-row"><strong>#{r.place}</strong><ConferencePatch name={r.name}/><span>{r.name||'TBD'}</span>{seedMap.has(String(r.name).toLowerCase())&&<small>Seed #{seedMap.get(String(r.name).toLowerCase())}</small>}</div>)}</div></>:<p className="cc-muted">Final placements will appear once the Week 13 results are completed.</p>}</section>
}
export default function ConferenceChallenger(){
 const navigate=useNavigate();const [season,setSeason]=useState(2027),[data,setData]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');const [week,setWeek]=useState(10);const [view,setView]=useState('bracket');
 useEffect(()=>{let cancelled=false;setLoading(true);setError('');fetch(`${API_URL}?action=conferenceChallenger&season=${season}`).then(r=>r.json()).then(d=>{if(cancelled)return;if(!d.ok)throw Error(d.error||'Could not load Challenger data');setData(d);setLoading(false)}).catch(e=>{if(!cancelled){setError(e.message);setLoading(false)}});return()=>{cancelled=true}},[season]);
 const allSeries=data?.series||[];const selectedSeries=allSeries.filter(x=>Number(x.week)===week);const seeding=[...(data?.seeding||[])].filter(x=>x.seed).sort((a,b)=>a.seed-b.seed);
 return <div className="cc-page"><PageHeader eyebrow="Events · Weeks 10–13" title="Conference Challenger Series" description="14 conferences · 12 head-to-head games per matchup · Weeks 10–13" imageSrc={mbaLogo} imageAlt="MBA logo" accent="events" size="compact"/>
 <div className="cc-filters"><button type="button" className="cc-back" onClick={()=>navigate('/events')}>← Events</button><label>SEASON<select value={season} onChange={e=>{setSeason(Number(e.target.value));setWeek(10)}}><option value={2027}>2027</option><option value={2026}>2026</option></select></label></div>
 <aside className="cc-explainer"><div><strong>THE CONFERENCE CHALLENGER SERIES</strong><p>Top two seeds receive opening-round byes. Defeated conferences continue in consolation brackets; final results rank all 14 conferences. Conference seeds are determined by the top 12 teams’ national ranks after Week 9. The best-ranked conferences across their 12 representatives receive the #1 seed, continuing until all 14 conferences are seeded.</p></div></aside>
 <section className="cc-section"><div className="cc-view-tabs"><button className={view==='bracket'?'is-active':''} onClick={()=>setView('bracket')}>Full Bracket</button><button className={view==='weekly'?'is-active':''} onClick={()=>setView('weekly')}>Weekly Matchups</button><button className={view==='standings'?'is-active':''} onClick={()=>setView('standings')}>Final Standings</button></div>
 {view==='weekly'&&<div className="cc-week-select"><label htmlFor="cc-week-choice">WEEK</label><select id="cc-week-choice" value={week} onChange={e=>setWeek(Number(e.target.value))}>{WEEKS.map(w=><option value={w} key={w}>Week {w}</option>)}</select></div>}
 {loading?<p className="cc-muted">Loading tournament…</p>:error?<p className="cc-error">{error}</p>:view==='bracket'?<FullBracket series={allSeries}/>:view==='standings'?<FinalStandings series={allSeries} seeding={seeding}/>:selectedSeries.length?<div className="cc-series-grid">{selectedSeries.map(s=><SeriesCard key={s.id} item={s} season={season} games={data?.games||[]} reps={data?.representatives||[]}/>)}</div>:<p className="cc-muted">No matchups published for Week {week}.</p>}
 </section></div>
}
