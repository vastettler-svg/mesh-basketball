import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Crown,
  FileText,
  Trophy,
  ArrowRightLeft,
  UserRound,
  Users,
} from "lucide-react";
import "../styles/franchiseProfile.css";

const API_URL =
  "https://script.google.com/macros/s/AKfycbwoKZvZRLo7POCjuaD56mvYKaL_AZdfbG04xkoF0XZKqiGYZjD3TmEFuNK8tDwr_K4B/exec";

const MID_MAJOR_CONFERENCES = new Set(["Coastal", "C-USA", "OVC", "West Coast"]);

const ROSTER_PREFETCH_PREFIX = "mesh:roster-prefetch:";

function rosterPrefetchKey(franchiseId) {
  return `${ROSTER_PREFETCH_PREFIX}${franchiseId}`;
}

function readPrefetchedRoster(franchiseId) {
  try {
    const raw = sessionStorage.getItem(rosterPrefetchKey(franchiseId));
    if (!raw) return null;
    const payload = JSON.parse(raw);
    return payload?.ok && payload?.franchiseId === franchiseId ? payload : null;
  } catch {
    return null;
  }
}

function writePrefetchedRoster(franchiseId, payload) {
  try {
    sessionStorage.setItem(rosterPrefetchKey(franchiseId), JSON.stringify(payload));
  } catch {
    // Preloading is optional; normal page loading remains the fallback.
  }
}

const TRANSACTIONS_PREFETCH_PREFIX = "mesh:transactions-prefetch:";

function transactionsPrefetchKey(franchiseId) {
  return `${TRANSACTIONS_PREFETCH_PREFIX}${franchiseId}`;
}

function writePrefetchedTransactions(franchiseId, payload) {
  try {
    sessionStorage.setItem(transactionsPrefetchKey(franchiseId), JSON.stringify(payload));
  } catch {
    // Preloading is optional; normal page loading remains the fallback.
  }
}

const FRANCHISE_PROFILE_PREFIX = "mesh:franchise-profile:";

function readFranchiseProfile(franchiseId) {
  try {
    const raw = sessionStorage.getItem(`${FRANCHISE_PROFILE_PREFIX}${franchiseId}`);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    return payload?.ok && payload?.franchise ? payload : null;
  } catch {
    return null;
  }
}

function writeFranchiseProfile(franchiseId, payload) {
  try {
    sessionStorage.setItem(`${FRANCHISE_PROFILE_PREFIX}${franchiseId}`, JSON.stringify(payload));
  } catch {
    // Optional optimization only.
  }
}

const RESUME_PREFETCH_PREFIX = "mesh:resume-prefetch:";

function writePrefetchedResume(franchiseId, payload) {
  try {
    sessionStorage.setItem(`${RESUME_PREFETCH_PREFIX}${franchiseId}`, JSON.stringify(payload));
  } catch {
    // Preloading is optional; normal page loading remains the fallback.
  }
}

function fmtScore(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(1) : "—";
}

function recordText(record) {
  if (!record) return "0–0";
  const w = Number(record.wins) || 0;
  const l = Number(record.losses) || 0;
  const t = Number(record.ties) || 0;
  return t ? `${w}–${l}–${t}` : `${w}–${l}`;
}

function statusId(status) {
  const s = String(status || "").toLowerCase();
  if (s === "final") return "final";
  if (s.includes("progress") || s === "live") return "live";
  return "scheduled";
}

function tournamentName(value) {
  const key = String(value || "").trim().toUpperCase();
  const names = {
    MM: "March Madness",
    "MARCH MADNESS": "March Madness",
    NIT: "NIT",
    CROWN: "Crown",
    CBI: "CBI",
  };
  return names[key] || String(value || "").trim();
}

function eventDisplayName(value) {
  const raw = String(value || "").trim();
  const key = raw.toLowerCase();
  if (key.includes("season kickoff invitational") && key.includes("regional")) return "SKI-Regional";
  if (key.includes("ski") && key.includes("regional")) return "SKI-Regional";
  if (key.includes("mid major mayhem")) return "Mid Major Mayhem";
  return raw;
}

function gameStageLabel(game) {
  const event = eventDisplayName(game.eventName || game.tournamentName);
  const round = String(game.round || "").trim();
  const type = String(game.gameType || "").trim();
  const genericEvent = !event || /^(regular season|regular|conference)$/i.test(event);

  if (!genericEvent && round) return `${event} • ${round}`;
  if (!genericEvent) return event;
  if (round && !/conference/i.test(round)) return round;
  return game.stageLabel || type || event || "Regular Season";
}

