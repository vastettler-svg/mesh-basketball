// Short-lived in-memory API cache. Avoids duplicate requests while navigating event pages.
const CACHE_TTL=10*60*1000;
const responseCache=new Map();
export function cachedEventRequest(url){
 const now=Date.now(),cached=responseCache.get(url);
 if(cached&&(cached.promise||now-cached.time<CACHE_TTL))return cached.promise||Promise.resolve(cached.data);
 const entry={time:now,promise:null,data:null};
 entry.promise=fetch(url).then(r=>{if(!r.ok)throw Error(`API request failed (${r.status})`);return r.json()}).then(data=>{if(data?.ok===false)throw Error(data.error||'API returned an error');entry.data=data;entry.time=Date.now();entry.promise=null;return data;}).catch(error=>{if(responseCache.get(url)===entry)responseCache.delete(url);throw error;});
 responseCache.set(url,entry);return entry.promise;
}
