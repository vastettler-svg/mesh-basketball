import {useEffect,useState} from "react";
import "../styles/Events.css";
import PageHeader from "../components/PageHeader";
import {useNavigate} from "react-router-dom";
import mbaLogo from "../assets/mba-logo.png";
const EVENTS=[
{slug:"ski-regionals",name:"Season Kickoff Invitational Regionals",weeks:"Weeks 2–4",start:2,end:4,accent:"#67c7ff",description:"184 teams compete across 23 eight-team regional tournaments.",meta:"23 REGIONALS · 8 TEAMS EACH"},
{slug:"ski-champions",name:"SKI Champions Bracket",weeks:"Weeks 5–9",start:5,end:9,accent:"#1756a9",description:"The 23 SKI Regional champions advance into the championship bracket.",meta:"REGIONAL CHAMPIONS"},
{slug:"mid-major-mayhem",name:"Mid Major Mayhem",weeks:"Weeks 5–10",start:5,end:10,accent:"#20b486",description:"A 64-team tournament featuring MESH Basketball's Mid Major field.",meta:"64 TEAMS"},
{slug:"invitational-tournaments",name:"Invitational Tournaments",weeks:"Weeks 6–8",start:6,end:8,accent:"#8b5cf6",description:"Twenty-three eight-team invitational tournaments run across the MESH universe.",meta:"23 TOURNAMENTS · 8 TEAMS EACH"},
{slug:"conference-challenger",name:"Conference Challenger Tourney",weeks:"Weeks 10–13",start:10,end:13,accent:"#ff7a1a",description:"Conference competition takes center stage in the Conference Challenger.",meta:"CONFERENCE EVENT"},
{slug:"rivalry-week",name:"Rivalry Week",weeks:"Week 14",start:14,end:14,accent:"#ef4444",description:"A full week dedicated to rivalry matchups across MESH Basketball.",meta:"SPECIAL EVENT"},
{slug:"conference-tournaments",name:"Conference Tournaments",weeks:"Weeks 15–18",start:15,end:18,accent:"#14b8a6",description:"Conference postseason tournaments determine champions across MESH.",meta:"POSTSEASON"},
{slug:"regional-showdowns",name:"Regional Showdown Tournaments",weeks:"Weeks 16–18",start:16,end:18,accent:"#ec4899",description:"Twenty-three eight-team Regional Showdown tournaments close the regional slate.",meta:"23 TOURNAMENTS · 8 TEAMS EACH"},
{slug:"national-postseason",name:"National Postseason",weeks:"Weeks 19–24",start:19,end:24,accent:"#d4af37",description:"The MESH Basketball season culminates with March Madness and the national postseason tournaments.",meta:"MARCH MADNESS · NIT · CROWN · CBI"}
];
const CLICKABLE_EVENT_STYLES=".events-card--clickable{cursor:pointer;transition:transform 150ms ease,border-color 150ms ease,box-shadow 150ms ease,filter 150ms ease}.events-card--clickable:hover{transform:translateY(-2px);border-color:var(--event-accent);box-shadow:0 10px 24px rgba(0,0,0,.22);filter:brightness(1.045)}.events-card--clickable:hover .events-card__action{color:var(--event-accent)}.events-card--clickable:focus-visible{outline:2px solid var(--event-accent);outline-offset:3px}.events-card--clickable:active{transform:translateY(0)}";
const SCORES_API_URL="https://script.google.com/macros/s/AKfycbwoKZvZRLo7POCjuaD56mvYKaL_AZdfbG04xkoF0XZKqiGYZjD3TmEFuNK8tDwr_K4B/exec";

