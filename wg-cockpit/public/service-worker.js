const CACHE="wg-cockpit-shell-v2";
const APP_BASE=self.location.pathname.replace(/\/service-worker\.js$/,"").replace(/\/$/,"");
const appPath=path=>`${APP_BASE}${path}`||"/";
const isApiPath=pathname=>{const relativePath=APP_BASE&&pathname.startsWith(`${APP_BASE}/`)?pathname.slice(APP_BASE.length):pathname;return relativePath==="/api"||relativePath.startsWith("/api/")};
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll([appPath("/"),appPath("/icon.svg")])));self.skipWaiting()});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))));self.clients.claim()});
self.addEventListener("fetch",event=>{const request=event.request;if(request.method!=="GET")return;const url=new URL(request.url);if(url.origin!==self.location.origin||isApiPath(url.pathname))return;event.respondWith(fetch(request).then(response=>{if(response.ok&&url.pathname.startsWith(APP_BASE||"/")){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response}).catch(()=>caches.match(request).then(cached=>cached||caches.match(appPath("/")))))});
