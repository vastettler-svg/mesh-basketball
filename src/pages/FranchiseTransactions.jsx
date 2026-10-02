import { useEffect, useState } from "react";
import {
  Activity,
  ArrowDownLeft,
  ArrowLeft,
  ArrowRightLeft,
  ArrowUpRight,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/franchiseTransactions.css";

const API_URL =
  "https://script.google.com/macros/s/AKfycbwoKZvZRLo7POCjuaD56mvYKaL_AZdfbG04xkoF0XZKqiGYZjD3TmEFuNK8tDwr_K4B/exec";

const TRANSACTIONS_PREFETCH_PREFIX = "mesh:transactions-prefetch:";
const FRANCHISE_PROFILE_PREFIX = "mesh:franchise-profile:";

function readSessionPayload(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function splitFranchiseName(name) {
  const full = String(name || "").trim();
  const parts = full.split(/\s+/);
  if (parts.length < 2) return { school: full, mascot: "" };
  return { school: parts.slice(0, -1).join(" "), mascot: parts[parts.length - 1] };
}

function typeLabel(type) {
  const value = String(type || "").toLowerCase();
  if (value === "trade") return "Trade";
  if (value === "waiver") return "Waiver Claim";
  if (value === "free_agent") return "Free Agent";
  return value ? value.replaceAll("_", " ") : "Transaction";
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function PlayerLine({ player }) {
  const eligible = Array.isArray(player?.fantasyPositions) && player.fantasyPositions.length
    ? player.fantasyPositions.join(" / ")
    : player?.position || "—";
  return (
    <div className="mba-tx-player">
      <strong>{player?.playerName || "Unknown Player"}</strong>
      <span>{eligible}{player?.nbaTeam ? ` • ${player.nbaTeam}` : ""}</span>
    </div>
  );
}

function pickNumber(pick, keys) {
  for (const key of keys) {
    if (pick?.[key] !== undefined && pick?.[key] !== null && pick?.[key] !== "") {
      const value = Number(pick[key]);
      if (Number.isFinite(value)) return value;
    }
  }
  return null;
}

function pickText(pick) {
  const season = pickNumber(pick, ["season", "draft_season", "draftSeason"]);
  const round = pickNumber(pick, ["round", "draft_round", "draftRound"]);
  if (season && round) return `${season} Round ${round} Draft Pick`;
  if (round) return `Round ${round} Draft Pick`;
  if (season) return `${season} Draft Pick`;
  return "Draft Pick";
}

function splitDraftPicks(transaction) {
  const rosterId = Number(transaction?.sleeperRosterId);
  const received = [];
  const sent = [];
  const unclassified = [];

  (Array.isArray(transaction?.draftPicks) ? transaction.draftPicks : []).forEach((pick) => {
    const newOwner = pickNumber(pick, [
      "owner_id", "ownerId", "new_owner_id", "newOwnerId", "new_roster_id", "newRosterId",
    ]);
    const previousOwner = pickNumber(pick, [
      "previous_owner_id", "previousOwnerId", "old_owner_id", "oldOwnerId",
      "previous_roster_id", "previousRosterId",
    ]);

    if (Number.isFinite(rosterId) && newOwner === rosterId && previousOwner !== rosterId) {
      received.push(pick);
    } else if (Number.isFinite(rosterId) && previousOwner === rosterId && newOwner !== rosterId) {
      sent.push(pick);
    } else {
      unclassified.push(pick);
    }
  });

  return { received, sent, unclassified };
}

function DraftPickList({ picks }) {
  if (!picks?.length) return null;
  return (
    <div className="mba-tx-pick-list">
      {picks.map((pick, index) => (
        <div className="mba-tx-pick" key={`${pickText(pick)}-${index}`}>
          <strong>{pickText(pick)}</strong>
        </div>
      ))}
    </div>
  );
}

function MovementBlock({ tone, title, players, picks, icon: Icon }) {
  if (!players?.length && !picks?.length) return null;
  return (
    <div className={`mba-tx-movement ${tone}`}>
      <div className="mba-tx-movement-label"><Icon size={14} /><span>{title}</span></div>
      <div className="mba-tx-player-list">
        {(players || []).map((player, index) => (
          <PlayerLine key={`${player.playerId || player.playerName || "player"}-${index}`} player={player} />
        ))}
        <DraftPickList picks={picks} />
      </div>
    </div>
  );
}

function TransactionCard({ transaction }) {
  const isTrade = transaction.type === "trade";
  const partners = Array.isArray(transaction.partnerFranchises) && transaction.partnerFranchises.length
    ? transaction.partnerFranchises.map((partner) => {
        const display = splitFranchiseName(partner?.name || partner?.franchiseId || "");
        return display.school || partner?.name || partner?.franchiseId || "";
      }).filter(Boolean)
    : (transaction.partnerFranchiseIds || []);
  const date = formatDate(transaction.createdAt);
  const picks = isTrade ? splitDraftPicks(transaction) : { received: [], sent: [], unclassified: [] };

  return (
    <article className={`mba-tx-card ${isTrade ? "trade" : transaction.type || "other"}`}>
      <header className="mba-tx-card-head">
        <div className="mba-tx-type">
          <div className="mba-tx-type-icon">
            {isTrade ? <ArrowRightLeft size={16} /> : <UserPlus size={16} />}
          </div>
          <div>
            <span>{typeLabel(transaction.type)}</span>
            <strong>{transaction.season} Season • Week {transaction.week}</strong>
          </div>
        </div>
        <div className="mba-tx-date">
          {date ? <strong>{date}</strong> : null}
          {isTrade && partners.length ? <span>with {partners.join(", ")}</span> : null}
        </div>
      </header>

      <div className="mba-tx-movements">
        <MovementBlock
          tone="in"
          title={isTrade ? "Received" : "Added"}
          players={transaction.adds}
          picks={picks.received}
          icon={ArrowDownLeft}
        />
        <MovementBlock
          tone="out"
          title={isTrade ? "Sent" : "Dropped"}
          players={transaction.drops}
          picks={picks.sent}
          icon={ArrowUpRight}
        />
      </div>

      {isTrade && picks.unclassified.length ? (
        <div className="mba-tx-unclassified-picks">
          <span>Draft Picks</span>
          <DraftPickList picks={picks.unclassified} />
        </div>
      ) : null}

      {transaction.type === "waiver" && transaction.waiverBid !== null && transaction.waiverBid !== undefined ? (
        <div className="mba-tx-faab-inline"><span>FAAB BID</span><strong>${transaction.waiverBid}</strong></div>
      ) : null}
    </article>
  );
}

export default function FranchiseTransactions() {
  const { franchiseId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    const prefetchedProfile = readSessionPayload(`${FRANCHISE_PROFILE_PREFIX}${franchiseId}`);
    const prefetchedTransactions = readSessionPayload(`${TRANSACTIONS_PREFETCH_PREFIX}${franchiseId}`);

    if (
      prefetchedProfile?.ok &&
      prefetchedProfile?.franchise &&
      prefetchedTransactions?.ok
    ) {
      setProfile(prefetchedProfile);
      setTransactions(prefetchedTransactions);
      setLoading(false);
      return () => controller.abort();
    }

    const profileUrl = new URL(API_URL);
    profileUrl.searchParams.set("action", "franchise");
    profileUrl.searchParams.set("franchiseId", franchiseId);

    const txUrl = new URL(API_URL);
    txUrl.searchParams.set("action", "transactions");
    txUrl.searchParams.set("franchiseId", franchiseId);

    Promise.all([
      fetch(profileUrl.toString(), { signal: controller.signal }).then((response) => response.json()),
      fetch(txUrl.toString(), { signal: controller.signal }).then((response) => response.json()),
    ])
      .then(([profilePayload, txPayload]) => {
        if (!profilePayload?.ok) throw new Error(profilePayload?.error || "Franchise profile unavailable.");
        if (!txPayload?.ok) throw new Error(txPayload?.error || "Transactions unavailable.");
        setProfile(profilePayload);
        setTransactions(txPayload);
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message || "Unable to load franchise transactions.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [franchiseId]);

  if (loading) {
    return <main className="mba-tx-page"><div className="mba-tx-state"><Activity size={28} /><strong>Loading franchise transactions</strong></div></main>;
  }

  if (error || !profile?.franchise) {
    return (
      <main className="mba-tx-page">
        <button className="mba-tx-back" type="button" onClick={() => navigate(-1)}><ArrowLeft size={15} /> Back</button>
        <div className="mba-tx-state error"><strong>Transactions unavailable</strong><span>{error || "This transaction history could not be loaded."}</span></div>
      </main>
    );
  }

  const f = profile.franchise;
  const displayName = splitFranchiseName(f.name);
  const totals = transactions?.totals || {};
  const feed = transactions?.transactions || [];

  return (
    <main
      className="mba-tx-page"
      style={{
        "--team-primary": f.primaryColor || "#ff6a00",
        "--team-secondary": f.secondaryColor || "#d7d7d7",
      }}
    >
      <button className="mba-tx-back" type="button" onClick={() => navigate(`/franchise/${encodeURIComponent(franchiseId)}`)}>
        <ArrowLeft size={15} /> Franchise Profile
      </button>

      <section className="mba-tx-hero">
        <div className="mba-tx-logo">
          {f.logoUrl ? <img src={f.logoUrl} alt={`${f.name} logo`} /> : <ArrowRightLeft size={38} />}
        </div>
        <div className="mba-tx-identity">
          <span>{f.conference} • FRANCHISE TRANSACTION HISTORY</span>
          <h1>{displayName.school || f.name}</h1>
          {displayName.mascot ? <h2>{displayName.mascot}</h2> : null}
          <small>Permanent MESH franchise record</small>
        </div>
      </section>

      <div className="mba-tx-tab"><ArrowRightLeft size={15} /> TRANSACTIONS</div>

      <section className="mba-tx-summary">
        <div><span>CAREER TRADES</span><strong>{Number(totals.trades || 0).toLocaleString()}</strong></div>
        <div><span>WAIVER CLAIMS</span><strong>{Number(totals.waiverClaims || 0).toLocaleString()}</strong></div>
      </section>

      <section className="mba-tx-section">
        <div className="mba-tx-section-heading">
          <div><span>FRANCHISE HISTORY</span><h2>Transaction Log</h2></div>
          <small>{feed.length} transactions</small>
        </div>

        {feed.length ? (
          <div className="mba-tx-feed">
            {feed.map((transaction, index) => {
              const previousSeason = index > 0 ? feed[index - 1]?.season : null;
              const showSeason = index === 0 || transaction.season !== previousSeason;
              return (
                <div className="mba-tx-season-group" key={`${transaction.season}-${transaction.transactionId}-${index}`}>
                  {showSeason ? <div className="mba-tx-season-divider"><span>{transaction.season}</span></div> : null}
                  <TransactionCard transaction={transaction} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mba-tx-empty">No archived transactions are available for this franchise yet.</div>
        )}
      </section>
    </main>
  );
}
