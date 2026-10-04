import { useEffect, useState } from "react";
import { ArrowLeft, Crown, Trophy } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../styles/coachProfile.css";

const API_URL =
  "https://script.google.com/macros/s/AKfycbwoKZvZRLo7POCjuaD56mvYKaL_AZdfbG04xkoF0XZKqiGYZjD3TmEFuNK8tDwr_K4B/exec";

function record(value) {
  if (!value) return "0–0";
  const w = Number(value.wins) || 0;
  const l = Number(value.losses) || 0;
  const t = Number(value.ties) || 0;
  return t ? `${w}–${l}–${t}` : `${w}–${l}`;
}
function score(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(1) : "—";
}
function Stat({ label, value, detail }) {
  return <div className="coach-resume-stat"><span>{label}</span><strong>{value}</strong>{detail ? <small>{detail}</small> : null}</div>;
}
function EventCard({ title, data }) {
  return <article className="coach-event-card"><div><span>Special Event</span><strong>{title}</strong></div><div className="coach-event-numbers"><Stat label="Championships" value={data?.championships || 0}/><Stat label="Record" value={record(data?.record)}/></div></article>;
}
function TournamentCard({ title, data }) {
  return <article className="coach-tournament-card"><strong>{title}</strong><div><Stat label="Appearances" value={data?.appearances || 0}/><Stat label="Record" value={record(data?.record)}/><Stat label="Titles" value={data?.championships || 0}/></div></article>;
}

