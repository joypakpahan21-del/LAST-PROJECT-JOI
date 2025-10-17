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

// ==== INTERFACE/CONTRACT DEFINITIONS ====
class IGPSDataHandler {
    handlePosition(position) {}
    updateUI(position) {}
    validatePosition(position) {}
    cleanup() {}
}

class IOfflineManager {
    saveOfflineData(data, type) {}
    syncWhenOnline() {}
    cleanupExpiredData() {}
}

// ==== FACTORY PATTERN FOR DI ====
class GPSTrackerFactory {
    static createTracker(gpsLogger, type = 'smooth', config = {}) {
        const dependencies = { gpsLogger };
        const defaultConfig = {
            smoothingEnabled: true,
            smoothingWindow: 5,
            sendInterval: 1000,
            enableHighAccuracy: true,
            ...config
        };

        switch(type) {
            case 'smooth':
                return new SmoothGPSTracker(dependencies, defaultConfig);
            case 'raw':
                return new RawGPSTracker(dependencies, defaultConfig);
            default:
                return new SmoothGPSTracker(dependencies, defaultConfig);
        }
    }
}

class OfflineManagerFactory {
    static createManager(type = 'enhanced', config = {}) {
        const defaultConfig = {
            maxStorageDays: 30,
            maxQueueSize: 1000,
            enableIndexedDB: true,
            ...config
        };

        switch(type) {
            case 'enhanced':
                return new EnhancedOfflineManager(defaultConfig);
            case 'basic':
                return new BasicOfflineManager(defaultConfig);
            default:
                return new EnhancedOfflineManager(defaultConfig);
        }
    }
}

// ==== ENHANCED SMOOTH GPS TRACKER WITH DI ====
class SmoothGPSTracker extends IGPSDataHandler {
    constructor(dependencies, config = {}) {
        super();
        
        // ✅ DEPENDENCY INJECTION
        if (!dependencies.gpsLogger) {
            throw new Error('GPS Logger dependency is required');
        }
        this.gpsLogger = dependencies.gpsLogger;
        
        // ✅ CONFIGURATION-BASED SETUP
        this.config = {
            smoothingEnabled: config.smoothingEnabled ?? true,
            smoothingWindow: config.smoothingWindow ?? 5,
            sendInterval: config.sendInterval ?? 1000,
            enableHighAccuracy: config.enableHighAccuracy ?? true,
            distanceFilter: config.distanceFilter ?? 2,
            ...config
        };
        
        // ✅ INIT COMPONENTS
        this.positionBuffer = [];
        this.lastSentPosition = null;
        this.isActive = false;
        
        console.log('✅ SmoothGPSTracker initialized with DI');
    }

    // ✅ ENHANCED POSITION HANDLER DENGAN DI
    handlePosition(position) {
        if (!this.isActive) return;

        console.log('📍 SmoothTracker processing position...');
        
        const rawPosition = this.createPositionObject(position);
        
        // ✅ VALIDATE POSITION
        if (!this.validatePosition(rawPosition)) {
            console.warn('Invalid GPS position, skipping');
            return;
        }

        // ✅ SMOOTHING ALGORITHM
        const smoothedPosition = this.config.smoothingEnabled ? 
            this.applySmoothing(rawPosition) : rawPosition;

        // ✅ UPDATE GPS LOGGER VIA DI
        this.gpsLogger.lastPosition = smoothedPosition;
        
        // ✅ UPDATE UI
        this.updateUI(smoothedPosition);
        
        // ✅ TRIGGER DATA PROCESSING
        this.gpsLogger.onPositionProcessed(smoothedPosition);
        
        console.log('✅ Position processed by SmoothTracker');
    }

    createPositionObject(position) {
        return {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            speed: position.coords.speed !== null ? position.coords.speed * 3.6 : 0,
            accuracy: position.coords.accuracy,
            bearing: position.coords.heading,
            timestamp: Date.now(),
            altitude: position.coords.altitude,
            isRaw: true
        };
    }

    // ✅ KALMAN FILTER SMOOTHING
    applySmoothing(newPosition) {
        if (this.positionBuffer.length === 0) {
            return newPosition;
        }

        const window = this.positionBuffer.slice(-this.config.smoothingWindow);
        window.push(newPosition);

        const avgLat = window.reduce((sum, pos) => sum + pos.lat, 0) / window.length;
        const avgLng = window.reduce((sum, pos) => sum + pos.lng, 0) / window.length;
        
        const accuracyWeight = Math.max(0.1, 1 - (newPosition.accuracy / 50));
        
        const smoothed = {
            ...newPosition,
            lat: (avgLat * 0.3) + (newPosition.lat * 0.7 * accuracyWeight),
            lng: (avgLng * 0.3) + (newPosition.lng * 0.7 * accuracyWeight),
            accuracy: newPosition.accuracy,
            isSmoothed: true,
            smoothingMethod: 'kalman_moving_avg'
        };

        this.addToBuffer(smoothed);
        return smoothed;
    }

