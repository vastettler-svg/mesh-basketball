import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, History, UserRound } from "lucide-react";
import "../styles/coachCarousel.css";

const API_URL = "https://script.google.com/macros/s/AKfycbwoKZvZRLo7POCjuaD56mvYKaL_AZdfbG04xkoF0XZKqiGYZjD3TmEFuNK8tDwr_K4B/exec";
const TIER_OPTIONS = ["All MESH", "Power", "Mid"];
const value = (record, key) => String(record?.[key] ?? "").trim();
const label = (record, key, fallback = "—") => value(record, key) || fallback;
const validColor = color => /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(String(color || ""));
function CoachName({id,name,linkable=true}) {
  return linkable && id && name ? <Link className="mba-cc-person-link" to={`/coach/${encodeURIComponent(id)}`}>{name}</Link> : <strong>{name || "Position Vacant"}</strong>;
}
function MoveCard({move, colors}) {
  const fid = value(move,"Franchise_ID");
  const team = label(move,"Franchise_Name");
  const open = value(move,"Status").toLowerCase() === "open";
  const color = colors[fid] || {};
  return <article className="mba-cc-card" style={{"--mba-cc-primary":validColor(color.primaryColor)?color.primaryColor:"#ff7a1a","--mba-cc-secondary":validColor(color.secondaryColor)?color.secondaryColor:"#2a3038"}}>
    <div className="mba-cc-team-header">
      {color.logoUrl ? <Link to={`/franchise/${encodeURIComponent(fid)}`}><img className="mba-cc-logo" src={color.logoUrl} alt={`${team} logo`}/></Link> : <div className="mba-cc-logo-fallback">M</div>}
      <div className="mba-cc-team-copy"><small>{label(move,"Conference")} · {label(move,"Tier").toUpperCase()}</small><Link to={`/franchise/${encodeURIComponent(fid)}`}>{team}</Link><span>{value(move,"Conference_Rank")?`CONF #${value(move,"Conference_Rank")}`:""}{value(move,"National_Rank")?` · NATIONAL #${value(move,"National_Rank")}`:""}</span></div>
      <span className={`mba-cc-status ${open?"mba-cc-open":"mba-cc-filled"}`}>{open?"OPEN":"FILLED"}</span>
    </div>
    <div className="mba-cc-sides">
      <div className="mba-cc-side"><div className="mba-cc-side-title"><UserRound size={14}/> WHO'S OUT</div><CoachName id={value(move,"Outgoing_Coach_ID")} name={value(move,"Outgoing_Coach_Name")} linkable={Boolean(value(move,"Outgoing_New_Franchise_ID")) && !/retir|left league|inactive|departed|quit/i.test(value(move,"Outgoing_Reason"))}/><span className="mba-cc-reason">{label(move,"Outgoing_Reason")}</span>{value(move,"Outgoing_New_Team")?<p>To: {value(move,"Outgoing_New_Franchise_ID")?<Link to={`/franchise/${encodeURIComponent(value(move,"Outgoing_New_Franchise_ID"))}`}>{value(move,"Outgoing_New_Team")}</Link>:value(move,"Outgoing_New_Team")}{value(move,"Outgoing_New_Tier")?` (${value(move,"Outgoing_New_Tier")})`:""}</p>:null}</div>
      <div className="mba-cc-side"><div className="mba-cc-side-title"><ArrowRight size={14}/> WHO'S IN</div>{open&&!value(move,"Incoming_Coach_Name")?<strong className="mba-cc-vacant">Awaiting Replacement</strong>:<CoachName id={value(move,"Incoming_Coach_ID")} name={value(move,"Incoming_Coach_Name")}/>}<span className="mba-cc-reason">{open&&!value(move,"Incoming_Reason")?"Head Coach Opening":label(move,"Incoming_Reason")}</span>{value(move,"Incoming_Prev_Team")?<p>From: {value(move,"Incoming_Prev_Franchise_ID")?<Link to={`/franchise/${encodeURIComponent(value(move,"Incoming_Prev_Franchise_ID"))}`}>{value(move,"Incoming_Prev_Team")}</Link>:value(move,"Incoming_Prev_Team")}{value(move,"Incoming_Prev_Tier")?` (${value(move,"Incoming_Prev_Tier")})`:""}</p>:null}</div>
    </div>
    {value(move,"Notes")?<p className="mba-cc-notes">{value(move,"Notes")}</p>:null}
  </article>;
}
export default function CoachCarousel() {
  const [moves,setMoves] = useState([]);
  const [seasons,setSeasons] = useState([]);
  const [season,setSeason] = useState("");
  const [tier,setTier] = useState("All MESH");
  const [colors,setColors] = useState({});
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  useEffect(()=>{const controller=new AbortController();(async()=>{try{const res=await fetch(`${API_URL}?action=coachCarousel`,{signal:controller.signal});if(!res.ok)throw new Error(`HTTP ${res.status}`);const data=await res.json();if(!data.ok)throw new Error(data.error||"Unable to load Coach Carousel");setMoves(Array.isArray(data.moves)?data.moves:[]);setSeasons(Array.isArray(data.seasons)?data.seasons:[]);setSeason(String(data.seasons?.[0]||""));}catch(err){if(err.name!=="AbortError")setError(err.message);}finally{if(!controller.signal.aborted)setLoading(false);}})();return()=>controller.abort();},[]);
  const filtered=useMemo(()=>moves.filter(move=>String(move.Season)===season&&(tier==="All MESH"||String(move.Tier||"").toLowerCase()===tier.toLowerCase())),[moves,season,tier]);
  const openMoves=filtered.filter(move=>String(move.Status||"").toLowerCase()==="open");
  const filledMoves=filtered.filter(move=>String(move.Status||"").toLowerCase()!=="open");
  useEffect(()=>{const controller=new AbortController();const ids=[...new Set(filtered.map(m=>m.Franchise_ID).filter(Boolean))].filter(id=>!colors[id]);if(!ids.length)return;let cursor=0;async function worker(){while(cursor<ids.length&&!controller.signal.aborted){const id=ids[cursor++];try{const response=await fetch(`${API_URL}?action=franchise&franchiseId=${encodeURIComponent(id)}`,{signal:controller.signal});const data=await response.json();if(data.ok&&data.franchise)setColors(old=>({...old,[id]:data.franchise}));}catch(err){if(err.name!=="AbortError")setColors(old=>({...old,[id]:{}}));}}}Promise.all(Array.from({length:Math.min(4,ids.length)},()=>worker()));return()=>controller.abort();},[filtered]);
  return <main className="mba-cc-page"><Link className="mba-cc-back" to="/more"><ArrowLeft size={15}/> Back to More</Link><header className="mba-cc-hero"><span>MESH BASKETBALL · MORE</span><h1>Coach Carousel</h1><p>Coaching vacancies, offseason movement, and the history of the MESH sidelines.</p></header>
    <div className="mba-cc-controls"><div className="mba-cc-tabs" role="group" aria-label="Tier filter">{TIER_OPTIONS.map(option=><button type="button" key={option} className={tier===option?"active":""} onClick={()=>setTier(option)}>{option==="Mid"?"Mid Major":option}</button>)}</div><label className="mba-cc-season">Season <select value={season} onChange={e=>setSeason(e.target.value)}>{seasons.map(y=><option key={y} value={String(y)}>{y}</option>)}</select></label></div>
    {loading?<p className="mba-cc-message">Loading coaching movements…</p>:error?<p className="mba-cc-message">{error}</p>:!filtered.length?<p className="mba-cc-message">No coaching moves have been recorded for this selection.</p>:<><div className="mba-cc-summary"><div><strong>{filtered.length}</strong><span>Coaching Moves</span></div><div><strong>{filledMoves.length}</strong><span>Filled</span></div><div><strong>{openMoves.length}</strong><span>Open</span></div></div>{openMoves.length?<section className="mba-cc-section"><h2><BriefcaseBusiness size={19}/> Open Jobs <small>{openMoves.length}</small></h2><div className="mba-cc-grid">{openMoves.map((move,i)=><MoveCard key={`${move.Season}-${move.Franchise_ID}-${i}`} move={move} colors={colors}/>)}</div></section>:null}<section className="mba-cc-section"><h2><History size={19}/> Recent Coach Moves <small>{filledMoves.length}</small></h2><div className="mba-cc-grid">{filledMoves.map((move,i)=><MoveCard key={`${move.Season}-${move.Franchise_ID}-${i}`} move={move} colors={colors}/>)}</div></section></>}
  </main>;
}
