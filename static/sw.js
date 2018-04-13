var CACHE_NAME = 'microconf-ssker-v1.2'
var INDEX_ITEM_PATH = '/index.html'
var FILES_TO_CACHE = [
    'index.html',
    '/socket.io/socket.io.js',
    'index.css',
    'icons/icon_32.png',
    'icons/icon_64.png',
    'icons/icon_128.png',
    'icons/icon_256.png',
    'icons/icon_512.png',
    'images/hands-512.png',
    'https://necolas.github.io/normalize.css/5.0.0/normalize.css'
]
var INDEX_PATHES = [
    '/'
]

self.addEventListener('install', eventInstall)
self.addEventListener('activate', eventActive)
self.addEventListener('fetch', eventFetch)

function eventInstall(e) {
    console.log('[ServiceWorker] Install')
    e.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            console.log('[ServiceWorker] Caching app shell')
            console.log(FILES_TO_CACHE)
            return cache.addAll(FILES_TO_CACHE)
        })
    )
}

function eventActive(e) {
    console.log('[ServiceWorker] Activate')
    e.waitUntil(
        caches.keys().then(function (keyList) {
            return Promise.all(keyList.map(function (key) {
                if (key !== CACHE_NAME) {
                    console.log('[ServiceWorker] Removing old cache', key)
                    return caches.delete(key)
                }
            }))
        })
    )
    return self.clients.claim()
}

function eventFetch(e) {
    var path = getPathFromRequest(e.request)
    console.log('[Service Worker] Fetch', e.request.url, ', path', path)

    if (isIndexPath(path)) {
        console.log('[Service Worker] For path', path, 'try to match', INDEX_ITEM_PATH)
        matchOrFetchIndex(e)
    } else {
        console.log('[Service Worker] Common handler for', e.request.url)
        matchOrFetch(e)
    }
}

function matchOrFetchIndex(e) {
    e.respondWith(
        caches.match(INDEX_ITEM_PATH).then(function (response) {
            console.log(response)
            return response || fetch(INDEX_ITEM_PATH)
        })
    )
}

function matchOrFetch(e) {
    e.respondWith(
        caches.match(e.request).then(function (response) {
            return response || fetch(e.request)
        })
    )
}

function getPathFromRequest(request) {
    return request.url.substr(self.location.origin.length)
}

function isIndexPath(path) {
    return !!(
        INDEX_PATHES.filter(function (i) { return i === path }).length
    )
}
