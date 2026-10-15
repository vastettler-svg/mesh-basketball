import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Trophy, Users, Archive, ChevronRight, ArrowLeft, ArrowUpDown, Crown, Medal, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import '../styles/statsCenter.css';
import PageHeader from '../components/PageHeader';
import mbaLogo from '../assets/mba-logo.png';

import badgeAmerican from '../assets/conference-badges/american.png';
import badgeAcc from '../assets/conference-badges/acc.png';
import badgeBig12 from '../assets/conference-badges/big-12.png';
import badgeBigEast from '../assets/conference-badges/big-east.png';
import badgeBigTen from '../assets/conference-badges/big-ten.png';
import badgeCoastal from '../assets/conference-badges/coastal.png';
import badgeCusa from '../assets/conference-badges/c-usa.png';
import badgeIvy from '../assets/conference-badges/ivy.png';
import badgeMac from '../assets/conference-badges/mac.png';
import badgeMountainWest from '../assets/conference-badges/mountain-west.png';
import badgeOvc from '../assets/conference-badges/ovc.png';
import badgeSec from '../assets/conference-badges/sec.png';
import badgeSunBelt from '../assets/conference-badges/sun-belt.png';
import badgeWestCoast from '../assets/conference-badges/west-coast.png';
const conferenceBadgeMap = {AAC:badgeAmerican,American:badgeAmerican,'American Athletic':badgeAmerican,ACC:badgeAcc,'Atlantic Coast':badgeAcc,'Big 12':badgeBig12,'Big East':badgeBigEast,'Big Ten':badgeBigTen,'C-USA':badgeCusa,'Conference USA':badgeCusa,'Conf USA':badgeCusa,'Conf. USA':badgeCusa,'CUSA':badgeCusa,Coastal:badgeCoastal,Ivy:badgeIvy,'Ivy League':badgeIvy,MAC:badgeMac,'Mid American':badgeMac,'Mountain West':badgeMountainWest,'Mtn West':badgeMountainWest,'Mountain West Conference':badgeMountainWest,OVC:badgeOvc,'Ohio Valley':badgeOvc,SEC:badgeSec,'Sun Belt':badgeSunBelt,'West Coast':badgeWestCoast};
const conferenceBadge = name => conferenceBadgeMap[name] || '';
// Combined Mid Major franchise leaderboard; existing API records and rankings remain unchanged.
const MID_MAJOR_CONFERENCES = new Set(['coastal','conf usa','conference usa','c-usa','cusa','conf. usa','ovc','ohio valley','west coast']);
const isMidMajorConference = value => MID_MAJOR_CONFERENCES.has(String(value||'').trim().toLowerCase());
const API_URL = 'https://script.google.com/macros/s/AKfycbwoKZvZRLo7POCjuaD56mvYKaL_AZdfbG04xkoF0XZKqiGYZjD3TmEFuNK8tDwr_K4B/exec';
const formatStat=(key,v)=>{if(v===null||v===undefined||v==='')return '—';if(!Number.isFinite(Number(v)))return '—';const n=Number(v);return ['pct','confPct','tourneyPct','selectedPct'].includes(key)?n.toFixed(1)+'%':['ppg','papg','avg','avgMargin','consistency','high','low','bigWin','bigLoss','closeWin','diff'].includes(key)?n.toFixed(1):Number.isInteger(n)?n.toLocaleString():n.toFixed(1)};
const SECTIONS = [
  { id:'franchises', name:'Franchises – Career Stats', subtitle:'Season and all-time franchise rankings', Icon:Shield },
  { id:'coaches', name:'Coaches – Career Stats', subtitle:'Season and all-time coaching rankings', Icon:Users },
  { id:'leaders', name:'Leaders & Records', subtitle:'League leaders and historic performances', Icon:Trophy },
  { id:'history', name:'Champions & History', subtitle:'Titles, events and season archives', Icon:Archive },
];
const STAT_GROUPS = [
 {name:'Overall Performance',cols:[['gp','GP'],['wins','W'],['losses','L'],['ties','T'],['pct','WIN%'],['prestige','PRESTIGE']]},
 {name:'Scoring',cols:[['pf','PF'],['ppg','PPG'],['papg','PA/G'],['diff','DIFF/G']]},
 {name:'Weekly Performance',cols:[['high','HIGH'],['low','LOW'],['avg','AVG'],['consistency','CONSIST.']]},
 {name:'Game Results',cols:[['bigWin','BIG W'],['bigLoss','BIG L'],['closeWin','CLOSE W'],['avgMargin','AVG +/-']]},
 {name:'Ranked Opponents',cols:[['top25Wins','TOP25 W'],['top25Losses','TOP25 L'],['top10Wins','TOP10 W'],['top10Losses','TOP10 L']]},
 {name:'Streaks',cols:[['winStreak','WIN STK'],['lossStreak','LOSS STK']]},
 {name:'Event Performance',cols:[['tourneyWins','EVENT W'],['tourneyLosses','EVENT L'],['tourneyPct','EVENT %'],['tourneyTitles','TITLES']]},
 {name:'Postseason',cols:[['postWins','POST W'],['postLosses','POST L'],['postTitles','POST TITLES'],['postApps','APPS']]},
];
// Demonstration rows intentionally contain no invented league statistics.
const PREVIEW_ROWS = [
 {id:'preview-1',label:'Franchise / Coach 01'},
 {id:'preview-2',label:'Franchise / Coach 02'},
 {id:'preview-3',label:'Franchise / Coach 03'},
 {id:'preview-4',label:'Franchise / Coach 04'},
];
const CATEGORIES = [
  {name:'Scoring', items:['Highest Points Per Game','Lowest Points Per Game','Most Total Points','Fewest Total Points','Best Scoring Defense','Worst Scoring Defense','Best Point Differential','Worst Point Differential']},
  {name:'Single-Game Records', items:['Highest Single-Game Score','Lowest Single-Game Score','Largest Victory Margin','Closest Game','Highest Combined Score','Lowest Combined Score','Highest Score in a Loss','Lowest Score in a Win']},
  {name:'Wins & Streaks',items:['Most Wins','Most Losses','Best Win %','Worst Win %','Longest Winning Streak','Longest Losing Streak']},
];
const METRICS = [['wins','W'],['losses','L'],['pct','WIN %'],['ppg','PPG'],['pf','PF'],['papg','PA/G'],['diff','+/-'],['high','HIGH']];
const HISTORY = [
  {name:'Postseason Champions',sub:'March Madness, NIT, College Basketball Crown and CBI champions',Icon:Crown},
  {name:'Conference Champions',sub:'Defending champions and expandable conference histories',Icon:Medal},
  {name:'Event Champions',sub:'SKI Regionals, named tournaments and other event titles',Icon:Trophy},
  {name:'Conference Achievement Rankings',sub:'Compare conference titles and event victories in sortable tables',Icon:BarChart3},
  {name:'Season Archives',sub:'Historical standings, postseason finishes and season identities',Icon:Archive},
];
function Select({label,value,onChange,options}){return <label className="msc-select"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}</select></label>}
function Placeholder({children}){return <div className="msc-empty"><strong>Data connection is the next step</strong><p>{children}</p><small>This preview intentionally contains no fabricated statistics or champions.</small></div>}
const compactSchoolName=(name)=>{const full=String(name||'');const schools=["Sam Houston State", "George Washington", "UC Santa Barbara", "Louisiana Monroe", "Central Michigan", "William & Mary", "Southern Utah", "NC Wilmington", "Florida State", "Oregon State", "Old Dominion", "Wake Forest", "Valparaiso", "Providence", "New Mexico", "Iowa State", "Lafayette", "Creighton", "Virginia", "Portland", "Michigan", "Marshall", "Campbell", "Harvard", "Bradley", "Toledo", "Oregon", "DePaul", "Idaho", "UTSA", "UTEP", "Navy", "USI"];for(const school of schools){if(full===school||full.startsWith(school+' '))return school;}return full.replace(/\s+(?:Blue Devils|Rainbow Warriors|Golden Flash|Fighting Irish|Redhawks|Red Wolves|Golden Eagles|Hilltoppers|Sycamores|Wolfpack|Beach|Bulldogs|Tigers|Cowboys|Seawolves|Buffaloes|Dukes|Cougars|Falcons|Pirates|Knights|Cardinals|Huskies|Panthers|Wildcats|Bulls|Eagles|Bears|Owls|Raiders|Aggies|Spartans|Hokies|Bruins|Broncos|Rams|Lions|Mavericks|Trojans|Jaguars|Rebels|Hurricanes|Volunteers|Longhorns|Jayhawks|Mountaineers|Terrapins|Boilermakers|Hoosiers|Crimson Tide|Red Storm|Minutemen|Commodores|Quakers|Zips|Zebras|Flames|Colonels|Bison|Penguins|Gaels|Redbirds|Hawkeyes|Bearcats|Gators|Sooners|Shockers|Toreros|Gamecocks|Golden Gophers|Dolphins|Mean Green|Vikings|Blue Hens|Orange|49ers|Lumberjacks|Ragin Cajuns|Chanticleers|Nittany Lions|Sun Devils|Buckeyes|Mustangs|Green Wave|Red Raiders|Waves|Aztecs|Horned Frogs|Razorbacks|Tar Heels|Yellow Jackets|Blue Raiders|Hawks|Red Foxes|Golden Griffins|Billikens|Crusaders|Patriots|Flyers|Explorers|Dragons|Pioneers|Phoenix|Pride|Bobcats|Roadrunners|Golden Hurricane|Leathernecks|Musketeers|Salukis|Purple Aces|Anteaters|Matadors|Highlanders|Tritons|Lopes|Antelopes|Privateers|Racers|Governors|Skyhawks|Ospreys|Keydets|Paladins|Retrievers|Catamounts|Terriers|Black Bears|River Hawks|Great Danes|Stags|Peacocks|Broncs|Red Flash|Blue Hose|Big Red|Big Green|Bonnies|Ramblers|Bengals|Grizzlies|Griffins|Golden Bears)$/i,'')};
function FragmentRow({row,rank,group,expanded,onToggle,identity}){
 const profile=identity==='franchises'?`/franchise/${row.id}`:`/coach/${row.id}`;
 return <><tr className={'msc-preview-row'+(expanded?' is-expanded':'')+(identity==='coaches'&&row.isInactive?' msc-coach-inactive':identity==='coaches'&&row.formerConference?' msc-coach-former':'')} onClick={onToggle} aria-expanded={expanded}>
 <td className="msc-rank-col">{rank}</td><td className="msc-name-col"><button type="button" className="msc-row-name" onClick={e=>{e.stopPropagation();onToggle()}}>{row.logoUrl&&!row.isInactive&&!row.formerConference?<img className="msc-team-logo" src={row.logoUrl} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>:null}{identity==='franchises'?compactSchoolName(row.name):row.name}</button></td>
 {group.cols.map(([key])=><td key={key}>{formatStat(key,row[key])}</td>)}<td className="msc-expand-col">{expanded?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</td>
 </tr>{expanded&&<tr className="msc-expanded-row"><td colSpan={group.cols.length+3}><div className="msc-expanded-inner"><div className="msc-expanded-title"><strong>{row.name} · {group.name}</strong><small>Career statistical breakdown</small></div><div className="msc-detail-grid">{group.cols.map(([key,label])=><div className="msc-detail-cell" key={key}><span>{label}</span><strong>{formatStat(key,row[key])}</strong></div>)}</div><p>Games played: {row.gp} · Record: {row.wins}–{row.losses}{row.ties?`–${row.ties}`:''}. Detailed event results are calculated from completed games.</p>{!(identity==='coaches'&&row.isInactive)&&<Link className="msc-profile-link" to={profile} onClick={e=>e.stopPropagation()}>View {identity==='franchises'?'franchise':'coach'} profile →</Link>}</div></td></tr>}</>;
}

const EVENT_KINDS=['Season Kickoff Invitational Regionals','SKI Champions Bracket','Mid Major Mayhem','Invitational Tournaments','Conference Challenger','Regional Showdown'];
const EVENT_LABELS={'Season Kickoff Invitational Regionals':'SKI Regional Champions','Regional Showdown':'Regional Showdowns','Conference Challenger':'Conference Challenger Series'};
const INVITATIONAL_PRESTIGE_ORDER=['Maui Invitational', 'Jimmy V Classic', 'Bad Boy Battle 4 Atlantis', 'Myrtle Beach Invitational', 'Coaches vs Cancer Holiday Tournament', 'Legends Classic Invitational', 'Old Spice Invitational', 'Wooden Legacy Invitational', 'Hawaiian Airlines Diamond Head Classic', 'Puerto Rico Tipoff Invitational', 'Paradise Jam Invitational', 'ESPN Events Invitational', 'Las Vegas Invitational', 'Hall of Fame London Showcase', 'Gotham Classic Invitational', "Shriners Children's Charleston Classic", 'Fort Myers Tipoff Classic', 'Holiday Hoopsgiving', "Jersey Mike's Jamaica Classic", 'Cancun Challenge', 'Naples Invitational', 'Caribbean Tipoff Classic', 'Emerald Coast Classic'];
const invitationalRank=name=>{const normalized=String(name||'').toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9]/g,'');return INVITATIONAL_PRESTIGE_ORDER.findIndex(x=>x.toLowerCase().replace(/[^a-z0-9]/g,'')===normalized)+1;};
function championshipBracketDestination(kind,record){
 const season=Number(record?.season),name=String(record?.tournamentName||'').trim();
 const slug=value=>String(value||'').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
 if(!season)return null;
 if(kind==='Season Kickoff Invitational Regionals'&&name)return {to:`/events/ski-regionals/${slug(name)}`,state:{season,tournamentName:name}};
 if(kind==='Invitational Tournaments'&&name)return {to:`/events/invitational-tournaments/${slug(name)}`,state:{season,tournamentName:name}};
 if(kind==='Regional Showdown'&&name)return {to:`/events/regional-showdowns/${slug(name)}`,state:{season,tournamentName:name}};
 if(kind==='Mid Major Mayhem')return {to:`/events/mid-major-mayhem/final-four?season=${season}`};
 if(kind==='SKI Champions Bracket')return {to:`/events/ski-champions/bracket?season=${season}`,state:{season}};
 return null;
}
function ChampionshipYear({kind,record}){const dest=championshipBracketDestination(kind,record);return dest?<Link className="msc-championship-year-link" to={dest.to} state={dest.state} title={`View ${record.season} bracket`}>{record.season}</Link>:<strong>{record.season}</strong>;}
function EventChampions({data,kind,onKindChange,year,onYearChange,open,onToggle}){
 const rows=(data?.champions||[]).filter(x=>x.event===kind);
 const years=[...new Set([...rows.map(x=>String(x.season)),...(kind==='Conference Challenger'?(data?.conferenceChallenger||[]).map(x=>String(x.season)):[])])].sort((a,b)=>Number(b)-Number(a));
 const selectedYear=years.includes(year)?year:years[0];
 const score=n=>Number.isFinite(Number(n))?Number(n).toFixed(2).replace(/\.00$/,''):'—';
 const team=(t,muted=false)=><span className={'msc-event-team'+(muted?' is-runner':'')}>{t?.logoUrl&&<Link to={`/franchise/${t.id}`}><img src={t.logoUrl} alt="" loading="lazy"/></Link>}<span className="msc-event-team-text"><Link to={`/franchise/${t.id}`}>{t.name}</Link>{t.coachId?<Link to={`/coach/${t.coachId}`} className="msc-event-coach">{t.coachName||t.coachId}</Link>:<small className="msc-event-coach">{t.coachName||'—'}</small>}</span></span>;
 const match=(r)=><div className="msc-event-match"><div className="msc-event-match-row">{r.championSeed&&<span className="msc-event-seed">#{r.championSeed}</span>}{team(r.champion)}<strong>{score(r.championScore)}</strong></div><div className="msc-event-match-row">{r.runnerUpSeed&&<span className="msc-event-seed">#{r.runnerUpSeed}</span>}{team(r.runnerUp,true)}<strong>{score(r.runnerUpScore)}</strong></div></div>;
 const named=['Invitational Tournaments','Regional Showdown'].includes(kind);
 const regional=kind==='Season Kickoff Invitational Regionals';
 const challenger=kind==='Conference Challenger';
 const challengerRows=data?.conferenceChallenger||[];
 const names=named?[...new Set(rows.map(x=>x.tournamentName).filter(Boolean))].sort((a,b)=>kind==='Invitational Tournaments'?( (invitationalRank(a)||999)-(invitationalRank(b)||999) || a.localeCompare(b)):a.localeCompare(b)):[];
 const yearsAvailable=challenger?challengerRows.map(x=>String(x.season)):years;
 const actualYear=yearsAvailable.includes(year)?year:yearsAvailable[0];
 return <div className="msc-event-archive">
 <Select label="Event" value={kind} onChange={onKindChange} options={EVENT_KINDS.map(k=>({value:k,label:EVENT_LABELS[k]||k}))}/>
 {regional&&<div className="msc-event-year"><Select label="Season" value={actualYear||''} onChange={onYearChange} options={yearsAvailable.length?yearsAvailable:['2026']}/></div>}
 {named?<><p className="msc-event-description">{names.length} named tournaments · Select a tournament to see its defending champion and previous finals.</p>
 {names.map(name=>{const history=rows.filter(x=>x.tournamentName===name).sort((a,b)=>b.season-a.season),latest=history[0],key=kind+'|'+name;
 return <section className="msc-event-bracket" key={key}><div className="msc-event-bracket-heading"><h4>{name}</h4>{kind==='Invitational Tournaments'&&invitationalRank(name)>0&&<span className="msc-event-prestige-rank">Prestige Rank #{invitationalRank(name)}</span>}</div><div className="msc-event-feature" style={{'--msc-card-color':latest.champion.primaryColor}}><small>DEFENDING CHAMPION · {latest.season}</small>{team(latest.champion)}{match(latest)}</div><button type="button" className="msc-conf-expand-trigger" onClick={()=>onToggle(key)} aria-expanded={Boolean(open[key])}><span>Championship History</span><span>{open[key]?'Hide':'View'} History {open[key]?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</span></button>{open[key]&&<div className="msc-event-history">{history.map(r=><div key={r.gameId} className="msc-event-history-item msc-event-history-compact"><ChampionshipYear kind={kind} record={r}/>{match(r)}</div>)}</div>}</section>})}</>:
 regional?<><h4 className="msc-event-group-title">{actualYear} SKI Regional Champions</h4><p className="msc-event-description">All completed regional winners for this season. Regions are not linked across seasons.</p><div className="msc-event-regional-list">{rows.filter(x=>String(x.season)===actualYear).map(r=><div className="msc-event-regional-row" key={r.gameId}>{team(r.champion)}{championshipBracketDestination(kind,r)?<Link className="msc-event-regional-label msc-event-regional-link" to={championshipBracketDestination(kind,r).to} state={championshipBracketDestination(kind,r).state} title={`View ${r.season} ${r.tournamentName} bracket`}>Regional Champion <ChevronRight size={13}/></Link>:<span className="msc-event-regional-label">Regional Champion</span>}</div>)}</div></>:
 challenger?<>{challengerRows.map(r=><section className="msc-event-challenger" key={r.season}><small>CONFERENCE CHALLENGER SERIES · {r.season}</small><div className="msc-event-challenger-winner">{r.winner&&conferenceBadge(r.winner)&&<img src={conferenceBadge(r.winner)} alt=""/>}<strong>{r.winner||'Undetermined'} {r.winner?'— Champion':''}</strong></div><div className="msc-event-conference-match">{r.conferences.map(c=><div key={c.name}>{conferenceBadge(c.name)&&<img src={conferenceBadge(c.name)} alt=""/>}<strong>{c.name}</strong><span>{c.wins} wins</span></div>)}</div><p>{r.gamesPlayed} championship-bracket games · {r.ties} tied games</p></section>)}</>:
 <>{rows.length?(()=>{const history=[...rows].sort((a,b)=>b.season-a.season),latest=history[0],key='featured|'+kind;return <section className="msc-event-bracket msc-event-single"><div className="msc-event-feature" style={{'--msc-card-color':latest.champion.primaryColor}}><small className="msc-event-feature-title">Defending Champion</small><div className="msc-event-feature-champion">{team(latest.champion)}</div><div className="msc-event-feature-final"><small>CHAMPIONSHIP GAME · {latest.season}{latest.week?' · WEEK '+latest.week:''}</small>{match(latest)}</div></div><button type="button" className="msc-conf-expand-trigger" onClick={()=>onToggle(key)} aria-expanded={Boolean(open[key])}><span>Championship History</span><span>{open[key]?'Hide':'View'} History {open[key]?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</span></button>{open[key]&&<div className="msc-event-history">{history.map(r=><div key={r.gameId} className="msc-event-history-item msc-event-history-compact"><ChampionshipYear kind={kind} record={r}/>{match(r)}</div>)}</div>}</section>})():<p className="msc-postseason-status">No completed championship results yet.</p>}</>}
 {((named&&!names.length)||(regional&&!rows.some(x=>String(x.season)===actualYear))||(challenger&&!challengerRows.length))&&<p className="msc-postseason-status">No completed championships recorded for this selection.</p>}
 </div>;
}


const ACH_METRICS=[{value:'titles',label:'Championships'},{value:'runnerUps',label:'Runner-up Finishes'},{value:'semifinalAppearances',label:'Final Four Appearances'}];
const ACH_POSTSEASON=['March Madness','NIT','College Basketball Crown','CBI'];
const ACH_MIDMAJOR=['Coastal','Conf USA','OVC','West Coast'];
const ACH_CANONICAL={ 'Conference USA':'Conf USA','C-USA':'Conf USA','Conf. USA':'Conf USA','CUSA':'Conf USA','Ohio Valley':'OVC','Ohio Valley Conference':'OVC','Coastal Athletic':'Coastal','West Coast Conference':'West Coast' };
function ConferenceAchievementBoard({data,loading,error,season,onSeason,event,onEvent,metric,onMetric}){
 const raw=data?.rows||[];
 const seasons=[...new Set(raw.map(x=>String(x.season)))].sort((a,b)=>Number(b)-Number(a));
 const events=data?.categories||['All Events'];
 const noFinalFour=['All Events','SKI Regionals','Invitational Tournaments','Regional Showdowns','Conference Challenger Series'];
 const allowedMetrics=[...ACH_METRICS.filter(m=>m.value!=='semifinalAppearances'||!noFinalFour.includes(event)),...(event==='March Madness'?[{value:'eliteEight',label:'Elite Eight Appearances'},{value:'sweetSixteen',label:'Sweet Sixteen Appearances'}]:[]),...((ACH_POSTSEASON.includes(event)||event==='SKI Champions Bracket')?[{value:'qualifiers',label:'Qualifiers'}]:[])];
 const selectedMetric=allowedMetrics.some(m=>m.value===metric)?metric:'titles';
 const byConference={};
 const newEntry=c=>({conference:c,titles:0,runnerUps:0,semifinalAppearances:0,qualifiers:0,eliteEight:0,sweetSixteen:0});
 raw.filter(x=>season==='All-Time'||String(x.season)===season).forEach(x=>{
  const c=ACH_CANONICAL[x.conference]||x.conference;if(!c)return;
  if(event==='Mid Major Mayhem'&&!ACH_MIDMAJOR.includes(c))return;
  if(!byConference[c])byConference[c]=newEntry(c);
  const part=event==='All Events'?x:(x.byEvent?.[event]||{});
  for(const k of ['titles','runnerUps','semifinalAppearances','qualifiers','eliteEight','sweetSixteen'])byConference[c][k]+=Number(part[k]||0);
 });
 if(event==='Mid Major Mayhem')for(const c of ACH_MIDMAJOR)if(!byConference[c])byConference[c]=newEntry(c);
 const ranked=Object.values(byConference).sort((a,b)=>b[selectedMetric]-a[selectedMetric]||b.titles-a.titles||a.conference.localeCompare(b.conference));
 const details=r=>(ACH_POSTSEASON.includes(event)||event==='SKI Champions Bracket')?`${r.titles} titles · ${r.runnerUps} runner-ups · ${r.qualifiers} qualifiers${event==='March Madness'?` · ${r.eliteEight} Elite Eight · ${r.sweetSixteen} Sweet Sixteen`:''}`:`${r.titles} titles · ${r.runnerUps} runner-ups · ${r.semifinalAppearances} semifinal appearances`;
 return <div className="msc-achievements">
  <p className="msc-achievement-note">Conference achievements earned in completed events. Titles, runner-up finishes and deep tournament runs are counted separately.</p>
  <div className="msc-achievement-filters">
   <Select label="Season" value={season} onChange={onSeason} options={['All-Time',...seasons]}/>
   <Select label="Competition" value={event} onChange={onEvent} options={events}/>
   <Select label="Ranking" value={selectedMetric} onChange={onMetric} options={allowedMetrics}/>
  </div>
  {loading?<p className="msc-postseason-status">Loading conference achievements…</p>:error?<p className="msc-postseason-status">Unable to load rankings: {error}. Deploy the included API first.</p>:ranked.length?<div className="msc-achievement-list">
   {ranked.map((r,i)=><div className="msc-achievement-row" key={r.conference}>
    <strong className="msc-achievement-rank">{i+1}</strong>
    {conferenceBadge(r.conference)?<img className="msc-achievement-patch" src={conferenceBadge(r.conference)} alt=""/>:<span className="msc-achievement-patch"/>}
    <div className="msc-achievement-info"><strong>{r.conference}</strong><small>{details(r)}</small></div>
    <strong className="msc-achievement-value">{r[selectedMetric]}</strong>
   </div>)}
  </div>:<p className="msc-postseason-status">No completed achievements available for this selection.</p>}
  <p className="msc-achievement-note">Qualifiers count unique participating franchises per SKI Champions Bracket or postseason event and season. Elite Eight and Sweet Sixteen count teams appearing in the corresponding recorded March Madness rounds. The Conference Challenger Series awards one title to the winning conference.</p>
 </div>;
}


const ARCHIVE_GROUPS=[
 {id:'postseason',label:'Postseason Championships',sub:'March Madness, NIT, Crown and CBI'},
 {id:'conference',label:'Conference Championships',sub:'Regular season and conference tournament'},
 {id:'events',label:'Event Championships',sub:'SKI, invitationals, showdowns and Challenger'},
 {id:'records',label:'Season Leaders & Records',sub:'Scoring, single-game records, wins and streaks'},
 {id:'standings',label:'Final Conference Standings',sub:'Historical conference records and placements'}
];

const ARCHIVE_RECORD_CATEGORIES=['Scoring','Single-Game Records','Wins & Streaks'];
function ArchiveSeasonRecords({season}){
 const [records,setRecords]=useState({});
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 useEffect(()=>{
  let cancelled=false;
  const controller=new AbortController();
  setLoading(true);setError('');setRecords({});
  Promise.all(ARCHIVE_RECORD_CATEGORIES.map(async category=>{
   const url=`${API_URL}?action=leadersRecords&season=${encodeURIComponent(season)}&category=${encodeURIComponent(category)}`;
   const response=await fetch(url,{signal:controller.signal});
   if(!response.ok)throw new Error(`HTTP ${response.status}`);
   const result=await response.json();
   if(!result.ok)throw new Error(result.error||'Leaders & Records API error');
   return [category,result.records||[]];
  })).then(items=>{if(!cancelled)setRecords(Object.fromEntries(items));})
    .catch(e=>{if(!cancelled&&e.name!=='AbortError')setError(e.message)})
    .finally(()=>{if(!cancelled)setLoading(false)});
  return()=>{cancelled=true;controller.abort()};
 },[season]);
 const displayValue=holder=>{
  if(!holder||holder.value===null||holder.value===undefined||!Number.isFinite(Number(holder.value)))return '—';
  const number=Number(holder.value);
  const digits=holder.unit==='%'?1:Number.isInteger(number)?0:1;
  return `${number.toLocaleString(undefined,{minimumFractionDigits:0,maximumFractionDigits:digits})}${holder.unit?' '+holder.unit:''}`;
 };
 if(loading)return <p className="msc-archive-help">Loading {season} season records…</p>;
 if(error)return <p className="msc-archive-help">Unable to load season records: {error}</p>;
 return <div className="msc-archive-records">
  <p className="msc-archive-help">Season-specific results from the existing Leaders & Records calculations. Open a group to review its records.</p>
  {ARCHIVE_RECORD_CATEGORIES.map(category=><details key={category} className="msc-archive-conference msc-archive-record-group">
   <summary><Trophy size={17}/>{category}<span>{(records[category]||[]).length} records</span></summary>
   <div className="msc-archive-record-grid">{(records[category]||[]).map((record,i)=>{
    const h=record.holder;
    return <article key={`${record.name}-${i}`} className="msc-archive-record-card">
     <small>{record.name}</small>
     <strong className="msc-archive-record-value">{displayValue(h)}</strong>
     {h?<Link className="msc-archive-record-holder" to={`/franchise/${h.id}`}>
      {h.logoUrl&&<img src={h.logoUrl} alt="" loading="lazy"/>}
      <span>{h.name}</span>
     </Link>:<span className="msc-archive-empty">No qualifying result yet</span>}
     {h?.opponent&&<span className="msc-archive-record-detail">vs {h.opponent}</span>}
    </article>;
   })}</div>
  </details>)}
 </div>;
}

function SeasonArchive({data,loading,error,season,onSeason,open,onToggle}){
 const fmt=x=>Number.isFinite(Number(x))?String(Number(x)):'—';
 const team=(t)=>t?<span className="msc-archive-team">{t.logoUrl&&<Link to={`/franchise/${t.id}`}><img src={t.logoUrl} alt=""/></Link>}<span><Link to={`/franchise/${t.id}`}>{t.name}</Link>{t.coachId?<Link className="msc-archive-coach" to={`/coach/${t.coachId}`}>{t.coachName}</Link>:<small>{t.coachName}</small>}</span></span>:<span className="msc-archive-empty">Not awarded yet</span>;
 const scorecard=r=><div className="msc-archive-final" key={r.gameId}><div>{team(r.champion)}<strong>{fmt(r.championScore)}</strong></div><div className="msc-archive-runner">{team(r.runnerUp)}<strong>{fmt(r.runnerUpScore)}</strong></div></div>;
 const conf=data?.conferenceChampions||[],events=data?.eventChampions||[],post=data?.postseason||[],challenger=data?.conferenceChallenger||[];
 const standings=data?.standings||[];
 const groups=(data?.conferences||[]).map(name=>({name,teams:standings.filter(r=>r.conference===name).sort((a,b)=>(b.conferenceWins+.5*b.conferenceTies)/Math.max(1,b.conferenceWins+b.conferenceLosses+b.conferenceTies)-(a.conferenceWins+.5*a.conferenceTies)/Math.max(1,a.conferenceWins+a.conferenceLosses+a.conferenceTies)||b.conferenceWins-a.conferenceWins)}));
 const eventsByName={};events.forEach(r=>{const name=r.event==='Season Kickoff Invitational Regionals'?'SKI Regional Champions':r.event==='Regional Showdown'?'Regional Showdowns':r.event; (eventsByName[name]||(eventsByName[name]=[])).push(r)});
 const years=['2026','2027'];
 return <div className="msc-season-archive">
  <Select label="Season" value={season} onChange={onSeason} options={years}/>
  {loading?<p className="msc-postseason-status">Loading {season} season archive…</p>:error?<p className="msc-postseason-status">Unable to load season archive: {error}. Deploy the v53 API first.</p>:<>
   <div className="msc-archive-summary"><small>{season} SEASON YEARBOOK</small><h4>{season} MESH Basketball</h4><p>Championships, events and final standings from the {season} season.</p></div>
   {ARCHIVE_GROUPS.map(section=><section key={section.id} className="msc-archive-section">
    <button className="msc-archive-toggle" type="button" onClick={()=>onToggle(section.id)} aria-expanded={!!open[section.id]}><span><strong>{section.label}</strong><small>{section.sub}</small></span>{open[section.id]?<ChevronUp size={18}/>:<ChevronDown size={18}/>}</button>
    {open[section.id]&&<div className="msc-archive-section-content">
     {section.id==='postseason'&&(post.length?['March Madness','NIT','College Basketball Crown','CBI'].map(name=>{const r=post.find(x=>x.tournament===name);return <div className="msc-archive-entry" key={name}><h5>{name}</h5>{r?scorecard(r):<p>Championship not completed.</p>}</div>}):<p>No completed postseason championships recorded.</p>)}
     {section.id==='conference'&&(conf.length?conf.map(r=><div className="msc-archive-entry" key={r.conference}><h5>{r.conference}</h5><small>Regular-season champion</small>{team(r.regular)}<small>Conference tournament champion</small>{r.final?team(r.final.champion):<p>Not completed.</p>}</div>):<p>No completed conference championships recorded.</p>)}
     {section.id==='events'&&<>{challenger.map(r=><div className="msc-archive-entry" key={r.season}><h5>Conference Challenger Series</h5><div className="msc-archive-challenger">{r.winner&&conferenceBadge(r.winner)&&<img src={conferenceBadge(r.winner)} alt=""/>}<strong>{r.winner||'No outright winner'}</strong></div><p>{r.conferences.map(c=>`${c.name}: ${c.wins} wins`).join(' · ')}</p></div>)}{Object.entries(eventsByName).map(([name,items])=>['SKI Regional Champions','Invitational Tournaments','Regional Showdowns'].includes(name)?<details className="msc-archive-event-group" key={name}><summary><span>{name}</span><small>{items.length} champions</small></summary><div className="msc-archive-event-group-content">{items.map(r=><div className="msc-archive-event-row" key={r.gameId}><span>{r.tournamentName||'Championship'}</span>{team(r.champion)}</div>)}</div></details>:<div className="msc-archive-entry" key={name}><h5>{name} <span>({items.length})</span></h5>{items.map(r=><div className="msc-archive-event-row" key={r.gameId}><span>{r.tournamentName||'Championship'}</span>{team(r.champion)}</div>)}</div>)}{!events.length&&!challenger.length&&<p>No completed event championships recorded.</p>}</>}
     {section.id==='records'&&<ArchiveSeasonRecords key={season} season={season}/>}
     {section.id==='standings'&&(groups.length?groups.map(group=><details className="msc-archive-conference" key={group.name}><summary>{conferenceBadge(group.name)&&<img src={conferenceBadge(group.name)} alt=""/>}{group.name}<span>{group.teams.length} teams</span></summary><div className="msc-archive-standings-head"><span>Team</span><span>Overall</span><span>Conf</span></div>{group.teams.map((r,i)=><div className="msc-archive-standings-row" key={r.id}><span><b>{i+1}.</b> {team(r)}</span><span>{r.wins}-{r.losses}{r.ties?'-'+r.ties:''}</span><span>{r.conferenceWins}-{r.conferenceLosses}{r.conferenceTies?'-'+r.conferenceTies:''}</span></div>)}</details>):<p>No final standings archived for this season yet.</p>)}
    </div>}
   </section>)}
  </>}
 </div>;
}

export default function Stats(){
 const [archiveSeason,setArchiveSeason]=useState('2026'),[archiveData,setArchiveData]=useState(null),[archiveLoading,setArchiveLoading]=useState(false),[archiveError,setArchiveError]=useState(''),[archiveOpen,setArchiveOpen]=useState({});
 const [postseasonOpen,setPostseasonOpen]=useState({});
 const [view,setView]=useState('home'),[scope,setScope]=useState('All-Time'),[metric,setMetric]=useState('wins'),[order,setOrder]=useState('desc'),[history,setHistory]=useState('Postseason Champions'),[category,setCategory]=useState('Scoring'),[statGroup,setStatGroup]=useState('Overall Performance'),[expanded,setExpanded]=useState(null),[conference,setConference]=useState('All MESH'),[competition,setCompetition]=useState('All Competitions'),[competitions,setCompetitions]=useState([]),[conferences,setConferences]=useState([]),[competitionKinds,setCompetitionKinds]=useState({});
 const [careerData,setCareerData]=useState([]),[loading,setLoading]=useState(false),[loadError,setLoadError]=useState('');
 const [postseasonCards,setPostseasonCards]=useState([]),[postseasonLoading,setPostseasonLoading]=useState(false),[postseasonError,setPostseasonError]=useState('');
 const [confExpanded,setConfExpanded]=useState({}),[confArchive,setConfArchive]=useState([]),[confLoading,setConfLoading]=useState(false),[confError,setConfError]=useState('');
 const [achievements,setAchievements]=useState(null),[achLoading,setAchLoading]=useState(false),[achError,setAchError]=useState(''),[achSeason,setAchSeason]=useState('All-Time'),[achEvent,setAchEvent]=useState('All Events'),[achMetric,setAchMetric]=useState('titles');
 const [eventData,setEventData]=useState(null),[eventLoading,setEventLoading]=useState(false),[eventError,setEventError]=useState(''),[eventKind,setEventKind]=useState('Season Kickoff Invitational Regionals'),[eventYear,setEventYear]=useState('2026'),[eventOpen,setEventOpen]=useState({});
 const [leaderRecords,setLeaderRecords]=useState([]),[leaderLoading,setLeaderLoading]=useState(false),[leaderError,setLeaderError]=useState('');
 useEffect(()=>{if(view!=='franchises'&&view!=='coaches')return;let cancelled=false;const controller=new AbortController();setLoading(true);setLoadError('');setCareerData([]);
 fetch(`${API_URL}?action=careerStats&kind=${view}&season=${encodeURIComponent(scope)}`,{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}).then(data=>{if(cancelled)return;if(!data.ok)throw new Error(data.error||'Stats API error');setCareerData(data.rows||[]);setCompetitions(data.competitions||[]);setConferences(data.conferences||[]);setCompetitionKinds(data.competitionKinds||{})}).catch(e=>{if(!cancelled&&e.name!=='AbortError')setLoadError(e.message)}).finally(()=>{if(!cancelled)setLoading(false)});
 return()=>{cancelled=true;controller.abort()};},[view,scope]);
 useEffect(()=>{if(view!=='leaders'||!['Scoring','Single-Game Records','Wins & Streaks'].includes(category))return;let cancelled=false;const controller=new AbortController();setLeaderLoading(true);setLeaderError('');setLeaderRecords([]);
 fetch(`${API_URL}?action=leadersRecords&season=${encodeURIComponent(scope)}&category=${encodeURIComponent(category)}`,{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}).then(data=>{if(cancelled)return;if(!data.ok)throw new Error(data.error||'Leaders API error');setLeaderRecords(data.records||[])}).catch(e=>{if(!cancelled&&e.name!=='AbortError')setLeaderError(e.message)}).finally(()=>{if(!cancelled)setLeaderLoading(false)});
 return()=>{cancelled=true;controller.abort()};},[view,scope,category]);
 useEffect(()=>{if(view!=='history'||history!=='Postseason Champions')return;let cancelled=false;const controller=new AbortController();setPostseasonLoading(true);setPostseasonError('');setPostseasonCards([]);
 const tournaments=['March Madness','NIT','College Basketball Crown','CBI'];
 Promise.all(tournaments.map(tournament=>fetch(`${API_URL}?action=postseasonChampions&season=All-Time&tournament=${encodeURIComponent(tournament)}`,{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}).then(data=>{if(!data.ok)throw new Error(data.error||'Champions API error');return {tournament,champions:data.champions||[]}}))).then(data=>{if(!cancelled)setPostseasonCards(data)}).catch(err=>{if(!cancelled&&err.name!=='AbortError')setPostseasonError(err.message)}).finally(()=>{if(!cancelled)setPostseasonLoading(false)});
 return()=>{cancelled=true;controller.abort()};},[view,history]);
 useEffect(()=>{if(view!=='history'||history!=='Conference Champions')return;let cancelled=false;const controller=new AbortController();setConfLoading(true);setConfError('');
 fetch(`${API_URL}?action=conferenceChampions`,{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}).then(data=>{if(!cancelled){if(!data.ok)throw new Error(data.error||'Conference champions API error');setConfArchive(data.records||[])}}).catch(e=>{if(!cancelled&&e.name!=='AbortError')setConfError(e.message)}).finally(()=>{if(!cancelled)setConfLoading(false)});
 return()=>{cancelled=true;controller.abort()};},[view,history]);
 useEffect(()=>{if(view!=='history'||history!=='Event Champions')return;let cancelled=false;const controller=new AbortController();setEventLoading(true);setEventError('');
 fetch(`${API_URL}?action=eventChampions`,{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}).then(data=>{if(!data.ok)throw new Error(data.error||'Event Champions API error');if(!cancelled)setEventData(data)}).catch(e=>{if(!cancelled&&e.name!=='AbortError')setEventError(e.message)}).finally(()=>{if(!cancelled)setEventLoading(false)});
 return()=>{cancelled=true;controller.abort()};},[view,history]);
 useEffect(()=>{if(view!=='history'||history!=='Conference Achievement Rankings')return;let cancelled=false;const controller=new AbortController();setAchLoading(true);setAchError('');
 fetch(`${API_URL}?action=conferenceAchievementsV52`,{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}).then(d=>{if(!d.ok)throw new Error(d.error||'Achievement API error');if(!cancelled)setAchievements(d)}).catch(e=>{if(!cancelled&&e.name!=='AbortError')setAchError(e.message)}).finally(()=>{if(!cancelled)setAchLoading(false)});
 return()=>{cancelled=true;controller.abort()};},[view,history]);
 useEffect(()=>{if(view!=='history'||history!=='Season Archives')return;let cancelled=false;const controller=new AbortController();setArchiveLoading(true);setArchiveError('');
 fetch(`${API_URL}?action=seasonArchiveV53&season=${archiveSeason}`,{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}).then(d=>{if(!d.ok)throw new Error(d.error||'Archive API error');if(!cancelled)setArchiveData(d)}).catch(e=>{if(!cancelled&&e.name!=='AbortError')setArchiveError(e.message)}).finally(()=>{if(!cancelled)setArchiveLoading(false)});
 return()=>{cancelled=true;controller.abort()};},[view,history,archiveSeason]);
 const active=useMemo(()=>SECTIONS.find(s=>s.id===view),[view]);
 const isCoachConference=view==='coaches'&&statGroup==='Event Performance'&&competition==='Conference';
 const filteredRows=useMemo(()=>careerData.filter(r=>conference==='All MESH'||((conference==='Mid Major Only'||conference==='Mid Major (Current)')?(isMidMajorConference(r.conference)&&(view!=='coaches'||!r.isInactive)):(isCoachConference?(r.conference===conference||Boolean(r.conferenceRecords?.[conference])):r.conference===conference))),[careerData,conference,isCoachConference,view]);
 const rankingRows=useMemo(()=>filteredRows.map(r=>{
   if(!isCoachConference||conference==='All MESH')return r;
   const cr=r.conferenceRecords?.[conference]||{wins:0,losses:0,ties:0,regTitles:0};
   const total=cr.wins+cr.losses+cr.ties;
   return {...r,confWins:cr.wins,confLosses:cr.losses,confTies:cr.ties,confPct:total?100*cr.wins/total:0,regTitles:cr.regTitles||0,formerConference:r.conference!==conference};
 }),[filteredRows,isCoachConference,conference]);
 const sortedRows=useMemo(()=>[...rankingRows].sort((a,b)=>{const av=a[metric],bv=b[metric];const diff=(Number(av)||0)-(Number(bv)||0);return (order==='asc'?1:-1)*(diff||a.name.localeCompare(b.name))}),[rankingRows,metric,order]);
 const baseGroup=STAT_GROUPS.find(g=>g.name===statGroup)||STAT_GROUPS[0];
 const group=statGroup==='Event Performance'&&competition==='Conference'?{...baseGroup,cols:[['confWins','CONF W'],['confLosses','CONF L'],['confTies','CONF T'],['confPct','CONF WIN%'],['regTitles','RS TITLES']]}:(statGroup==='Event Performance'||statGroup==='Postseason')?{...baseGroup,cols:[['selectedWins','W'],['selectedLosses','L'],...((statGroup==='Event Performance'&&competition==='Conference Challenger Series')?[['selectedTies','T']]:[]),['selectedPct','WIN%'],...((statGroup==='Postseason'||competition==='SKI Champions Bracket')?[['selectedApps','APPS']]:[]),['selectedTitles','TITLES']]}:baseGroup;
 const visibleRows=useMemo(()=>sortedRows.map(r=>{if((statGroup!=='Event Performance'&&statGroup!=='Postseason')||(statGroup==='Event Performance'&&competition==='Conference'))return r;const isPost=statGroup==='Postseason';const entries=Object.entries(r.events||{}).filter(([name])=>isPost?competitionKinds[name]==='postseason':['event','conferenceTournament'].includes(competitionKinds[name]));const chosen=competition==='All Competitions'?entries:entries.filter(([name])=>name===competition);const totals=chosen.reduce((a,[,v])=>({wins:a.wins+(v.wins||0),losses:a.losses+(v.losses||0),ties:a.ties+(v.ties||0),titles:a.titles+(v.titles||0),apps:a.apps+(v.appearances||0)}),{wins:0,losses:0,ties:0,titles:0,apps:0});return {...r,selectedWins:totals.wins,selectedLosses:totals.losses,selectedTies:totals.ties,selectedPct:totals.wins+totals.losses+totals.ties?100*totals.wins/(totals.wins+totals.losses+totals.ties):0,selectedApps:totals.apps,selectedTitles:totals.titles}}).sort((a,b)=>{const key=['selectedWins','selectedLosses','selectedTies','selectedPct','selectedApps','selectedTitles'].includes(metric)?metric:'selectedWins';return (order==='asc'?1:-1)*((Number(a[key])||0)-(Number(b[key])||0))}),[sortedRows,statGroup,competition,metric,order,competitionKinds]);
 const chooseMetric=k=>{if(k===metric)setOrder(x=>x==='desc'?'asc':'desc');else{setMetric(k);setOrder('desc')}};
 const openView=id=>{setView(id);setExpanded(null);setScope('All-Time');setStatGroup('Overall Performance');setMetric('wins');setConference('All MESH');setCompetition('All Competitions')};
 return <main className="msc-page">
   <PageHeader eyebrow="Statistics Center" title="Stats & History" description="Explore MESH Basketball statistics, career records, championships, and league history." imageSrc={mbaLogo} imageAlt="MBA logo" accent="events" size="compact"/>
   {view!=='home'&&<button type="button" className="msc-back" onClick={()=>openView('home')}><ArrowLeft size={16}/> All Stats Sections</button>}
   {view==='home'?<><div className="msc-intro"><span>EXPLORE THE RECORD BOOK</span><h2>Inside the Numbers</h2><p>Choose a section to explore statistics and MESH Basketball history.</p></div><div className="msc-landing">{SECTIONS.map(({id,name,subtitle,Icon})=><button type="button" className="msc-landing-card" key={id} onClick={()=>openView(id)}><span className="msc-card-icon"><Icon size={25}/></span><strong>{name}</strong><small>{subtitle}</small><ChevronRight className="msc-card-chevron" size={17}/></button>)}</div></>:null}
   {(view==='franchises'||view==='coaches')?<section className="msc-section">
     <div className="msc-heading"><span>CAREER STATISTICAL RANKINGS</span><h2>{view==='franchises'?'Franchises – Career Stats':'Coaches – Career Stats'}</h2><p>{view==='franchises'?'Each franchise keeps its history across coaching and team-name changes.':'Each coach keeps their complete history across franchise changes.'} Select a category, compare the full table, or tap a row for more detail.</p></div>
     <div className="msc-filters msc-career-filters"><Select label="Season" value={scope} onChange={setScope} options={['All-Time','2027','2026']}/><Select label="Conference" value={conference} onChange={v=>{setConference(v);setExpanded(null)}} options={['All MESH',view==='coaches'?'Mid Major (Current)':'Mid Major Only',...conferences]}/><div className={'msc-category-filter msc-category-half'}><Select label="Stat Category" value={statGroup} onChange={v=>{setStatGroup(v);setCompetition('All Competitions');setMetric((v==='Event Performance'||v==='Postseason')?'selectedWins':(STAT_GROUPS.find(g=>g.name===v)||STAT_GROUPS[0]).cols[0][0]);setExpanded(null)}} options={STAT_GROUPS.map(g=>g.name)}/></div>{(statGroup==='Event Performance'||statGroup==='Postseason')&&<div className="msc-category-filter msc-category-half"><Select label={statGroup==='Postseason'?'Postseason Tournament':'Season Event'} value={competition} onChange={v=>{setCompetition(v);if(v==='Conference')setMetric('confWins');else if(competition==='Conference')setMetric('selectedWins');setExpanded(null)}} options={statGroup==='Postseason'?['All Competitions','March Madness','NIT','College Basketball Crown','CBI']:['All Competitions','Conference','SKI Regionals','SKI Champions Bracket','Mid Major Mayhem','Invitational Tournaments','Conference Challenger Series','Regional Showdowns','Conference Tournaments']}/></div>}</div>
     {isCoachConference&&<p className="msc-conference-record-note">{conference==='All MESH'?'Records include all conference games coached throughout MESH, regardless of conference.':'Records include only conference games coached in '+conference+'. Former conference coaches remain in the historical rankings.'}</p>}
     <div className="msc-table-head"><div><strong>{statGroup} Rankings</strong><small>Tap column headings to sort. Tap a row to expand its statistical breakdown.</small></div><ArrowUpDown size={17}/></div>
     <div className="msc-table-wrap msc-career-table-wrap"><table className="msc-table msc-career-table"><thead><tr><th className="msc-rank-col">#</th><th className="msc-name-col">{view==='franchises'?'Franchise':'Coach'}</th>{group.cols.map(([key,label])=><th key={key}><button type="button" className={metric===key?'active':''} onClick={()=>chooseMetric(key)}>{label} {metric===key?(order==='desc'?'↓':'↑'):''}</button></th>)}<th className="msc-expand-col">DETAILS</th></tr></thead><tbody>{visibleRows.map((row,i)=><FragmentRow key={row.id} row={row} rank={i+1} group={group} expanded={expanded===row.id} onToggle={()=>setExpanded(x=>x===row.id?null:row.id)} identity={view}/>)}</tbody></table></div>
     <div className="msc-preview-note">{loading?'Loading career statistics…':loadError?`Unable to load statistics: ${loadError}. Deploy the included Apps Script first, then refresh.`:`${visibleRows.length} ${view==='franchises'?'franchises':'coaches'} in the rankings. Championship and event totals are derived from finalized GAME_RESULTS; categories needing additional sources show dashes.`}</div>
   </section>:null}
   {view==='leaders'?<section className="msc-section"><div className="msc-heading"><span>THE BEST OF MESH</span><h2>Leaders & Records</h2><p>Season leaders and historical records, organized by achievement.</p></div><div className="msc-filters msc-leaders-filters"><Select label="Season" value={scope} onChange={setScope} options={['All-Time','2027','2026']}/><Select label="Category" value={category} onChange={setCategory} options={CATEGORIES.map(c=>c.name)}/></div><div className="msc-record-grid">{(CATEGORIES.find(c=>c.name===category)?.items||[]).map(name=>{const record=['Scoring','Single-Game Records','Wins & Streaks'].includes(category)?leaderRecords.find(r=>r.name===name):null;const holder=record?.holder;return <article key={name} className="msc-record-card" style={holder?{'--msc-record-stripe':holder.primaryColor}:undefined}><span className="msc-record-icon"><Trophy size={16}/></span><h3>{name}</h3>{holder?<><strong>{Number(holder.value).toLocaleString(undefined,{maximumFractionDigits:category==='Single-Game Records'||holder.unit!=='%'?0:1})} <span className="msc-record-unit">{holder.unit}</span></strong><Link className="msc-record-holder msc-record-holder-link" to={`/franchise/${holder.id}`}>{holder.logoUrl?<img src={holder.logoUrl} alt="" loading="lazy"/>:null}<span>{compactSchoolName(holder.name)}</span></Link><small>{holder.season}{holder.opponent?` · vs ${holder.opponent}`:` · ${holder.games} completed games`}</small></>:<><strong>—</strong><small>{['Scoring','Single-Game Records','Wins & Streaks'].includes(category)?(leaderLoading?'Loading records…':'No completed-game record available'):'Record holder · Season · Opponent'}</small></>}</article>})}</div>{['Scoring','Single-Game Records','Wins & Streaks'].includes(category)?(leaderError?<p className="msc-preview-note">Unable to load scoring records: {leaderError}. Deploy the included Apps Script and refresh.</p>:<p className="msc-preview-note">{leaderLoading?'Loading records…':category==='Scoring'?'Scoring records use completed games. Defense is lowest points allowed per game; differential is points scored per game minus points allowed per game.':category==='Single-Game Records'?'Single-game records use completed games; ties are excluded from Closest Game. Combined score is attributed to the winning franchise (or Team 1 in a tie).':'Win percentage requires at least 10 completed games and counts ties as half a win. Ties break winning and losing streaks; All-Time streaks carry across seasons.' }</p>):<Placeholder>Leader names, values and game links will appear here after validating the source fields.</Placeholder>}</section>:null}
   {view==='history'?<section className="msc-section"><div className="msc-heading"><span>THE CHAMPIONSHIP ARCHIVE</span><h2>Champions & History</h2><p>Find past champions and compare which conferences have dominated each competition.</p></div><div className="msc-history-category"><Select label="Category" value={history} onChange={value=>{setHistory(value);if(value==='Event Champions'){setEventKind('Season Kickoff Invitational Regionals');setEventYear('2026');}}} options={HISTORY.map(h=>h.name)}/></div><div className="msc-history-detail"><span>CHAMPIONSHIP RECORD BOOK</span><h3>{history}</h3><p>{HISTORY.find(h=>h.name===history)?.sub}</p>{history==='Postseason Champions'?<div className="msc-postseason-archive">
 {postseasonLoading?<p className="msc-postseason-status">Loading championship results…</p>:postseasonError?<p className="msc-postseason-status">Unable to load champions: {postseasonError}. Deploy the v25 Apps Script and refresh.</p>:
 ['March Madness','NIT','College Basketball Crown','CBI'].map(tournament=>{const cards=(postseasonCards.find(x=>x.tournament===tournament)?.champions||[]).slice().sort((a,b)=>b.season-a.season);const latest=cards[0];const fmt=n=>Number(n).toFixed(2).replace(/\.00$/,'');return <section className="msc-postseason-group" key={tournament}>
 <h4 className="msc-postseason-group-title">{tournament}</h4>
 {latest?<><article className="msc-postseason-card" style={{'--msc-champ-color':latest.champion.primaryColor}}>
 <div className="msc-postseason-card-head"><strong>Defending Champion</strong></div>
 <div className="msc-postseason-champion"><Link to={`/franchise/${latest.champion.id}`} className="msc-postseason-team">{latest.champion.logoUrl&&<img src={latest.champion.logoUrl} alt="" loading="lazy"/>}<strong>{latest.champion.name}</strong></Link>{latest.champion.coachId?<Link className="msc-postseason-champion-coach" to={`/coach/${latest.champion.coachId}`}>{latest.champion.coachName||latest.champion.coachId}</Link>:<span className="msc-postseason-champion-coach">{latest.champion.coachName||'—'}</span>}</div>
 <div className="msc-postseason-final"><span>CHAMPIONSHIP GAME · WEEK {latest.week}</span><div><Link to={`/franchise/${latest.champion.id}`}>{latest.champion.name}</Link><strong>{fmt(latest.championScore)}</strong></div><div><Link to={`/franchise/${latest.runnerUp.id}`}>{latest.runnerUp.name}</Link><strong>{fmt(latest.runnerUpScore)}</strong></div></div>
 <div className="msc-postseason-runner">RUNNER-UP · {latest.runnerUp.name} · Coach: {latest.runnerUp.coachName||'—'}</div></article>
 <button type="button" className="msc-conf-expand-trigger msc-postseason-expand" onClick={()=>setPostseasonOpen(p=>({...p,[tournament]:!p[tournament]}))} aria-expanded={Boolean(postseasonOpen[tournament])}><span>Championship History</span><span>{postseasonOpen[tournament]?'Hide':'View'} History {postseasonOpen[tournament]?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</span></button>
 {postseasonOpen[tournament]&&<div className="msc-postseason-history msc-postseason-history-expanded">{cards.map(c=><div className="msc-postseason-history-compact" key={c.gameId||`${tournament}-${c.season}`}><strong className="msc-postseason-history-year">{c.season}</strong><div className="msc-postseason-history-match"><div className="msc-postseason-history-match-team">{c.champion.logoUrl&&<Link to={`/franchise/${c.champion.id}`}><img src={c.champion.logoUrl} alt=""/></Link>}<span><Link to={`/franchise/${c.champion.id}`}>{c.champion.name}</Link>{c.champion.coachId?<Link className="msc-postseason-history-coach" to={`/coach/${c.champion.coachId}`}>{c.champion.coachName||c.champion.coachId}</Link>:<small>{c.champion.coachName||'—'}</small>}</span><b>{fmt(c.championScore)}</b></div><div className="msc-postseason-history-match-team is-runner">{c.runnerUp.logoUrl&&<Link to={`/franchise/${c.runnerUp.id}`}><img src={c.runnerUp.logoUrl} alt=""/></Link>}<span><Link to={`/franchise/${c.runnerUp.id}`}>{c.runnerUp.name}</Link>{c.runnerUp.coachId?<Link className="msc-postseason-history-coach" to={`/coach/${c.runnerUp.coachId}`}>{c.runnerUp.coachName||c.runnerUp.coachId}</Link>:<small>{c.runnerUp.coachName||'—'}</small>}</span><b>{fmt(c.runnerUpScore)}</b></div></div></div>)}</div>}</>:<p className="msc-postseason-status">No completed championship is recorded for this tournament yet.</p>}
 </section>})}
 </div>:history==='Conference Champions'?<div className="msc-conference-archive">
 {confLoading?<p className="msc-postseason-status">Loading conference champions…</p>:confError?<p className="msc-postseason-status">Unable to load conference champions: {confError}. Deploy the included Apps Script first.</p>:
 (()=>{const filtered=confArchive;
 const groups=[...new Set(filtered.map(r=>r.conference))].sort();
 const team=(t,muted=false)=><span className={'msc-conf-team'+(muted?' is-runner':'')}>{t?.logoUrl&&<Link to={`/franchise/${t.id}`}><img src={t.logoUrl} alt="" loading="lazy"/></Link>}<span className="msc-conf-team-text"><Link to={`/franchise/${t.id}`}>{t.name}</Link>{t.coachId?<Link className="msc-conf-coach" to={`/coach/${t.coachId}`}>{t.coachName||t.coachId}</Link>:<small className="msc-conf-coach">{t.coachName||'—'}</small>}</span></span>;
 const score=n=>Number(n).toFixed(2).replace(/\.00$/,'');
 const record=t=>t?.conferenceRecord||'—';
 return groups.length?groups.map(conf=>{const seasons=filtered.filter(r=>r.conference===conf).sort((a,b)=>b.season-a.season);const latestRegular=seasons.find(r=>r.regular),latestFinal=seasons.find(r=>r.final);const color=latestFinal?.final?.champion?.primaryColor||latestRegular?.regular?.primaryColor||'#ff8a2a';const badge=conferenceBadge(conf);
 const regularOpen=Boolean(confExpanded[conf+'|regular']);const tournamentOpen=Boolean(confExpanded[conf+'|tournament']);
 const toggle=(key)=>setConfExpanded(prev=>({...prev,[key]:!prev[key]}));
 return <section key={conf} className="msc-conf-section">
 <header className="msc-conf-section-header">{badge&&<img className="msc-conf-badge" src={badge} alt={`${conf} conference patch`}/>}<h3>{{AAC:'American Athletic',ACC:'Atlantic Coast',MAC:'Mid-American'}[conf]||conf}</h3></header>
 <div className="msc-conf-champ-box msc-conf-glow" style={{'--msc-card-color':latestRegular?.regular?.primaryColor||'#ff8a2a'}}><small>DEFENDING REGULAR SEASON CHAMPION</small>{latestRegular?<div className="msc-conf-feature-line">{team(latestRegular.regular)}<strong className="msc-conf-record">{record(latestRegular.regular)}</strong></div>:<span>Not yet recorded</span>}</div>
 <button type="button" className="msc-conf-expand-trigger" aria-expanded={regularOpen} onClick={()=>toggle(conf+'|regular')}><span>Regular Season Champions History</span><span>{regularOpen?'Hide':'View'} History {regularOpen?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</span></button>
 {regularOpen&&<div className="msc-conf-history-list">{seasons.filter(r=>r.regular).map(r=><div key={r.season} className="msc-conf-history-line"><strong className="msc-conf-year">{r.season}</strong>{team(r.regular)}<strong className="msc-conf-record">{record(r.regular)}</strong></div>)}</div>}
 <div className="msc-conf-tourney-unified msc-conf-glow" style={{'--msc-card-color':latestFinal?.final?.champion?.primaryColor||'#ff8a2a'}}><div className="msc-conf-champ-box"><small>DEFENDING CONFERENCE TOURNAMENT CHAMPION</small>{latestFinal?team(latestFinal.final.champion):<span>Not yet recorded</span>}</div>
  {latestFinal&&<div className="msc-conf-final"><small>CHAMPIONSHIP GAME · {latestFinal.season} · WEEK {latestFinal.final.week}</small><div className="msc-conf-final-row"><div className="msc-conf-seeded-team">{latestFinal.final.championSeed&&<span className="msc-conf-seed">#{latestFinal.final.championSeed}</span>}{team(latestFinal.final.champion)}</div><strong>{score(latestFinal.final.championScore)}</strong></div><div className="msc-conf-final-row"><div className="msc-conf-seeded-team">{latestFinal.final.runnerUpSeed&&<span className="msc-conf-seed">#{latestFinal.final.runnerUpSeed}</span>}{team(latestFinal.final.runnerUp,true)}</div><strong>{score(latestFinal.final.runnerUpScore)}</strong></div></div>}</div>
 <button type="button" className="msc-conf-expand-trigger" aria-expanded={tournamentOpen} onClick={()=>toggle(conf+'|tournament')}><span>Conference Tournament Champions History</span><span>{tournamentOpen?'Hide':'View'} History {tournamentOpen?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</span></button>
 {tournamentOpen&&<div className="msc-conf-history-list">{seasons.filter(r=>r.final).map(r=><div key={r.season} className="msc-conf-history-match"><strong className="msc-conf-year">{r.season}</strong><div className="msc-conf-history-match-teams"><div><span className="msc-conf-seeded-team">{r.final.championSeed&&<span className="msc-conf-seed">#{r.final.championSeed}</span>}{team(r.final.champion)}</span><strong>{score(r.final.championScore)}</strong></div><div><span className="msc-conf-seeded-team">{r.final.runnerUpSeed&&<span className="msc-conf-seed">#{r.final.runnerUpSeed}</span>}{team(r.final.runnerUp,true)}</span><strong>{score(r.final.runnerUpScore)}</strong></div></div></div>)}</div>}
 </section>}) :<p className="msc-postseason-status">No completed conference championship games are recorded for this selection yet.</p>})()}
 </div>:history==='Event Champions'?<>{eventLoading?<p className="msc-postseason-status">Loading event champions…</p>:eventError?<p className="msc-postseason-status">Unable to load event champions: {eventError}. Deploy the included Apps Script first.</p>:<EventChampions data={eventData} kind={eventKind} onKindChange={setEventKind} year={eventYear} onYearChange={setEventYear} open={eventOpen} onToggle={key=>setEventOpen(p=>({...p,[key]:!p[key]}))}/>}</>:history==='Conference Achievement Rankings'?<ConferenceAchievementBoard data={achievements} loading={achLoading} error={achError} season={achSeason} onSeason={setAchSeason} event={achEvent} onEvent={setAchEvent} metric={achMetric} onMetric={setAchMetric}/>:history==='Season Archives'?<SeasonArchive data={archiveData} loading={archiveLoading} error={archiveError} season={archiveSeason} onSeason={setArchiveSeason} open={archiveOpen} onToggle={key=>setArchiveOpen(p=>({...p,[key]:!p[key]}))}/>:<Placeholder>Historical winners, team logos, coaches, seasons and results will appear here.</Placeholder>}</div></section>:null}
   <footer className="msc-footer">MESH Basketball · Stats & History</footer>
 </main>
}
