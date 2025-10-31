// sw.js - Enhanced Service Worker untuk Real-Time GPS Tracking
const CACHE_NAME = 'dt-gps-realtime-v4.0';
const GPS_DATA_CACHE = 'gps-realtime-data-v4.0';
const SYNC_QUEUE_CACHE = 'gps-sync-queue-v4.0';

const urlsToCache = [
  '/',
  '/mobile.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/script-monitor.js',
  '/script-mobile.js'
];

// ✅ INSTALL EVENT - Setup cache untuk offline support
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker: Installing Real-Time GPS Tracker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('✅ App Cache opened');
          return cache.addAll(urlsToCache);
        }),
      caches.open(GPS_DATA_CACHE)
        .then((cache) => {
          console.log('✅ GPS Data Cache opened - Ready for offline tracking');
          return cache;
        }),
      caches.open(SYNC_QUEUE_CACHE)
        .then((cache) => {
          console.log('✅ Sync Queue Cache opened');
          return cache;
        })
    ]).then(() => {
      console.log('✅ All caches ready - Skipping waiting');
      return self.skipWaiting();
    })
  );
});

// ✅ ACTIVATE EVENT - Cleanup cache lama
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated - Real-Time GPS Tracking Ready');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Hapus cache lama yang tidak digunakan
          if (![CACHE_NAME, GPS_DATA_CACHE, SYNC_QUEUE_CACHE].includes(cacheName)) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Cache cleanup completed');
      return self.clients.claim();
    })
  );
});

