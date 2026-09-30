import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, ChevronDown, ChevronLeft, ChevronRight, Clock3, Radio, Sparkles, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import ConferenceBadge from "../components/ConferenceBadge";
import mbaLogo from "../assets/mba-logo.png";
import "../styles/scores.css";

const MAX_WEEK = 24;

const SCORES_API_URL =
  "https://script.google.com/macros/s/AKfycbwoKZvZRLo7POCjuaD56mvYKaL_AZdfbG04xkoF0XZKqiGYZjD3TmEFuNK8tDwr_K4B/exec";

const SCORES_VIEW_STORAGE_KEY = "mba-scores-view";

function readSavedScoresView() {
  try {
    return JSON.parse(sessionStorage.getItem(SCORES_VIEW_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}



const CONFERENCES = [
  { id: "acc", label: "ACC" },
  { id: "american", label: "American" },
  { id: "big-12", label: "Big 12" },
  { id: "big-east", label: "Big East" },
  { id: "big-ten", label: "Big Ten" },
  { id: "coastal", label: "Coastal", midMajor: true },
  { id: "c-usa", label: "C-USA", midMajor: true },
  { id: "ivy", label: "Ivy" },
  { id: "mac", label: "MAC" },
  { id: "mtn-west", label: "Mtn West" },
  { id: "ovc", label: "OVC", midMajor: true },
  { id: "sec", label: "SEC" },
  { id: "sun-belt", label: "Sun Belt" },
  { id: "west-coast", label: "West Coast", midMajor: true },
];

const PRIMARY_FILTERS = [
  { id: "featured", label: "Featured" },
  { id: "top-25", label: "Top 25" },
  { id: "all-mesh", label: "All MESH" },
  ...CONFERENCES,
];

const MID_MAJOR_MAYHEM_CONFERENCES = new Set([
  "coastal",
  "c-usa",
  "ovc",
  "west-coast",
]);

const EVENT = {
  SKI_REG: { id: "ski-reg", label: "SKI Reg", fullLabel: "Season Kickoff Inv. - Regionals" },
  SKI_CB: { id: "ski-cb", label: "SKI CB", fullLabel: "SKI Champions Bracket" },
  INVITATIONAL: { id: "invitational", label: "Invitational", fullLabel: "Invitational Tournaments" },
  MID_MAJOR: {
    id: "mid-major-mayhem",
    label: "Mid Major Mayhem",
    midMajorOnly: true,
  },
  CONF_CHALL: { id: "conf-chall", label: "Conf Chall", fullLabel: "Conference Challenger Series" },
  RIVALRY: { id: "rivalry", label: "Rivalry", fullLabel: "Rivalry Week" },
  CONF_TOURN: { id: "conf-tourn", label: "Conf Tourn", fullLabel: "Conference Tournament" },
  REG_SHOWDOWN: { id: "reg-showdown", label: "Reg. Showdown", fullLabel: "Regional Showdown Tournament" },
  POSTSEASON: { id: "postseason", label: "Postseason" },
};

/*
 * Temporary controls schedule based on the supplied 2025-2026 schedule.
 * When GAME_RESULTS is connected, these event buttons should be derived from
 * the selected week's game rows instead of maintained here.
 */
const WEEKLY_EVENTS = {
  1: [],
  2: [EVENT.SKI_REG],
  3: [EVENT.SKI_REG],
  4: [EVENT.SKI_REG],
  5: [EVENT.SKI_CB, EVENT.MID_MAJOR],
  6: [EVENT.INVITATIONAL, EVENT.SKI_CB, EVENT.MID_MAJOR],
  7: [EVENT.INVITATIONAL, EVENT.SKI_CB, EVENT.MID_MAJOR],
  8: [EVENT.INVITATIONAL, EVENT.SKI_CB, EVENT.MID_MAJOR],
  9: [EVENT.SKI_CB, EVENT.MID_MAJOR],
  10: [EVENT.CONF_CHALL, EVENT.MID_MAJOR],
  11: [EVENT.CONF_CHALL],
  12: [EVENT.CONF_CHALL],
  13: [EVENT.CONF_CHALL],
  14: [EVENT.RIVALRY],
  15: [],
  16: [EVENT.REG_SHOWDOWN],
  17: [EVENT.REG_SHOWDOWN],
  18: [EVENT.REG_SHOWDOWN],
  19: [EVENT.POSTSEASON],
  20: [EVENT.POSTSEASON],
  21: [EVENT.POSTSEASON],
  22: [EVENT.POSTSEASON],
  23: [EVENT.POSTSEASON],
  24: [EVENT.POSTSEASON],
};

function getBaseFilterForWeek(week) {
  if (week >= 15 && week <= 18) return EVENT.CONF_TOURN;
  if (week >= 19) return EVENT.POSTSEASON;
  return { id: "conference", label: "Conference" };
}


const CONFERENCE_API_LABELS = {
  acc: ["ACC"],
  american: ["American"],
  "big-12": ["Big 12"],
  "big-east": ["Big East"],
  "big-ten": ["Big Ten"],
  coastal: ["Coastal"],
  "c-usa": ["C-USA", "CUSA", "Conference USA"],
  ivy: ["Ivy"],
  mac: ["MAC"],
  "mtn-west": ["Mtn West", "Mountain West"],
  ovc: ["OVC"],
  sec: ["SEC"],
  "sun-belt": ["Sun Belt"],
  "west-coast": ["West Coast"],
};

function normalizeStatus(status) {
  const value = String(status || "").trim().toLowerCase();

  if (value === "final") {
    return { id: "final", label: "Final" };
  }

  if (
    value.includes("progress") ||
    value === "live" ||
    value === "in progress"
  ) {
    return { id: "live", label: "In Progress" };
  }

  return { id: "upcoming", label: "Scheduled" };
}

function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);
  const icons = {
    live: Radio,
    upcoming: Clock3,
    final: Trophy,
  };
  const Icon = icons[normalized.id] ?? Activity;

  return (
    <span className={`scores-status-badge scores-status-${normalized.id}`}>
      <Icon size={11} />
      {normalized.label}
    </span>
  );
}

function formatScore(score, status) {
  const normalized = normalizeStatus(status);

  if (score === null || score === undefined || score === "") {
    return normalized.id === "upcoming" ? "—" : "0.0";
  }

  return Number(score).toFixed(1);
}

function formatProjection(projection) {
  if (projection === null || projection === undefined || projection === "") {
    return "";
  }

  return `Proj: ${Number(projection).toFixed(1)}`;
}

function teamInitial(team) {
  const words = String(team?.name || "MBA")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words.length > 1
    ? `${words[0][0]}${words[1][0]}`.toUpperCase()
    : String(words[0] || "M").slice(0, 2).toUpperCase();
}

function ScoresDropdown({
  label,
  value,
  options,
  onChange,
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const selectedOption =
    options.find((option) => String(option.value) === String(value)) ??
    options[0];

  useEffect(() => {
    function handlePointerDown(event) {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function choose(option) {
    onChange(option.value);
    setOpen(false);
  }

  return (
    <div
      className={`scores-dropdown-control${open ? " is-open" : ""}`}
      ref={rootRef}
    >
      <span>{label}</span>

      <button
        type="button"
        className="scores-dropdown-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <strong>{selectedOption?.label || ""}</strong>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {open ? (
        <div className="scores-dropdown-menu" role="listbox" aria-label={ariaLabel}>
          {options.map((option) => {
            const selected = String(option.value) === String(value);

            return (
              <button
                type="button"
                role="option"
                aria-selected={selected}
                key={String(option.value)}
                className={[
                  selected ? "active" : "",
                  option.className || "",
                  option.isCurrent ? "current-week" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => choose(option)}
              >
                {option.menuLabel || option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function TeamRow({ team, status, winnerFranchiseId }) {
  if (!team) {
    return (
      <div className="score-team-row score-team-row-tbd">
        <div className="score-team-logo">
          <span>TBD</span>
        </div>
        <div className="score-team-info">
          <strong>TBD</strong>
          <span>Matchup participant pending</span>
        </div>
        <div className="score-team-numbers">
          <strong>—</strong>
        </div>
      </div>
    );
  }

  const normalized = normalizeStatus(status);
  const isWinner =
    normalized.id === "final" &&
    winnerFranchiseId &&
    winnerFranchiseId === team.franchiseId;

  const hasWinner =
    normalized.id === "final" && Boolean(winnerFranchiseId);

  const showRank =
    Number.isFinite(Number(team.rank)) &&
    Number(team.rank) > 0 &&
    Number(team.rank) <= 25;

  return (
    <div
      className={[
        "score-team-row",
        isWinner ? "winner" : "",
        hasWinner && !isWinner ? "loser" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="score-team-logo">
        {team.logoUrl ? (
          <img
            src={team.logoUrl}
            alt={`${team.name || "Team"} logo`}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
              event.currentTarget.nextElementSibling?.removeAttribute("hidden");
            }}
          />
        ) : null}
        <span hidden={Boolean(team.logoUrl)}>{teamInitial(team)}</span>
      </div>

      <div className="score-team-info">
        <strong title={team.name || "TBD"}>
          {showRank ? <b className="score-team-rank">#{team.rank}</b> : null}
          {team.name || "TBD"}
        </strong>

        {team.coachName ? (
          <span className="score-team-coach">{team.coachName}</span>
        ) : null}

        <span className="score-team-records">
          <span>OVR: {team.overallRecord || "0-0"}</span>
          <span>CONF: {team.conferenceRecord || "0-0"}</span>
        </span>
      </div>

      <div className="score-team-numbers">
        <strong>{formatScore(team.score, status)}</strong>
        {normalized.id !== "final" ? (
          <span className="score-team-projection">
            {team.projectedScore !== null &&
            team.projectedScore !== undefined
              ? formatProjection(team.projectedScore)
              : "Proj: —"}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function isBracketEvent(game) {
  const haystack = [
    game?.eventId,
    game?.eventName,
    game?.gameType,
    game?.tournamentName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const bracketTerms = [
    "ski",
    "season kickoff",
    "invitational",
    "mid major mayhem",
    "conference challenger",
    "conference tournament",
    "regional showdown",
    "march madness",
    "national tournament",
    "nit",
    "cbi",
    "postseason",
  ];

  return bracketTerms.some((term) => haystack.includes(term));
}

function eventBracketUrl(game) {
  const params = new URLSearchParams();

  if (game?.eventId) params.set("event", game.eventId);
  if (game?.bracket) params.set("bracket", game.bracket);
  if (game?.week) params.set("week", String(game.week));

  const query = params.toString();
  return query ? `/events?${query}` : "/events";
}

function ScoreCard({ game, featured = false, featuredPosition = 0 }) {
  const stage =
    game.stageLabel ||
    game.round ||
    game.gameType ||
    game.eventName ||
    "Game";

  return (
    <article
      className={[
        "score-card",
        `score-card-${normalizeStatus(game.status).id}`,
        featured ? "score-card-featured" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="score-card-header">
        <div className="score-card-identity">
          <span className="score-league-name">{stage}</span>
          {featured ? (
            <span className="score-featured-label">
              <Sparkles size={10} />
              {featuredPosition === 0
                ? "Game of the Week"
                : "Featured Matchup"}
            </span>
          ) : null}
        </div>

        {isBracketEvent(game) ? (
          <Link
            className="score-bracket-link"
            to={eventBracketUrl(game)}
            title="Open this event bracket"
          >
            View Bracket
            <ChevronRight size={12} />
          </Link>
        ) : null}

        <StatusBadge status={game.status} />
      </div>

      <div className="score-team-list">
        <TeamRow
          team={game.team1}
          status={game.status}
          winnerFranchiseId={game.winnerFranchiseId}
        />
        <TeamRow
          team={game.team2}
          status={game.status}
          winnerFranchiseId={game.winnerFranchiseId}
        />
      </div>

      <Link
        className="score-game-center-button"
        to={`/scores/${encodeURIComponent(game.gameId)}`}
      >
        View Game Center
        <ChevronRight size={15} />
      </Link>
    </article>
  );
}

function gameMatchesConference(game, filterId) {
  const accepted = CONFERENCE_API_LABELS[filterId] ?? [];
  const conferences = [
    game?.team1?.conference,
    game?.team2?.conference,
  ].map((value) => String(value || "").trim().toLowerCase());

  return accepted.some((label) =>
    conferences.includes(label.toLowerCase()),
  );
}

function gameMatchesEvent(game, filterId) {
  const haystack = [
    game?.eventId,
    game?.eventName,
    game?.gameType,
    game?.tournamentName,
    game?.round,
    game?.bracket,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const matchers = {
    conference: ["conference"],
    "conf-tourn": ["conference tournament", "conf tourn"],
    "ski-reg": ["ski reg", "season kickoff"],
    "ski-cb": ["ski cb", "champions bracket"],
    invitational: ["invitational"],
    "mid-major-mayhem": ["mid major mayhem"],
    "conf-chall": ["conference challenger", "conf chall"],
    rivalry: ["rivalry"],
    "reg-showdown": ["regional showdown", "reg. showdown"],
    postseason: [
      "march madness",
      "national tournament",
      "nit",
      "cbi",
      "postseason",
    ],
  };

  return (matchers[filterId] ?? []).some((term) =>
    haystack.includes(term),
  );
}

function ScoresResults({
  data,
  loading,
  error,
  selectedPrimaryFilter,
  selectedSecondaryFilter,
  primaryLabel,
  secondaryLabel,
  selectedConference,
}) {
  const allGames = Array.isArray(data?.games) ? data.games : [];

  const visibleGames = useMemo(() => {
    if (selectedPrimaryFilter === "featured") {
      return allGames
        .filter(
          (game) =>
            game.featuredRank !== null &&
            game.featuredRank !== undefined &&
            game.featuredRank !== "" &&
            Number.isFinite(Number(game.featuredRank)) &&
            Number(game.featuredRank) > 0,
        )
        .sort((a, b) => Number(a.featuredRank) - Number(b.featuredRank))
        .slice(0, 3);
    }

    let games = allGames;

    if (selectedPrimaryFilter === "top-25") {
      games = games.filter(
        (game) =>
          (Number(game?.team1?.rank) > 0 &&
            Number(game?.team1?.rank) <= 25) ||
          (Number(game?.team2?.rank) > 0 &&
            Number(game?.team2?.rank) <= 25),
      );
    } else if (selectedPrimaryFilter !== "all-mesh") {
      games = games.filter((game) =>
        gameMatchesConference(game, selectedPrimaryFilter),
      );
    }

    games = games.filter((game) =>
      gameMatchesEvent(game, selectedSecondaryFilter),
    );

    if (selectedPrimaryFilter === "top-25") {
      const bestTop25Rank = (game) => {
        const ranks = [game?.team1?.rank, game?.team2?.rank]
          .map(Number)
          .filter((rank) => Number.isFinite(rank) && rank > 0 && rank <= 25);

        return ranks.length > 0 ? Math.min(...ranks) : 999;
      };

      games = [...games].sort(
        (a, b) => bestTop25Rank(a) - bestTop25Rank(b),
      );
    }

    return games;
  }, [
    allGames,
    selectedPrimaryFilter,
    selectedSecondaryFilter,
  ]);

  if (loading) {
    return (
      <div className="scores-empty-state">
        <Activity size={27} />
        <h3>Loading scores</h3>
        <p>Retrieving Week {data?.week || ""} MESH matchups.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="scores-empty-state">
        <Activity size={27} />
        <h3>Scores unavailable</h3>
        <p>{error}</p>
      </div>
    );
  }

  const isFeatured = selectedPrimaryFilter === "featured";

  return (
    <section className="scores-results">
      <div className="scores-section-heading">
        <div>
          <span>
            {isFeatured
              ? "Three games to watch"
              : `${visibleGames.length} matchups shown`}
          </span>
          <h2>
            {isFeatured
              ? "Featured Matchups"
              : secondaryLabel || primaryLabel}
          </h2>
        </div>

        {selectedConference ? (
          <ConferenceBadge
            conference={selectedConference.label}
            className="scores-conference-badge"
            alt={`${selectedConference.label} conference badge`}
          />
        ) : (
          <span className="scores-section-badge">
            {isFeatured ? "MBA" : primaryLabel}
          </span>
        )}
      </div>

      {visibleGames.length > 0 ? (
        <div className="scores-grid">
          {visibleGames.map((game, index) => (
            <ScoreCard
              key={game.gameId || `${game.week}-${index}`}
              game={game}
              featured={isFeatured}
              featuredPosition={index}
            />
          ))}
        </div>
      ) : (
        <div className="scores-empty-state">
          {isFeatured ? <Sparkles size={27} /> : <Activity size={27} />}
          <h3>
            {isFeatured
              ? "Featured matchups not selected yet"
              : "No matchups found"}
          </h3>
          <p>
            {isFeatured
              ? "Featured Rank has not been assigned to games for this week."
              : "No games match the selected week and scoreboard filters."}
          </p>
        </div>
      )}
    </section>
  );
}

export default function Scores() {
  const savedScoresView = useMemo(() => readSavedScoresView(), []);
  const [selectedWeek, setSelectedWeek] = useState(
    Number(savedScoresView?.selectedWeek) || 1,
  );
  const [selectedPrimaryFilter, setSelectedPrimaryFilter] = useState(
    savedScoresView?.selectedPrimaryFilter || "featured",
  );
  const [selectedSecondaryFilter, setSelectedSecondaryFilter] = useState(
    savedScoresView?.selectedSecondaryFilter || "conference",
  );
  const [scoresData, setScoresData] = useState(null);
  const [scoresLoading, setScoresLoading] = useState(true);
  const [scoresError, setScoresError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadScores() {
      setScoresLoading(true);
      setScoresError("");

      try {
        const url = new URL(SCORES_API_URL);
        url.searchParams.set("action", "scores");
        url.searchParams.set("week", String(selectedWeek));

        const response = await fetch(url.toString(), {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`API request failed with HTTP ${response.status}.`);
        }

        const data = await response.json();

        if (!data?.ok) {
          throw new Error(data?.error || "The MESH Basketball API returned an error.");
        }

        setScoresData(data);
      } catch (error) {
        if (error?.name === "AbortError") return;

        setScoresData(null);
        setScoresError(
          error?.message || "Unable to load MESH Basketball scores.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setScoresLoading(false);
        }
      }
    }

    loadScores();

    return () => controller.abort();
  }, [selectedWeek]);

  useEffect(() => {
    sessionStorage.setItem(
      SCORES_VIEW_STORAGE_KEY,
      JSON.stringify({
        selectedWeek,
        selectedPrimaryFilter,
        selectedSecondaryFilter,
      }),
    );
  }, [selectedWeek, selectedPrimaryFilter, selectedSecondaryFilter]);

  const primaryLabel =
    PRIMARY_FILTERS.find((item) => item.id === selectedPrimaryFilter)?.label ??
    "Featured";

  const selectedConference =
    CONFERENCES.find((item) => item.id === selectedPrimaryFilter) ?? null;

  const secondaryFilters = useMemo(() => {
    if (selectedPrimaryFilter === "featured") return [];

    const baseFilter = getBaseFilterForWeek(selectedWeek);
    const events = WEEKLY_EVENTS[selectedWeek] ?? [];

    const visibleEvents = events.filter(
      (event) =>
        event.id !== baseFilter.id &&
        (!event.midMajorOnly ||
          selectedPrimaryFilter === "top-25" ||
          MID_MAJOR_MAYHEM_CONFERENCES.has(selectedPrimaryFilter)),
    );

    return [baseFilter, ...visibleEvents];
  }, [selectedPrimaryFilter, selectedWeek]);

  const selectedSecondaryOption =
    secondaryFilters.find((item) => item.id === selectedSecondaryFilter) ??
    secondaryFilters[0];

  const secondaryLabel =
    selectedSecondaryOption?.fullLabel ??
    selectedSecondaryOption?.label ??
    "";

  function resetSecondaryForWeek(week) {
    setSelectedSecondaryFilter(getBaseFilterForWeek(week).id);
  }

  function selectPrimaryFilter(filterId) {
    setSelectedPrimaryFilter(filterId);
    resetSecondaryForWeek(selectedWeek);
  }

  function changeWeek(nextWeek) {
    if (nextWeek < 1 || nextWeek > MAX_WEEK) return;
    setSelectedWeek(nextWeek);
    resetSecondaryForWeek(nextWeek);
  }

  return (
    <main className="scores-page">
      <PageHeader
        eyebrow="Live Game Center"
        title="Scores"
        description="Follow every MBA matchup by conference, ranking, and week."
        imageSrc={mbaLogo}
        imageAlt="MBA logo"
        accent="scores"
        size="compact"
      />

      <section className="scores-controls scores-controls-dropdowns">
        <ScoresDropdown
          label="MESH Week"
          value={selectedWeek}
          options={Array.from({ length: MAX_WEEK }, (_, index) => {
            const week = index + 1;
            const isCurrent = Number(scoresData?.activeWeek) === week;

            return {
              value: week,
              label: `Week ${week}`,
              menuLabel: isCurrent ? `Week ${week} (Current)` : `Week ${week}`,
              isCurrent,
            };
          })}
          onChange={(week) => changeWeek(Number(week))}
          ariaLabel="Choose MESH week"
        />

        <ScoresDropdown
          label="Scoreboard"
          value={selectedPrimaryFilter}
          options={PRIMARY_FILTERS.map((filter) => ({
            value: filter.id,
            label: filter.label,
            className: filter.midMajor ? "mid-major-option" : "",
          }))}
          onChange={selectPrimaryFilter}
          ariaLabel="Choose scoreboard view"
        />
      </section>

      {selectedPrimaryFilter !== "featured" ? (
        <section className="scores-secondary-filter">
          <div className="scores-filter-heading">
            <span>Filter {primaryLabel}</span>
            <strong>{secondaryLabel}</strong>
          </div>

          <div
            className="scores-secondary-tabs"
            aria-label={`Filter ${primaryLabel} games by event`}
          >
            {secondaryFilters.map((filter) => (
              <button
                type="button"
                key={filter.id}
                className={
                  selectedSecondaryFilter === filter.id
                    ? "scores-secondary-tab active"
                    : "scores-secondary-tab"
                }
                onClick={() => setSelectedSecondaryFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <ScoresResults
        data={scoresData}
        loading={scoresLoading}
        error={scoresError}
        selectedPrimaryFilter={selectedPrimaryFilter}
        selectedSecondaryFilter={selectedSecondaryFilter}
        primaryLabel={primaryLabel}
        secondaryLabel={secondaryLabel}
        selectedConference={selectedConference}
      />
    </main>
  );
}
