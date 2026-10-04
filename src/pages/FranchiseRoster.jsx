import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowLeft, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/franchiseRoster.css";

const API_URL =
  "https://script.google.com/macros/s/AKfycbwoKZvZRLo7POCjuaD56mvYKaL_AZdfbG04xkoF0XZKqiGYZjD3TmEFuNK8tDwr_K4B/exec";

const STARTER_ORDER = { PG: 1, SG: 2, G: 3, SF: 4, PF: 5, F: 6, C: 7, UTIL: 8 };

function splitFranchiseName(name) {
  const full = String(name || "").trim();
  const parts = full.split(/\s+/);
  if (parts.length < 2) return { school: full, mascot: "" };
  return { school: parts.slice(0, -1).join(" "), mascot: parts[parts.length - 1] };
}

function PlayerRow({ player, starter }) {
  return (
    <article className="mba-roster-player-row">
      <div className={`mba-roster-slot${starter ? " starter" : " bench"}`}>
        {starter ? player.lineupPosition || player.position || "—" : "BENCH"}
      </div>
      <div className="mba-roster-player-copy">
        <strong>{player.playerName || "Unknown Player"}</strong>
      </div>
      <div className="mba-roster-player-meta">
        <strong>{player.eligiblePositions || player.position || "—"}</strong>
        <span>{player.nbaTeam || "NBA team unavailable"}</span>
      </div>
    </article>
  );
}

export default function FranchiseRoster() {
  const { franchiseId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [roster, setRoster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    const profileUrl = new URL(API_URL);
    profileUrl.searchParams.set("action", "franchise");
    profileUrl.searchParams.set("franchiseId", franchiseId);

    const rosterUrl = new URL(API_URL);
    rosterUrl.searchParams.set("action", "roster");
    rosterUrl.searchParams.set("franchiseId", franchiseId);

    Promise.all([
      fetch(profileUrl.toString(), { signal: controller.signal }).then((response) => response.json()),
      fetch(rosterUrl.toString(), { signal: controller.signal }).then((response) => response.json()),
    ])
      .then(([profilePayload, rosterPayload]) => {
        if (!profilePayload?.ok) throw new Error(profilePayload?.error || "Franchise profile unavailable.");
        if (!rosterPayload?.ok) throw new Error(rosterPayload?.error || "Roster unavailable.");
        setProfile(profilePayload);
        setRoster(rosterPayload);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "Unable to load franchise roster.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [franchiseId]);

  const starters = useMemo(
    () =>
      (roster?.players || [])
        .filter((player) => player.isStarter)
        .sort(
          (a, b) =>
            (STARTER_ORDER[String(a.lineupPosition || "").toUpperCase()] || 99) -
              (STARTER_ORDER[String(b.lineupPosition || "").toUpperCase()] || 99) ||
            String(a.playerName).localeCompare(String(b.playerName)),
        ),
    [roster],
  );

  const bench = useMemo(
    () =>
      (roster?.players || [])
        .filter((player) => !player.isStarter)
        .sort((a, b) => String(a.playerName).localeCompare(String(b.playerName))),
    [roster],
  );

  if (loading) {
    return (
      <main className="mba-roster-page">
        <div className="mba-roster-state">
          <Activity size={28} />
          <strong>Loading franchise roster</strong>
        </div>
      </main>
    );
  }

  if (error || !profile?.franchise) {
    return (
      <main className="mba-roster-page">
        <button className="mba-roster-back" type="button" onClick={() => navigate(-1)}>
          <ArrowLeft size={15} /> Back
        </button>
        <div className="mba-roster-state error">
          <strong>Roster unavailable</strong>
          <span>{error || "This MESH roster could not be loaded."}</span>
        </div>
      </main>
    );
  }

  const f = profile.franchise;
  const displayName = splitFranchiseName(f.name);

  return (
    <main
      className="mba-roster-page"
      style={{
        "--team-primary": f.primaryColor || "#ff6a00",
        "--team-secondary": f.secondaryColor || "#d7d7d7",
      }}
    >
      <button
        className="mba-roster-back"
        type="button"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={15} /> Back
      </button>

      <section className="mba-roster-hero">
        <div className="mba-roster-logo">
          {f.logoUrl ? <img src={f.logoUrl} alt={`${f.name} logo`} /> : <Users size={38} />}
        </div>
        <div className="mba-roster-identity">
          <span>{f.conference} • CURRENT MESH ROSTER</span>
          <h1>{displayName.school || f.name}</h1>
          {displayName.mascot ? <h2>{displayName.mascot}</h2> : null}
          <small>{roster?.season ? `${roster.season} Season` : "Current Season"}</small>
        </div>
      </section>

      <div className="mba-roster-tab"><Users size={15} /> ROSTER</div>

      <section className="mba-roster-section">
        <div className="mba-roster-section-heading">
          <div><span>ACTIVE LINEUP</span><h2>Starters</h2></div>
          <small>{starters.length} players</small>
        </div>
        <div className="mba-roster-list">
          {starters.map((player) => <PlayerRow key={player.playerId} player={player} starter />)}
        </div>
      </section>

      <section className="mba-roster-section">
        <div className="mba-roster-section-heading">
          <div><span>RESERVES</span><h2>Bench</h2></div>
          <small>{bench.length} players</small>
        </div>
        <div className="mba-roster-list">
          {bench.map((player) => <PlayerRow key={player.playerId} player={player} starter={false} />)}
        </div>
      </section>
    </main>
  );
}
