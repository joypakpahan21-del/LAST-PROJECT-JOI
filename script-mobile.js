// ==== FIREBASE CONFIG ====
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBMiER_5b51IEEoxivkCliRC0WID1f-yzk",
    authDomain: "joi-gps-tracker.firebaseapp.com",
    databaseURL: "https://joi-gps-tracker-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "joi-gps-tracker",
    storageBucket: "joi-gps-tracker.firebasestorage.app",
    messagingSenderId: "216572191895",
    appId: "1:216572191895:web:a4fef1794daf200a2775d2"
};

// Initialize Firebase
firebase.initializeApp(FIREBASE_CONFIG);
const database = firebase.database();

// ✅ CIRCULAR BUFFER IMPLEMENTATION
class CircularBuffer {
    constructor(capacity) {
        this.capacity = capacity;
        this.buffer = new Array(capacity);
        this.head = 0;
        this.tail = 0;
        this._count = 0;
        this.isFull = false;
    }

    push(item) {
        this.buffer[this.tail] = item;
        this.tail = (this.tail + 1) % this.capacity;
        
        if (this.isFull) {
            this.head = (this.head + 1) % this.capacity;
        } else {
            this._count++;
            if (this._count === this.capacity) {
                this.isFull = true;
            }
        }
    }

    getAll() {
        if (this._count === 0) return [];
        
        const result = [];
        if (this.isFull) {
            for (let i = 0; i < this.capacity; i++) {
                const index = (this.head + i) % this.capacity;
                result.push(this.buffer[index]);
            }
        } else {
            for (let i = 0; i < this._count; i++) {
                result.push(this.buffer[i]);
            }
        }
        return result;
    }

    getUnsynced() {
        return this.getAll().filter(wp => !wp.synced);
    }

    clear() {
        this.head = 0;
        this.tail = 0;
        this._count = 0;
        this.isFull = false;
        this.buffer = new Array(this.capacity);
    }

    get count() {
        return this.isFull ? this.capacity : this._count;
    }
}

// ✅ ENHANCED STORAGE MANAGER WITH BACKGROUND SUPPORT
class EnhancedStorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            WAYPOINTS: 'enhanced_gps_waypoints',
            SYNC_STATUS: 'enhanced_sync_status',
            SESSION_DATA: 'enhanced_session_data',
            PERSISTED_SESSION: 'dt_gps_persisted_session',
            BACKGROUND_DATA: 'dt_gps_backup_data'
        };
    }

    saveWaypoint(waypoint) {
        try {
            const existing = this.loadAllWaypoints();
            
            // Smart storage management
            if (existing.length >= 61200) {
                const removeCount = Math.floor(existing.length * 0.1);
                existing.splice(0, removeCount);
            }
            
            existing.push(waypoint);
            this.saveToStorage(existing);
            
            this.updateSyncStatus({
                totalWaypoints: existing.length,
                unsyncedCount: existing.filter(w => !w.synced).length,
                lastSave: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Failed to save waypoint:', error);
            this.handleStorageError(error);
        }
    }

    loadAllWaypoints() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.WAYPOINTS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Failed to load waypoints:', error);
            return [];
        }
    }

    loadUnsyncedWaypoints() {
        const all = this.loadAllWaypoints();
        return all.filter(waypoint => !waypoint.synced);
    }

    markWaypointsAsSynced(waypointIds) {
        try {
            const all = this.loadAllWaypoints();
            const updated = all.map(waypoint => {
                if (waypointIds.includes(waypoint.id)) {
                    return { ...waypoint, synced: true };
                }
                return waypoint;
            });
            
            this.saveToStorage(updated);
            
            this.updateSyncStatus({
                totalWaypoints: updated.length,
                unsyncedCount: updated.filter(w => !w.synced).length,
                lastSync: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error marking waypoints as synced:', error);
        }
    }

    saveToStorage(waypoints) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.WAYPOINTS, JSON.stringify(waypoints));
        } catch (error) {
            console.error('Error saving to storage:', error);
            this.handleStorageError(error);
        }
    }

    updateSyncStatus(status) {
        try {
            const existing = this.getSyncStatus();
            localStorage.setItem(this.STORAGE_KEYS.SYNC_STATUS, JSON.stringify({
                ...existing, ...status, updatedAt: new Date().toISOString()
            }));
        } catch (error) {
            console.error('Error updating sync status:', error);
        }
    }

    getSyncStatus() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.SYNC_STATUS);
            return data ? JSON.parse(data) : {
                totalWaypoints: 0, unsyncedCount: 0, lastSync: null, lastSave: null
            };
        } catch (error) {
            return { totalWaypoints: 0, unsyncedCount: 0, lastSync: null, lastSave: null };
        }
    }

    // ✅ BACKGROUND SESSION PERSISTENCE
    persistSession(sessionData) {
        try {
            if (!sessionData) return;
            
            const sessionToSave = {
                ...sessionData,
                persistedAt: new Date().toISOString(),
                appState: document.hidden ? 'background' : 'foreground'
            };
            
            localStorage.setItem(this.STORAGE_KEYS.PERSISTED_SESSION, JSON.stringify(sessionToSave));
        } catch (error) {
            console.error('Error persisting session:', error);
        }
    }

    loadPersistedSession() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.PERSISTED_SESSION);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading persisted session:', error);
            return null;
        }
    }

    clearPersistedSession() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.PERSISTED_SESSION);
        } catch (error) {
            console.error('Error clearing persisted session:', error);
        }
    }

    // ✅ BACKGROUND DATA BACKUP
    backupBackgroundData(backupData) {
        try {
            const backup = {
                ...backupData,
                backupTimestamp: new Date().toISOString(),
                waypointCount: backupData.waypoints?.length || 0
            };
            
            localStorage.setItem(this.STORAGE_KEYS.BACKGROUND_DATA, JSON.stringify(backup));
        } catch (error) {
            console.error('Error backing up background data:', error);
        }
    }

    loadBackgroundBackup() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.BACKGROUND_DATA);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading background backup:', error);
            return null;
        }
    }

    clearBackgroundBackup() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.BACKGROUND_DATA);
        } catch (error) {
            console.error('Error clearing background backup:', error);
        }
    }

    handleStorageError(error) {
        if (error.name === 'QuotaExceededError' || error.code === 22) {
            console.warn('Storage quota exceeded, clearing old data...');
            const allWaypoints = this.loadAllWaypoints();
            const removeCount = Math.floor(allWaypoints.length * 0.25);
            const remaining = allWaypoints.slice(removeCount);
            this.saveToStorage(remaining);
            
            this.updateSyncStatus({
                totalWaypoints: remaining.length,
                unsyncedCount: remaining.filter(w => !w.synced).length,
                lastSave: new Date().toISOString()
            });
        }
    }
}