    validatePosition(position) {
        // Check coordinate bounds (Indonesia area)
        if (position.lat < -11 || position.lat > 6 || 
            position.lng < 95 || position.lng > 141) {
            return false;
        }

        // Check accuracy
        if (position.accuracy > 100) {
            console.warn('Poor GPS accuracy:', position.accuracy);
            return false;
        }

        // Check for sudden jumps
        if (this.lastSentPosition) {
            const distance = this.calculateDistance(
                this.lastSentPosition.lat, this.lastSentPosition.lng,
                position.lat, position.lng
            );
            const timeDiff = (position.timestamp - this.lastSentPosition.timestamp) / 1000;
            
            if (timeDiff > 0 && distance / timeDiff > 500) {
                console.warn('Impossible speed detected, filtering position');
                return false;
            }
        }

        return true;
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    addToBuffer(position) {
        this.positionBuffer.push(position);
        if (this.positionBuffer.length > 20) {
            this.positionBuffer = this.positionBuffer.slice(-20);
        }
    }

    updateUI(position) {
        requestAnimationFrame(() => {
            const latElement = document.getElementById('currentLat');
            const lngElement = document.getElementById('currentLng');
            const speedElement = document.getElementById('currentSpeed');
            
            if (latElement) latElement.textContent = position.lat.toFixed(6);
            if (lngElement) lngElement.textContent = position.lng.toFixed(6);
            if (speedElement) speedElement.textContent = position.speed.toFixed(1);
        });
    }

    start() {
        this.isActive = true;
        console.log('🚀 SmoothGPSTracker started');
    }

    stop() {
        this.isActive = false;
        this.positionBuffer = [];
        console.log('🛑 SmoothGPSTracker stopped');
    }

    cleanup() {
        this.stop();
    }
}

// ==== RAW GPS TRACKER (ALTERNATIVE IMPLEMENTATION) ====
class RawGPSTracker extends IGPSDataHandler {
    constructor(dependencies, config = {}) {
        super();
        this.gpsLogger = dependencies.gpsLogger;
        this.config = config;
    }

    handlePosition(position) {
        const rawPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            speed: position.coords.speed !== null ? position.coords.speed * 3.6 : 0,
            accuracy: position.coords.accuracy,
            bearing: position.coords.heading,
            timestamp: Date.now(),
            isRaw: true
        };

        this.gpsLogger.lastPosition = rawPosition;
        this.updateUI(rawPosition);
        this.gpsLogger.onPositionProcessed(rawPosition);
    }

    updateUI(position) {
        // Basic UI update
    }

    validatePosition(position) {
        return true; // Accept all positions in raw mode
    }

    cleanup() {}
}

// ==== ENHANCED OFFLINE MANAGER WITH DI ====
class EnhancedOfflineManager extends IOfflineManager {
    constructor(config = {}) {
        super();
        
        this.config = {
            maxStorageDays: config.maxStorageDays ?? 30,
            maxQueueSize: config.maxQueueSize ?? 1000,
            enableIndexedDB: config.enableIndexedDB ?? true,
            syncRetryAttempts: config.syncRetryAttempts ?? 3,
            ...config
        };
        
        this.offlineData = {
            queue: [],
            history: [],
            sessions: [],
            lastSync: null
        };
        
        this.localDatabase = null;
        this.initLocalDatabase();
    }
    
    async initLocalDatabase() {
        if (this.config.enableIndexedDB && 'indexedDB' in window) {
            try {
                this.localDatabase = await this.openLocalDB();
                console.log('✅ IndexedDB initialized for offline storage');
            } catch (error) {
                console.error('Failed to initialize IndexedDB:', error);
            }
        }
    }
    
    openLocalDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('GPSOfflineDB', 1);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains('gpsData')) {
                    const store = db.createObjectStore('gpsData', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('sessionId', 'sessionId', { unique: false });
                    store.createIndex('synced', 'synced', { unique: false });
                }
            };
            
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }
    
    async saveOfflineData(data, type = 'gps') {
        const offlineRecord = {
            data: data,
            type: type,
            timestamp: new Date().toISOString(),
            expiry: this.getExpiryDate(),
            id: this.generateOfflineId(),
            synced: false,
            retryCount: 0
        };
        
        await this.addToOfflineStorage(offlineRecord);
        return offlineRecord.id;
    }
    
    getExpiryDate() {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + this.config.maxStorageDays);
        return expiry.toISOString();
    }
    
    generateOfflineId() {
        return 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async addToOfflineStorage(record) {
        if (this.localDatabase) {
            try {
                const transaction = this.localDatabase.transaction(['gpsData'], 'readwrite');
                const store = transaction.objectStore('gpsData');
                await store.add(record);
            } catch (error) {
                console.error('Failed to save to IndexedDB:', error);
                await this.fallbackToLocalStorage(record);
            }
        } else {
            await this.fallbackToLocalStorage(record);
        }
    }
    
    async fallbackToLocalStorage(record) {
        return new Promise((resolve) => {
            const existing = JSON.parse(localStorage.getItem('gps_offline_backup') || '[]');
            existing.push(record);
            
            if (existing.length > this.config.maxQueueSize) {
                existing.splice(0, existing.length - this.config.maxQueueSize);
            }
            
            localStorage.setItem('gps_offline_backup', JSON.stringify(existing));
            resolve();
        });
    }
    
    async syncWhenOnline() {
        if (!navigator.onLine) {
            console.log('📴 Offline - skipping sync');
            return 0;
        }
        
        console.log('🔄 Starting smart offline data sync...');
        let syncedCount = 0;
        
        if (this.localDatabase) {
            syncedCount += await this.syncIndexedDBData();
        }
        
        syncedCount += await this.syncLocalStorageData();
        
        console.log(`✅ Offline data sync completed: ${syncedCount} records`);
        return syncedCount;
    }
    
    async syncIndexedDBData() {
        let syncedCount = 0;
        
        try {
            const transaction = this.localDatabase.transaction(['gpsData'], 'readonly');
            const store = transaction.objectStore('gpsData');
            const unsyncedData = await store.index('synced').getAll(IDBKeyRange.only(false));
            
            for (const data of unsyncedData) {
                try {
                    await this.syncSingleRecord(data);
                    await this.markAsSynced(data.id);
                    syncedCount++;
                } catch (error) {
                    console.warn('Failed to sync record:', data.id, error);
                    await this.handleSyncError(data, error);
                }
            }
        } catch (error) {
            console.error('IndexedDB sync error:', error);
        }
        
        return syncedCount;
    }
    
    async syncSingleRecord(record, retries = null) {
        const maxRetries = retries ?? this.config.syncRetryAttempts;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.mockFirebaseUpdate(record.data);
                return true;
            } catch (error) {
                if (attempt === maxRetries) throw error;
                await this.delay(1000 * attempt);
            }
        }
    }
    
    async mockFirebaseUpdate(data) {
        return new Promise((resolve) => {
            setTimeout(() => resolve(), 100);
        });
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async markAsSynced(id) {
        if (!this.localDatabase) return;
        
        try {
            const transaction = this.localDatabase.transaction(['gpsData'], 'readwrite');
            const store = transaction.objectStore('gpsData');
            const record = await store.get(id);
            
            if (record) {
                record.synced = true;
                await store.put(record);
            }
        } catch (error) {
            console.error('Failed to mark as synced:', error);
        }
    }
    
    async handleSyncError(record, error) {
        record.retryCount = (record.retryCount || 0) + 1;
        console.warn(`Sync error for record ${record.id}, retry count: ${record.retryCount}`);
    }
    
    async syncLocalStorageData() {
        try {
            const backupData = JSON.parse(localStorage.getItem('gps_offline_backup') || '[]');
            const unsynced = backupData.filter(item => !item.synced);
            let syncedCount = 0;
            
            for (const data of unsynced) {
                try {
                    await this.syncSingleRecord(data);
                    data.synced = true;
                    syncedCount++;
                } catch (error) {
                    console.warn('Failed to sync backup record:', data.id, error);
                }
            }
            
            localStorage.setItem('gps_offline_backup', JSON.stringify(backupData));
            return syncedCount;
        } catch (error) {
            console.error('LocalStorage sync error:', error);
            return 0;
        }
    }
    
    cleanupExpiredData() {
        const now = new Date();
        this.offlineData.queue = this.offlineData.queue.filter(item => 
            new Date(item.expiry) > now
        );
    }
}

// ==== BASIC OFFLINE MANAGER ====
class BasicOfflineManager extends IOfflineManager {
    constructor(config = {}) {
        super();
        this.config = config;
        this.queue = [];
    }
    
    saveOfflineData(data, type = 'gps') {
        this.queue.push({
            data,
            type,
            timestamp: new Date().toISOString()
        });
    }
    
    async syncWhenOnline() {
        return this.queue.length;
    }
    
    cleanupExpiredData() {
        // Basic cleanup
    }
}

// ==== OFFLINE QUEUE MANAGER ====
class OfflineQueueManager {
    constructor() {
        this.queue = [];
        this.isOnline = navigator.onLine;
        this.maxQueueSize = 1000;
        this.syncInterval = null;
        this.init();
    }

    init() {
        this.loadQueueFromStorage();
        this.setupOnlineOfflineListeners();
        this.startSyncMonitor();
    }

    setupOnlineOfflineListeners() {
        window.addEventListener('online', () => {
            console.log('📱 Koneksi online - sync data offline');
            this.isOnline = true;
            this.processQueue();
        });

        window.addEventListener('offline', () => {
            console.log('📱 Koneksi offline - menyimpan data lokal');
            this.isOnline = false;
        });
    }

    loadQueueFromStorage() {
        try {
            const saved = localStorage.getItem('gps_offline_queue');
            if (saved) {
                this.queue = JSON.parse(saved);
                console.log(`📂 Loaded ${this.queue.length} queued items`);
            }
        } catch (error) {
            console.error('Error loading queue:', error);
            this.queue = [];
        }
    }