function combineCoachTenures(rows, activeSeason) {
  const ordered = [...(rows || [])].sort(
    (a, b) => Number(a.season) - Number(b.season) || Number(a.startWeek || 0) - Number(b.startWeek || 0),
  );
  const groups = [];

  ordered.forEach((row) => {
    const previous = groups[groups.length - 1];
    const sameCoach = previous && previous.coachId === row.coachId;
    const consecutiveSeason = sameCoach && Number(row.season) <= Number(previous.endSeason) + 1;

    if (!sameCoach || !consecutiveSeason) {
      groups.push({
        coachId: row.coachId,
        coachName: row.coachName,
        startSeason: Number(row.season),
        endSeason: Number(row.season),
        overall: { ...(row.overall || {}) },
      });
      return;
    }

    previous.endSeason = Math.max(previous.endSeason, Number(row.season));
    previous.overall.wins = (Number(previous.overall.wins) || 0) + (Number(row.overall?.wins) || 0);
    previous.overall.losses = (Number(previous.overall.losses) || 0) + (Number(row.overall?.losses) || 0);
    previous.overall.ties = (Number(previous.overall.ties) || 0) + (Number(row.overall?.ties) || 0);
  });

  return groups
    .map((group) => ({
      ...group,
      tenureLabel:
        Number(group.endSeason) === Number(activeSeason)
          ? `${group.startSeason} – Present`
          : group.startSeason === group.endSeason
            ? String(group.startSeason)
            : `${group.startSeason} – ${group.endSeason}`,
    }))
    .sort((a, b) => b.endSeason - a.endSeason);
}

const MULTIWORD_MASCOTS = [
  "Golden Gophers","Blue Devils","Golden Eagles","Golden Flashes","Fighting Irish",
  "Yellow Jackets","Red Raiders","Red Wolves","Red Storm","RedHawks","Red Hawks",
  "Blue Raiders","Blue Hens","Blue Demons","Mean Green","Thundering Herd",
  "Runnin' Rebels","Running Rebels","Rainbow Warriors","Scarlet Knights",
  "Black Knights","Sun Devils","Demon Deacons","Mountaineers","Nittany Lions",
  "Tar Heels","Crimson Tide","Green Wave","Green Bay","Purple Aces",
  "Golden Grizzlies","Golden Bears","Golden Hurricane","Golden Lions",
  "Fighting Illini","Horned Frogs","Red Foxes","River Hawks","RiverHawks",
  "Roadrunners","Sea Wolves","Seawolves","Great Danes","Great Danes",
  "Privateers","Mocs","Retrievers"
];

function splitFranchiseName(name) {
  const full = String(name || "").trim();
  if (!full) return { school: "", mascot: "" };
  const match = MULTIWORD_MASCOTS
    .sort((a, b) => b.length - a.length)
    .find((mascot) => full.toLowerCase().endsWith(` ${mascot.toLowerCase()}`));
  if (match) {
    return { school: full.slice(0, -(match.length + 1)), mascot: match };
  }
  const parts = full.split(/\s+/);
  if (parts.length === 1) return { school: full, mascot: "" };
  return { school: parts.slice(0, -1).join(" "), mascot: parts[parts.length - 1] };
}

function SectionHeading({ eyebrow, title, action }) {
  return (
    <div className="mba-franchise-section-heading">
      <div>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {action ? <small>{action}</small> : null}
    </div>
  );
}

function LegacyCard({ icon: Icon, eyebrow, title, description, tone = "standard", to = "" }) {
  const content = (
    <>
      <div className="mba-franchise-legacy-icon">
        <Icon size={28} />
      </div>
      <div className="mba-franchise-legacy-copy">
        <span>{eyebrow}</span>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      <ChevronRight size={18} />
    </>
  );
  return to ? (
    <Link className={`mba-franchise-legacy-card mba-franchise-legacy-${tone}`} to={to}>
      {content}
    </Link>
  ) : (
    <div className={`mba-franchise-legacy-card mba-franchise-legacy-${tone}`}>
      {content}
    </div>
  );
}