// ✅ BACKGROUND TRACKING MANAGER
class BackgroundTrackingManager {
    constructor(logger) {
        this.logger = logger;
        this.isActive = false;
        this.backgroundWatchId = null;
        this.backgroundInterval = null;
        this.isInBackground = false;
        this.lastBackgroundPosition = null;
        this.backgroundUpdateCount = 0;
        this.backgroundWaypoints = [];
    }

    start() {
        if (this.isActive) return;
        
        console.log('🔄 Starting background tracking service...');
        this.isActive = true;
        
        this.setupVisibilityHandlers();
        this.startBackgroundPositionWatch();
        
        // Background processing interval (optimized for battery)
        this.backgroundInterval = setInterval(() => {
            this.processBackgroundData();
        }, 15000); // 15 seconds in background
        
        this.updateBackgroundIndicator();
    }

    setupVisibilityHandlers() {
        document.addEventListener('visibilitychange', () => {
            this.isInBackground = document.hidden;
            
            if (this.isInBackground) {
                this.onEnterBackground();
            } else {
                this.onEnterForeground();
            }
            
            this.updateBackgroundIndicator();
        });

        window.addEventListener('pagehide', () => {
            this.isInBackground = true;
            this.onEnterBackground();
        });

        window.addEventListener('pageshow', () => {
            this.isInBackground = false;
            this.onEnterForeground();
        });

        window.addEventListener('beforeunload', () => {
            if (this.logger.driverData) {
                this.logger.persistSession();
            }
        });
    }

    startBackgroundPositionWatch() {
        if (!navigator.geolocation) return;

        const backgroundOptions = {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 60000
        };

        if (this.backgroundWatchId) {
            navigator.geolocation.clearWatch(this.backgroundWatchId);
        }

        this.backgroundWatchId = navigator.geolocation.watchPosition(
            (position) => this.handleBackgroundPosition(position),
            (error) => this.handleBackgroundError(error),
            backgroundOptions
        );
    }

    handleBackgroundPosition(position) {
        this.lastBackgroundPosition = position;
        this.backgroundUpdateCount++;
        
        if (!this.isInBackground || this.isSignificantMovement(position)) {
            this.processBackgroundPosition(position);
        }
    }