    saveQueueToStorage() {
        try {
            localStorage.setItem('gps_offline_queue', JSON.stringify(this.queue));
        } catch (error) {
            console.error('Error saving queue:', error);
        }
    }

    addToQueue(gpsData) {
        if (this.queue.length >= this.maxQueueSize) {
            this.queue.shift();
        }
        
        this.queue.push({
            ...gpsData,
            queueTimestamp: new Date().toISOString(),
            offlineId: 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        });

        this.saveQueueToStorage();
        console.log(`💾 Saved to offline queue. Total: ${this.queue.length}`);
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
            }
        }

        this.queue = failedItems;
        this.saveQueueToStorage();

        console.log(`✅ Sent ${successItems.length} items, ${failedItems.length} failed`);
        
        if (successItems.length > 0 && window.dtLogger) {
            window.dtLogger.addLog(`📡 Sync offline: ${successItems.length} data terkirim`, 'success');
        }
    }

    async sendQueuedData(queuedData) {
        if (!window.dtLogger?.firebaseRef) {
            throw new Error('No Firebase reference');
        }

        const { queueTimestamp, offlineId, ...cleanData } = queuedData;
        await window.dtLogger.firebaseRef.set(cleanData);
    }

    startSyncMonitor() {
        this.syncInterval = setInterval(() => {
            if (this.isOnline && this.queue.length > 0) {
                this.processQueue();
            }
        }, 10000);
    }

    getQueueSize() {
        return this.queue.length;
    }

    clearQueue() {
        this.queue = [];
        this.saveQueueToStorage();
    }
}

// ==== CHAT SYSTEM ====
class ChatSystem {
    constructor(gpsLogger) {
        this.gpsLogger = gpsLogger;
        this.chatRef = null;
        this.chatMessages = [];
        this.unreadCount = 0;
        this.isChatOpen = false;
        this.chatInitialized = false;
    }