export default function CoachProfile() {
  const { coachId } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetch(`${API_URL}?action=coach&coachId=${encodeURIComponent(coachId)}`)
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (!data?.ok) throw new Error(data?.error || "Coach profile unavailable.");
        setPayload(data);
        setStatus("ready");
      })
      .catch(() => { if (!cancelled) setStatus("error"); });
    return () => { cancelled = true; };
  }, [coachId]);

  if (status === "loading") return <main className="coach-profile-page"><div className="coach-state">Loading coach profile…</div></main>;
  if (status === "error" || !payload?.coach) return <main className="coach-profile-page"><button className="coach-back" onClick={() => navigate(-1)}><ArrowLeft size={15}/> Back</button><div className="coach-state">Coach profile could not be loaded.</div></main>;

  const coach = payload.coach;
  const current = payload.currentSeason || {};
  const career = payload.careerSummary || {};
  const events = payload.specialEvents || {};
  const postseason = payload.postseason || {};
  const mm = postseason.marchMadness || {};
  const history = Array.isArray(payload.careerHistory) ? payload.careerHistory : [];
  const stops = Array.isArray(payload.franchiseStops)
    ? [...payload.franchiseStops].sort((a, b) => {
        const aLast = Number(a.lastSeason) || 0;
        const bLast = Number(b.lastSeason) || 0;
        if (bLast !== aLast) return bLast - aLast;
        return (Number(b.firstSeason) || 0) - (Number(a.firstSeason) || 0);
      })
    : [];
  const logo = coach.currentFranchiseLogoUrl || current.logoUrl || "";
  const primary = current.primaryColor || "#ff6a00";
  const secondary = current.secondaryColor || "#aeb6bf";

  return (
    <main className="coach-profile-page" style={{"--coach-primary":primary,"--coach-secondary":secondary}}>
      <button className="coach-back" onClick={() => navigate(-1)}><ArrowLeft size={15}/> Back</button>

      <section className="coach-hero">
        <div className="coach-hero-heading">
          <div className="coach-hero-identity">
            <span>Active Coach</span>
            <b>•</b>
            <span>{coach.currentTier || current.tier || "MESH"}</span>
            {coach.currentConference || current.conference ? <><b>•</b><span>{coach.currentConference || current.conference}</span></> : null}
          </div>
          <h1>{coach.name}</h1>
        </div>

        <div className="coach-prestige-card">
          <span>Coach Prestige</span>
          <strong>{Number(coach.careerPrestigePoints || 0).toFixed(1)}</strong>
        </div>

        <div className="coach-current-row">
          <Link className="coach-current-franchise" to={`/franchise/${encodeURIComponent(coach.currentFranchiseId || current.franchiseId || "")}`}>
            <span>Current Franchise</span>
            <div>
              {logo ? <img src={logo} alt="Current franchise logo" /> : <Trophy size={30} />}
              <strong>{coach.currentFranchiseName || current.franchiseName}</strong>
            </div>
          </Link>
          <div className="coach-seasons-card">
            <span>MESH Seasons</span>
            <strong>{career.meshSeasons || 0}</strong>
          </div>
        </div>

        <div className="coach-season-row">
          <Stat label={`${current.season || payload.activeSeason || ""} OVR REC`} value={record(current.overallRecord)} />
          <Stat label={`${current.season || payload.activeSeason || ""} CONF REC`} value={record(current.conferenceRecord)} />
          <Stat label={`${current.season || payload.activeSeason || ""} PF`} value={score(current.pointsFor)} />
        </div>
      </section>

      <section className="coach-section">
        <div className="coach-heading"><span>Achievements</span><h2>Trophy Vault</h2></div>
        <div className="coach-trophy-card"><div className="coach-trophy-icon"><Crown size={28}/></div><div><span>Coach Trophy Room</span><strong>Trophies, Banners & Championships</strong><small>A permanent home for championships, tournament titles and career honors earned across MESH Basketball.</small></div></div>
      </section>

      <section className="coach-section">
        <div className="coach-heading"><span>Coach Career</span><h2>Championships & Performance</h2></div>
        <div className="coach-performance-grid">
          <Stat label="Regular Season Conference Championships" value={career.regularSeasonConferenceChampionships || 0}/>
          <Stat label="Conference Tournament Championships" value={career.conferenceTournamentChampionships || 0}/>
          <Stat label="Overall Coach Record" value={record(career.overallRecord)}/>
          <Stat label="Overall Conference Record" value={record(career.conferenceRecord)}/>
          <Stat label="Weeks in Top 25" value={career.weeksTop25 || 0}/>
          <Stat label="Weeks in Top 10" value={career.weeksTop10 || 0}/>
          <Stat label="Record vs Top 25" value={record(career.recordVsTop25)}/>
          <Stat label="Record vs Top 10" value={record(career.recordVsTop10)}/>
          <Stat label="Highest Career Weekly Score" value={score(career.highestWeeklyScore)}/>
          <Stat label="Lowest Career Weekly Score" value={score(career.lowestWeeklyScore)}/>
        </div>
      </section>

      <section className="coach-section">
        <div className="coach-heading"><span>Showcase History</span><h2>Special Events</h2></div>
        <div className="coach-events-grid">
          <EventCard title="SKI Regional" data={events.skiRegional}/>
          <EventCard title="SKI Champions Bracket" data={events.skiChampionsBracket}/>
          <EventCard title="Mid Major Mayhem" data={events.midMajorMayhem}/>
          <EventCard title="Invitational Tournament" data={events.invitational}/>
          <EventCard title="Regional Showdown" data={events.regionalShowdown}/>
          <div className="coach-event-wide"><EventCard title="Conference Tournaments" data={events.conferenceTournament}/></div>
        </div>
      </section>

      <section className="coach-section">
        <div className="coach-heading"><span>Postseason History</span><h2>Postseason Tournaments</h2></div>
        <article className="coach-march-card">
          <div className="coach-march-title"><div className="coach-march-icon"><Crown size={25}/></div><div><span>Premier Postseason</span><strong>March Madness</strong></div></div>
          <div className="coach-march-primary"><Stat label="Appearances" value={mm.appearances || 0}/><Stat label="Record" value={record(mm.record)}/></div>
          <div className="coach-march-rounds"><Stat label="Sweet 16" value={mm.sweet16 || 0}/><Stat label="Elite 8" value={mm.elite8 || 0}/><Stat label="Final Four" value={mm.finalFour || 0}/></div>
          <div className="coach-march-finals"><Stat label="Runner-Up" value={mm.runnerUp || 0}/><Stat label="Championships" value={mm.championships || 0}/></div>
        </article>
        <div className="coach-postseason-grid"><TournamentCard title="NIT" data={postseason.nit}/><TournamentCard title="College Basketball Crown" data={postseason.crown}/><TournamentCard title="CBI" data={postseason.cbi}/></div>
      </section>

      <section className="coach-section">
        <div className="coach-heading coach-heading-row"><div><span>Season by Season</span><h2>Career History</h2></div><small>{history.length} entries</small></div>
        <div className="coach-history-list">{history.map((s,i)=><Link className="coach-history-row" key={`${s.season}-${s.franchiseId}-${i}`} to={`/franchise/${encodeURIComponent(s.franchiseId || "")}`}><div className="coach-history-season"><strong>{s.season}</strong><span>{i===0 ? "Current" : (s.coachMovement || "")}</span></div><div className="coach-history-team">{s.logoUrl ? <img src={s.logoUrl} alt=""/> : null}<div><strong>{s.franchiseName}</strong><span>{s.tier} • {s.conference}</span></div></div><div className="coach-history-record"><span>OVR</span><strong>{record(s.overallRecord)}</strong><small>{score(s.pointsFor)} PF</small></div></Link>)}</div>
      </section>

      <section className="coach-section">
        <div className="coach-heading coach-heading-row"><div><span>Coaching Journey</span><h2>Franchise Stops</h2></div><small>{stops.length} stops</small></div>
        <div className="coach-stops-list">{stops.map((s,i)=><Link className="coach-stop-row" key={`${s.franchiseId}-${i}`} to={`/franchise/${encodeURIComponent(s.franchiseId || "")}`}><div className="coach-stop-years">{String(s.franchiseId || "") === String(coach.currentFranchiseId || current.franchiseId || "") ? `${s.firstSeason}–Present` : (s.firstSeason === s.lastSeason ? s.firstSeason : `${s.firstSeason}–${s.lastSeason}`)}</div>{s.logoUrl ? <img src={s.logoUrl} alt=""/> : null}<div><strong>{s.franchiseName}</strong><span>{s.tier} • {s.conference}</span></div></Link>)}</div>
      </section>
    </main>
  );
}