    isSignificantMovement(newPosition) {
        if (!this.lastBackgroundPosition) return true;
        
        const distance = this.calculateDistance(
            this.lastBackgroundPosition.coords.latitude,
            this.lastBackgroundPosition.coords.longitude,
            newPosition.coords.latitude,
            newPosition.coords.longitude
        );
        
        return distance > 0.02; // 20 meters
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    processBackgroundPosition(position) {
        if (!this.logger.driverData || !this.logger.isTracking) return;

        const accuracy = position.coords.accuracy;
        
        // Lenient accuracy check for background
        if (accuracy > 200) {
            return;
        }

        const waypoint = {
            id: `wp_bg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            lat: parseFloat(position.coords.latitude.toFixed(6)),
            lng: parseFloat(position.coords.longitude.toFixed(6)),
            accuracy: parseFloat(accuracy.toFixed(1)),
            speed: position.coords.speed ? parseFloat((position.coords.speed * 3.6).toFixed(1)) : 0,
            bearing: position.coords.heading ? parseFloat(position.coords.heading.toFixed(0)) : null,
            timestamp: new Date().toISOString(),
            timeDisplay: new Date().toLocaleTimeString('id-ID'),
            sessionId: this.logger.driverData.sessionId,
            unit: this.logger.driverData.unit,
            driver: this.logger.driverData.name,
            synced: false,
            isOnline: this.logger.isOnline,
            lowAccuracy: accuracy > 50,
            isSimulated: false,
            isBackground: true,
            batteryLevel: this.logger.getBatteryLevel()
        };

        this.logger.processWaypoint(waypoint);
        
        this.logger.lastPosition = {
            lat: waypoint.lat,
            lng: waypoint.lng,
            speed: waypoint.speed,
            accuracy: waypoint.accuracy,
            bearing: waypoint.bearing,
            timestamp: new Date()
        };

        // Persist session in background
        this.logger.persistSession();
    }

    processBackgroundData() {
        if (!this.isInBackground || !this.lastBackgroundPosition) return;
        
        this.processBackgroundPosition(this.lastBackgroundPosition);
        
        // Send to Firebase periodically in background
        if (this.backgroundUpdateCount % 3 === 0 && this.logger.lastPosition) {
            this.logger.sendToFirebase();
        }
    }

    handleBackgroundError(error) {
        console.warn('Background GPS Error:', error);
    }

    onEnterBackground() {
        console.log('🎯 Background mode activated');
        this.updateBackgroundIndicator(true);
        
        // Backup current data
        if (this.logger.driverData) {
            this.logger.storageManager.backupBackgroundData({
                driverData: this.logger.driverData,
                trackingData: {
                    totalDistance: this.logger.totalDistance,
                    dataPoints: this.logger.dataPoints,
                    sessionStartTime: this.logger.sessionStartTime,
                    journeyStatus: this.logger.journeyStatus
                },
                waypoints: this.logger.waypointBuffer.getAll().slice(-100) // Last 100 waypoints
            });
        }
    }

    onEnterForeground() {
        console.log('🎯 Foreground mode activated');
        this.updateBackgroundIndicator(false);
        
        // Restore from backup if needed
        this.restoreFromBackup();
        
        if (this.logger.isOnline) {
            setTimeout(() => {
                this.logger.syncWaypointsToServer();
                this.logger.offlineQueue.processQueue();
            }, 2000);
        }
    }

    restoreFromBackup() {
        const backup = this.logger.storageManager.loadBackgroundBackup();
        if (backup && backup.driverData) {
            console.log('📂 Restoring from background backup...');
            // Add backup waypoints to buffer
            if (backup.waypoints && backup.waypoints.length > 0) {
                backup.waypoints.forEach(waypoint => {
                    if (!waypoint.synced) {
                        this.logger.waypointBuffer.push(waypoint);
                        this.logger.unsyncedWaypoints.add(waypoint.id);
                    }
                });
            }
            this.logger.storageManager.clearBackgroundBackup();
        }
    }

    updateBackgroundIndicator(show = false) {
        const indicator = document.getElementById('backgroundIndicator');
        if (indicator) {
            if (show && this.isInBackground) {
                indicator.style.display = 'block';
                indicator.textContent = '🔄 Background Tracking Active';
            } else {
                indicator.style.display = 'none';
            }
        }
    }

    stop() {
        console.log('🛑 Stopping background tracking...');
        this.isActive = false;
        
        if (this.backgroundWatchId) {
            navigator.geolocation.clearWatch(this.backgroundWatchId);
            this.backgroundWatchId = null;
        }
        
        if (this.backgroundInterval) {
            clearInterval(this.backgroundInterval);
            this.backgroundInterval = null;
        }
        
        this.lastBackgroundPosition = null;
        this.backgroundUpdateCount = 0;
        
        this.updateBackgroundIndicator(false);
    }
}

// ✅ OFFLINE QUEUE MANAGER
class OfflineQueueManager {
    constructor() {
        this.queue = [];
        this.isOnline = navigator.onLine;
        this.maxQueueSize = 1000;
    }

    addToQueue(gpsData) {
        if (this.queue.length >= this.maxQueueSize) {
            const removeCount = Math.floor(this.maxQueueSize * 0.1);
            this.queue.splice(0, removeCount);
        }
        
        this.queue.push({
            ...gpsData,
            queueTimestamp: new Date().toISOString(),
            queueId: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
    }

    getQueueSize() {
        return this.queue.length;
    }

    async processQueue() {
        if (this.queue.length === 0 || !this.isOnline) return;

        console.log(`🔄 Processing ${this.queue.length} queued items...`);
        
        const successItems = [];
        const failedItems = [];

        for (const item of this.queue) {
            try {
                await this.sendQueuedData(item);
                successItems.push(item);
            } catch (error) {
                console.error('Failed to send queued data:', error);
                failedItems.push(item);
                
                if (failedItems.length > 5) {
                    break;
                }
            }
        }

        this.queue = failedItems;

        console.log(`✅ Sent ${successItems.length} items, ${failedItems.length} failed`);
        
        if (successItems.length > 0 && window.dtLogger) {
            window.dtLogger.addLog(`📡 Sync offline: ${successItems.length} data terkirim`, 'success');
        }
    }

    async sendQueuedData(queuedData) {
        if (!window.dtLogger?.firebaseRef) {
            throw new Error('No Firebase reference');
        }

        const { queueTimestamp, queueId, ...cleanData } = queuedData;
        await window.dtLogger.firebaseRef.set(cleanData);
    }
}

// ✅ ENHANCED MOBILE GPS LOGGER WITH BACKGROUND SUPPORT
class DTGPSLogger {
    constructor() {
        this.waypointConfig = {
            collectionInterval: 1000,
            maxWaypoints: 61200,
            batchSize: 100,
            syncInterval: 30000,
        };

        this.waypointBuffer = new CircularBuffer(this.waypointConfig.maxWaypoints);
        this.unsyncedWaypoints = new Set();
        this.storageManager = new EnhancedStorageManager();
        
        this.driverData = null;
        this.watchId = null;
        this.isTracking = false;
        this.sendInterval = null;
        this.sessionStartTime = null;
        this.totalDistance = 0;
        this.lastPosition = null;
        this.dataPoints = 0;
        this.isOnline = false;
        this.journeyStatus = 'ready';
        this.firebaseRef = null;
        
        this.lastUpdateTime = null;
        this.currentSpeed = 0;
        this.speedHistory = [];
        
        this.completeHistory = this.loadCompleteHistory();
        
        // ✅ BACKGROUND TRACKING SYSTEM
        this.backgroundManager = new BackgroundTrackingManager(this);
        this.isInBackground = false;
        
        this.chatRef = null;
        this.chatMessages = [];
        this.unreadCount = 0;
        this.isChatOpen = false;
        this.chatInitialized = false;
        this.lastMessageId = null;
        
        this.offlineQueue = new OfflineQueueManager();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTime();
        this.checkNetworkStatus();
        setInterval(() => this.updateTime(), 1000);
        setInterval(() => this.checkNetworkStatus(), 5000);
        
        this.loadUnsyncedWaypoints();
        this.checkPersistedSession();
        
        console.log('🚀 DT GPS Logger initialized - BACKGROUND TRACKING READY');
    }

    // ✅ SESSION PERSISTENCE & RECOVERY
    checkPersistedSession() {
        const persistedSession = this.storageManager.loadPersistedSession();
        if (persistedSession && persistedSession.driverData) {
            console.log('📂 Found persisted session, restoring...');
            
            const persistedAt = new Date(persistedSession.persistedAt);
            const now = new Date();
            const hoursDiff = (now - persistedAt) / (1000 * 60 * 60);
            
            if (hoursDiff < 24) {
                this.restoreSession(persistedSession);
            } else {
                this.storageManager.clearPersistedSession();
            }
        }
    }

    restoreSession(sessionData) {
        if (!sessionData.driverData) return;
        
        try {
            this.driverData = sessionData.driverData;
            this.totalDistance = sessionData.trackingData?.totalDistance || 0;
            this.dataPoints = sessionData.trackingData?.dataPoints || 0;
            this.sessionStartTime = new Date(sessionData.trackingData?.sessionStartTime || new Date());
            this.journeyStatus = sessionData.trackingData?.journeyStatus || 'ready';
            this.currentSpeed = sessionData.trackingData?.currentSpeed || 0;
            
            this.firebaseRef = database.ref('/units/' + this.driverData.unit);
            
            this.showDriverApp();
            this.backgroundManager.start();
            this.startDataTransmission();
            
            this.addLog('✅ Session dipulihkan - tracking berjalan di background', 'success');
            this.addLog(`📊 Data sebelumnya: ${this.totalDistance.toFixed(3)} km, ${this.dataPoints} waypoints`, 'info');
            
        } catch (error) {
            console.error('Error restoring session:', error);
            this.storageManager.clearPersistedSession();
        }
    }

    persistSession() {
        if (!this.driverData) return;
        
        const sessionData = {
            driverData: this.driverData,
            trackingData: {
                totalDistance: this.totalDistance,
                dataPoints: this.dataPoints,
                sessionStartTime: this.sessionStartTime,
                journeyStatus: this.journeyStatus,
                currentSpeed: this.currentSpeed,
                lastPersist: new Date().toISOString()
            }
        };
        
        this.storageManager.persistSession(sessionData);
    }

    clearPersistedSession() {
        this.storageManager.clearPersistedSession();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        document.getElementById('startJourneyBtn')?.addEventListener('click', () => this.startJourney());
        document.getElementById('pauseJourneyBtn')?.addEventListener('click', () => this.pauseJourney());
        document.getElementById('endJourneyBtn')?.addEventListener('click', () => this.endJourney());
        document.getElementById('reportIssueBtn')?.addEventListener('click', () => this.reportIssue());
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());

        // Debug controls
        document.getElementById('sendTestMessageBtn')?.addEventListener('click', () => this.sendTestMessage());
        document.getElementById('forceSyncBtn')?.addEventListener('click', () => this.forceSync());
        document.getElementById('gpsDiagnosticBtn')?.addEventListener('click', () => this.runGPSDiagnostic());

        // Chat buttons
        document.getElementById('chatToggle')?.addEventListener('click', () => this.toggleChat());
        document.getElementById('closeChatBtn')?.addEventListener('click', () => this.toggleChat());
        document.getElementById('sendChatBtn')?.addEventListener('click', () => this.sendChatMessage());
        
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });
        }
        
        // Enhanced visibility handling
        document.addEventListener('visibilitychange', () => {
            this.isInBackground = document.hidden;
            if (this.driverData) {
                this.persistSession();
            }
        });
    }

    // ✅ ENHANCED GPS ACCURACY HANDLING
    startRealGPSTracking() {
        if (!navigator.geolocation) {
            this.addLog('❌ GPS tidak didukung di browser ini', 'error');
            this.showGPSInstructions();
            return;
        }

        console.log('📍 Starting REAL GPS tracking...');
        
        const options = {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        };

        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }

        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.handleRealPositionUpdate(position),
            (error) => this.handleGPSError(error),
            options
        );

        this.isTracking = true;
        this.addLog('📍 GPS Real diaktifkan - Menunggu sinyal satelit...', 'success');
        
        // Request one-time position untuk testing
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const accuracy = pos.coords.accuracy;
                this.addLog(`✅ GPS Aktif - Akurasi: ${accuracy}m`, 'success');
            },
            (err) => {
                this.addLog('⚠️ GPS butuh izin - pastikan izin lokasi diaktifkan', 'warning');
            }
        );
    }

    handleRealPositionUpdate(position) {
        const accuracy = position.coords.accuracy;
        
        // Enhanced accuracy validation
        if (accuracy > 1000) {
            console.warn(`⚠️ Akurasi GPS rendah: ${accuracy}m`);
            this.addLog(`⚠️ Akurasi rendah (${accuracy}m) - cari area terbuka`, 'warning');
        }

        // Enhanced coordinate validation
        if (!this.isValidCoordinate(position.coords.latitude, position.coords.longitude)) {
            console.warn('❌ Invalid coordinates, skipping waypoint');
            return;
        }

        const currentPosition = {
            lat: parseFloat(position.coords.latitude.toFixed(6)),
            lng: parseFloat(position.coords.longitude.toFixed(6)),
            accuracy: parseFloat(accuracy.toFixed(1)),
            speed: position.coords.speed ? parseFloat((position.coords.speed * 3.6).toFixed(1)) : 0,
            bearing: position.coords.heading ? parseFloat(position.coords.heading.toFixed(0)) : null,
            timestamp: new Date(),
            isOnline: this.isOnline
        };

        this.calculateDistanceWithCoordinates(currentPosition);

        this.processWaypoint({
            ...currentPosition,
            id: `wp_real_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sessionId: this.driverData?.sessionId || 'unknown',
            unit: this.driverData?.unit || 'unknown',
            driver: this.driverData?.name || 'unknown',
            synced: false,
            lowAccuracy: accuracy > 50,
            isBackground: this.isInBackground
        });

        this.lastPosition = currentPosition;
        
        // Persist session periodically
        if (this.dataPoints % 10 === 0) {
            this.persistSession();
        }
    }

