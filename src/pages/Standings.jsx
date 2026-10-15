import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import PageHeader from "../components/PageHeader";
import ConferenceBadge from "../components/ConferenceBadge";
import mbaLogo from "../assets/mba-logo.png";
import "../styles/standings.css";
const STANDINGS_API_URL =
  "https://script.google.com/macros/s/AKfycbwoKZvZRLo7POCjuaD56mvYKaL_AZdfbG04xkoF0XZKqiGYZjD3TmEFuNK8tDwr_K4B/exec";
// v65: cache successful standings responses and share simultaneous requests.
// The active season refreshes more often than completed historical seasons.
const standingsCache = new Map();
const standingsPending = new Map();
const STANDINGS_LIVE_TTL = 60 * 1000;
const STANDINGS_HISTORY_TTL = 10 * 60 * 1000;
const standingsKey = (season) => season == null ? "default" : String(season);
function cachedStandings(season) {
  const entry = standingsCache.get(standingsKey(season));
  if (!entry || entry.expiresAt <= Date.now()) return null;
  return entry.payload;
}
async function requestStandings(season) {
  const key = standingsKey(season);
  const cached = cachedStandings(season);
  if (cached) return cached;
  if (standingsPending.has(key)) return standingsPending.get(key);
  const task = (async () => {
    const url = new URL(STANDINGS_API_URL);
    url.searchParams.set("action", "standings");
    if (season != null) url.searchParams.set("season", String(season));
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`API request failed with HTTP ${response.status}.`);
    const payload = await response.json();
    if (!payload?.ok) throw new Error(payload?.error || "Unable to load standings.");
    const active = Number(payload.activeSeason);
    const resolved = season == null ? active : Number(season);
    const ttl = Number.isFinite(active) && Number.isFinite(resolved) && resolved !== active
      ? STANDINGS_HISTORY_TTL : STANDINGS_LIVE_TTL;
    const entry = { payload, expiresAt: Date.now() + ttl };
    standingsCache.set(key, entry);
    // Default-season results also satisfy the immediate active-season request.
    if (season == null && Number.isFinite(active) && active > 0) {
      standingsCache.set(String(active), entry);
    }
    return payload;
  })();
  standingsPending.set(key, task);
  try { return await task; }
  finally { if (standingsPending.get(key) === task) standingsPending.delete(key); }
}
const VIEWS = [
  { value: "pulse", label: "Pulse" },
  { value: "top-25", label: "Top 25" },
  { value: "mid-major-top-25", label: "Mid Major Top 25" },
  { value: "overall", label: "Overall" },
  { value: "conferences", label: "Conferences" },
];
const CONFERENCES = [
  "ACC", "American", "Big 12", "Big East", "Big Ten", "Coastal", "C-USA",
  "Ivy", "MAC", "Mtn West", "OVC", "SEC", "Sun Belt", "West Coast",
];
const MID_MAJOR = new Set(["Coastal", "C-USA", "OVC", "West Coast"]);
function normalizeConference(value) {
  const conference = String(value || "").trim();
  const compact = conference.toLowerCase().replace(/[.\s_-]+/g, "");
  if (
    compact === "confusa" ||
    compact === "conferenceusa" ||
    compact === "cusa"
  ) {
    return "C-USA";
  }
  return conference;
}
function StandingsDropdown({ label, value, options, onChange, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find((option) => String(option.value) === String(value));
  useEffect(() => {
    function close(event) {
      if (ref.current && !ref.current.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);
  return (
    <div className="standings-dropdown" ref={ref}>
      <span className="standings-dropdown-label">{label}</span>
      <button
        type="button"
        className="standings-dropdown-button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span>{selected?.label ?? value}</span>
        <ChevronDown size={17} />
      </button>
      {open ? (
        <div className="standings-dropdown-menu">
          {options.map((option) => (
            <button
              type="button"
              key={option.value}
              className={`${String(option.value) === String(value) ? "is-selected" : ""} ${option.className || ""}`.trim()}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
function TeamIdentity({ team, showNationalRank = false }) {
  const teamName = (
    <>
      {showNationalRank && team.nationalRank && team.nationalRank <= 25 ? (
        <span className="standings-inline-rank">#{team.nationalRank}</span>
      ) : null}
      {team.name}
    </>
  );
  return (
    <div className="standings-team">
      {team.franchiseId ? (
        <Link
          className="standings-team-logo-link"
          to={`/franchise/${encodeURIComponent(team.franchiseId)}`}
          aria-label={`Open ${team.name || "franchise"} profile`}
        >
          <div className="standings-team-logo-wrap">
            {team.logoUrl ? <img src={team.logoUrl} alt="" className="standings-team-logo" /> : null}
          </div>
        </Link>
      ) : (
        <div className="standings-team-logo-wrap">
          {team.logoUrl ? <img src={team.logoUrl} alt="" className="standings-team-logo" /> : null}
        </div>
      )}
      <div className="standings-team-copy">
        <strong>
          {team.franchiseId ? (
            <Link
              className="standings-team-name-link"
              to={`/franchise/${encodeURIComponent(team.franchiseId)}`}
            >
              {teamName}
            </Link>
          ) : (
            teamName
          )}
        </strong>
        {team.coachId ? (
          <Link
            className="standings-coach-link"
            to={`/coach/${encodeURIComponent(team.coachId)}`}
          >
            {team.coachName || team.coachId}
          </Link>
        ) : (
          <span>{team.coachName || "—"}</span>
        )}
      </div>
    </div>
  );
}
function RankingsTable({ title, eyebrow, teams, rankField = "nationalRank", conferenceMode = false }) {
  return (
    <section className="standings-section">
      <div className="standings-section-heading">
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      <div className="standings-table-card">
        <div className="standings-table-head">
          <span>#</span><span>Team</span><span>OVR</span><span>CONF</span>
        </div>
        {teams.map((team, index) => (
          <div className="standings-table-row" key={team.franchiseId}>
            <div className="standings-position">
              {team[rankField] ?? index + 1}
            </div>
            <TeamIdentity team={team} showNationalRank={conferenceMode} />
            <div className="standings-record">{team.overallRecord || "0-0"}</div>
            <div className="standings-record">{team.conferenceRecord || "0-0"}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
function PulseTeamRow({ team, position, tone = "" }) {
  if (!team) return null;
  return (
    <div className={`pulse-race-row ${tone}`}>
      <span className="pulse-race-position">{position}</span>
      <TeamIdentity team={team} showNationalRank />
    </div>
  );
}
function PulseView({ data }) {
  const teams = data.teams ?? [];
  const pulse = data.pulse ?? {};
  const ranked = [...teams].filter((team) => team.nationalRank != null)
    .sort((a, b) => a.nationalRank - b.nationalRank);
  const leader = ranked[0];
  const power = ranked.filter((team) => (data.powerConferences ?? []).includes(team.conference));
  const mid = ranked.filter((team) => (data.midMajorConferences ?? []).includes(team.conference));
  const relegationWatch = pulse.relegationWatch ?? power.slice(Math.max(0, power.length - 13), Math.max(0, power.length - 10));
  const relegated = pulse.relegated ?? power.slice(-10);
  const promoted = pulse.promoted ?? mid.slice(0, 10);
  const promotionWatch = pulse.promotionWatch ?? mid.slice(10, 13);
  const powerStart = Math.max(1, power.length - 12);
  return (
    <section className="standings-section standings-pulse">
      <div className="standings-section-heading standings-pulse-heading">
        <span>League Snapshot</span>
        <h2>MESH Pulse</h2>
        <p>The biggest live movement across MESH Basketball — leaders, ranking swings, new Top 25 teams, promotion and relegation pressure.</p>
      </div>
      <div className="pulse-card">
        <div className="pulse-card-top pulse-card-top-clean">
          <div>
            <strong>MBA Pulse</strong>
            <span>{data.isLiveSeason ? (data.lastCompletedWeek === 0 ? `${data.season} preseason snapshot` : `Through Week ${data.lastCompletedWeek}`) : `${data.season} final standings`}</span>
          </div>
        </div>
        <div className="pulse-stats">
          <div><strong>184</strong><span>Franchises</span></div>
          <div><strong>10</strong><span>Power Conference Coaches Relegated</span></div>
          <div><strong>10</strong><span>Mid Major Coaches Promoted</span></div>
        </div>
        <div className="pulse-leader">
          <div className="pulse-leader-team">
            <span>Current No. 1</span>
            {leader ? <TeamIdentity team={leader} /> : <strong>Rankings unavailable</strong>}
          </div>
          <div className="pulse-leader-weeks">
            <span>Weeks at No. 1</span>
            <strong>{pulse.weeksAtNo1 ?? 0}</strong>
          </div>
        </div>
        <div className="pulse-movement">
          <div>
            <span>Biggest Top 25 Rise</span>
            <strong>
              {pulse.biggestRise ? (
                <>{pulse.biggestRise.team.name} <em className="move-up">▲ {pulse.biggestRise.change}</em></>
              ) : data.lastCompletedWeek === 0 ? "Preseason" : "No movement yet"}
            </strong>
          </div>
          <div>
            <span>Biggest Top 25 Fall</span>
            <strong>
              {pulse.biggestFall ? (
                <>{pulse.biggestFall.team.name} <em className="move-down">▼ {Math.abs(pulse.biggestFall.change)}</em></>
              ) : data.lastCompletedWeek === 0 ? "Preseason" : "No movement yet"}
            </strong>
          </div>
          <div className="pulse-entrants">
            <span>New Top 25 Entrants</span>
            <div className="pulse-entrant-list">
              {(pulse.newTop25Entrants ?? []).length ? (
                pulse.newTop25Entrants.map((team) => (
                  <div key={team.franchiseId}>
                    <b>#{team.nationalRank}</b>
                    <TeamIdentity team={team} />
                  </div>
                ))
              ) : (
                <strong>{data.lastCompletedWeek === 0 ? "Preseason" : "None this week"}</strong>
              )}
            </div>
          </div>
        </div>
        <div className="pulse-race-block">
          <span className="pulse-race-label">Power Conference Relegation Watch</span>
          <div className="pulse-race-list">
            {relegationWatch.map((team, index) => (
              <PulseTeamRow key={team.franchiseId} team={team} position={powerStart + index} />
            ))}
            <div className="pulse-line pulse-line-red"><span>Relegation Line</span></div>
            {relegated.map((team, index) => (
              <PulseTeamRow key={team.franchiseId} team={team} position={power.length - 9 + index} tone="is-relegated" />
            ))}
          </div>
        </div>
        <div className="pulse-race-block">
          <span className="pulse-race-label">Mid Major Promotion Race</span>
          <div className="pulse-race-list">
            {promoted.map((team, index) => (
              <PulseTeamRow key={team.franchiseId} team={team} position={index + 1} tone="is-promoted" />
            ))}
            <div className="pulse-line pulse-line-green"><span>Promotion Line</span></div>
            {promotionWatch.map((team, index) => (
              <PulseTeamRow key={team.franchiseId} team={team} position={11 + index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
export default function Standings() {
  const location = useLocation();
  const navigate = useNavigate();
  const restoredStandings = location.state?.standingsState || {};
  const [season, setSeason] = useState(
    restoredStandings.season != null ? Number(restoredStandings.season) : null,
  );
  const [data, setData] = useState(() => cachedStandings(restoredStandings.season != null ? Number(restoredStandings.season) : null));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(() => !cachedStandings(restoredStandings.season != null ? Number(restoredStandings.season) : null));
  const [view, setView] = useState(restoredStandings.view || "pulse");
  const [conference, setConference] = useState(restoredStandings.conference || "ACC");
  useEffect(() => {
    const current = location.state?.standingsState || {};
    const next = { season, view, conference };
    if (
      Number(current.season ?? 0) === Number(next.season ?? 0) &&
      current.view === next.view &&
      current.conference === next.conference
    ) {
      return;
    }
    navigate(location.pathname + location.search, {
      replace: true,
      state: {
        ...(location.state || {}),
        standingsState: next,
      },
    });
  }, [season, view, conference, location.pathname, location.search, location.state, navigate]);
  useEffect(() => {
    let cancelled = false;
    const cached = cachedStandings(season);
    if (cached) {
      setData(cached);
      setError("");
      setLoading(false);
      if (season == null && cached.activeSeason) setSeason(Number(cached.activeSeason));
      return () => { cancelled = true; };
    }
    setLoading(true);
    setError("");
    async function load() {
      try {
        const payload = await requestStandings(season);
        if (cancelled) return;
        setData(payload);
        if (season == null && payload.activeSeason) setSeason(Number(payload.activeSeason));
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || "Unable to load standings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    // Do not abort shared requests: a quick return can reuse the same response.
    return () => { cancelled = true; };
  }, [season]);
  const teams = data?.teams ?? [];
  const ranked = useMemo(
    () => [...teams].sort((a, b) => (a.nationalRank ?? 9999) - (b.nationalRank ?? 9999)),
    [teams],
  );
  const displayTeams = useMemo(() => {
    if (view === "top-25") return ranked.filter((team) => team.nationalRank <= 25);
    if (view === "mid-major-top-25") return ranked.filter((team) => MID_MAJOR.has(normalizeConference(team.conference))).slice(0, 25);
    if (view === "overall") return ranked;
    if (view === "conferences") {
      return teams
        .filter((team) => normalizeConference(team.conference) === normalizeConference(conference))
        .sort((a, b) => (a.conferenceRank ?? 9999) - (b.conferenceRank ?? 9999) || (a.nationalRank ?? 9999) - (b.nationalRank ?? 9999));
    }
    return [];
  }, [view, ranked, teams, conference]);
  const availableSeasonYears = data?.availableSeasons?.length ? data.availableSeasons : [data?.activeSeason || 2027];
  const seasonYears = view === "pulse" ? [data?.activeSeason || 2027] : availableSeasonYears;
  const seasonOptions = seasonYears.map((year) => ({
    value: year,
    label: Number(year) === Number(data?.activeSeason) ? `${year} Live` : String(year),
  }));
  useEffect(() => {
    if (view === "pulse" && data?.activeSeason && Number(season) !== Number(data.activeSeason)) {
      setSeason(Number(data.activeSeason));
    }
  }, [view, data?.activeSeason, season]);
  return (
    <main className="standings-page">
      <PageHeader
        eyebrow="The Race for MESH"
        title="Standings"
        description="Track national rankings, conference races, and the MESH Basketball hierarchy."
        imageSrc={mbaLogo}
        imageAlt="MBA logo"
        accent="standings"
        size="compact"
      />
      <section className="standings-controls">
        <StandingsDropdown
          label="Season"
          value={season}
          options={seasonOptions}
          onChange={(value) => setSeason(Number(value))}
          ariaLabel="Choose standings season"
        />
        <StandingsDropdown
          label="View"
          value={view}
          options={VIEWS}
          onChange={setView}
          ariaLabel="Choose standings view"
        />
      </section>
      {view === "conferences" ? (
        <section className="standings-conference-control">
          <div className="standings-conference-badge">
            <ConferenceBadge conference={conference} />
          </div>
          <StandingsDropdown
            label="Conference"
            value={conference}
            options={CONFERENCES.map((item) => ({ value: item, label: item, className: MID_MAJOR.has(item) ? "is-mid-major" : "" }))}
            onChange={setConference}
            ariaLabel="Choose conference"
          />
        </section>
      ) : null}
      {loading ? <div className="standings-message">Loading MESH standings…</div> : null}
      {error ? <div className="standings-message standings-error">{error}</div> : null}
      {!loading && !error && data ? (
        <>
          {view === "pulse" ? (
            <PulseView data={data} />
          ) : null}
          {view === "top-25" ? (
            <RankingsTable title="MESH Top 25" eyebrow="National Rankings" teams={displayTeams} />
          ) : null}
          {view === "mid-major-top-25" ? (
            <RankingsTable title="Mid Major Top 25" eyebrow="National Rankings" teams={displayTeams} />
          ) : null}
          {view === "overall" ? (
            <RankingsTable title="Overall Rankings" eyebrow="All MESH" teams={displayTeams} />
          ) : null}
          {view === "conferences" ? (
            <RankingsTable
              title={`${conference} Standings`}
              eyebrow="Conference Race"
              teams={displayTeams}
              rankField="conferenceRank"
              conferenceMode
            />
          ) : null}
        </>
      ) : null}
    </main>
  );
}