function GameRow({ game, franchiseId }) {
  const own = game.team1?.franchiseId === franchiseId ? game.team1 : game.team2;
  const opp = game.team1?.franchiseId === franchiseId ? game.team2 : game.team1;
  if (!own || !opp) return null;

  const status = statusId(game.status);
  const final = status === "final";
  const winner =
    final && game.winnerFranchiseId
      ? game.winnerFranchiseId === franchiseId
      : null;
  const tied = final && !game.winnerFranchiseId;
  const showRank = Number(opp.rank) > 0 && Number(opp.rank) <= 25;
  const stage = gameStageLabel(game);

  return (
    <Link
      className="mba-franchise-game-row"
      to={`/scores/${encodeURIComponent(game.gameId)}`}
    >
      <div className="mba-franchise-game-week">
        <span>WK</span>
        <strong>{game.week}</strong>
      </div>

      <div className="mba-franchise-game-logo">
        {opp.logoUrl ? (
          <img src={opp.logoUrl} alt="" />
        ) : (
          <span>{String(opp.name || "M").slice(0, 1)}</span>
        )}
      </div>

      <div className="mba-franchise-game-copy">
        <span>{stage}</span>
        <strong>
          {showRank ? <b>#{opp.rank}</b> : null}
          {opp.name || "Opponent TBD"}
        </strong>
      </div>

      <div className="mba-franchise-game-result">
        {final ? (
          <span
            className={`result-pill ${
              tied ? "tie" : winner ? "win" : "loss"
            }`}
          >
            {tied ? "T" : winner ? "W" : "L"}
          </span>
        ) : (
          <span className={`result-pill ${status}`}>
            {status === "live" ? "LIVE" : "—"}
          </span>
        )}
        <strong>
          {final || status === "live"
            ? `${fmtScore(own.score)}–${fmtScore(opp.score)}`
            : "Scheduled"}
        </strong>
      </div>

      <ChevronRight size={16} />
    </Link>
  );
}

export default function FranchiseProfile() {
  const { franchiseId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [season, setSeason] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const prefetchedProfile = readFranchiseProfile(franchiseId);

    if (prefetchedProfile) {
      setData(prefetchedProfile);
      setSeason(prefetchedProfile.activeSeason);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError("");

    const url = new URL(API_URL);
    url.searchParams.set("action", "franchise");
    url.searchParams.set("franchiseId", franchiseId);

    fetch(url.toString(), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`API request failed with HTTP ${response.status}.`);
        }
        return response.json();
      })
      .then((payload) => {
        if (!payload?.ok) {
          throw new Error(payload?.error || "Franchise profile unavailable.");
        }
        setData(payload);
        setSeason(payload.activeSeason);
        writeFranchiseProfile(franchiseId, payload);

        const rosterUrl = new URL(API_URL);
        rosterUrl.searchParams.set("action", "roster");
        rosterUrl.searchParams.set("franchiseId", franchiseId);

        fetch(rosterUrl.toString())
          .then((response) => {
            if (!response.ok) return null;
            return response.json();
          })
          .then((rosterPayload) => {
            if (rosterPayload?.ok) {
              writePrefetchedRoster(franchiseId, rosterPayload);
            }
          })
          .catch(() => {
            // Preloading is optional. Roster keeps its normal fetch fallback.
          });

        const transactionsUrl = new URL(API_URL);
        transactionsUrl.searchParams.set("action", "transactions");
        transactionsUrl.searchParams.set("franchiseId", franchiseId);

        fetch(transactionsUrl.toString())
          .then((response) => {
            if (!response.ok) return null;
            return response.json();
          })
          .then((transactionsPayload) => {
            if (transactionsPayload?.ok) {
              writePrefetchedTransactions(franchiseId, transactionsPayload);
            }
          })
          .catch(() => {
            // Preloading is optional. Transactions keeps its normal fetch fallback.
          });

        const resumeUrl = new URL(API_URL);
        resumeUrl.searchParams.set("action", "franchiseResume");
        resumeUrl.searchParams.set("franchiseId", franchiseId);

        fetch(resumeUrl.toString())
          .then((response) => {
            if (!response.ok) return null;
            return response.json();
          })
          .then((resumePayload) => {
            if (resumePayload?.ok) {
              writePrefetchedResume(franchiseId, resumePayload);
            }
          })
          .catch(() => {
            // Preloading is optional. Career Résumé keeps its normal fetch fallback.
          });
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(
            requestError.message || "Unable to load franchise profile.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [franchiseId]);

  const games = useMemo(
    () =>
      (data?.games || [])
        .filter((game) => Number(game.season) === Number(season))
        .sort(
          (a, b) =>
            Number(a.week) - Number(b.week) ||
            String(a.gameId).localeCompare(String(b.gameId)),
        ),
    [data, season],
  );

  const coachTenures = useMemo(
    () => combineCoachTenures(data?.coachingHistory || [], data?.activeSeason),
    [data?.coachingHistory, data?.activeSeason],
  );

  if (loading) {
    return (
      <main className="mba-franchise-page">
        <div className="mba-franchise-state">
          <Activity size={28} />
          <strong>Loading franchise profile</strong>
        </div>
      </main>
    );
  }

  if (error || !data?.franchise) {
    return (
      <main className="mba-franchise-page">
        <button
          type="button"
          className="mba-franchise-back"
          onClick={() => {
            if (window.history.length > 1) navigate(-1);
            else navigate("/standings");
          }}
        >
          <ArrowLeft size={15} />
          Back
        </button>
        <div className="mba-franchise-state error">
          <strong>Franchise unavailable</strong>
          <span>{error || "This MESH franchise could not be found."}</span>
        </div>
      </main>
    );
  }

  const f = data.franchise;
  const current = data.currentSeason || {};
  const classification = MID_MAJOR_CONFERENCES.has(f.conference)
    ? "MID MAJOR"
    : "POWER";
  const displayName = splitFranchiseName(f.name);

  return (
    <main
      className="mba-franchise-page"
      style={{
        "--team-primary": f.primaryColor || "#ff6a00",
        "--team-secondary": f.secondaryColor || "#d7d7d7",
      }}
    >
      <button
        type="button"
        className="mba-franchise-back"
        onClick={() => {
            if (window.history.length > 1) navigate(-1);
            else navigate("/standings");
          }}
      >
        <ArrowLeft size={15} />
        Back
      </button>

      <section className="mba-franchise-hero">
        <div className="mba-franchise-hero-glow" />

        <div className="mba-franchise-logo-column">
          <div className="mba-franchise-logo">
            {f.logoUrl ? (
              <img src={f.logoUrl} alt={`${f.name} logo`} />
            ) : (
              <span>{String(f.name || "MBA").slice(0, 2)}</span>
            )}
          </div>

          <div className="mba-franchise-prestige">
            <Trophy size={16} />
            <div>
              <span>Prestige Points</span>
              <strong>{f.careerPrestigePoints ?? 0}</strong>
            </div>
          </div>
        </div>

        <div className="mba-franchise-identity">
          <div className="mba-franchise-kicker mba-franchise-kicker-centered">
            <span>{classification}</span>
            <span>•</span>
            <span>{f.conference}</span>
          </div>

          <div className="mba-franchise-team-name">
            <h1>{displayName.school || f.name}</h1>
            {displayName.mascot ? <h2>{displayName.mascot}</h2> : null}
          </div>

          <div className="mba-franchise-meta-row">
            <div className="mba-franchise-coach">
              <UserRound size={17} />
              <div>
                <span>Current Coach</span>
                <strong>{current.coachName || "Coach TBD"}</strong>
              </div>
            </div>

            <Link
              className="mba-franchise-roster mba-franchise-action-button"
              to={`/franchise/${encodeURIComponent(f.franchiseId)}/roster`}
            >
              <Users size={16} />
              <span>Roster</span>
              <ChevronRight size={15} />
            </Link>
            <Link
              className="mba-franchise-roster mba-franchise-action-button mba-franchise-transactions"
              to={`/franchise/${encodeURIComponent(f.franchiseId)}/transactions`}
            >
              <ArrowRightLeft size={16} />
              <span>Transactions</span>
              <ChevronRight size={15} />
            </Link>
          </div>

          <div className="mba-franchise-current">
            <div>
              <span>Conf Rank</span>
              <strong>
                {Number(current.conferenceRank) > 0
                  ? `#${current.conferenceRank}`
                  : "—"}
              </strong>
            </div>
            <div>
              <span>MESH Rank</span>
              <strong>
                {Number(current.nationalRank) > 0
                  ? `#${current.nationalRank}`
                  : "—"}
              </strong>
            </div>
            <div>
              <span>OVR Record</span>
              <strong>{recordText(current.overall)}</strong>
            </div>
            <div>
              <span>Conf Record</span>
              <strong>{recordText(current.conferenceRecord)}</strong>
            </div>
            <div>
              <span>PF</span>
              <strong>{fmtScore(current.pointsFor)}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="mba-franchise-section mba-franchise-trophy-section">
        <SectionHeading
          eyebrow="Achievements"
          title="Trophy Vault"
          action="Franchise trophy room"
        />
        <LegacyCard
          icon={Crown}
          eyebrow="Franchise Trophy Room"
          title="Trophies, Banners & Championships"
          description="View every championship trophy, franchise banner achievement, and Weekly High Score honor earned by this permanent MESH franchise."
          tone="trophy"
        />
      </section>

      <section className="mba-franchise-section mba-franchise-resume-section">
        <SectionHeading
          eyebrow="Franchise Career"
          title="Career Résumé"
          action="Complete historical résumé"
        />
        <LegacyCard
          icon={FileText}
          eyebrow="Franchise Career"
          title="Records, Rankings & Tournament History"
          description="Explore the complete franchise résumé, including career records, ranked history, special events, and postseason tournament results."
          tone="resume"
          to={`/franchise/${encodeURIComponent(f.franchiseId)}/resume`}
        />
      </section>

      <section className="mba-franchise-section">
        <div className="mba-franchise-schedule-heading">
          <SectionHeading
            eyebrow="Scores & Schedule"
            title={`${season} Game Log`}
            action={`${games.length} games`}
          />
          <label className="mba-franchise-season">
            <span>Season</span>
            <select
              value={season || ""}
              onChange={(event) => setSeason(Number(event.target.value))}
            >
              {(data.availableSeasons || []).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        {games.length ? (
          <div className="mba-franchise-game-log">
            {games.map((game) => (
              <GameRow
                key={game.gameId}
                game={game}
                franchiseId={f.franchiseId}
              />
            ))}
          </div>
        ) : (
          <div className="mba-franchise-empty">
            <CalendarDays size={20} />
            <div>
              <strong>Schedule not available</strong>
              <span>
                No GAME_RESULTS matchups are available for {season}.
              </span>
            </div>
          </div>
        )}
      </section>

      <section className="mba-franchise-section">
        <SectionHeading
          eyebrow="Permanent History"
          title="Season History"
          action="Season-by-season results"
        />

        <div className="mba-franchise-season-list">
          {(data.seasonHistory || []).map((row) => (
            <article
              className={`mba-franchise-season-card${
                Number(row.season) === Number(data.activeSeason)
                  ? " current"
                  : ""
              }`}
              key={row.season}
            >
              <div className="season-year">
                <span>Season</span>
                <strong>{row.season}</strong>
              </div>

              <div className="season-team">
                <strong>{row.franchiseName || f.name}</strong>
                <span>{row.coachName || "Coach TBD"}</span>
              </div>

              <div className="season-stats">
                <span>
                  OVR <strong>{recordText(row.overall)}</strong>
                </span>
                <span>
                  CONF <strong>{recordText(row.conferenceRecord)}</strong>
                </span>
                <span>
                  NAT{" "}
                  <strong>
                    {Number(row.nationalRank) > 0
                      ? `#${row.nationalRank}`
                      : "—"}
                  </strong>
                </span>
                <span>
                  CONF RANK{" "}
                  <strong>
                    {Number(row.conferenceRank) > 0
                      ? `#${row.conferenceRank}`
                      : "—"}
                  </strong>
                </span>
              </div>

              {row.regularSeasonConferenceChampion ||
              row.conferenceTournamentChampion ||
              row.postseasonTournament ||
              row.postseasonFinish ? (
                <div className="season-accomplishments">
                  {row.regularSeasonConferenceChampion ? (
                    <span><Crown size={13} />Regular Season {row.conference || f.conference} Champion</span>
                  ) : null}
                  {row.conferenceTournamentChampion ? (
                    <span><Crown size={13} />{row.conference || f.conference} Conference Tournament Champion</span>
                  ) : null}
                  {row.postseasonTournament || row.postseasonFinish ? (
                    <span>
                      <Crown size={13} />
                      {[tournamentName(row.postseasonTournament), row.postseasonFinish]
                        .filter(Boolean)
                        .join(" • ")}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="mba-franchise-section">
        <SectionHeading
          eyebrow="Leadership"
          title="Coaching History"
          action="Coach tenures"
        />

        <div className="mba-franchise-coaches">
          {coachTenures.map((row, index) => (
            <article
              className="mba-franchise-coach-row"
              key={`${row.coachId}-${row.startSeason}-${index}`}
            >
              <div className="coach-avatar">
                <UserRound size={19} />
              </div>
              <div>
                <span>{row.tenureLabel}</span>
                <strong>{row.coachName || "Coach TBD"}</strong>
                <small>Franchise record: {recordText(row.overall)}</small>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