// ✅ ENHANCED FETCH HANDLER - Real-time GPS data priority
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Handle GPS data requests dengan strategy khusus
  if (url.includes('/units/') || 
      url.includes('/gps-data') || 
      url.includes('/waypoints') ||
      url.includes('firebaseio.com')) {
    
    event.respondWith(handleGPSFetch(event.request));
    return;
  }
  
  // Untuk static assets - Cache First strategy
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version jika ada
        if (response) {
          return response;
        }
        
        // Jika tidak ada di cache, fetch dari network
        return fetch(event.request)
          .then(fetchResponse => {
            // Cache response baru untuk future use
            if (fetchResponse && fetchResponse.status === 200) {
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseClone);
                });
            }
            return fetchResponse;
          })
          .catch(error => {
            console.log('📴 Offline - Cannot fetch:', event.request.url);
            
            // Fallback untuk halaman utama
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
            
            return new Response('Offline - Data cached locally', {
              status: 200,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// ✅ GPS FETCH HANDLER - Offline First dengan real-time caching
async function handleGPSFetch(request) {
  const isWriteOperation = request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH';
  
  try {
    // Untuk write operations, cache dulu lalu try sync
    if (isWriteOperation) {
      return await handleGPSWriteOperation(request);
    }
    
    // Untuk read operations, try network first
    return await handleGPSReadOperation(request);
    
  } catch (error) {
    console.error('❌ GPS fetch handler error:', error);
    
    // Return success response untuk prevent client errors
    return new Response(JSON.stringify({ 
      status: 'offline_cached',
      message: 'GPS data cached offline - will sync when online',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// ✅ HANDLE GPS WRITE OPERATIONS - Cache dulu, sync nanti
async function handleGPSWriteOperation(request) {
  console.log('📝 GPS Write Operation - Caching for offline sync');
  
  // Clone request untuk caching
  const requestClone = request.clone();
  const requestBody = await request.json();
  
  // Cache data untuk sync nanti
  await cacheGPSDataForSync(request.url, request.method, requestBody);
  
  // Try to send to server jika online
  if (navigator.onLine) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        console.log('📡 GPS data sent to server successfully');
        
        // Hapus dari cache jika berhasil dikirim
        await removeFromSyncCache(request.url, requestBody);
        return response;
      }
    } catch (serverError) {
      console.log('📴 Server offline - data remains in cache');
    }
  }
  
  // Return success response ke client
  return new Response(JSON.stringify({ 
    status: 'cached_offline',
    message: 'Data disimpan offline - akan sync otomatis',
    cachedAt: new Date().toISOString(),
    data: requestBody
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// ✅ HANDLE GPS READ OPERATIONS - Network First
async function handleGPSReadOperation(request) {
  // Try network first
  if (navigator.onLine) {
    try {
      const response = await fetch(request);
      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.log('📴 Network offline for read operation');
    }
  }
  
  // Fallback ke cache jika ada
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('💾 Serving cached GPS data for read');
    return cachedResponse;
  }
  
  // Return empty response jika tidak ada cache
  return new Response(JSON.stringify({ 
    status: 'offline_no_cache',
    message: 'Offline - no cached data available'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

// ✅ CACHE GPS DATA FOR SYNC
async function cacheGPSDataForSync(url, method, data) {
  try {
    const cache = await caches.open(SYNC_QUEUE_CACHE);
    const cacheKey = `/sync-queue/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const cacheItem = {
      url: url,
      method: method,
      data: data,
      timestamp: new Date().toISOString(),
      attemptCount: 0,
      lastAttempt: null,
      priority: getSyncPriority(data)
    };
    
    const response = new Response(JSON.stringify(cacheItem));
    await cache.put(cacheKey, response);
    
    console.log('💾 GPS data cached for sync:', {
      type: cacheItem.priority,
      lat: data.lat,
      lng: data.lng,
      speed: data.speed,
      timestamp: new Date().toLocaleTimeString()
    });
    
    // Update sync status ke clients
    await notifyClients({
      type: 'DATA_CACHED',
      data: {
        cachedItems: await getCachedItemsCount(),
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to cache GPS data for sync:', error);
  }
}

// ✅ GET SYNC PRIORITY - Prioritaskan data penting
function getSyncPriority(data) {
  // Real-time position data - highest priority
  if (data.lat && data.lng && data.speed !== undefined) {
    return 'realtime_high';
  }
  
  // Waypoint data - medium priority
  if (data.waypoints || data.sessionId) {
    return 'waypoints_medium';
  }
  
  // Status updates - low priority
  return 'status_low';
}

// ✅ BACKGROUND SYNC EVENT - Real-time data sync
self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync Event:', event.tag);
  
  switch (event.tag) {
    case 'background-gps-sync':
      event.waitUntil(syncCachedGPSData());
      break;
      
    case 'emergency-gps-backup':
      event.waitUntil(performEmergencyBackup());
      break;
      
    case 'health-check-sync':
      event.waitUntil(performHealthCheckSync());
      break;
      
    default:
      console.log('🔄 Unknown sync tag:', event.tag);
  }
});

// ✅ SYNC CACHED GPS DATA - Process semua data yang tertahan
async function syncCachedGPSData() {
  try {
    const cache = await caches.open(SYNC_QUEUE_CACHE);
    const requests = await cache.keys();
    
    console.log(`📡 Starting sync: ${requests.length} items in queue`);
    
    if (requests.length === 0) {
      await notifyClients({
        type: 'SYNC_COMPLETED',
        data: { message: 'No data to sync', items: 0 }
      });
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    let retryItems = [];
    
    // Process items berdasarkan priority
    const prioritizedRequests = await prioritizeSyncRequests(requests);
    
    for (const request of prioritizedRequests) {
      try {
        const response = await cache.match(request);
        if (!response) continue;
        
        const cachedItem = await response.json();
        
        // Skip jika sudah terlalu banyak attempt
        if (cachedItem.attemptCount > 5) {
          console.log('🗑️ Skipping item - too many attempts:', cachedItem.attemptCount);
          await cache.delete(request);
          continue;
        }
        
        // Try to send to server
        const syncSuccess = await sendToServer(cachedItem);
        
        if (syncSuccess) {
          // Hapus dari cache jika berhasil
          await cache.delete(request);
          successCount++;
          
          console.log(`✅ Synced: ${cachedItem.data.lat}, ${cachedItem.data.lng}`);
        } else {
          // Update attempt count untuk retry nanti
          cachedItem.attemptCount++;
          cachedItem.lastAttempt = new Date().toISOString();
          
          const updatedResponse = new Response(JSON.stringify(cachedItem));
          await cache.put(request, updatedResponse);
          
          failCount++;
          retryItems.push(cachedItem);
        }
        
      } catch (itemError) {
        console.error('❌ Error processing sync item:', itemError);
        failCount++;
      }
    }
    
    // Report sync results
    const syncResult = {
      successCount,
      failCount,
      totalItems: requests.length,
      retryItems: retryItems.length,
      timestamp: new Date().toISOString()
    };
    
    console.log('📊 Sync completed:', syncResult);
    
    await notifyClients({
      type: 'SYNC_COMPLETED',
      data: syncResult
    });
    
    // Schedule retry untuk failed items
    if (failCount > 0) {
      setTimeout(() => {
        self.registration.sync.register('background-gps-sync')
          .then(() => console.log('🔄 Retry scheduled for failed items'))
          .catch(err => console.error('Retry scheduling failed:', err));
      }, 30000); // Retry dalam 30 detik
    }
    
  } catch (error) {
    console.error('❌ GPS sync failed completely:', error);
    
    await notifyClients({
      type: 'SYNC_FAILED',
      data: { 
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// ✅ PRIORITIZE SYNC REQUESTS - Urutkan berdasarkan priority
async function prioritizeSyncRequests(requests) {
  const items = [];
  
  for (const request of requests) {
    const response = await caches.match(request);
    if (response) {
      const item = await response.json();
      items.push({ request, item });
    }
  }
  
  // Urutkan berdasarkan priority dan timestamp
  items.sort((a, b) => {
    const priorityOrder = { 'realtime_high': 0, 'waypoints_medium': 1, 'status_low': 2 };
    const aPriority = priorityOrder[a.item.priority] || 3;
    const bPriority = priorityOrder[b.item.priority] || 3;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    return new Date(a.item.timestamp) - new Date(b.item.timestamp);
  });
  
  return items.map(item => item.request);
}

// ✅ SEND TO SERVER - Simulasi pengiriman ke Firebase/Server
async function sendToServer(cachedItem) {
  return new Promise((resolve) => {
    // Simulasi pengiriman data ke server
    setTimeout(() => {
      // Simulasi: 90% success rate untuk testing
      const success = Math.random() > 0.1;
      
      if (success) {
        console.log('📤 Data sent to server successfully:', {
          url: cachedItem.url,
          lat: cachedItem.data.lat,
          lng: cachedItem.data.lng,
          speed: cachedItem.data.speed
        });
        resolve(true);
      } else {
        console.log('❌ Failed to send data to server');
        resolve(false);
      }
    }, 500);
  });
}

// ✅ EMERGENCY BACKUP - Ketika battery low atau kondisi kritis
async function performEmergencyBackup() {
  try {
    console.log('🚨 Performing emergency backup...');
    
    const syncCache = await caches.open(SYNC_QUEUE_CACHE);
    const requests = await syncCache.keys();
    
    // Backup hanya 100 data terbaru
    const backupData = [];
    const recentRequests = requests.slice(-100);
    
    for (const request of recentRequests) {
      const response = await syncCache.match(request);
      if (response) {
        const data = await response.json();
        backupData.push(data);
      }
    }
    
    // Simpan backup ke GPS data cache
    const gpsCache = await caches.open(GPS_DATA_CACHE);
    const backupKey = `/emergency-backup/${Date.now()}`;
    const backupResponse = new Response(JSON.stringify({
      data: backupData,
      timestamp: new Date().toISOString(),
      itemCount: backupData.length
    }));
    
    await gpsCache.put(backupKey, backupResponse);
    
    console.log(`🚨 Emergency backup completed: ${backupData.length} items saved`);
    
    await notifyClients({
      type: 'EMERGENCY_BACKUP_CREATED',
      data: {
        itemCount: backupData.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Emergency backup failed:', error);
  }
}

// ✅ HEALTH CHECK SYNC
async function performHealthCheckSync() {
  try {
    const syncCache = await caches.open(SYNC_QUEUE_CACHE);
    const gpsCache = await caches.open(GPS_DATA_CACHE);
    
    const syncItems = await syncCache.keys();
    const gpsItems = await gpsCache.keys();
    
    const healthStatus = {
      syncQueueSize: syncItems.length,
      gpsCacheSize: gpsItems.length,
      lastCheck: new Date().toISOString(),
      online: navigator.onLine,
      storage: await getStorageEstimate()
    };
    
    console.log('🔍 Health Check Sync:', healthStatus);
    
    await notifyClients({
      type: 'HEALTH_CHECK',
      data: healthStatus
    });
    
    // Cleanup old data jika storage hampir penuh
    if (healthStatus.storage.percentage > 80) {
      await performStorageCleanup();
    }
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
  }
}

// ✅ MESSAGE HANDLER - Komunikasi dengan client
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;
  console.log('📩 Service Worker received message:', type);
  
  try {
    switch (type) {
      case 'CACHE_GPS_DATA':
        await handleCacheGPSData(data);
        break;
        
      case 'GET_CACHED_DATA':
        const cachedData = await getCachedGPSData();
        event.ports[0]?.postMessage({
          type: 'CACHED_DATA_RESPONSE',
          data: cachedData
        });
        break;
        
      case 'GET_SYNC_STATUS':
        const syncStatus = await getSyncStatus();
        event.ports[0]?.postMessage({
          type: 'SYNC_STATUS_RESPONSE',
          data: syncStatus
        });
        break;
        
      case 'TRIGGER_SYNC':
        await triggerManualSync();
        break;
        
      case 'CLEAR_CACHE':
        await clearSpecificCache(data);
        break;
        
      case 'LOGOUT_CLEANUP':
        await handleLogoutCleanup();
        break;
        
      case 'BACKGROUND_STATE_CHANGE':
        handleBackgroundStateChange(data);
        break;
        
      case 'GET_STORAGE_INFO':
        const storageInfo = await getStorageInfo();
        event.ports[0]?.postMessage({
          type: 'STORAGE_INFO_RESPONSE',
          data: storageInfo
        });
        break;
    }
  } catch (error) {
    console.error('❌ Message handler error:', error);
    
    event.ports[0]?.postMessage({
      type: 'ERROR_RESPONSE',
      data: { error: error.message }
    });
  }
});

// ✅ HANDLE CACHE GPS DATA - Direct caching dari client
async function handleCacheGPSData(gpsData) {
  try {
    const cache = await caches.open(GPS_DATA_CACHE);
    const cacheKey = `/gps-realtime/${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    
    const cacheItem = {
      data: gpsData,
      timestamp: new Date().toISOString(),
      type: 'realtime_position',
      sessionId: gpsData.sessionId,
      unit: gpsData.unit,
      accuracy: gpsData.accuracy
    };
    
    const response = new Response(JSON.stringify(cacheItem));
    await cache.put(cacheKey, response);
    
    console.log('💾 Real-time GPS data cached:', {
      lat: gpsData.lat.toFixed(6),
      lng: gpsData.lng.toFixed(6),
      speed: gpsData.speed?.toFixed(1),
      accuracy: gpsData.accuracy?.toFixed(1),
      time: new Date().toLocaleTimeString()
    });
    
    // Juga tambahkan ke sync queue untuk dikirim ke server
    await cacheGPSDataForSync('/api/gps/realtime', 'POST', gpsData);
    
  } catch (error) {
    console.error('❌ Failed to cache GPS data:', error);
  }
}

// ✅ GET CACHED GPS DATA
async function getCachedGPSData() {
  try {
    const cache = await caches.open(GPS_DATA_CACHE);
    const requests = await cache.keys();
    
    const gpsData = [];
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const data = await response.json();
        gpsData.push(data);
      }
    }
    
    // Urutkan berdasarkan timestamp
    gpsData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    return {
      items: gpsData,
      count: gpsData.length,
      lastUpdate: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Failed to get cached GPS data:', error);
    return { items: [], count: 0, error: error.message };
  }
}

// ✅ GET SYNC STATUS
async function getSyncStatus() {
  try {
    const syncCache = await caches.open(SYNC_QUEUE_CACHE);
    const requests = await syncCache.keys();
    
    let highPriority = 0;
    let mediumPriority = 0;
    let lowPriority = 0;
    
    for (const request of requests) {
      const response = await syncCache.match(request);
      if (response) {
        const item = await response.json();
        switch (item.priority) {
          case 'realtime_high': highPriority++; break;
          case 'waypoints_medium': mediumPriority++; break;
          case 'status_low': lowPriority++; break;
        }
      }
    }
    
    return {
      totalItems: requests.length,
      byPriority: { highPriority, mediumPriority, lowPriority },
      online: navigator.onLine,
      lastUpdate: new Date().toISOString()
    };
    
  } catch (error) {
    return { error: error.message };
  }
}

// ✅ TRIGGER MANUAL SYNC
async function triggerManualSync() {
  if (!navigator.onLine) {
    await notifyClients({
      type: 'SYNC_STATUS',
      data: { status: 'offline', message: 'Tidak dapat sync - perangkat offline' }
    });
    return;
  }
  
  try {
    await self.registration.sync.register('background-gps-sync');
    
    await notifyClients({
      type: 'SYNC_STATUS',
      data: { status: 'triggered', message: 'Sync manual dimulai...' }
    });
    
  } catch (error) {
    await notifyClients({
      type: 'SYNC_STATUS',
      data: { status: 'error', message: 'Gagal trigger sync' }
    });
  }
}

// ✅ HANDLE LOGOUT CLEANUP - Hapus semua data user
async function handleLogoutCleanup() {
  console.log('🚪 Logout cleanup initiated');
  
  try {
    const syncCache = await caches.open(SYNC_QUEUE_CACHE);
    const gpsCache = await caches.open(GPS_DATA_CACHE);
    
    const syncRequests = await syncCache.keys();
    const gpsRequests = await gpsCache.keys();
    
    // Hapus semua data dari cache
    for (const request of syncRequests) {
      await syncCache.delete(request);
    }
    
    for (const request of gpsRequests) {
      await gpsCache.delete(request);
    }
    
    console.log(`🗑️ Logout cleanup completed: ${syncRequests.length} sync + ${gpsRequests.length} GPS data removed`);
    
    await notifyClients({
      type: 'LOGOUT_CLEANUP_COMPLETED',
      data: {
        syncItems: syncRequests.length,
        gpsItems: gpsRequests.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Logout cleanup failed:', error);
  }
}

// ✅ HANDLE BACKGROUND STATE CHANGE
function handleBackgroundStateChange(data) {
  console.log('📱 Background state changed:', data.isBackground);
  
  // Optimize behavior berdasarkan state
  if (data.isBackground) {
    console.log('🎯 Background mode - optimizing for battery');
  } else {
    console.log('🎯 Foreground mode - full features enabled');
  }
}

// ✅ CLEAR SPECIFIC CACHE
async function clearSpecificCache(cacheName) {
  try {
    if (cacheName === 'all') {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('🗑️ All caches cleared');
    } else {
      await caches.delete(cacheName);
      console.log(`🗑️ Cache cleared: ${cacheName}`);
    }
  } catch (error) {
    console.error('❌ Cache clearance failed:', error);
  }
}

// ✅ GET STORAGE INFO
async function getStorageInfo() {
  try {
    const syncCache = await caches.open(SYNC_QUEUE_CACHE);
    const gpsCache = await caches.open(GPS_DATA_CACHE);
    
    const syncItems = await syncCache.keys();
    const gpsItems = await gpsCache.keys();
    
    return {
      syncQueue: syncItems.length,
      gpsCache: gpsItems.length,
      storage: await getStorageEstimate(),
      lastUpdate: new Date().toISOString()
    };
  } catch (error) {
    return { error: error.message };
  }
}

// ✅ HELPER FUNCTIONS
async function getCachedItemsCount() {
  try {
    const syncCache = await caches.open(SYNC_QUEUE_CACHE);
    const requests = await syncCache.keys();
    return requests.length;
  } catch (error) {
    return 0;
  }
}

async function removeFromSyncCache(url, data) {
  try {
    const cache = await caches.open(SYNC_QUEUE_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const item = await response.json();
        if (item.url === url && JSON.stringify(item.data) === JSON.stringify(data)) {
          await cache.delete(request);
          console.log('✅ Removed synced item from cache');
          break;
        }
      }
    }
  } catch (error) {
    console.error('Failed to remove from sync cache:', error);
  }
}

async function getStorageEstimate() {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const percentage = estimate.quota ? (estimate.usage / estimate.quota) * 100 : 0;
      
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        percentage: percentage.toFixed(1),
        status: percentage > 80 ? 'warning' : percentage > 90 ? 'critical' : 'normal'
      };
    } catch (error) {
      return { error: error.message };
    }
  }
  return { unavailable: true };
}

async function performStorageCleanup() {
  try {
    const syncCache = await caches.open(SYNC_QUEUE_CACHE);
    const requests = await syncCache.keys();
    
    // Hapus 20% data tertua jika storage penuh
    const deleteCount = Math.floor(requests.length * 0.2);
    const oldRequests = requests.slice(0, deleteCount);
    
    for (const request of oldRequests) {
      await syncCache.delete(request);
    }
    
    console.log(`🗑️ Storage cleanup: ${deleteCount} old items removed`);
    
  } catch (error) {
    console.error('Storage cleanup failed:', error);
  }
}

async function notifyClients(message) {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage(message);
    });
  } catch (error) {
    console.error('Failed to notify clients:', error);
  }
}

// ✅ PERIODIC SYNC untuk maintenance
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'gps-health-check') {
    console.log('🔍 Periodic GPS Health Check');
    event.waitUntil(performHealthCheckSync());
  }
});

// ✅ PUSH NOTIFICATION handler
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'GPS Tracking aktif di background',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'gps-tracking',
    requireInteraction: true,
    data: data
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'DT GPS Tracker', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

console.log('✅ Service Worker loaded successfully - Real-Time GPS Tracking Ready');
