import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Trophy, Users, Archive, ChevronRight, ArrowLeft, ArrowUpDown, Crown, Medal, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import '../styles/statsCenter.css';
import PageHeader from '../components/PageHeader';
import mbaLogo from '../assets/mba-logo.png';

const API_URL = 'https://script.google.com/macros/s/AKfycbwoKZvZRLo7POCjuaD56mvYKaL_AZdfbG04xkoF0XZKqiGYZjD3TmEFuNK8tDwr_K4B/exec';
const formatStat=(key,v)=>{if(v===null||v===undefined||v==='')return '—';if(!Number.isFinite(Number(v)))return '—';const n=Number(v);return ['pct','confPct','tourneyPct','selectedPct'].includes(key)?n.toFixed(1)+'%':['ppg','papg','avg','avgMargin','consistency','high','low','bigWin','bigLoss','closeWin'].includes(key)?n.toFixed(1):Number.isInteger(n)?n.toLocaleString():n.toFixed(1)};
const SECTIONS = [
  { id:'franchises', name:'Franchises – Career Stats', subtitle:'Season and all-time franchise rankings', Icon:Shield },
  { id:'coaches', name:'Coaches – Career Stats', subtitle:'Season and all-time coaching rankings', Icon:Users },
  { id:'leaders', name:'Leaders & Records', subtitle:'League leaders and historic performances', Icon:Trophy },
  { id:'history', name:'Champions & History', subtitle:'Titles, events and season archives', Icon:Archive },
];
const STAT_GROUPS = [
 {name:'Overall Performance',cols:[['gp','GP'],['wins','W'],['losses','L'],['pct','WIN%'],['confWins','CONF W'],['confLosses','CONF L'],['confPct','CONF %']]},
 {name:'Scoring',cols:[['pf','PF'],['ppg','PPG'],['pa','PA'],['papg','PA/G'],['diff','DIFF']]},
 {name:'Weekly Performance',cols:[['high','HIGH'],['low','LOW'],['avg','AVG'],['consistency','CONSIST.']]},
 {name:'Game Results',cols:[['bigWin','BIG W'],['bigLoss','BIG L'],['closeWin','CLOSE W'],['avgMargin','AVG +/-']]},
 {name:'Ranked Opponents',cols:[['top25Wins','TOP25 W'],['top25Losses','TOP25 L'],['top10Wins','TOP10 W'],['top10Losses','TOP10 L']]},
 {name:'Streaks',cols:[['winStreak','WIN STK'],['lossStreak','LOSS STK']]},
 {name:'Tournament Performance',cols:[['tourneyWins','TOUR W'],['tourneyLosses','TOUR L'],['tourneyPct','TOUR %'],['tourneyTitles','TITLES']]},
 {name:'Postseason',cols:[['postWins','POST W'],['postLosses','POST L'],['postTitles','POST TITLES'],['postApps','APPS']]},
 {name:'Historical Achievements',cols:[['regTitles','REG SEASON CONF'],['confTitles','CONF TOUR'],['natTitles','NATL'],['eventTitles','EVENT'],['postTitles','POST TITLES'],['prestige','PRESTIGE']]},
];
// Demonstration rows intentionally contain no invented league statistics.
const PREVIEW_ROWS = [
 {id:'preview-1',label:'Franchise / Coach 01'},
 {id:'preview-2',label:'Franchise / Coach 02'},
 {id:'preview-3',label:'Franchise / Coach 03'},
 {id:'preview-4',label:'Franchise / Coach 04'},
];
const CATEGORIES = [
  {name:'Scoring', items:['Highest Points Per Game','Most Total Points','Best Scoring Defense','Best Point Differential']},
  {name:'Single-Game Records', items:['Highest Single-Game Score','Lowest Single-Game Score','Largest Victory Margin','Closest Game','Highest Combined Score','Highest Score in a Loss']},
  {name:'Wins & Streaks',items:['Most Wins','Best Win Percentage','Longest Winning Streak']},
];
const METRICS = [['wins','W'],['losses','L'],['pct','WIN %'],['ppg','PPG'],['pf','PF'],['papg','PA/G'],['diff','+/-'],['high','HIGH']];
const HISTORY = [
  {name:'National Champions',sub:'National title winners, runner-ups, coaches and championship results',Icon:Crown},
  {name:'Conference Champions',sub:'Champions by conference and season',Icon:Medal},
  {name:'Tournament Champions',sub:'Ski Regional, invitational and other event winners',Icon:Trophy},
  {name:'Conference Achievement Rankings',sub:'Compare conference titles and event victories in sortable tables',Icon:BarChart3},
  {name:'Season Archives',sub:'Historical standings, postseason finishes and season identities',Icon:Archive},
];
function Select({label,value,onChange,options}){return <label className="msc-select"><span>{label}</span><select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}</select></label>}
function Placeholder({children}){return <div className="msc-empty"><strong>Data connection is the next step</strong><p>{children}</p><small>This preview intentionally contains no fabricated statistics or champions.</small></div>}
function FragmentRow({row,rank,group,expanded,onToggle,identity}){
 const profile=identity==='franchises'?`/franchise/${row.id}`:`/coach/${row.id}`;
 return <><tr className={'msc-preview-row'+(expanded?' is-expanded':'')} onClick={onToggle} aria-expanded={expanded}>
 <td className="msc-rank-col">{rank}</td><td className="msc-name-col"><button type="button" className="msc-row-name" onClick={e=>{e.stopPropagation();onToggle()}}>{row.logoUrl?<img className="msc-team-logo" src={row.logoUrl} alt="" loading="lazy" onError={e=>{e.currentTarget.style.display='none'}}/>:null}{row.name}</button></td>
 {group.cols.map(([key])=><td key={key}>{formatStat(key,row[key])}</td>)}<td className="msc-expand-col">{expanded?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</td>
 </tr>{expanded&&<tr className="msc-expanded-row"><td colSpan={group.cols.length+3}><div className="msc-expanded-inner"><div className="msc-expanded-title"><strong>{row.name} · {group.name}</strong><small>Career statistical breakdown</small></div><div className="msc-detail-grid">{group.cols.map(([key,label])=><div className="msc-detail-cell" key={key}><span>{label}</span><strong>{formatStat(key,row[key])}</strong></div>)}</div><p>Games played: {row.gp} · Record: {row.wins}–{row.losses}{row.ties?`–${row.ties}`:''}. Detailed event results are calculated from completed games.</p><Link className="msc-profile-link" to={profile} onClick={e=>e.stopPropagation()}>View {identity==='franchises'?'franchise':'coach'} profile →</Link></div></td></tr>}</>;
}
export default function Stats(){
 const [view,setView]=useState('home'),[scope,setScope]=useState('All-Time'),[metric,setMetric]=useState('wins'),[order,setOrder]=useState('desc'),[history,setHistory]=useState('National Champions'),[category,setCategory]=useState('Scoring'),[statGroup,setStatGroup]=useState('Overall Performance'),[expanded,setExpanded]=useState(null),[conference,setConference]=useState('All MESH'),[competition,setCompetition]=useState('All Competitions'),[competitions,setCompetitions]=useState([]),[conferences,setConferences]=useState([]),[competitionKinds,setCompetitionKinds]=useState({});
 const [careerData,setCareerData]=useState([]),[loading,setLoading]=useState(false),[loadError,setLoadError]=useState('');
 useEffect(()=>{if(view!=='franchises'&&view!=='coaches')return;let cancelled=false;const controller=new AbortController();setLoading(true);setLoadError('');setCareerData([]);
 fetch(`${API_URL}?action=careerStats&kind=${view}&season=${encodeURIComponent(scope)}`,{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()}).then(data=>{if(cancelled)return;if(!data.ok)throw new Error(data.error||'Stats API error');setCareerData(data.rows||[]);setCompetitions(data.competitions||[]);setConferences(data.conferences||[]);setCompetitionKinds(data.competitionKinds||{})}).catch(e=>{if(!cancelled&&e.name!=='AbortError')setLoadError(e.message)}).finally(()=>{if(!cancelled)setLoading(false)});
 return()=>{cancelled=true;controller.abort()};},[view,scope]);
 const active=useMemo(()=>SECTIONS.find(s=>s.id===view),[view]);
 const filteredRows=useMemo(()=>careerData.filter(r=>conference==='All MESH'||r.conference===conference),[careerData,conference]);
 const sortedRows=useMemo(()=>[...filteredRows].sort((a,b)=>{const av=a[metric],bv=b[metric];const diff=(Number(av)||0)-(Number(bv)||0);return (order==='asc'?1:-1)*(diff||a.name.localeCompare(b.name))}),[filteredRows,metric,order]);
 const baseGroup=STAT_GROUPS.find(g=>g.name===statGroup)||STAT_GROUPS[0];
 const group=(statGroup==='Tournament Performance'||statGroup==='Postseason')?{...baseGroup,cols:[['selectedWins','W'],['selectedLosses','L'],['selectedPct','WIN%'],['selectedApps','APPS'],['selectedTitles','TITLES']]}:baseGroup;
 const visibleRows=useMemo(()=>sortedRows.map(r=>{if(statGroup!=='Tournament Performance'&&statGroup!=='Postseason')return r;const isPost=statGroup==='Postseason';const entries=Object.entries(r.events||{}).filter(([name])=>isPost?competitionKinds[name]==='postseason':competitionKinds[name]==='event');const chosen=competition==='All Competitions'?entries:entries.filter(([name])=>name===competition);const totals=chosen.reduce((a,[,v])=>({wins:a.wins+(v.wins||0),losses:a.losses+(v.losses||0),ties:a.ties+(v.ties||0),titles:a.titles+(v.titles||0),apps:a.apps+(v.appearances||0)}),{wins:0,losses:0,ties:0,titles:0,apps:0});return {...r,selectedWins:totals.wins,selectedLosses:totals.losses,selectedPct:totals.wins+totals.losses+totals.ties?100*totals.wins/(totals.wins+totals.losses+totals.ties):0,selectedApps:totals.apps,selectedTitles:totals.titles}}).sort((a,b)=>{const key=['selectedWins','selectedLosses','selectedPct','selectedApps','selectedTitles'].includes(metric)?metric:'selectedWins';return (order==='asc'?1:-1)*((Number(a[key])||0)-(Number(b[key])||0))}),[sortedRows,statGroup,competition,metric,order,competitionKinds]);
 const chooseMetric=k=>{if(k===metric)setOrder(x=>x==='desc'?'asc':'desc');else{setMetric(k);setOrder('desc')}};
 const openView=id=>{setView(id);setExpanded(null);setScope('All-Time');setStatGroup('Overall Performance');setMetric('wins');setConference('All MESH');setCompetition('All Competitions')};
 return <main className="msc-page">
   <PageHeader eyebrow="Statistics Center" title="Stats & History" description="Explore MESH Basketball statistics, career records, championships, and league history." imageSrc={mbaLogo} imageAlt="MBA logo" accent="events" size="compact"/>
   {view!=='home'&&<button type="button" className="msc-back" onClick={()=>openView('home')}><ArrowLeft size={16}/> All Stats Sections</button>}
   {view==='home'?<><div className="msc-intro"><span>EXPLORE THE RECORD BOOK</span><h2>Inside the Numbers</h2><p>Choose a section to explore statistics and MESH Basketball history.</p></div><div className="msc-landing">{SECTIONS.map(({id,name,subtitle,Icon})=><button type="button" className="msc-landing-card" key={id} onClick={()=>openView(id)}><span className="msc-card-icon"><Icon size={25}/></span><strong>{name}</strong><small>{subtitle}</small><ChevronRight className="msc-card-chevron" size={17}/></button>)}</div></>:null}
   {(view==='franchises'||view==='coaches')?<section className="msc-section">
     <div className="msc-heading"><span>CAREER STATISTICAL RANKINGS</span><h2>{view==='franchises'?'Franchises – Career Stats':'Coaches – Career Stats'}</h2><p>{view==='franchises'?'Each franchise keeps its history across coaching and team-name changes.':'Each coach keeps their complete history across franchise changes.'} Select a category, compare the full table, or tap a row for more detail.</p></div>
     <div className="msc-filters msc-career-filters"><Select label="Season" value={scope} onChange={setScope} options={['All-Time','2027','2026']}/><Select label="Conference" value={conference} onChange={v=>{setConference(v);setExpanded(null)}} options={['All MESH',...conferences]}/><div className="msc-category-filter"><Select label="Stat Category" value={statGroup} onChange={v=>{setStatGroup(v);setCompetition('All Competitions');setMetric((v==='Tournament Performance'||v==='Postseason')?'selectedWins':(STAT_GROUPS.find(g=>g.name===v)||STAT_GROUPS[0]).cols[0][0]);setExpanded(null)}} options={STAT_GROUPS.map(g=>g.name)}/></div>{(statGroup==='Tournament Performance'||statGroup==='Postseason')&&<div className="msc-category-filter"><Select label={statGroup==='Postseason'?'Postseason Tournament':'Season Event'} value={competition} onChange={v=>{setCompetition(v);setExpanded(null)}} options={statGroup==='Postseason'?['All Competitions','March Madness','NIT','College Basketball Crown','CBI']:['All Competitions','SKI Regionals','SKI Champions Bracket','Mid Major Mayhem','Invitational Tournaments','Conference Challenger Series','Regional Showdowns','Conference Tournaments']}/></div>}</div>
     <div className="msc-table-head"><div><strong>{statGroup} Rankings</strong><small>Tap column headings to sort. Tap a row to expand its statistical breakdown.</small></div><ArrowUpDown size={17}/></div>
     <div className="msc-table-wrap msc-career-table-wrap"><table className="msc-table msc-career-table"><thead><tr><th className="msc-rank-col">#</th><th className="msc-name-col">{view==='franchises'?'Franchise':'Coach'}</th>{group.cols.map(([key,label])=><th key={key}><button type="button" className={metric===key?'active':''} onClick={()=>chooseMetric(key)}>{label} {metric===key?(order==='desc'?'↓':'↑'):''}</button></th>)}<th className="msc-expand-col">DETAILS</th></tr></thead><tbody>{visibleRows.map((row,i)=><FragmentRow key={row.id} row={row} rank={i+1} group={group} expanded={expanded===row.id} onToggle={()=>setExpanded(x=>x===row.id?null:row.id)} identity={view}/>)}</tbody></table></div>
     <div className="msc-preview-note">{loading?'Loading career statistics…':loadError?`Unable to load statistics: ${loadError}. Deploy the included Apps Script first, then refresh.`:`${visibleRows.length} ${view==='franchises'?'franchises':'coaches'} with completed-game statistics. Championship and event totals are derived from finalized GAME_RESULTS; categories needing additional sources show dashes.`}</div>
   </section>:null}
   {view==='leaders'?<section className="msc-section"><div className="msc-heading"><span>THE BEST OF MESH</span><h2>Leaders & Records</h2><p>Season leaders and historical records, organized by achievement.</p></div><div className="msc-toggle"><button className={scope==='Current Season'?'active':''} onClick={()=>setScope('Current Season')}>Current Season</button><button className={scope==='All-Time'?'active':''} onClick={()=>setScope('All-Time')}>All-Time</button></div><div className="msc-filters msc-filters-single"><Select label="Category" value={category} onChange={setCategory} options={CATEGORIES.map(c=>c.name)}/></div><div className="msc-record-grid">{(CATEGORIES.find(c=>c.name===category)?.items||[]).map(name=><article key={name} className="msc-record-card"><span className="msc-record-icon"><Trophy size={16}/></span><h3>{name}</h3><strong>—</strong><small>Record holder · Season · Opponent</small></article>)}</div><Placeholder>Leader names, values and game links will appear here after validating the source fields.</Placeholder></section>:null}
   {view==='history'?<section className="msc-section"><div className="msc-heading"><span>THE CHAMPIONSHIP ARCHIVE</span><h2>Champions & History</h2><p>Find past champions and compare which conferences have dominated each competition.</p></div><div className="msc-history-nav">{HISTORY.map(({name,Icon})=><button key={name} className={history===name?'active':''} onClick={()=>setHistory(name)}><Icon size={15}/>{name}</button>)}</div><div className="msc-history-detail"><span>CHAMPIONSHIP RECORD BOOK</span><h3>{history}</h3><p>{HISTORY.find(h=>h.name===history)?.sub}</p>{history==='Conference Achievement Rankings'?<div className="msc-table-wrap"><table className="msc-table"><thead><tr>{['Conference','National','Conference','Ski Regional','Invitational','Other Events'].map((s,i)=><th key={i}>{s}</th>)}</tr></thead><tbody><tr><td colSpan={6} className="msc-table-empty">Conference totals will be attributed using the champion's historical conference and verified event classifications.</td></tr></tbody></table></div>:<Placeholder>Historical winners, team logos, coaches, seasons and results will appear here.</Placeholder>}</div></section>:null}
   <footer className="msc-footer">MESH Basketball · Stats & History</footer>
 </main>
}