    // ✅ IMPROVED COORDINATE VALIDATION
    isValidCoordinate(lat, lng) {
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return false;
        }
        if (isNaN(lat) || isNaN(lng)) {
            return false;
        }
        if (lat === 0 && lng === 0) {
            return false;
        }
        return true;
    }

    // ✅ IMPROVED DISTANCE CALCULATION
    calculateDistanceWithCoordinates(currentPosition) {
        if (!this.lastPosition || !this.lastPosition.timestamp) {
            this.lastPosition = currentPosition;
            return 0;
        }

        const distanceKm = this.haversineDistance(
            this.lastPosition.lat, 
            this.lastPosition.lng,
            currentPosition.lat, 
            currentPosition.lng
        );

        const timeDiffMs = currentPosition.timestamp - this.lastPosition.timestamp;
        const timeDiffHours = timeDiffMs / 1000 / 3600;

        if (timeDiffMs < 1000) {
            return 0;
        }

        const maxAccuracy = 500;
        if (currentPosition.accuracy > maxAccuracy) {
            console.warn(`🎯 Akurasi GPS ${currentPosition.accuracy}m terlalu rendah, skip perhitungan`);
            return 0;
        }

        const minDistance = 0.003;
        if (distanceKm < minDistance) {
            return 0;
        }

        let actualSpeed = 0;
        if (timeDiffHours > 0) {
            actualSpeed = distanceKm / timeDiffHours;
            
            const MAX_REALISTIC_SPEED = 120;
            if (actualSpeed > MAX_REALISTIC_SPEED) {
                console.warn(`🚫 Kecepatan ${actualSpeed.toFixed(1)} km/h tidak realistis, diabaikan`);
                return 0;
            }
        }

        if (actualSpeed > 1 && this.journeyStatus === 'started') {
            this.totalDistance += distanceKm;
            
            this.currentSpeed = this.smoothSpeed(actualSpeed);
            
            if (!this.isInBackground) {
                document.getElementById('todayDistance').textContent = this.totalDistance.toFixed(3);
                document.getElementById('currentSpeed').textContent = this.currentSpeed.toFixed(1);
            }
            
            console.log(`📏 +${(distanceKm * 1000).toFixed(1)}m | 🚀 ${actualSpeed.toFixed(1)} km/h | Total: ${this.totalDistance.toFixed(3)}km`);
            
            this.updateAverageSpeed();
            
            return distanceKm;
        }
        
        return 0;
    }

    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance;
    }

    smoothSpeed(newSpeed) {
        if (!this.speedHistory) {
            this.speedHistory = [];
        }
        
        this.speedHistory.push(newSpeed);
        if (this.speedHistory.length > 5) {
            this.speedHistory.shift();
        }
        
        const sum = this.speedHistory.reduce((a, b) => a + b, 0);
        const average = sum / this.speedHistory.length;
        
        return average;
    }

    // ✅ GPS ERROR HANDLING
    handleGPSError(error) {
        let message = '';
        let instructions = '';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = '❌ Izin GPS Ditolak';
                instructions = '📱 Buka: Settings → Site Settings → Location → Allow';
                this.showGPSInstructions();
                break;
                
            case error.POSITION_UNAVAILABLE:
                message = '❌ GPS Device Tidak Aktif';
                instructions = 'Aktifkan GPS/Lokasi di pengaturan device';
                break;
                
            case error.TIMEOUT:
                message = '⏱️ Timeout GPS';
                instructions = 'Cari area dengan sinyal lebih baik';
                break;
                
            default:
                message = '❌ Error GPS Tidak Diketahui';
                break;
        }
        
        this.addLog(`${message} - ${instructions}`, 'error');
    }

    showGPSInstructions() {
        const instructions = document.getElementById('gpsInstructions');
        if (instructions) {
            instructions.style.display = 'block';
        }
    }

    // ✅ CORE APPLICATION METHODS
    handleLogin() {
        const driverName = document.getElementById('driverName');
        const unitNumber = document.getElementById('unitNumber');

        if (driverName && unitNumber && driverName.value && unitNumber.value) {
            this.driverData = {
                name: driverName.value,
                unit: unitNumber.value,
                year: this.getVehicleYear(unitNumber.value),
                sessionId: this.generateSessionId()
            };

            this.firebaseRef = database.ref('/units/' + this.driverData.unit);
            
            const cleanData = {
                driver: this.driverData.name,
                unit: this.driverData.unit,
                sessionId: this.driverData.sessionId,
                journeyStatus: 'ready',
                lastUpdate: new Date().toLocaleTimeString('id-ID'),
                lat: 0, lng: 0, speed: 0, distance: 0,
                fuel: 100, accuracy: 0, timestamp: new Date().toISOString(),
                gpsMode: 'real'
            };

            this.firebaseRef.set(cleanData);
            this.showDriverApp();
            this.startDataTransmission();
            
            // Start background tracking
            this.backgroundManager.start();
            
            // Persist session immediately
            this.persistSession();
            
            setTimeout(() => {
                this.startJourney();
            }, 2000);
        } else {
            alert('Harap isi semua field!');
        }
    }

    getVehicleYear(unit) {
        const yearMap = {
            'DT-06': '2018', 'DT-07': '2018', 'DT-12': '2020', 'DT-13': '2020', 
            'DT-15': '2020', 'DT-16': '2020', 'DT-17': '2020', 'DT-18': '2020',
            'DT-23': '2021', 'DT-24': '2021', 'DT-25': '2022', 'DT-26': '2022',
            'DT-27': '2022', 'DT-28': '2022', 'DT-29': '2022', 'DT-32': '2024',
            'DT-33': '2025', 'DT-34': '2025', 'DT-35': '2025', 'DT-36': '2020',
            'DT-37': '2020', 'DT-38': '2020', 'DT-39': '2020'
        };
        return yearMap[unit] || 'Unknown';
    }

    generateSessionId() {
        return 'SESS_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    showDriverApp() {
        const loginScreen = document.getElementById('loginScreen');
        const driverApp = document.getElementById('driverApp');
        
        if (loginScreen) loginScreen.style.display = 'none';
        if (driverApp) driverApp.style.display = 'block';
        
        const vehicleName = document.getElementById('vehicleName');
        const driverDisplayName = document.getElementById('driverDisplayName');
        
        if (vehicleName) vehicleName.textContent = this.driverData.unit;
        if (driverDisplayName) driverDisplayName.textContent = this.driverData.name;
        
        this.sessionStartTime = new Date();
        this.lastUpdateTime = new Date();
        this.updateSessionDuration();
        this.updateWaypointDisplay();
        this.setupChatSystem();
        
        // Start real GPS tracking
        setTimeout(() => {
            this.startRealGPSTracking();
        }, 1000);
        
        this.addLog(`✅ Login berhasil - ${this.driverData.name} (${this.driverData.unit}) - GPS Real`, 'success');
        this.addLog('🔄 Background tracking aktif - aplikasi tetap berjalan meski dimatikan', 'info');
    }

    processWaypoint(waypoint) {
        if (!this.isValidCoordinate(waypoint.lat, waypoint.lng)) {
            console.warn('❌ Invalid coordinates, skipping waypoint:', waypoint);
            return;
        }

        this.waypointBuffer.push(waypoint);
        this.unsyncedWaypoints.add(waypoint.id);
        this.storageManager.saveWaypoint(waypoint);
        
        if (!this.isInBackground) {
            this.updateGPSDisplay(waypoint);
            this.updateWaypointDisplay();
        }
        
        this.dataPoints++;
        if (!this.isInBackground) {
            document.getElementById('dataPoints').textContent = this.dataPoints;
        }

        console.log(`📍 ${waypoint.isBackground ? 'BACKGROUND' : 'FOREGROUND'} GPS: ${waypoint.lat}, ${waypoint.lng}, Speed: ${this.currentSpeed.toFixed(1)} km/h`);
    }

    updateGPSDisplay(waypoint) {
        document.getElementById('currentLat').textContent = waypoint.lat.toFixed(6);
        document.getElementById('currentLng').textContent = waypoint.lng.toFixed(6);
        document.getElementById('currentSpeed').textContent = this.currentSpeed.toFixed(1);
        document.getElementById('gpsAccuracy').textContent = waypoint.accuracy.toFixed(1) + ' m';
        document.getElementById('gpsBearing').textContent = waypoint.bearing ? waypoint.bearing + '°' : '-';
    }

    updateWaypointDisplay() {
        const waypointCount = document.getElementById('waypointCount');
        const unsyncedCount = document.getElementById('unsyncedCount');
        const waypointStatus = document.getElementById('waypointStatus');

        if (waypointCount) waypointCount.textContent = this.waypointBuffer.count;
        if (unsyncedCount) unsyncedCount.textContent = this.unsyncedWaypoints.size;
        if (waypointStatus) {
            waypointStatus.textContent = this.isOnline ? 
                '🟢 Mengumpulkan waypoint...' : 
                `🔴 Offline (${this.unsyncedWaypoints.size} menunggu sync)`;
        }
    }

    updateAverageSpeed() {
        if (this.dataPoints > 0 && this.sessionStartTime && this.totalDistance > 0) {
            const durationHours = (new Date() - this.sessionStartTime) / 3600000;
            const avgSpeed = durationHours > 0 ? this.totalDistance / durationHours : 0;
            
            if (!this.isInBackground) {
                document.getElementById('avgSpeed').textContent = avgSpeed.toFixed(1);
            }
        }
    }

    startDataTransmission() {
        this.sendInterval = setInterval(() => {
            if (this.lastPosition) {
                this.sendToFirebase();
            }
        }, 5000);
    }

    async sendToFirebase() {
        if (!this.firebaseRef || !this.lastPosition) return;

        try {
            const gpsData = {
                driver: this.driverData.name,
                unit: this.driverData.unit,
                lat: parseFloat(this.lastPosition.lat.toFixed(6)),
                lng: parseFloat(this.lastPosition.lng.toFixed(6)),
                speed: parseFloat(this.currentSpeed.toFixed(1)),
                accuracy: parseFloat(this.lastPosition.accuracy.toFixed(1)),
                bearing: this.lastPosition.bearing ? parseFloat(this.lastPosition.bearing.toFixed(0)) : null,
                timestamp: new Date().toISOString(),
                lastUpdate: new Date().toLocaleTimeString('id-ID'),
                distance: parseFloat(this.totalDistance.toFixed(3)),
                journeyStatus: this.journeyStatus,
                batteryLevel: this.getBatteryLevel(),
                sessionId: this.driverData.sessionId,
                isOfflineData: false,
                fuel: this.calculateFuelLevel(),
                gpsMode: 'real',
                isActive: true,
                isBackground: this.isInBackground
            };

            if (this.isOnline) {
                await this.firebaseRef.set(gpsData);
                if (!this.isInBackground) {
                    this.addLog(`📡 Data terkirim: ${this.currentSpeed.toFixed(1)} km/h | ${this.totalDistance.toFixed(3)} km`, 'success');
                }
                this.updateConnectionStatus(true);
            } else {
                this.offlineQueue.addToQueue(gpsData);
                if (!this.isInBackground) {
                    this.addLog(`💾 Data disimpan offline (${this.offlineQueue.getQueueSize()} dalam antrian)`, 'warning');
                }
                this.updateConnectionStatus(false);
            }
            
        } catch (error) {
            console.error('Error sending to Firebase:', error);
            if (!this.isInBackground) {
                this.addLog(`❌ Gagal kirim data`, 'error');
            }
        }
    }

    calculateFuelLevel() {
        const baseFuel = 100;
        const fuelConsumptionRate = 0.25;
        const fuelUsed = this.totalDistance * fuelConsumptionRate;
        const remainingFuel = Math.max(0, baseFuel - fuelUsed);
        return Math.min(100, Math.max(0, Math.round(remainingFuel)));
    }

    getBatteryLevel() {
        return Math.max(20, Math.floor(Math.random() * 100));
    }

    checkNetworkStatus() {
        const wasOnline = this.isOnline;
        this.isOnline = navigator.onLine;
        
        if (wasOnline !== this.isOnline) {
            if (this.isOnline) {
                if (!this.isInBackground) {
                    this.addLog('📱 Koneksi pulih - sync semua waypoint', 'success');
                }
                this.updateConnectionStatus(true);
                
                setTimeout(() => {
                    this.syncWaypointsToServer();
                    this.offlineQueue.processQueue();
                }, 2000);
                
            } else {
                if (!this.isInBackground) {
                    this.addLog('📱 Koneksi terputus - menyimpan waypoint lokal', 'warning');
                }
                this.updateConnectionStatus(false);
            }
        }
        
        this.updateConnectionStatus(this.isOnline);
    }

    updateConnectionStatus(connected) {
        if (this.isInBackground) return;
        
        const dot = document.getElementById('connectionDot');
        const status = document.getElementById('connectionStatus');
        
        if (connected) {
            if (dot) dot.className = 'connection-status connected';
            if (status) {
                status.textContent = 'TERHUBUNG';
                status.className = 'text-success';
            }
        } else {
            if (dot) dot.className = 'connection-status disconnected';
            if (status) {
                status.textContent = `OFFLINE (${this.unsyncedWaypoints.size} waypoint menunggu)`;
                status.className = 'text-danger';
                
                const queueSize = this.offlineQueue.getQueueSize();
                if (queueSize > 0) {
                    status.textContent = `OFFLINE (${this.unsyncedWaypoints.size} waypoint, ${queueSize} data antrian)`;
                }
            }
        }
        
        this.updateWaypointDisplay();
    }

    addLog(message, type = 'info') {
        if (this.isInBackground) return;
        
        const logContainer = document.getElementById('dataLogs');
        if (!logContainer) return;

        const alertClass = {
            'info': 'alert-info',
            'success': 'alert-success', 
            'error': 'alert-danger',
            'warning': 'alert-warning'
        }[type] || 'alert-info';

        const logEntry = document.createElement('div');
        logEntry.className = `alert ${alertClass} py-2 mb-2`;
        logEntry.innerHTML = `
            <small>${new Date().toLocaleTimeString('id-ID')}: ${message}</small>
        `;
        
        logContainer.insertBefore(logEntry, logContainer.firstChild);
        
        if (logContainer.children.length > 6) {
            logContainer.removeChild(logContainer.lastChild);
        }
    }

    updateTime() {
        if (this.isInBackground) return;
        
        const currentTimeEl = document.getElementById('currentTime');
        if (currentTimeEl) {
            currentTimeEl.textContent = new Date().toLocaleTimeString('id-ID');
        }
    }

    updateSessionDuration() {
        if (!this.sessionStartTime || this.isInBackground) return;
        
        const now = new Date();
        const diff = now - this.sessionStartTime;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        const sessionDurationEl = document.getElementById('sessionDuration');
        if (sessionDurationEl) {
            sessionDurationEl.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        
        setTimeout(() => this.updateSessionDuration(), 1000);
    }

    startJourney() {
        this.journeyStatus = 'started';
        this.lastUpdateTime = new Date();
        const vehicleStatus = document.getElementById('vehicleStatus');
        if (vehicleStatus && !this.isInBackground) {
            vehicleStatus.textContent = 'ON TRIP';
            vehicleStatus.className = 'bg-success text-white rounded px-2 py-1';
        }
        this.addLog('Perjalanan dimulai - GPS tracking aktif', 'success');
        this.sendToFirebase();
    }

    pauseJourney() {
        this.journeyStatus = 'paused';
        const vehicleStatus = document.getElementById('vehicleStatus');
        if (vehicleStatus && !this.isInBackground) {
            vehicleStatus.textContent = 'PAUSED';
            vehicleStatus.className = 'bg-warning text-dark rounded px-2 py-1';
        }
        this.addLog('Perjalanan dijeda', 'warning');
        this.sendToFirebase();
    }

    endJourney() {
        this.journeyStatus = 'ended';
        const vehicleStatus = document.getElementById('vehicleStatus');
        if (vehicleStatus && !this.isInBackground) {
            vehicleStatus.textContent = 'COMPLETED';
            vehicleStatus.className = 'bg-info text-white rounded px-2 py-1';
        }
        this.addLog(`Perjalanan selesai - Total jarak: ${this.totalDistance.toFixed(3)} km`, 'info');
        this.sendToFirebase();
        
        if (this.isOnline) {
            this.syncWaypointsToServer();
        }
    }

    reportIssue() {
        if (this.isInBackground) return;
        
        const issues = [
            'Mesin bermasalah', 'Ban bocor', 'Bahan bakar habis',
            'Kecelakaan kecil', 'Lainnya'
        ];
        
        const issue = prompt('Lapor masalah:\n' + issues.join('\n'));
        if (issue) {
            this.addLog(`Laporan: ${issue}`, 'warning');
        }
    }

    // ✅ DEBUG METHODS
    sendTestMessage() {
        const testMessages = [
            "Lokasi saya saat ini aman",
            "Perjalanan lancar, tidak ada kendala", 
            "Estimasi sampai 30 menit lagi",
            "Butuh istirahat sebentar",
            "Bahan bakar masih cukup"
        ];
        
        const randomMessage = testMessages[Math.floor(Math.random() * testMessages.length)];
        this.sendMessage(randomMessage);
    }

    forceSync() {
        this.addLog('🔄 Memaksa sinkronisasi data...', 'info');
        this.syncWaypointsToServer();
        if (this.offlineQueue.getQueueSize() > 0) {
            this.offlineQueue.processQueue();
        }
    }

    async runGPSDiagnostic() {
        this.addLog('📡 Menjalankan diagnostic GPS...', 'info');
        
        if (!navigator.geolocation) {
            this.addLog('❌ GPS tidak didukung di browser ini', 'error');
            return;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                });
            });

            const accuracy = position.coords.accuracy;
            const diagnosticMessage = `
✅ GPS Diagnostic Result:
• Latitude: ${position.coords.latitude.toFixed(6)}
• Longitude: ${position.coords.longitude.toFixed(6)}
• Accuracy: ${accuracy}m
• Speed: ${position.coords.speed ? (position.coords.speed * 3.6).toFixed(1) + ' km/h' : 'N/A'}
• Altitude: ${position.coords.altitude ? position.coords.altitude.toFixed(1) + 'm' : 'N/A'}
• Timestamp: ${new Date().toLocaleTimeString('id-ID')}
            `.trim();

            this.addLog(diagnosticMessage, 'success');

            if (accuracy > 50) {
                this.addLog('⚠️ Akurasi GPS sedang - cari area terbuka untuk hasil terbaik', 'warning');
            }

        } catch (error) {
            this.addLog(`❌ GPS Diagnostic Failed: ${this.getGPSErrorMessage(error)}`, 'error');
        }
    }

    getGPSErrorMessage(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED: return 'Izin GPS ditolak';
            case error.POSITION_UNAVAILABLE: return 'Posisi tidak tersedia';
            case error.TIMEOUT: return 'Timeout GPS';
            default: return 'Error tidak diketahui';
        }
    }

    // ✅ CHAT SYSTEM
    setupChatSystem() {
        if (!this.driverData) return;
        
        console.log('💬 Setting up chat system for unit:', this.driverData.unit);
        
        this.chatRef = database.ref('/chat/' + this.driverData.unit);
        this.chatRef.off();
        
        this.chatRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            if (message && message.id !== this.lastMessageId) {
                this.handleNewMessage(message);
            }
        });
        
        this.chatInitialized = true;
        console.log('💬 Chat system activated for unit:', this.driverData.unit);
        this.addLog('Sistem chat aktif - bisa komunikasi real-time dengan monitor', 'success');
    }

    handleNewMessage(message) {
        if (!message || message.sender === this.driverData.name) return;
        
        const messageExists = this.chatMessages.some(msg => 
            msg.id === message.id || 
            (msg.timestamp === message.timestamp && msg.sender === message.sender)
        );
        
        if (messageExists) return;
        
        this.chatMessages.push(message);
        
        if (!this.isChatOpen || message.sender !== this.driverData.name) {
            this.unreadCount++;
        }
        
        this.updateChatUI();
        
        if (!this.isChatOpen && message.sender !== this.driverData.name) {
            this.showChatNotification(message);
        }
        
        this.playNotificationSound();
        console.log('💬 New message received:', message);
    }

    async sendMessage(messageText) {
        if (!messageText.trim() || !this.chatRef || !this.driverData) return;
        
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const messageData = {
            id: messageId,
            text: messageText.trim(),
            sender: this.driverData.name,
            unit: this.driverData.unit,
            timestamp: new Date().toISOString(),
            timeDisplay: new Date().toLocaleTimeString('id-ID', { 
                hour: '2-digit', minute: '2-digit' 
            }),
            type: 'driver',
            status: 'sent'
        };
        
        try {
            await this.chatRef.push(messageData);
            this.lastMessageId = messageId;
            
            this.chatMessages.push(messageData);
            this.updateChatUI();
            this.addLog(`💬 Pesan terkirim: "${messageText}"`, 'info');
            
        } catch (error) {
            console.error('Failed to send message:', error);
            this.addLog('❌ Gagal mengirim pesan', 'error');
            
            messageData.status = 'failed';
            this.chatMessages.push(messageData);
            this.updateChatUI();
        }
    }

    sendChatMessage() {
        const input = document.getElementById('chatInput');
        if (input && input.value.trim()) {
            this.sendMessage(input.value);
            input.value = '';
        }
    }

    updateChatUI() {
        if (this.isInBackground) return;
        
        const messageList = document.getElementById('chatMessages');
        const unreadBadge = document.getElementById('unreadBadge');
        const chatToggle = document.getElementById('chatToggle');
        
        if (!messageList) return;
        
        if (unreadBadge) {
            unreadBadge.textContent = this.unreadCount > 0 ? this.unreadCount : '';
            unreadBadge.style.display = this.unreadCount > 0 ? 'inline' : 'none';
        }
        
        if (chatToggle) {
            chatToggle.innerHTML = this.unreadCount > 0 ? 
                `💬 Chat <span class="badge bg-danger">${this.unreadCount}</span>` : 
                '💬 Chat';
        }
        
        messageList.innerHTML = '';
        
        if (this.chatMessages.length === 0) {
            messageList.innerHTML = `
                <div class="chat-placeholder text-center text-muted py-4">
                    <small>Mulai percakapan dengan monitor...</small>
                </div>
            `;
            return;
        }
        
        this.chatMessages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            messageList.appendChild(messageElement);
        });
        
        messageList.scrollTop = messageList.scrollHeight;
    }

    createMessageElement(message) {
        const messageElement = document.createElement('div');
        const isSentMessage = message.sender === this.driverData.name;
        
        messageElement.className = `chat-message ${isSentMessage ? 'message-sent' : 'message-received'}`;
        
        messageElement.innerHTML = `
            <div class="message-content ${message.status === 'failed' ? 'message-failed' : ''}">
                ${!isSentMessage ? 
                    `<div class="message-sender">${this.escapeHtml(message.sender)}</div>` : ''}
                <div class="message-text">${this.escapeHtml(message.text)}</div>
                <div class="message-footer">
                    <span class="message-time">${message.timeDisplay}</span>
                    ${isSentMessage ? 
                        `<span class="message-status">${message.status === 'failed' ? '❌' : '✓'}</span>` : ''}
                </div>
            </div>
        `;
        
        return messageElement;
    }

    toggleChat() {
        if (this.isInBackground) return;
        
        this.isChatOpen = !this.isChatOpen;
        const chatWindow = document.getElementById('chatWindow');
        
        if (chatWindow) {
            chatWindow.style.display = this.isChatOpen ? 'flex' : 'none';
            
            if (this.isChatOpen) {
                this.unreadCount = 0;
                this.updateChatUI();
                setTimeout(() => {
                    const chatInput = document.getElementById('chatInput');
                    if (chatInput) chatInput.focus();
                }, 100);
            }
        }
    }

    showChatNotification(message) {
        if (this.isInBackground) return;
        
        const notification = document.createElement('div');
        notification.className = 'chat-notification alert alert-info';
        notification.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>💬 Pesan Baru dari ${message.sender}</strong>
                    <div class="small">${message.text}</div>
                </div>
                <button type="button" class="btn-close btn-sm" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Notification sound not supported');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    loadUnsyncedWaypoints() {
        const unsynced = this.storageManager.loadUnsyncedWaypoints();
        unsynced.forEach(waypoint => {
            this.waypointBuffer.push(waypoint);
            if (!waypoint.synced) {
                this.unsyncedWaypoints.add(waypoint.id);
            }
        });
        console.log(`📂 Loaded ${unsynced.length} waypoints from storage`);
    }

    loadCompleteHistory() {
        try {
            const saved = localStorage.getItem('gps_complete_history');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    }

    async syncWaypointsToServer() {
        if (!this.isOnline || !this.driverData) {
            console.log('❌ Cannot sync: Offline or no driver data');
            return;
        }

        const unsynced = this.getUnsyncedWaypoints();
        if (unsynced.length === 0) {
            console.log('✅ All waypoints synced');
            return;
        }

        console.log(`🔄 Syncing ${unsynced.length} waypoints to server...`);
        
        const batches = this.createBatches(unsynced, this.waypointConfig.batchSize);
        let successfulBatches = 0;

        for (const [index, batch] of batches.entries()) {
            try {
                await this.uploadBatch(batch, index);
                successfulBatches++;
                
                batch.forEach(waypoint => {
                    waypoint.synced = true;
                    this.unsyncedWaypoints.delete(waypoint.id);
                });
                
                this.storageManager.markWaypointsAsSynced(batch.map(wp => wp.id));
                if (!this.isInBackground) {
                    this.addLog(`📡 Batch ${index + 1}/${batches.length} synced (${batch.length} waypoints)`, 'success');
                }
                
            } catch (error) {
                console.error(`❌ Batch ${index + 1} sync failed:`, error);
                if (!this.isInBackground) {
                    this.addLog(`❌ Batch ${index + 1} sync failed`, 'error');
                }
                break;
            }
        }

        if (successfulBatches > 0 && !this.isInBackground) {
            this.addLog(`✅ ${successfulBatches} batches synced successfully`, 'success');
            this.updateWaypointDisplay();
        }
    }

    async uploadBatch(batch, batchIndex) {
        const batchId = `batch_${this.driverData.unit}_${Date.now()}_${batchIndex}`;
        const batchRef = database.ref(`/waypoints/${this.driverData.unit}/batches/${batchId}`);
        
        const batchData = {
            batchId: batchId,
            unit: this.driverData.unit,
            sessionId: this.driverData.sessionId,
            driver: this.driverData.name,
            waypoints: batch,
            uploadedAt: new Date().toISOString(),
            batchSize: batch.length,
            totalWaypoints: this.waypointBuffer.count,
            batchIndex: batchIndex
        };

        await batchRef.set(batchData);
        console.log(`✅ Batch ${batchIndex} uploaded: ${batch.length} waypoints`);
    }

    getUnsyncedWaypoints() {
        return this.waypointBuffer.getAll().filter(wp => !wp.synced);
    }

    createBatches(array, batchSize) {
        const batches = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    stopRealGPSTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        this.isTracking = false;
    }

    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }
        if (this.sendInterval) {
            clearInterval(this.sendInterval);
        }
        if (this.firebaseRef) {
            this.firebaseRef.remove();
        }
        
        this.isTracking = false;
    }

    // ✅ ENHANCED LOGOUT WITH BACKGROUND CLEANUP
    logout() {
        if (confirm('Yakin ingin logout? Tracking akan dihentikan permanen.')) {
            // Stop all tracking
            this.stopRealGPSTracking();
            this.backgroundManager.stop();
            
            if (this.sendInterval) {
                clearInterval(this.sendInterval);
            }
            
            if (this.firebaseRef) {
                this.firebaseRef.update({
                    isActive: false,
                    lastUpdate: new Date().toLocaleTimeString('id-ID'),
                    journeyStatus: 'ended'
                });
            }
            
            if (this.chatRef) {
                this.chatRef.off();
            }
            
            // Clear persisted session
            this.clearPersistedSession();
            
            // Sync any remaining data
            if (this.isOnline) {
                this.syncWaypointsToServer();
            }
            
            const sessionSummary = {
                driver: this.driverData.name,
                unit: this.driverData.unit,
                duration: document.getElementById('sessionDuration')?.textContent || '00:00:00',
                totalDistance: this.totalDistance.toFixed(3),
                dataPoints: this.dataPoints,
                waypointsCollected: this.waypointBuffer.count,
                unsyncedWaypoints: this.unsyncedWaypoints.size,
                avgSpeed: document.getElementById('avgSpeed')?.textContent || '0',
                sessionId: this.driverData.sessionId
            };
            
            console.log('Session Summary:', sessionSummary);
            this.addLog(`Session ended - ${this.waypointBuffer.count} waypoints collected`, 'info');
            
            // Reset all data
            this.waypointBuffer.clear();
            this.unsyncedWaypoints.clear();
            
            this.driverData = null;
            this.firebaseRef = null;
            this.chatRef = null;
            this.chatMessages = [];
            this.unreadCount = 0;
            this.isChatOpen = false;
            this.chatInitialized = false;
            
            const loginScreen = document.getElementById('loginScreen');
            const driverApp = document.getElementById('driverApp');
            const loginForm = document.getElementById('loginForm');
            
            if (loginScreen) loginScreen.style.display = 'block';
            if (driverApp) driverApp.style.display = 'none';
            if (loginForm) loginForm.reset();
            
            this.totalDistance = 0;
            this.dataPoints = 0;
            this.lastPosition = null;
            this.lastUpdateTime = null;
            
            this.addLog('✅ Logout berhasil - semua tracking dihentikan', 'success');
        }
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    window.dtLogger = new DTGPSLogger();
});

// Enhanced visibility change handling
document.addEventListener('visibilitychange', function() {
    if (window.dtLogger && window.dtLogger.driverData) {
        if (document.hidden) {
            console.log('📱 App moved to background - background tracking active');
        } else {
            window.dtLogger.addLog('📱 App aktif kembali', 'success');
            window.dtLogger.updateWaypointDisplay();
            window.dtLogger.updateSessionDuration();
        }
    }
});

// Handle page freeze and resume
window.addEventListener('freeze', () => {
    if (window.dtLogger) {
        window.dtLogger.persistSession();
    }
});

window.addEventListener('resume', () => {
    if (window.dtLogger && window.dtLogger.driverData) {
        window.dtLogger.addLog('🔁 App dilanjutkan dari sleep mode', 'info');
    }
});

// Network status recovery
window.addEventListener('online', () => {
    if (window.dtLogger) {
        setTimeout(() => {
            window.dtLogger.syncWaypointsToServer();
            window.dtLogger.offlineQueue.processQueue();
        }, 1000);
    }
});