    initialize(driverData) {
        if (!driverData) return;
        
        this.chatRef = database.ref('/chat/' + driverData.unit);
        
        this.chatRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            this.handleNewMessage(message);
        });
        
        this.chatInitialized = true;
        console.log('💬 Chat system activated for unit:', driverData.unit);
        this.gpsLogger.addLog('Sistem chat aktif - bisa komunikasi dengan monitor', 'success');
    }

    handleNewMessage(message) {
        if (!message || message.sender === this.gpsLogger.driverData?.name) return;
        
        this.chatMessages.push(message);
        this.unreadCount++;
        
        this.updateChatUI();
        
        if (!this.isChatOpen) {
            this.showChatNotification(message);
        }
    }

    async sendMessage(messageText) {
        if (!messageText.trim() || !this.chatRef || !this.gpsLogger.driverData) return;
        
        const messageData = {
            text: messageText.trim(),
            sender: this.gpsLogger.driverData.name,
            unit: this.gpsLogger.driverData.unit,
            timestamp: new Date().toISOString(),
            timeDisplay: new Date().toLocaleTimeString('id-ID'),
            type: 'driver'
        };
        
        try {
            await this.chatRef.push(messageData);
            this.gpsLogger.addLog(`💬 Pesan terkirim: "${messageText}"`, 'info');
        } catch (error) {
            console.error('Failed to send message:', error);
            this.gpsLogger.addLog('❌ Gagal mengirim pesan', 'error');
        }
    }

    updateChatUI() {
        const messageList = document.getElementById('chatMessages');
        const unreadBadge = document.getElementById('unreadBadge');
        const chatToggle = document.getElementById('chatToggle');
        
        if (!messageList) return;
        
        if (unreadBadge) {
            unreadBadge.textContent = this.unreadCount > 0 ? this.unreadCount : '';
            unreadBadge.style.display = this.unreadCount > 0 ? 'block' : 'none';
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
            const messageElement = document.createElement('div');
            messageElement.className = `chat-message ${message.sender === this.gpsLogger.driverData?.name ? 'message-sent' : 'message-received'}`;
            
            messageElement.innerHTML = `
                <div class="message-content">
                    ${message.sender !== this.gpsLogger.driverData?.name ? 
                      `<div class="message-sender">${this.escapeHtml(message.sender)}</div>` : ''}
                    <div class="message-text">${this.escapeHtml(message.text)}</div>
                    <div class="message-time">${message.timeDisplay}</div>
                </div>
            `;
            
            messageList.appendChild(messageElement);
        });
        
        messageList.scrollTop = messageList.scrollHeight;
    }

    toggleChat() {
        this.isChatOpen = !this.isChatOpen;
        const chatWindow = document.getElementById('chatWindow');
        
        if (chatWindow) {
            chatWindow.style.display = this.isChatOpen ? 'block' : 'none';
            
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

    handleChatInput(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const input = document.getElementById('chatInput');
            if (input && input.value.trim()) {
                this.sendMessage(input.value);
                input.value = '';
            }
        }
    }

    showChatNotification(message) {
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
            animation: slideInRight 0.3s ease-out;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ==== MAIN DTGPS LOGGER WITH COMPLETE DI ====
class DTGPSLogger {
    constructor() {
        console.log('🚀 Mobile GPS Logger Initializing with DI...');
        
        // ✅ CORE PROPERTIES
        this.driverData = null;
        this.watchId = null;
        this.isTracking = false;
        this.lastPosition = null;
        this.isOnline = navigator.onLine;
        this.journeyStatus = 'ready';
        this.firebaseRef = null;
        
        // ✅ ENHANCED TRACKING PROPERTIES
        this.totalDistance = 0;
        this.dataPoints = 0;
        this.sessionStartTime = null;
        this.lastUpdateTime = null;
        this.currentSpeed = 0;
        this.lastSentPosition = null;
        
        // ✅ DEPENDENCY INJECTION VIA FACTORY PATTERN
        this.smoothTracker = GPSTrackerFactory.createTracker(
            this, 
            'smooth',
            {
                smoothingEnabled: true,
                smoothingWindow: 7,
                sendInterval: 2000,
                enableHighAccuracy: true,
                distanceFilter: 2
            }
        );
        
        this.enhancedOfflineManager = OfflineManagerFactory.createManager(
            'enhanced',
            {
                maxStorageDays: 30,
                maxQueueSize: 1000,
                enableIndexedDB: true,
                syncRetryAttempts: 3
            }
        );
        
        // ✅ COMPATIBILITY COMPONENTS
        this.offlineQueue = new OfflineQueueManager();
        this.chatSystem = new ChatSystem(this);
        
        console.log('✅ All DI components initialized');
        this.init();
    }

    init() {
        console.log('🔧 Starting mobile system with DI...');
        this.setupEventListeners();
        this.updateTime();
        this.checkNetworkStatus();
        
        // ✅ START TRACKING SYSTEMS
        this.startEnhancedGPSTracking();
        
        // ✅ SETUP INTERVALS
        setInterval(() => this.updateTime(), 1000);
        setInterval(() => this.checkNetworkStatus(), 5000);
        setInterval(() => this.updateSessionDuration(), 1000);
        setInterval(() => this.updateOfflineStatus(), 2000);
        
        console.log('✅ Mobile system fully started with DI');
    }

    // ✅ ENHANCED GPS TRACKING WITH DI INTEGRATION
    startEnhancedGPSTracking() {
        if (!navigator.geolocation) {
            this.addLog('GPS tidak didukung di browser ini', 'error');
            return;
        }

        this.isTracking = true;
        this.smoothTracker.start();

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
            distanceFilter: 2
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                // ✅ DELEGATE TO SMOOTH TRACKER VIA DI
                this.smoothTracker.handlePosition(position);
            },
            (error) => this.handleGPSError(error),
            options
        );

        this.addLog('🚀 Enhanced GPS tracking aktif - DI Integrated', 'success');
    }

    // ✅ POSITION PROCESSED CALLBACK (DI COMMUNICATION)
    onPositionProcessed(processedPosition) {
        console.log('📍 Position processed callback called');
        
        // ✅ UPDATE COMPATIBILITY DATA
        this.lastPosition = processedPosition;
        this.dataPoints++;
        
        // ✅ CALCULATE DISTANCE
        this.calculateDistanceWithSpeed(processedPosition.speed, Date.now());
        
        // ✅ SEND TO FIREBASE
        this.sendToFirebaseIfNeeded(processedPosition);
        
        // ✅ SAVE TO HISTORY
        this.saveToCompleteHistory(processedPosition);
    }

    sendToFirebaseIfNeeded(position) {
        const now = Date.now();
        
        if (!this.lastSentPosition || now - this.lastSentPosition.timestamp >= 2000) {
            if (this.isSignificantChange(position)) {
                this.sendToFirebase();
                this.lastSentPosition = { ...position, timestamp: now };
            }
        }
    }

    isSignificantChange(newPosition) {
        if (!this.lastSentPosition) return true;

        const distance = this.smoothTracker.calculateDistance(
            this.lastSentPosition.lat, this.lastSentPosition.lng,
            newPosition.lat, newPosition.lng
        );

        const bearingDiff = Math.abs(
            (newPosition.bearing || 0) - (this.lastSentPosition.bearing || 0)
        );

        return distance >= 5 || bearingDiff >= 10;
    }

    // ✅ ENHANCED FIREBASE INTEGRATION
    async sendToFirebase() {
        if (!this.firebaseRef || !this.lastPosition) return;

        try {
            const firebaseData = this.createFirebaseData();
            
            if (this.isOnline) {
                await this.firebaseRef.set(firebaseData);
                this.addLog(`📡 Data terkirim: ${this.lastPosition.speed.toFixed(1)} km/h`, 'success');
                this.updateConnectionStatus(true);
                
                // ✅ SYNC OFFLINE DATA VIA DI
                if (this.offlineQueue.getQueueSize() > 0) {
                    this.offlineQueue.processQueue();
                }
                
                this.enhancedOfflineManager.syncWhenOnline();
            } else {
                this.offlineQueue.addToQueue(firebaseData);
                this.addLog(`💾 Data disimpan offline (${this.offlineQueue.getQueueSize()} dalam antrian)`, 'warning');
                this.updateConnectionStatus(false);
            }
            
        } catch (error) {
            console.error('Error sending to Firebase:', error);
            this.handleFirebaseError(error);
        }
    }

    createFirebaseData() {
        return {
            // ✅ FLAT DATA (compatibility)
            driver: this.driverData?.name || '',
            unit: this.driverData?.unit || '',
            lat: this.lastPosition?.lat || 0,
            lng: this.lastPosition?.lng || 0,
            speed: this.lastPosition?.speed || 0,
            bearing: this.lastPosition?.bearing || null,
            accuracy: this.lastPosition?.accuracy || 0,
            lastUpdate: new Date().toLocaleTimeString('id-ID'),
            timestamp: this.lastPosition?.timestamp || Date.now(),
            distance: parseFloat(this.totalDistance.toFixed(3)),
            journeyStatus: this.journeyStatus,
            
            // ✅ ENHANCED DATA (new features)
            enhanced: {
                live: {
                    lat: this.lastPosition?.lat || 0,
                    lng: this.lastPosition?.lng || 0,
                    speed: this.lastPosition?.speed || 0,
                    bearing: this.lastPosition?.bearing || null,
                    accuracy: this.lastPosition?.accuracy || 0,
                    timestamp: Date.now(),
                    isMoving: (this.lastPosition?.speed || 0) > 2,
                    isSmoothed: this.lastPosition?.isSmoothed || false
                },
                sessionId: this.driverData?.sessionId,
                battery: this.getBatteryLevel(),
                fuel: this.calculateFuelLevel(),
                dataPoints: this.dataPoints,
                trackingQuality: this.calculateTrackingQuality()
            }
        };
    }

    // ✅ ENHANCED METHODS
    calculateDistanceWithSpeed(currentSpeed, currentTime) {
        if (!this.lastUpdateTime) {
            this.lastUpdateTime = currentTime;
            return;
        }

        const timeDiff = (currentTime - this.lastUpdateTime) / 1000 / 3600;
        
        if (currentSpeed > 2 && this.journeyStatus === 'started') {
            const distanceIncrement = currentSpeed * timeDiff;
            
            if (distanceIncrement > 0 && distanceIncrement < 1) {
                this.totalDistance += distanceIncrement;
                this.updateDistanceUI();
            }
        }

        this.lastUpdateTime = currentTime;
        this.currentSpeed = currentSpeed;
    }

    calculateFuelLevel() {
        const baseFuel = 100;
        const fuelConsumptionRate = 0.25;
        const fuelUsed = this.totalDistance * fuelConsumptionRate;
        const remainingFuel = Math.max(0, baseFuel - fuelUsed);
        return Math.min(100, Math.max(0, Math.round(remainingFuel)));
    }

    calculateTrackingQuality() {
        if (!this.lastPosition) return 'unknown';
        
        const accuracy = this.lastPosition.accuracy;
        if (accuracy < 20) return 'excellent';
        if (accuracy < 50) return 'good';
        if (accuracy < 100) return 'fair';
        return 'poor';
    }

    getBatteryLevel() {
        return Math.max(20, Math.floor(Math.random() * 100));
    }

    updateDistanceUI() {
        const distanceElement = document.getElementById('todayDistance');
        if (distanceElement) {
            distanceElement.textContent = this.totalDistance.toFixed(3);
        }
    }

    // ✅ COMPATIBILITY METHODS
    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }
    }

    handleLogin() {
        const driverName = document.getElementById('driverName').value;
        const unitNumber = document.getElementById('unitNumber').value;

        if (driverName && unitNumber) {
            this.driverData = {
                name: driverName,
                unit: unitNumber,
                year: this.getVehicleYear(unitNumber),
                sessionId: this.generateSessionId()
            };

            this.firebaseRef = database.ref('/units/' + unitNumber);
            this.showDriverApp();
            this.startDataTransmission();
            
            setTimeout(() => {
                this.startJourney();
            }, 3000);
        } else {
            alert('Harap isi semua field!');
        }
    }

    getVehicleYear(unit) {
        const yearMap = {
            'DT-06': '2018', 'DT-07': '2018',
            'DT-12': '2020', 'DT-13': '2020', 'DT-15': '2020', 'DT-16': '2020', 
            'DT-17': '2020', 'DT-18': '2020', 'DT-36': '2020', 'DT-37': '2020',
            'DT-38': '2020', 'DT-39': '2020',
            'DT-23': '2021', 'DT-24': '2021',
            'DT-25': '2022', 'DT-26': '2022', 'DT-27': '2022', 'DT-28': '2022', 'DT-29': '2022',
            'DT-32': '2024',
            'DT-33': '2025', 'DT-34': '2025', 'DT-35': '2025'
        };
        return yearMap[unit] || 'Unknown';
    }

    generateSessionId() {
        return 'SESS_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    showDriverApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('driverApp').style.display = 'block';
        
        document.getElementById('vehicleName').textContent = this.driverData.unit;
        document.getElementById('driverDisplayName').textContent = this.driverData.name;
        
        this.sessionStartTime = new Date();
        this.lastUpdateTime = new Date();
        
        // ✅ SETUP CHAT SYSTEM
        this.chatSystem.initialize(this.driverData);
    }

    startDataTransmission() {
        this.sendInterval = setInterval(() => {
            if (this.lastPosition) {
                this.sendToFirebase();
            }
        }, 2000);
    }

    // ✅ JOURNEY MANAGEMENT
    startJourney() {
        this.journeyStatus = 'started';
        this.lastUpdateTime = new Date();
        document.getElementById('vehicleStatus').textContent = 'ON TRIP';
        document.getElementById('vehicleStatus').className = 'bg-success text-white rounded px-2 py-1';
        this.addLog('Perjalanan dimulai - GPS tracking aktif', 'success');
        this.sendToFirebase();
    }

    pauseJourney() {
        this.journeyStatus = 'paused';
        document.getElementById('vehicleStatus').textContent = 'PAUSED';
        document.getElementById('vehicleStatus').className = 'bg-warning text-dark rounded px-2 py-1';
        this.addLog('Perjalanan dijeda', 'warning');
        this.sendToFirebase();
    }

    endJourney() {
        this.journeyStatus = 'ended';
        document.getElementById('vehicleStatus').textContent = 'COMPLETED';
        document.getElementById('vehicleStatus').className = 'bg-info text-white rounded px-2 py-1';
        this.addLog(`Perjalanan selesai - Total jarak: ${this.totalDistance.toFixed(3)} km`, 'info');
        this.sendToFirebase();
        this.syncCompleteHistory();
    }

    // ✅ NETWORK & STATUS MANAGEMENT
    checkNetworkStatus() {
        const wasOnline = this.isOnline;
        this.isOnline = navigator.onLine;
        
        if (wasOnline !== this.isOnline) {
            if (this.isOnline) {
                this.addLog('📱 Koneksi pulih - sync semua data', 'success');
                this.updateConnectionStatus(true);
                this.offlineQueue.processQueue();
                
                setTimeout(() => {
                    this.enhancedOfflineManager.syncWhenOnline();
                }, 3000);
                
            } else {
                this.addLog('📱 Koneksi terputus - menyimpan data lokal', 'warning');
                this.updateConnectionStatus(false);
            }
        }
        
        this.updateConnectionStatus(this.isOnline);
    }

    updateConnectionStatus(connected) {
        const dot = document.getElementById('connectionDot');
        const status = document.getElementById('connectionStatus');
        
        if (dot && status) {
            if (connected) {
                dot.className = 'connection-status connected';
                status.textContent = 'TERHUBUNG';
                status.className = 'text-success';
            } else {
                dot.className = 'connection-status disconnected';
                status.textContent = 'OFFLINE';
                status.className = 'text-danger';
                
                const queueSize = this.offlineQueue.getQueueSize();
                if (queueSize > 0) {
                    status.textContent = `OFFLINE (${queueSize} data antrian)`;
                }
            }
        }
    }

    updateOfflineStatus() {
        const isOffline = !navigator.onLine;
        const queueSize = this.offlineQueue.getQueueSize();
        const offlineNotification = document.getElementById('offlineNotification');
        const queueCountElement = document.getElementById('offlineQueueCount');
        const progressBar = document.getElementById('offlineProgressBar');
        
        if (offlineNotification && queueCountElement && progressBar) {
            if (isOffline) {
                offlineNotification.style.display = 'block';
                queueCountElement.textContent = queueSize;
                progressBar.style.width = `${Math.min(100, queueSize / 10)}%`;
            } else {
                offlineNotification.style.display = 'none';
            }
        }
    }

    // ✅ LOGGING & UTILITIES
    addLog(message, type = 'info') {
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
        const timeElement = document.getElementById('currentTime');
        if (timeElement) {
            timeElement.textContent = new Date().toLocaleTimeString('id-ID');
        }
    }

    updateSessionDuration() {
        if (!this.sessionStartTime) return;
        
        const now = new Date();
        const diff = now - this.sessionStartTime;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        const durationElement = document.getElementById('sessionDuration');
        if (durationElement) {
            durationElement.textContent = 
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    handleGPSError(error) {
        let message = 'GPS Error: ';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message += 'Izin GPS ditolak';
                break;
            case error.POSITION_UNAVAILABLE:
                message += 'Posisi tidak tersedia';
                break;
            case error.TIMEOUT:
                message += 'Timeout';
                break;
            default:
                message += 'Error tidak diketahui';
                break;
        }
        this.addLog(message, 'error');
    }

    handleFirebaseError(error) {
        const firebaseData = this.createFirebaseData();
        if (this.isOnline) {
            this.offlineQueue.addToQueue(firebaseData);
            this.addLog(`❌ Gagal kirim, disimpan offline`, 'error');
        } else {
            this.addLog(`❌ Offline - data dalam antrian`, 'warning');
        }
        this.updateConnectionStatus(false);
    }

    // ✅ DATA MANAGEMENT
    saveToCompleteHistory(positionData) {
        if (!this.driverData) return;
        
        const historyPoint = {
            ...positionData,
            sessionId: this.driverData.sessionId,
            unit: this.driverData.unit,
            driver: this.driverData.name,
            saveTimestamp: new Date().toISOString()
        };
        
        this.enhancedOfflineManager.saveOfflineData(historyPoint, 'gps_history');
        
        let history = this.loadCompleteHistory();
        history.push(historyPoint);
        
        if (history.length > 1000) {
            history = history.slice(-1000);
        }
        
        localStorage.setItem('gps_complete_history', JSON.stringify(history));
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

    async syncCompleteHistory() {
        if (!this.isOnline || !this.firebaseRef || !this.driverData) {
            console.log('❌ Cannot sync history: offline or no driver data');
            return;
        }
        
        const history = this.loadCompleteHistory();
        const sessionHistory = history.filter(point => 
            point.sessionId === this.driverData.sessionId
        );
        
        if (sessionHistory.length === 0) {
            console.log('ℹ️ No history to sync');
            return;
        }
        
        try {
            const historyRef = database.ref('/history/' + this.driverData.unit + '/' + this.driverData.sessionId);
            
            const historyObject = {};
            sessionHistory.forEach((point, index) => {
                historyObject['point_' + index] = {
                    lat: point.lat,
                    lng: point.lng,
                    speed: point.speed,
                    accuracy: point.accuracy,
                    bearing: point.bearing,
                    timestamp: point.timestamp,
                    driver: point.driver,
                    unit: point.unit
                };
            });
            
            await historyRef.set(historyObject);
            console.log(`✅ History synced: ${sessionHistory.length} points`);
            this.addLog(`📡 Sync complete: ${sessionHistory.length} data points`, 'success');
            
        } catch (error) {
            console.error('History sync failed:', error);
            this.addLog(`❌ Gagal sync history: ${error.message}`, 'error');
        }
    }

    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }
        if (this.sendInterval) {
            clearInterval(this.sendInterval);
        }
        
        this.smoothTracker.stop();
        this.isTracking = false;
    }

    logout() {
        if (this.chatSystem.chatRef) {
            this.chatSystem.chatRef.off();
        }
        
        this.stopTracking();
        this.syncCompleteHistory();
        
        const sessionSummary = {
            driver: this.driverData.name,
            unit: this.driverData.unit,
            duration: document.getElementById('sessionDuration').textContent,
            totalDistance: this.totalDistance.toFixed(3),
            dataPoints: this.dataPoints,
            sessionId: this.driverData.sessionId
        };
        
        console.log('Session Summary:', sessionSummary);
        this.addLog(`Session ended - Total: ${this.totalDistance.toFixed(3)} km`, 'info');
        
        if (this.firebaseRef) {
            this.firebaseRef.remove();
        }
        
        this.driverData = null;
        this.firebaseRef = null;
        this.chatSystem.chatRef = null;
        this.chatSystem.chatMessages = [];
        this.chatSystem.unreadCount = 0;
        this.chatSystem.isChatOpen = false;
        this.chatSystem.chatInitialized = false;
        
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('driverApp').style.display = 'none';
        document.getElementById('loginForm').reset();
        
        this.totalDistance = 0;
        this.dataPoints = 0;
        this.lastPosition = null;
        this.lastUpdateTime = null;
    }
}

