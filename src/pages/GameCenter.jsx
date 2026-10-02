import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowLeft, Clock3, Radio, Trophy } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ConferenceBadge from "../components/ConferenceBadge";
import mbaLogo from "../assets/mba-logo.png";
import "../styles/gameCenter.css";

const API_URL =
  "https://script.google.com/macros/s/AKfycbwoKZvZRLo7POCjuaD56mvYKaL_AZdfbG04xkoF0XZKqiGYZjD3TmEFuNK8tDwr_K4B/exec";

function apiUrl(action, params = {}) {
  const url = new URL(API_URL);
  url.searchParams.set("action", action);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`API request failed with HTTP ${response.status}.`);
  const data = await response.json();
  if (!data?.ok) throw new Error(data?.error || "MESH Basketball API returned an error.");
  return data;
}

function num(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function points(value, fallback = "—") {
  const parsed = num(value);
  return parsed === null ? fallback : parsed.toFixed(1);
}

function rankLabel(rank) {
  const value = num(rank);
  return value && value <= 25 ? `#${value}` : "";
}

function statusInfo(status) {
  const value = String(status || "").trim().toLowerCase();
  if (value === "final") return { id: "final", label: "Final", Icon: Trophy };
  if (value === "live" || value === "in progress" || value.includes("progress")) {
    return { id: "live", label: "Live Matchup", Icon: Radio };
  }
  return { id: "scheduled", label: "Scheduled", Icon: Clock3 };
}

function normalizeGame(payload) {
  const game = payload?.game || payload || {};
  return {
    ...game,
    gameId: game.gameId || game.Game_ID || "",
    team1: game.team1 || {},
    team2: game.team2 || {},
    winnerFranchiseId: game.winnerFranchiseId || game.winnerId || "",
  };
}

function normalizeRoster(payload) {
  const players = (side) => Array.isArray(side) ? side : (Array.isArray(side?.players) ? side.players : []);
  return {
    locked: Boolean(payload?.locked),
    source: payload?.source || "",
    team1: players(payload?.team1),
    team2: players(payload?.team2),
  };
}

function TeamLogo({ team, small = false }) {
  return (
    <div className={`gc-logo${small ? " is-small" : ""}`}>
      {team?.logoUrl ? <img src={team.logoUrl} alt={`${team.name || "Team"} logo`} /> : <span>MBA</span>}
    </div>
  );
}

function MatchupTeam({ team, status, winnerId, roster }) {
  const isFinal = statusInfo(status).id === "final";
  const winner = isFinal && winnerId === team?.franchiseId;
  const rosterProj = roster?.find((p) => num(p.teamProjectedPoints) !== null)?.teamProjectedPoints;
  const rosterPoints = roster?.find((p) => num(p.teamTotalPoints) !== null)?.teamTotalPoints;
  const score = num(team?.score) ?? num(rosterPoints) ?? 0;
  const projection = num(team?.projectedScore) ?? num(rosterProj);

  return (
    <div className={`gc-match-team${winner ? " is-winner" : ""}`}>
      <div className="gc-team-logo-wrap">
        <TeamLogo team={team} />
        {rankLabel(team?.rank) ? <span className="gc-team-rank">{rankLabel(team.rank)}</span> : null}
      </div>
      <h2>{team?.name || "TBD"}</h2>
      <strong className="gc-coach">{team?.coachName || "Coach TBD"}</strong>
      <div className="gc-records">OVR: {team?.overallRecord || "0-0"} &nbsp; CONF: {team?.conferenceRecord || "0-0"}</div>
      <div className="gc-conference-name">{team?.conference || ""}</div>
      <div className="gc-main-score">{points(score, "0.0")}</div>
      {!isFinal ? <div className="gc-main-proj">Proj: {points(projection)}</div> : null}
    </div>
  );
}

const STARTER_SLOTS = ["PG", "SG", "G", "SF", "PF", "F", "C", "UTIL", "UTIL"];

function orderedStarters(players) {
  const starters = (players || []).filter((p) => p?.isStarter);
  const used = new Set();
  return STARTER_SLOTS.map((slot) => {
    const index = starters.findIndex((p, i) =>
      !used.has(i) && String(p?.lineupPosition || "").toUpperCase() === slot
    );
    if (index >= 0) {
      used.add(index);
      return starters[index];
    }
    const fallback = starters.findIndex((p, i) => !used.has(i));
    if (fallback >= 0) {
      used.add(fallback);
      return starters[fallback];
    }
    return null;
  });
}

function StarterCell({ player, side }) {
  if (!player) return <div className={`gc-starter-cell ${side} is-empty`}>—</div>;
  return (
    <div className={`gc-starter-cell ${side}`}>
      <div className="gc-starter-line gc-starter-line-main">
        <strong className="gc-starter-name">{player.playerName || "Unknown Player"}</strong>
        <div className="gc-inline-stat"><span>PTS</span><strong>{points(player.points, "0.0")}</strong></div>
      </div>
      <div className="gc-starter-line gc-starter-line-sub">
        <span className="gc-player-meta">{[player.position, player.nbaTeam].filter(Boolean).join(" · ")}</span>
        <div className="gc-inline-stat"><span>PROJ</span><strong className="proj">{points(player.projectedPoints)}</strong></div>
      </div>
    </div>
  );
}

function StarterComparison({ team1, team2, roster1, roster2, locked }) {
  const left = orderedStarters(roster1);
  const right = orderedStarters(roster2);
  return (
    <section className="gc-section">
      <div className="gc-section-heading">
        <span>{locked ? "Final scoring snapshot" : "Live scoring"}</span>
        <h2>Starter Comparison</h2>
      </div>
      <div className="gc-starters-card">
        <div className="gc-starters-head">
          <div><TeamLogo team={team1} small /><strong>{team1?.name}</strong></div>
          <span>STARTERS</span>
          <div><strong>{team2?.name}</strong><TeamLogo team={team2} small /></div>
        </div>
        {STARTER_SLOTS.map((slot, index) => (
          <div className="gc-starter-row" key={`${slot}-${index}`}>
            <StarterCell player={left[index]} side="left" />
            <div className="gc-slot">{slot}</div>
            <StarterCell player={right[index]} side="right" />
          </div>
        ))}
      </div>
    </section>
  );
}

function meetingForTeam(meeting, team) {
  const isFirst = meeting.team1FranchiseId === team?.franchiseId;
  return {
    name: isFirst ? meeting.team1Name : meeting.team2Name,
    score: num(isFirst ? meeting.team1Score : meeting.team2Score) || 0,
  };
}

function seriesAnalytics(meetings, team1, team2) {
  const ordered = [...meetings].sort((a,b) =>
    Number(b.season) - Number(a.season) || Number(b.week) - Number(a.week)
  );
  let team1Wins = 0, team2Wins = 0, team1Points = 0, team2Points = 0;
  let largest = null, closest = null, highest = null;
  ordered.forEach((m) => {
    const a = meetingForTeam(m, team1).score;
    const b = meetingForTeam(m, team2).score;
    team1Points += a; team2Points += b;
    if (m.winnerFranchiseId === team1?.franchiseId) team1Wins += 1;
    if (m.winnerFranchiseId === team2?.franchiseId) team2Wins += 1;
    const margin = Math.abs(a-b);
    const combined = a+b;
    if (!largest || margin > largest.margin) largest = { meeting:m, margin };
    if (!closest || margin < closest.margin) closest = { meeting:m, margin };
    if (!highest || combined > highest.combined) highest = { meeting:m, combined };
  });

  let streakTeam = null, streak = 0;
  if (ordered.length && ordered[0].winnerFranchiseId) {
    streakTeam = ordered[0].winnerFranchiseId;
    for (const m of ordered) {
      if (m.winnerFranchiseId === streakTeam) streak += 1;
      else break;
    }
  }

  const postseason = ordered.filter((m) => {
    const text = `${m.eventName || ""} ${m.gameType || ""} ${m.round || ""} ${m.tournamentName || ""}`.toLowerCase();
    return /postseason|tournament|championship|playoff|march madness|nit|cbi/.test(text);
  });

  return {
    ordered, team1Wins, team2Wins, team1Points, team2Points, largest, closest, highest,
    streakTeam, streak, postseason,
    avg1: ordered.length ? team1Points / ordered.length : 0,
    avg2: ordered.length ? team2Points / ordered.length : 0,
  };
}

function MeetingScore({ item, team1, team2, footer }) {
  if (!item?.meeting) return <div className="gc-stat-empty">No previous meetings</div>;
  const m = item.meeting;
  const a = meetingForTeam(m, team1);
  const b = meetingForTeam(m, team2);
  return (
    <>
      <div className="gc-stat-score"><span>{team1.name}</span><strong>{points(a.score)}</strong></div>
      <div className="gc-stat-score"><span>{team2.name}</span><strong>{points(b.score)}</strong></div>
      <div className="gc-stat-footer">{footer ? footer(item) : `${m.season} · Week ${m.week}`}</div>
    </>
  );
}

function SeriesHistory({ meetings, team1, team2 }) {
  const stats = useMemo(() => seriesAnalytics(meetings, team1, team2), [meetings, team1, team2]);
  const streakName = stats.streakTeam === team1?.franchiseId ? team1?.name :
    stats.streakTeam === team2?.franchiseId ? team2?.name : "—";

  return (
    <section className="gc-section">
      <div className="gc-section-heading"><span>Series history</span><h2>Matchup History</h2></div>
      <div className="gc-series-card">
        <div className="gc-series-title">
          {stats.team1Wins === stats.team2Wins ? `Series tied ${stats.team1Wins}–${stats.team2Wins}` :
            `${stats.team1Wins > stats.team2Wins ? team1.name : team2.name} leads ${Math.max(stats.team1Wins,stats.team2Wins)}–${Math.min(stats.team1Wins,stats.team2Wins)}`}
        </div>
        <div className="gc-series-summary">
          <div><strong>{stats.team1Wins}</strong><span>{team1?.name}</span></div>
          <div><strong>{meetings.length}</strong><span>Previous Meetings</span></div>
          <div><strong>{stats.team2Wins}</strong><span>{team2?.name}</span></div>
        </div>
      </div>

      <div className="gc-stat-grid">
        <div className="gc-stat-card"><label>Last Meeting</label>
          <MeetingScore item={stats.ordered[0] ? {meeting:stats.ordered[0]} : null} team1={team1} team2={team2} />
        </div>
        <div className="gc-stat-card"><label>Current Streak</label>
          <strong className="gc-big-stat">{streakName}</strong>
          <div className="gc-stat-footer">{stats.streak ? `W${stats.streak}` : "—"}</div>
        </div>
        <div className="gc-stat-card"><label>Largest Win</label>
          <MeetingScore item={stats.largest} team1={team1} team2={team2} footer={(x)=>`Margin: +${points(x.margin)}`} />
        </div>
        <div className="gc-stat-card"><label>Closest Meeting</label>
          <MeetingScore item={stats.closest} team1={team1} team2={team2} footer={(x)=>`Margin: ${points(x.margin)}`} />
        </div>
        <div className="gc-stat-card"><label>Highest-Scoring Meeting</label>
          <MeetingScore item={stats.highest} team1={team1} team2={team2} footer={(x)=>`Combined: ${points(x.combined)}`} />
        </div>
        <div className="gc-stat-card"><label>Average Score</label>
          <div className="gc-stat-score"><span>{team1.name}</span><strong>{points(stats.avg1)}</strong></div>
          <div className="gc-stat-score"><span>{team2.name}</span><strong>{points(stats.avg2)}</strong></div>
          <div className="gc-stat-footer">All-Time Average</div>
        </div>
        <div className="gc-stat-card gc-postseason"><label>Postseason Series</label>
          <strong className="gc-big-stat">{stats.postseason.length ? `${stats.postseason.length} Meeting${stats.postseason.length===1?"":"s"}` : "No Postseason Meetings"}</strong>
          <div className="gc-stat-footer">Postseason meetings only</div>
        </div>
      </div>

      <div className="gc-section-heading gc-recent-heading"><span>Archive</span><h2>Recent Meetings</h2></div>
      <div className="gc-history-list">
        {stats.ordered.length ? stats.ordered.map((m,index)=>{
          const a=meetingForTeam(m,team1), b=meetingForTeam(m,team2);
          return <div className="gc-history-row" key={m.gameId||index}>
            <div><strong>{m.season} · Week {m.week}</strong><span>{m.eventName||m.gameType||"MESH Matchup"}</span></div>
            <div className="gc-history-score">
              <span className={m.winnerFranchiseId===team1.franchiseId?"winner":""}>{team1.name}</span><strong>{points(a.score)}</strong>
              <em>–</em><strong>{points(b.score)}</strong><span className={m.winnerFranchiseId===team2.franchiseId?"winner":""}>{team2.name}</span>
            </div>
          </div>
        }) : <div className="gc-empty">No previous meetings found.</div>}
      </div>
    </section>
  );
}


function cleanEventLabel(game) {
  const raw = String(game?.eventName || "").trim();
  const generic = new Set([
    "", "Regular Season", "Conference", "Non-Conference",
    "Invitational", "Invitational Tournament", "Tournament"
  ]);
  if (!generic.has(raw)) return raw;

  const stage = String(game?.stageLabel || "").trim();
  if (stage && !generic.has(stage)) return stage;

  return String(game?.gameType || "Regular Season").trim();
}

function cleanRoundLabel(game) {
  const round = String(game?.round || "").trim();
  const bracket = String(game?.bracket || "").trim();
  const candidates = [round, bracket].filter(Boolean);

  for (const value of candidates) {
    const normalized = value.toLowerCase();

    if (/championship|final\b/.test(normalized) && !/semi/.test(normalized)) return "Championship";
    if (/3rd|third/.test(normalized)) return "3rd Place";
    if (/5th|fifth/.test(normalized)) return "5th Place";
    if (/7th|seventh/.test(normalized)) return "7th Place";
    if (/consolation/.test(normalized)) return "Consolation";
    if (/winner/.test(normalized)) return "Winners Bracket";

    const roundMatch = value.match(/round\s*(\d+)/i);
    if (roundMatch) return `Round ${roundMatch[1]}`;
  }

  return round || bracket || "";
}

export default function GameCenter() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game,setGame]=useState(null);
  const [rosters,setRosters]=useState({team1:[],team2:[],locked:false});
  const [history,setHistory]=useState([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  useEffect(()=>{
    const controller=new AbortController();

    async function load(){
      try{
        setLoading(true);
        setError("");
        setGame(null);
        setHistory([]);
        setRosters({team1:[],team2:[],locked:false});

        const id=decodeURIComponent(gameId||"");
        const gp=await fetchJson(apiUrl("game",{gameId:id}),controller.signal);
        const next=normalizeGame(gp);

        // The matchup itself is now enough to render Game Center.
        setGame(next);
        setLoading(false);

        // Roster/live scoring and series history are secondary data. Load them
        // independently so neither can hold the entire Game Center screen hostage.
        fetchJson(apiUrl("gameRoster",{gameId:id}),controller.signal)
          .then((rp)=>setRosters(normalizeRoster(rp)))
          .catch((err)=>{
            if(err?.name!=="AbortError") console.error("Unable to load Game Center roster:",err);
          });

        fetchJson(
          apiUrl("history",{
            team1:next.team1?.franchiseId,
            team2:next.team2?.franchiseId,
            excludeGameId:id
          }),
          controller.signal
        )
          .then((hp)=>setHistory(Array.isArray(hp?.meetings)?hp.meetings:[]))
          .catch((err)=>{
            if(err?.name!=="AbortError") console.error("Unable to load Game Center history:",err);
          });
      }catch(err){
        if(err?.name!=="AbortError"){
          console.error(err);
          setError(err?.message||"Unable to load this matchup.");
          setLoading(false);
        }
      }
    }

    load();
    return()=>controller.abort();
  },[gameId]);

  if(loading)return <main className="game-center-page"><div className="gc-message"><Activity size={28}/><h2>Loading Game Center</h2></div></main>;
  if(error||!game)return <main className="game-center-page"><button className="gc-back" onClick={()=>navigate("/scores")}><ArrowLeft size={16}/> Back</button><div className="gc-message"><h2>Game unavailable</h2><p>{error}</p></div></main>;

  const status=statusInfo(game.status), StatusIcon=status.Icon;
  const conference=game.team1?.conference===game.team2?.conference?game.team1?.conference:(game.team1?.conference||game.team2?.conference||"");

  return <main className="game-center-page">
    <button className="gc-back" type="button" onClick={()=>navigate(-1)}><ArrowLeft size={16}/> Back</button>
    <PageHeader eyebrow={`Week ${game.week} • ${game.stageLabel||game.gameType||"Matchup"}`} title="Game Center"
      description={game.eventName||"MESH Basketball Matchup"} imageSrc={mbaLogo} imageAlt="MBA logo" accent="scores" size="compact"/>

    <section className="gc-matchup-card">
      <div className="gc-matchup-top">
        <div className={`gc-status gc-status-${status.id}`}><StatusIcon size={12}/>{status.label}</div>
        <div className={`gc-conference-display ${game.team1?.conference === game.team2?.conference ? "same-conference" : "cross-conference"}`}>
          <div className="gc-conference-item">
            <ConferenceBadge conference={game.team1?.conference} className="gc-conference-badge"/>
            <span>{game.team1?.conference || ""}</span>
          </div>

          {game.team1?.conference !== game.team2?.conference ? (
            <>
              <div className="gc-header-matchup-type">
                <span>Non-Conference</span>
                <strong>{cleanEventLabel(game)}</strong>
              </div>
              <div className="gc-conference-item">
                <ConferenceBadge conference={game.team2?.conference} className="gc-conference-badge"/>
                <span>{game.team2?.conference || ""}</span>
              </div>
            </>
          ) : (
            <div className="gc-header-matchup-type same-conference-copy">
              <span>{game.team1?.conference || "Conference"}</span>
              <strong>{cleanEventLabel(game)}</strong>
            </div>
          )}
        </div>

        <div className="gc-round-display">
          {cleanRoundLabel(game) ? (
            <>
              <span>ROUND</span>
              <strong>{cleanRoundLabel(game)}</strong>
            </>
          ) : null}
        </div>
      </div>
      <div className="gc-matchup-grid">
        <MatchupTeam team={game.team1} status={game.status} winnerId={game.winnerFranchiseId} roster={rosters.team1}/>
        <div className="gc-vs">VS</div>
        <MatchupTeam team={game.team2} status={game.status} winnerId={game.winnerFranchiseId} roster={rosters.team2}/>
      </div>
      <div className={`gc-live-note${rosters.locked?" is-locked":""}`}>
        {rosters.locked?<Trophy size={12}/>:<Radio size={12}/>}
        {rosters.locked?"Final player points and projections are locked to this matchup.":"Actual points and projections refresh with the live scoring feed."}
      </div>
    </section>

    <StarterComparison team1={game.team1} team2={game.team2} roster1={rosters.team1} roster2={rosters.team2} locked={rosters.locked}/>
    <SeriesHistory meetings={history} team1={game.team1} team2={game.team2}/>
    <section className="gc-section">
      <div className="gc-section-heading"><span>Matchup</span><h2>Game Details</h2></div>
      <div className="gc-details-card">
        <div><span>Season</span><strong>{game.season}</strong></div>
        <div><span>Week</span><strong>Week {game.week}</strong></div>
        <div><span>Category</span><strong>{game.team1?.conference === game.team2?.conference ? "Conference" : "Non-Conference"}</strong></div>
        <div><span>Game Type</span><strong>{game.gameType || game.eventName || "Regular Season"}</strong></div>
        {game.tournamentName ? <div><span>Tournament</span><strong>{game.tournamentName}</strong></div> : null}
        {game.round ? <div><span>Round</span><strong>{game.round}</strong></div> : null}
      </div>
    </section>
  </main>;
}
