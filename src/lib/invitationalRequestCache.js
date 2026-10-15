// v70: One bundled Invitational response supplies the landing page and all brackets.
// No separate 23 bracket requests; preserves the original response shape for pages.
const responses = new Map();
const pending = new Map();
const ACTIVE_TTL = 60 * 1000;
const HISTORICAL_TTL = 10 * 60 * 1000;
const EVENT = "Invitational Tournaments";
const ENDPOINT = "https://script.google.com/macros/s/AKfycbwoKZvZRLo7POCjuaD56mvYKaL_AZdfbG04xkoF0XZKqiGYZjD3TmEFuNK8tDwr_K4B/exec";
const key = (season, tournament = "") => `${season}::${tournament || "ALL"}`;
const ttl = season => Number(season) >= 2027 ? ACTIVE_TTL : HISTORICAL_TTL;
function store(season, tournament, data) {
  responses.set(key(season, tournament), { data, expires: Date.now() + ttl(season) });
}
export function getCachedInvitational(season, tournament = "") {
  const k = key(season, tournament);
  const item = responses.get(k);
  if (!item) return null;
  if (Date.now() >= item.expires) { responses.delete(k); return null; }
  return item.data;
}
function unpackBundledBrackets(season, payload) {
  for (const tournament of payload.tournaments || []) {
    if (!Array.isArray(tournament.games)) continue;
    store(season, tournament.tournamentName, {
      ok: true, api: payload.api, action: "event", generatedAt: payload.generatedAt,
      activeSeason: payload.activeSeason, activeWeek: payload.activeWeek,
      lastCompletedWeek: payload.lastCompletedWeek, season: payload.season,
      eventName: payload.eventName, tournamentName: tournament.tournamentName,
      found: true, availableSeasons: payload.availableSeasons,
      teamCount: tournament.teamCount, teams: tournament.teams,
      placements: tournament.placements, gameCount: tournament.gameCount,
      games: tournament.games
    });
  }
}
export function requestInvitational(season, tournament = "") {
  const cached = getCachedInvitational(season, tournament);
  if (cached) return Promise.resolve(cached);
  const k = key(season, tournament);
  if (pending.has(k)) return pending.get(k);
  // Wait for the single bundled listing request even on direct bracket links.
  const request = (async () => {
    if (tournament) {
      await requestInvitational(season);
      const detail = getCachedInvitational(season, tournament);
      if (detail) return detail;
      // Defensive fallback for an older Apps Script deployment or missing tournament.
      return fetchAndValidate(season, tournament);
    }
    return fetchAndValidate(season, "");
  })().finally(() => pending.delete(k));
  pending.set(k, request);
  return request;
}
async function fetchAndValidate(season, tournament) {
  const url = new URL(ENDPOINT);
  url.searchParams.set("action", "event");
  url.searchParams.set("season", String(season));
  url.searchParams.set("event", EVENT);
  if (tournament) url.searchParams.set("tournament", tournament);
  else url.searchParams.set("includeGames", "1");
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`API request failed with HTTP ${response.status}.`);
  const data = await response.json();
  if (!data?.ok) throw new Error(data?.error || "MESH Basketball API returned an error.");
  if (tournament && data.found === false) throw new Error("Invitational not found for this season.");
  store(season, tournament, data);
  if (!tournament) unpackBundledBrackets(season, data);
  return data;
}
// All bracket data is already bundled; no background requests needed.
export function warmInvitationalBrackets() {}