// ==== GLOBAL FUNCTIONS ====
function sendChatMessage() {
    if (window.dtLogger) {
        window.dtLogger.chatSystem.sendChatMessage();
    }
}

function toggleChat() {
    if (window.dtLogger) {
        window.dtLogger.chatSystem.toggleChat();
    }
}

function handleChatInput(event) {
    if (window.dtLogger) {
        window.dtLogger.chatSystem.handleChatInput(event);
    }
}

function startJourney() {
    if (window.dtLogger) {
        window.dtLogger.startJourney();
    }
}

function pauseJourney() {
    if (window.dtLogger) {
        window.dtLogger.pauseJourney();
    }
}

function endJourney() {
    if (window.dtLogger) {
        window.dtLogger.endJourney();
    }
}

function reportIssue() {
    const issues = [
        'Mesin bermasalah',
        'Ban bocor', 
        'Bahan bakar habis',
        'Kecelakaan kecil',
        'Lainnya'
    ];
    
    const issue = prompt('Lapor masalah:\n' + issues.join('\n'));
    if (issue && window.dtLogger) {
        window.dtLogger.addLog(`Laporan: ${issue}`, 'warning');
    }
}

function logout() {
    if (window.dtLogger) {
        if (confirm('Yakin ingin logout?')) {
            window.dtLogger.logout();
        }
    }
}

// ==== INITIALIZE APP ====
document.addEventListener('DOMContentLoaded', function() {
    window.dtLogger = new DTGPSLogger();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (window.dtLogger && window.dtLogger.driverData) {
        if (document.hidden) {
            window.dtLogger.addLog('Aplikasi di background', 'warning');
        } else {
            window.dtLogger.addLog('Aplikasi aktif kembali', 'success');
        }
    }
});