function statusFor(event,currentWeek){if(currentWeek==null)return"UPCOMING";if(currentWeek<event.start)return"UPCOMING";if(currentWeek>event.end)return"COMPLETE";return"ACTIVE";}
function EventCard({event,hero=false,onOpen,currentWeek}){const status=statusFor(event,currentWeek);const clickable=event.slug==="ski-regionals"||event.slug==="ski-champions"||event.slug==="mid-major-mayhem"||event.slug==="invitational-tournaments"||event.slug==="regional-showdowns"||event.slug==="rivalry-week"||event.slug==="conference-tournaments"||event.slug==="national-postseason"||event.slug==="conference-challenger";return <article className={`events-card${hero?" events-card--hero":""}${clickable?" events-card--clickable":""}`} style={{"--event-accent":event.accent}} onClick={clickable?()=>onOpen(event):undefined} onKeyDown={clickable?e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onOpen(event);}}:undefined} role={clickable?"link":undefined} tabIndex={clickable?0:undefined}><div className="events-card__accent"/><div className="events-card__body"><div className="events-card__eyebrow"><span>{event.weeks}</span><span className={`events-status events-status--${status.toLowerCase()}`}>{status}</span></div><h2>{event.name}</h2><p>{event.description}</p><div className="events-card__footer"><span>{event.meta}</span><span className="events-card__action">{status==="UPCOMING"?"EVENT PREVIEW":"VIEW EVENT"} <span aria-hidden="true">›</span></span></div></div></article>}
export default function Events(){
const navigate=useNavigate();
const[currentWeek,setCurrentWeek]=useState(null);
const[weekError,setWeekError]=useState(false);
useEffect(()=>{
 let cancelled=false;
 const controller=new AbortController();
 async function loadCurrentWeek(){
  try{
   const url=new URL(SCORES_API_URL);
   url.searchParams.set("action","scores");
   const response=await fetch(url.toString(),{signal:controller.signal,cache:"no-store"});
   if(!response.ok)throw new Error("Unable to retrieve the current week");
   const payload=await response.json();
   if(!payload?.ok)throw new Error(payload?.error||"Unable to retrieve the current week");
   const week=Number(payload.activeWeek||payload.week);
   if(!Number.isInteger(week)||week<1)throw new Error("Invalid current week");
   if(!cancelled){setCurrentWeek(week);setWeekError(false);}
  }catch(error){if(!cancelled&&error?.name!=="AbortError"){setCurrentWeek(null);setWeekError(true);}}
 }
 loadCurrentWeek();
 return()=>{cancelled=true;controller.abort();};
},[]);
const active=currentWeek==null?[]:EVENTS.filter(event=>statusFor(event,currentWeek)==="ACTIVE");const openEvent=event=>{if(event.slug==="ski-regionals")navigate("/events/ski-regionals");if(event.slug==="ski-champions")navigate("/events/ski-champions");if(event.slug==="mid-major-mayhem")navigate("/events/mid-major-mayhem");if(event.slug==="invitational-tournaments")navigate("/events/invitational-tournaments");if(event.slug==="regional-showdowns")navigate("/events/regional-showdowns");if(event.slug==="rivalry-week")navigate("/events/rivalry-week");if(event.slug==="conference-tournaments")navigate("/events/conference-tournaments");if(event.slug==="conference-challenger")navigate("/events/conference-challenger");if(event.slug==="national-postseason")navigate("/events/national-postseason");};return <div className="events-page"><style>{CLICKABLE_EVENT_STYLES}</style><PageHeader eyebrow="Event Center" title="Events" description="Track MESH Basketball tournaments, showcases, and special events." imageSrc={mbaLogo} imageAlt="MBA logo" accent="events" size="compact"/><section className="events-section"><div className="events-section__heading"><div><span className="events-section__kicker">CURRENT EVENTS</span><h2>{active.length>1?"Around MESH":active[0]?.name||(currentWeek==null?"Current Events":`Week ${currentWeek}`)}</h2></div><span className="events-week">{currentWeek==null?(weekError?"WEEK UNAVAILABLE":"LOADING WEEK…"):`WEEK ${currentWeek}`}</span></div>{active.length?<div className={`events-featured${active.length>1?" events-featured--multiple":""}`}>{active.map(event=><EventCard key={event.slug} event={event} hero onOpen={openEvent} currentWeek={currentWeek}/>)}</div>:<div className="events-empty"><div className="events-empty__week">{currentWeek==null?"—":`WEEK ${currentWeek}`}</div><div className="events-empty__copy"><strong>{currentWeek==null?(weekError?"Current week unavailable":"Loading current events…"):"No events this week"}</strong><span>{currentWeek==null?(weekError?"Unable to load the current week. Please try reopening Events.":"Checking the current MESH Basketball week."):currentWeek<2?"The first event begins Week 2 with the Season Kickoff Invitational Regionals.":"There are no special events scheduled for this week."}</span></div></div>}</section><section className="events-section events-section--season"><div className="events-section__heading"><div><span className="events-section__kicker">2026–27</span><h2>Season Events</h2></div></div><div className="events-grid">{EVENTS.map(event=><EventCard key={event.slug} event={event} onOpen={openEvent} currentWeek={currentWeek}/>)}</div></section></div>}
