// Shared in-memory SKI Regional API cache. Requests are keyed by their full URL.
const completed = new Map();
const pending = new Map();
export function cachedRegionalData(url, season) {
  const item = completed.get(url);
  const ttl = Number(season) === 2027 ? 60_000 : 600_000;
  return item && Date.now() - item.at < ttl ? item.data : null;
}
export function requestRegionalData(url, season) {
  const cached = cachedRegionalData(url, season);
  if (cached) return Promise.resolve(cached);
  if (pending.has(url)) return pending.get(url);
  const request = (async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`API request failed with HTTP ${response.status}.`);
    const data = await response.json();
    if (!data?.ok) throw new Error(data?.error || "MESH Basketball API returned an error.");
    if (data.found === false) throw new Error("Regional not found for this season.");
    completed.set(url, { data, at: Date.now() });
    return data;
  })();
  pending.set(url, request);
  request.finally(() => { if (pending.get(url) === request) pending.delete(url); }).catch(() => {});
  return request;
}
