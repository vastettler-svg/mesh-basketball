import { useEffect, useState } from "react";
import { ArrowLeft, Award, Crown, Medal, Trophy, TrendingUp } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import "../styles/franchiseResume.css";

const API_URL =
  "https://script.google.com/macros/s/AKfycbwoKZvZRLo7POCjuaD56mvYKaL_AZdfbG04xkoF0XZKqiGYZjD3TmEFuNK8tDwr_K4B/exec";

const RESUME_PREFETCH_PREFIX = "mesh:resume-prefetch:";

function readPrefetchedResume(franchiseId) {
  try {
    const raw = sessionStorage.getItem(`${RESUME_PREFETCH_PREFIX}${franchiseId}`);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    return payload?.ok ? payload : null;
  } catch {
    return null;
  }
}

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
  return (
    <div className="resume-stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}

function EventCard({ title, data }) {
  return (
    <article className="resume-event-card">
      <div>
        <span>Special Event</span>
        <strong>{title}</strong>
      </div>
      <div className="resume-event-numbers">
        <Stat label="Championships" value={data?.championships || 0} />
        <Stat label="Record" value={record(data?.record)} />
      </div>
    </article>
  );
}

function TournamentCard({ title, data }) {
  return (
    <article className="resume-tournament-card">
      <strong>{title}</strong>
      <div>
        <Stat label="Appearances" value={data?.appearances || 0} />
        <Stat label="Record" value={record(data?.record)} />
        <Stat label="Titles" value={data?.championships || 0} />
      </div>
    </article>
  );
}

export default function FranchiseResume() {
  const { franchiseId } = useParams();
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    const prefetched = readPrefetchedResume(franchiseId);
    if (prefetched) {
      setData(prefetched);
      setStatus("ready");
      return () => {
        cancelled = true;
      };
    }

    fetch(`${API_URL}?action=franchiseResume&franchiseId=${encodeURIComponent(franchiseId)}`)
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        if (!payload?.ok) throw new Error(payload?.error || "Career résumé unavailable.");
        setData(payload);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [franchiseId]);

  if (status === "loading") {
    return <main className="franchise-resume-page"><div className="resume-state">Loading career résumé…</div></main>;
  }

  if (status === "error" || !data) {
    return (
      <main className="franchise-resume-page">
        <Link className="resume-back" to={`/franchise/${encodeURIComponent(franchiseId)}`}><ArrowLeft size={15} /> Franchise</Link>
        <div className="resume-state">Career résumé could not be loaded.</div>
      </main>
    );
  }

  const f = data.franchise;
  const c = data.championshipsPerformance || {};
  const mm = data.postseason?.marchMadness || {};

  return (
    <main
      className="franchise-resume-page"
      style={{
        "--resume-primary": f.primaryColor || "#ff6a00",
        "--resume-secondary": f.secondaryColor || "#aeb6bf",
      }}
    >
      <Link className="resume-back" to={`/franchise/${encodeURIComponent(franchiseId)}`}>
        <ArrowLeft size={15} /> Franchise
      </Link>

      <section className="resume-hero">
        <div className="resume-hero-logo">
          {f.logoUrl ? <img src={f.logoUrl} alt={`${f.name} logo`} /> : <Trophy size={38} />}
        </div>
        <div>
          <span>Permanent Franchise • Career Résumé</span>
          <h1>{f.name}</h1>
          <p>{f.tier} • {f.conference}</p>
        </div>
      </section>

      <section className="resume-section">
        <div className="resume-heading">
          <span>Franchise Career</span>
          <h2>Championships & Performance</h2>
        </div>
        <div className="resume-performance-grid">
          <Stat label="Regular Season Conference Championships" value={c.regularSeasonConferenceChampionships || 0} />
          <Stat label="Conference Tournament Championships" value={c.conferenceTournamentChampionships || 0} />
          <Stat label="Overall Franchise Record" value={record(c.overallRecord)} />
          <Stat label="Overall Conference Record" value={record(c.conferenceRecord)} />
          <Stat label="Weeks in Top 25" value={c.weeksTop25 || 0} />
          <Stat label="Weeks in Top 10" value={c.weeksTop10 || 0} />
          <Stat label="Record vs Top 25" value={record(c.recordVsTop25)} />
          <Stat label="Record vs Top 10" value={record(c.recordVsTop10)} />
          <Stat label="Highest Career Weekly Score" value={score(c.highestWeeklyScore)} />
          <Stat label="Lowest Career Weekly Score" value={score(c.lowestWeeklyScore)} />
        </div>
      </section>

      <section className="resume-section">
        <div className="resume-heading">
          <span>Showcase History</span>
          <h2>Special Events</h2>
        </div>
        <div className="resume-events-grid">
          <EventCard title="SKI Regional" data={data.specialEvents?.skiRegional} />
          <EventCard title="SKI Champions Bracket" data={data.specialEvents?.skiChampionsBracket} />
          {data.isMidMajor ? (
            <EventCard title="Mid Major Mayhem" data={data.specialEvents?.midMajorMayhem} />
          ) : null}
          <EventCard title="Invitational Tournament" data={data.specialEvents?.invitational} />
          <EventCard title="Regional Showdown" data={data.specialEvents?.regionalShowdown} />
          <div className="resume-event-wide">
            <EventCard title="Conference Tournaments" data={data.specialEvents?.conferenceTournament} />
          </div>
        </div>
      </section>

      <section className="resume-section">
        <div className="resume-heading">
          <span>Postseason History</span>
          <h2>Postseason Tournaments</h2>
        </div>

        <article className="resume-march-card">
          <div className="resume-march-title">
            <div className="resume-march-icon"><Crown size={25} /></div>
            <div><span>Premier Postseason</span><strong>March Madness</strong></div>
          </div>
          <div className="resume-march-primary">
            <Stat label="Appearances" value={mm.appearances || 0} />
            <Stat label="Record" value={record(mm.record)} />
          </div>
          <div className="resume-march-rounds">
            <Stat label="Sweet 16" value={mm.sweet16 || 0} />
            <Stat label="Elite 8" value={mm.elite8 || 0} />
            <Stat label="Final Four" value={mm.finalFour || 0} />
          </div>
          <div className="resume-march-finals">
            <Stat label="Runner-Up" value={mm.runnerUp || 0} />
            <Stat label="Championships" value={mm.championships || 0} />
          </div>
        </article>

        <div className="resume-postseason-grid">
          <TournamentCard title="NIT" data={data.postseason?.nit} />
          <TournamentCard title="College Basketball Crown" data={data.postseason?.crown} />
          <TournamentCard title="CBI" data={data.postseason?.cbi} />
        </div>
      </section>
    </main>
  );
}
