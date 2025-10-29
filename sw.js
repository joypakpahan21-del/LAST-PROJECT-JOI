// sw.js - Enhanced Service Worker untuk GPS Tracking
const CACHE_NAME = 'dt-gps-tracker-v2.1';
const urlsToCache = [
  '/',
  '/mobile.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install Event
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ Service Worker: Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('❌ Service Worker: Cache failed', error);
      })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - Enhanced untuk GPS data
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Handle GPS data requests khusus
  if (event.request.url.includes('/gps-data') || 
      event.request.url.includes('/waypoints')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseClone);
            });
          return response;
        })
        .catch(() => {
          // Return cached version jika offline
          return caches.match(event.request);
        })
    );
    return;
  }

  // Untuk request lainnya
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version atau fetch baru
        return response || fetch(event.request)
          .then(fetchResponse => {
            // Cache response yang baru
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return fetchResponse;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // Fallback untuk halaman utama
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Background Sync untuk GPS data
self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync:', event.tag);
  
  if (event.tag === 'background-gps-sync') {
    event.waitUntil(
      syncGPSData()
        .then(() => {
          console.log('✅ Background sync completed');
          // Kirim notifikasi ke client
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNC_STATUS',
                data: { status: 'completed' }
              });
            });
          });
        })
        .catch(error => {
          console.error('❌ Background sync failed:', error);
        })
    );
  }
});

// Periodic Sync untuk health check
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'periodic-gps-health-check') {
    console.log('🔍 Periodic GPS Health Check');
    event.waitUntil(performHealthCheck());
  }
});

// Fungsi untuk sync GPS data
async function syncGPSData() {
  try {
    // Ambil data dari cache
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const gpsRequests = keys.filter(request => 
      request.url.includes('/gps-data') || 
      request.url.includes('/waypoints')
    );

    console.log(`📡 Syncing ${gpsRequests.length} GPS data items...`);

    for (const request of gpsRequests) {
      try {
        const response = await cache.match(request);
        if (response) {
          const data = await response.json();
          // Simulasi pengiriman data ke server
          await sendToServer(data);
          // Hapus dari cache setelah berhasil sync
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Error syncing GPS data:', error);
      }
    }
  } catch (error) {
    console.error('Sync GPS data failed:', error);
    throw error;
  }
}

// Simulasi pengiriman ke server
async function sendToServer(data) {
  // Di sini Anda akan mengirim data ke Firebase atau server Anda
  // Untuk sekarang kita simulasi dengan timeout
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('📤 Data sent to server:', data);
      resolve();
    }, 1000);
  });
}

// Health check function
async function performHealthCheck() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const gpsDataCount = keys.filter(request => 
      request.url.includes('/gps-data')
    ).length;

    console.log(`🔍 Health Check: ${gpsDataCount} GPS data items in cache`);

    // Kirim status health ke clients
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'HEALTH_CHECK_RESPONSE',
          data: {
            cacheSize: gpsDataCount,
            lastCheck: new Date().toISOString(),
            status: 'healthy'
          }
        });
      });
    });

  } catch (error) {
    console.error('Health check failed:', error);
  }
}

// Message handler dari client
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CACHE_GPS_DATA':
      cacheGPSData(data);
      break;
      
    case 'GET_CACHED_DATA':
      event.ports[0].postMessage({
        type: 'CACHED_DATA_RESPONSE',
        data: getCachedGPSData()
      });
      break;
      
    case 'CLEAR_CACHE':
      clearOldCache();
      break;
  }
});

// Cache GPS data
async function cacheGPSData(gpsData) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const url = `/gps-data/${Date.now()}`;
    const response = new Response(JSON.stringify(gpsData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put(url, response);
    console.log('💾 GPS data cached:', gpsData);
  } catch (error) {
    console.error('Failed to cache GPS data:', error);
  }
}

// Get cached GPS data
async function getCachedGPSData() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    const gpsRequests = keys.filter(request => 
      request.url.includes('/gps-data')
    );
    
    const gpsData = [];
    for (const request of gpsRequests) {
      const response = await cache.match(request);
      if (response) {
        const data = await response.json();
        gpsData.push(data);
      }
    }
    
    return gpsData;
  } catch (error) {
    console.error('Failed to get cached GPS data:', error);
    return [];
  }
}

// Clear old cache
async function clearOldCache() {
  try {
    const cacheNames = await caches.keys();
    const deletions = cacheNames.map(cacheName => {
      if (cacheName !== CACHE_NAME) {
        return caches.delete(cacheName);
      }
    });
    await Promise.all(deletions);
    console.log('🗑️ Old cache cleared');
  } catch (error) {
    console.error('Failed to clear old cache:', error);
  }
}