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

// ==== ENHANCED SMOOTH GPS TRACKING SYSTEM ====
class SmoothGPSTracker {
    constructor() {
        this.positionBuffer = [];
        this.smoothingEnabled = true;
        this.lastSentPosition = null;
        this.sendInterval = 1000; // Kirim setiap 1 detik
        this.smoothingWindow = 5; // Buffer 5 posisi untuk smoothing
        
        // Enhanced GPS options
        this.gpsOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
            distanceFilter: 2 // Minimum 2 meter perubahan
        };
    }

    // Enhanced position handler dengan smoothing
    handlePositionUpdate(position) {
        const rawPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            speed: position.coords.speed !== null ? position.coords.speed * 3.6 : 0,
            accuracy: position.coords.accuracy,
            bearing: position.coords.heading,
            timestamp: Date.now(),
            altitude: position.coords.altitude
        };

        // Validasi data GPS
        if (!this.isValidPosition(rawPosition)) {
            console.warn('Invalid GPS position, skipping');
            return;
        }

        // Smoothing algorithm
        const smoothedPosition = this.smoothingEnabled ? 
            this.applySmoothing(rawPosition) : rawPosition;

        // Simpan ke buffer untuk real-time
        this.addToBuffer(smoothedPosition);

        // Update UI immediately
        this.updateRealTimeUI(smoothedPosition);

        // Kirim ke Firebase dengan interval yang dikontrol
        this.sendToFirebaseIfNeeded(smoothedPosition);
    }

    // Kalman Filter untuk smoothing GPS
    applySmoothing(newPosition) {
        if (this.positionBuffer.length === 0) {
            return newPosition;
        }

        // Simple moving average untuk lat/lng
        const window = this.positionBuffer.slice(-this.smoothingWindow);
        window.push(newPosition);

        const avgLat = window.reduce((sum, pos) => sum + pos.lat, 0) / window.length;
        const avgLng = window.reduce((sum, pos) => sum + pos.lng, 0) / window.length;
        
        // Weighted average berdasarkan accuracy
        const accuracyWeight = Math.max(0.1, 1 - (newPosition.accuracy / 50));
        
        return {
            ...newPosition,
            lat: (avgLat * 0.3) + (newPosition.lat * 0.7 * accuracyWeight),
            lng: (avgLng * 0.3) + (newPosition.lng * 0.7 * accuracyWeight),
            accuracy: newPosition.accuracy,
            isSmoothed: true
        };
    }

    // Validasi posisi seperti Google Maps
    isValidPosition(position) {
        // Check coordinate bounds (Indonesia area)
        if (position.lat < -11 || position.lat > 6 || 
            position.lng < 95 || position.lng > 141) {
            return false;
        }

        // Check accuracy
        if (position.accuracy > 100) { // Accuracy > 100m dianggap tidak akurat
            console.warn('Poor GPS accuracy:', position.accuracy);
            return false;
        }

        // Check for sudden jumps (lebih dari 500m dalam 1 detik = tidak mungkin)
        if (this.lastSentPosition) {
            const distance = this.calculateDistance(
                this.lastSentPosition.lat, this.lastSentPosition.lng,
                position.lat, position.lng
            );
            const timeDiff = (position.timestamp - this.lastSentPosition.timestamp) / 1000;
            
            if (timeDiff > 0 && distance / timeDiff > 500) { // 500 m/s = 1800 km/h
                console.warn('Impossible speed detected, filtering position');
                return false;
            }
        }

        return true;
    }

    // Kirim data hanya jika ada perubahan signifikan
    sendToFirebaseIfNeeded(currentPosition) {
        const now = Date.now();
        
        if (!this.lastSentPosition || 
            now - this.lastSentPosition.timestamp >= this.sendInterval) {
            
            // Check jika ada perubahan posisi yang signifikan
            if (this.isSignificantChange(currentPosition)) {
                this.sendToFirebase(currentPosition);
                this.lastSentPosition = { ...currentPosition, timestamp: now };
            }
        }
    }

    // Cek perubahan signifikan (min 5 meter atau bearing berubah)
    isSignificantChange(newPosition) {
        if (!this.lastSentPosition) return true;

        const distance = this.calculateDistance(
            this.lastSentPosition.lat, this.lastSentPosition.lng,
            newPosition.lat, newPosition.lng
        );

        const bearingDiff = Math.abs(
            (newPosition.bearing || 0) - (this.lastSentPosition.bearing || 0)
        );

        return distance >= 5 || bearingDiff >= 10; // 5 meter atau 10 derajat
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth radius in meters
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
        
        // Maintain buffer size
        if (this.positionBuffer.length > 20) {
            this.positionBuffer = this.positionBuffer.slice(-20);
        }
    }

    updateRealTimeUI(position) {
        // Immediate UI update untuk feel yang real-time
        requestAnimationFrame(() => {
            const latElement = document.getElementById('currentLat');
            const lngElement = document.getElementById('currentLng');
            const speedElement = document.getElementById('currentSpeed');
            
            if (latElement) latElement.textContent = position.lat.toFixed(6);
            if (lngElement) lngElement.textContent = position.lng.toFixed(6);
            if (speedElement) speedElement.textContent = position.speed.toFixed(1);
        });
    }
}

// ==== ENHANCED OFFLINE MANAGER ====
class EnhancedOfflineManager {
    constructor() {
        this.offlineData = {
            queue: [],          // Data yang belum terkirim
            history: [],        // Complete history
            sessions: [],       // Session data
            lastSync: null      // Last successful sync
        };
        this.maxStorageDays = 30; // Simpan data maksimal 30 hari
        this.localDatabase = null;
        this.initLocalDatabase();
    }
    
    async initLocalDatabase() {
        if ('indexedDB' in window) {
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
                
                // Buat store untuk GPS data
                if (!db.objectStoreNames.contains('gpsData')) {
                    const store = db.createObjectStore('gpsData', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('sessionId', 'sessionId', { unique: false });
                    store.createIndex('synced', 'synced', { unique: false });
                }
                
                // Buat store untuk chat messages
                if (!db.objectStoreNames.contains('chatMessages')) {
                    const store = db.createObjectStore('chatMessages', { 
                        keyPath: 'id',
                        autoIncrement: true 
                    });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('synced', 'synced', { unique: false });
                }
            };
            
            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject(event.target.error);
        });
    }
    
    // Simpan data dengan timestamp dan expiry
    saveOfflineData(data, type = 'gps') {
        const offlineRecord = {
            data: data,
            type: type,
            timestamp: new Date().toISOString(),
            expiry: this.getExpiryDate(),
            id: this.generateOfflineId(),
            synced: false
        };
        
        this.addToOfflineStorage(offlineRecord);
    }
    
    getExpiryDate() {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + this.maxStorageDays);
        return expiry.toISOString();
    }
    
    generateOfflineId() {
        return 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async addToOfflineStorage(record) {
        // Save to IndexedDB jika available
        if (this.localDatabase) {
            try {
                const transaction = this.localDatabase.transaction(['gpsData'], 'readwrite');
                const store = transaction.objectStore('gpsData');
                await store.add(record);
            } catch (error) {
                console.error('Failed to save to IndexedDB:', error);
                this.fallbackToLocalStorage(record);
            }
        } else {
            this.fallbackToLocalStorage(record);
        }
    }
    
    fallbackToLocalStorage(record) {
        // Fallback ke localStorage
        const existing = JSON.parse(localStorage.getItem('gps_offline_backup') || '[]');
        existing.push(record);
        
        // Maintain size limit
        if (existing.length > 1000) {
            existing = existing.slice(-1000);
        }
        
        localStorage.setItem('gps_offline_backup', JSON.stringify(existing));
    }
    
    // Auto-clean expired data
    cleanupExpiredData() {
        const now = new Date();
        this.offlineData.queue = this.offlineData.queue.filter(item => 
            new Date(item.expiry) > now
        );
        this.saveToStorage();
    }
    
    // Smart sync ketika online
    async syncWhenOnline() {
        if (!navigator.onLine) return;
        
        console.log('🔄 Starting smart offline data sync...');
        
        // Sync dari IndexedDB pertama
        if (this.localDatabase) {
            await this.syncIndexedDBData();
        }
        
        // Sync dari localStorage backup
        await this.syncLocalStorageData();
        
        console.log('✅ Offline data sync completed');
    }
    
    async syncIndexedDBData() {
        try {
            const transaction = this.localDatabase.transaction(['gpsData'], 'readonly');
            const store = transaction.objectStore('gpsData');
            const unsyncedData = await store.index('synced').getAll(IDBKeyRange.only(false));
            
            for (const data of unsyncedData) {
                try {
                    await this.syncSingleRecord(data);
                    await this.markAsSynced(data.id);
                } catch (error) {
                    console.warn('Failed to sync record:', data.id, error);
                }
            }
        } catch (error) {
            console.error('IndexedDB sync error:', error);
        }
    }
    
    async syncLocalStorageData() {
        try {
            const backupData = JSON.parse(localStorage.getItem('gps_offline_backup') || '[]');
            const unsynced = backupData.filter(item => !item.synced);
            
            for (const data of unsynced) {
                try {
                    await this.syncSingleRecord(data);
                    data.synced = true;
                } catch (error) {
                    console.warn('Failed to sync backup record:', data.id, error);
                }
            }
            
            localStorage.setItem('gps_offline_backup', JSON.stringify(backupData));
        } catch (error) {
            console.error('LocalStorage sync error:', error);
        }
    }
    
    async syncSingleRecord(record, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                // Implement your Firebase update logic here
                await this.sendToFirebase(record.data);
                return true;
            } catch (error) {
                if (attempt === retries) throw error;
                await this.delay(1000 * attempt); // Exponential backoff
            }
        }
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
}

class DTGPSLogger {
    constructor() {
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
        
        // Enhanced distance calculation
        this.lastUpdateTime = null;
        this.currentSpeed = 0;
        this.movingStartTime = null;
        this.isCurrentlyMoving = false;
        
        // Complete history tracking
        this.offlineHistory = [];
        this.maxOfflinePoints = 1000;
        this.isCollectingOfflineData = false;
        this.completeHistory = this.loadCompleteHistory();
        
        // ✅ ENHANCED: Smooth GPS Tracking
        this.smoothTracker = new SmoothGPSTracker();
        
        // ✅ ENHANCED: Offline Manager
        this.enhancedOfflineManager = new EnhancedOfflineManager();
        
        // ✅ CHAT SYSTEM PROPERTIES - SESUAI DENGAN HTML BARU
        this.chatRef = null;
        this.chatMessages = [];
        this.unreadCount = 0;
        this.isChatOpen = false;
        this.chatInitialized = false;
        
        this.offlineQueue = new OfflineQueueManager();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTime();
        this.checkNetworkStatus();
        setInterval(() => this.updateTime(), 1000);
        setInterval(() => this.checkNetworkStatus(), 5000);
        
        // Enhanced offline status monitoring
        setInterval(() => this.updateOfflineStatus(), 2000);
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
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
            
            // ✅ ENHANCED: Clean data format sebelum kirim ke Firebase
            const cleanData = {
                driver: driverName,
                unit: unitNumber,
                sessionId: this.driverData.sessionId,
                journeyStatus: 'ready',
                lastUpdate: new Date().toLocaleTimeString('id-ID'),
                lat: 0,
                lng: 0,
                speed: 0,
                distance: 0,
                fuel: 100,
                accuracy: 0,
                timestamp: new Date().toISOString()
            };

            this.firebaseRef.set(cleanData);

            this.showDriverApp();
            this.startEnhancedGPSTracking(); // ✅ ENHANCED: High-precision GPS
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
        this.updateSessionDuration();
        
        // ✅ SETUP CHAT SYSTEM SETELAH LOGIN - SESUAI DENGAN HTML BARU
        this.setupChatSystem();
        
        // ✅ ENHANCED: Setup offline status display
        this.setupOfflineStatusDisplay();
    }

    // ✅ ENHANCED: High-precision GPS setup
    startEnhancedGPSTracking() {
        if (!navigator.geolocation) {
            this.addLog('GPS tidak didukung di browser ini', 'error');
            return;
        }

        this.isTracking = true;
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
            distanceFilter: 1 // 1 meter minimum change
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.smoothTracker.handlePositionUpdate(position),
            (error) => this.handleGPSError(error),
            options
        );

        this.addLog('🚀 Enhanced GPS tracking aktif - WhatsApp/Google Maps style', 'success');
    }

    // ✅ ENHANCED: Setup offline status display
    setupOfflineStatusDisplay() {
        const statusHtml = `
            <div id="offlineStatusContainer" class="offline-status-container">
                <div id="offlineNotification" class="offline-notification" style="display: none;">
                    <div class="offline-header">
                        <span>📴 Mode Offline</span>
                        <small>Data disimpan secara lokal</small>
                    </div>
                    <div class="offline-info">
                        <span>Data dalam antrian: <strong id="offlineQueueCount">0</strong></span>
                        <div class="offline-progress">
                            <div id="offlineProgressBar" class="progress-bar" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('driverApp').insertAdjacentHTML('afterbegin', statusHtml);
    }

    // ✅ ENHANCED: Update offline status
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
        
        // Update connection status
        this.updateConnectionStatus(!isOffline);
    }

    // ✅ CHAT METHOD: Setup chat system - SESUAI DENGAN HTML BARU
    setupChatSystem() {
        if (!this.driverData) return;
        
        this.chatRef = database.ref('/chat/' + this.driverData.unit);
        
        // Listen untuk pesan baru
        this.chatRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            this.handleNewMessage(message);
        });
        
        this.chatInitialized = true;
        console.log('💬 Chat system activated for unit:', this.driverData.unit);
        this.addLog('Sistem chat aktif - bisa komunikasi dengan monitor', 'success');
    }

    // ✅ CHAT METHOD: Handle pesan baru
    handleNewMessage(message) {
        if (!message || message.sender === this.driverData.name) return;
        
        this.chatMessages.push(message);
        this.unreadCount++;
        
        this.updateChatUI();
        
        if (!this.isChatOpen) {
            this.showChatNotification(message);
        }
        
        console.log('💬 New message:', message);
    }

    // ✅ CHAT METHOD: Kirim pesan
    async sendMessage(messageText) {
        if (!messageText.trim() || !this.chatRef || !this.driverData) return;
        
        const messageData = {
            text: messageText.trim(),
            sender: this.driverData.name,
            unit: this.driverData.unit,
            timestamp: new Date().toISOString(),
            timeDisplay: new Date().toLocaleTimeString('id-ID'),
            type: 'driver'
        };
        
        try {
            await this.chatRef.push(messageData);
            this.addLog(`💬 Pesan terkirim: "${messageText}"`, 'info');
            
        } catch (error) {
            console.error('Failed to send message:', error);
            this.addLog('❌ Gagal mengirim pesan', 'error');
        }
    }

    // ✅ CHAT METHOD: Update chat UI - SESUAI DENGAN HTML BARU
    updateChatUI() {
        const messageList = document.getElementById('chatMessages');
        const unreadBadge = document.getElementById('unreadBadge');
        const chatToggle = document.getElementById('chatToggle');
        
        if (!messageList) return;
        
        // Update unread badge
        if (unreadBadge) {
            unreadBadge.textContent = this.unreadCount > 0 ? this.unreadCount : '';
            unreadBadge.style.display = this.unreadCount > 0 ? 'block' : 'none';
        }
        
        // Update chat toggle button
        if (chatToggle) {
            chatToggle.innerHTML = this.unreadCount > 0 ? 
                `💬 Chat <span class="badge bg-danger">${this.unreadCount}</span>` : 
                '💬 Chat';
        }
        
        // Render messages
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
            messageElement.className = `chat-message ${message.sender === this.driverData.name ? 'message-sent' : 'message-received'}`;
            
            messageElement.innerHTML = `
                <div class="message-content">
                    ${message.sender !== this.driverData.name ? 
                      `<div class="message-sender">${this.escapeHtml(message.sender)}</div>` : ''}
                    <div class="message-text">${this.escapeHtml(message.text)}</div>
                    <div class="message-time">${message.timeDisplay}</div>
                </div>
            `;
            
            messageList.appendChild(messageElement);
        });
        
        // Auto scroll to bottom
        messageList.scrollTop = messageList.scrollHeight;
    }

    // ✅ CHAT METHOD: Toggle chat window - SESUAI DENGAN HTML BARU
    toggleChat() {
        this.isChatOpen = !this.isChatOpen;
        const chatWindow = document.getElementById('chatWindow');
        
        if (chatWindow) {
            chatWindow.style.display = this.isChatOpen ? 'block' : 'none';
            
            if (this.isChatOpen) {
                this.unreadCount = 0;
                this.updateChatUI();
                // Focus input field
                setTimeout(() => {
                    const chatInput = document.getElementById('chatInput');
                    if (chatInput) chatInput.focus();
                }, 100);
            }
        }
    }

    // ✅ CHAT METHOD: Handle chat input - SESUAI DENGAN HTML BARU
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

    // ✅ CHAT METHOD: Show notification
    showChatNotification(message) {
        // Buat notification element
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
        
        // Auto remove setelah 5 detik
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // ✅ CHAT METHOD: Escape HTML untuk keamanan
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    startDataTransmission() {
        this.sendInterval = setInterval(() => {
            if (this.lastPosition) {
                this.sendToFirebase();
            }
        }, 2000);
    }

    // Enhanced position update dengan smooth tracking
    handlePositionUpdate(position) {
        // Delegate to smooth tracker
        this.smoothTracker.handlePositionUpdate(position);
    }

    // Simpan semua titik ke localStorage
    saveToCompleteHistory(positionData) {
        if (!this.driverData) return;
        
        const historyPoint = {
            ...positionData,
            sessionId: this.driverData.sessionId,
            unit: this.driverData.unit,
            driver: this.driverData.name,
            saveTimestamp: new Date().toISOString()
        };
        
        // ✅ ENHANCED: Save to enhanced offline manager
        this.enhancedOfflineManager.saveOfflineData(historyPoint, 'gps_history');
        
        // Juga simpan ke localStorage untuk compatibility
        let history = this.loadCompleteHistory();
        history.push(historyPoint);
        
        if (history.length > this.maxOfflinePoints) {
            history = history.slice(-this.maxOfflinePoints);
        }
        
        localStorage.setItem('gps_complete_history', JSON.stringify(history));
        this.completeHistory = history;
        
        console.log(`💾 Saved to enhanced history: ${history.length} points`);
    }

    // Load history dari localStorage
    loadCompleteHistory() {
        try {
            const saved = localStorage.getItem('gps_complete_history');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    }

    // ✅ ENHANCED: Validasi GPS coordinates
    isValidCoordinate(lat, lng) {
        // Check for reasonable coordinates (Kebun Tempuling area)
        if (lat < -1 || lat > 1 || lng < 102.5 || lng > 103.5) {
            return false;
        }
        
        // Check for NaN values
        if (isNaN(lat) || isNaN(lng)) {
            return false;
        }
        
        return true;
    }

    // Enhanced distance calculation menggunakan rumus S = V × t
    calculateDistanceWithSpeed(currentSpeed, currentTime) {
        if (!this.lastUpdateTime) {
            this.lastUpdateTime = currentTime;
            return;
        }

        // Hitung selisih waktu dalam jam
        const timeDiff = (currentTime - this.lastUpdateTime) / 1000 / 3600;
        
        // Hanya hitung jika ada pergerakan (speed > 2 km/h untuk menghindari drift GPS)
        if (currentSpeed > 2 && this.journeyStatus === 'started') {
            // Rumus: Jarak (km) = Kecepatan (km/jam) × Waktu (jam)
            const distanceIncrement = currentSpeed * timeDiff;
            
            // Hanya tambahkan jika perhitungan valid
            if (distanceIncrement > 0 && distanceIncrement < 1) {
                this.totalDistance += distanceIncrement;
                document.getElementById('todayDistance').textContent = this.totalDistance.toFixed(3);
                
                this.addLog(`📏 +${(distanceIncrement * 1000).toFixed(1)}m (${currentSpeed.toFixed(1)} km/h)`, 'info');
            }
            
            this.isCurrentlyMoving = true;
            this.movingStartTime = this.movingStartTime || currentTime;
        } else {
            this.isCurrentlyMoving = false;
            this.movingStartTime = null;
        }

        this.lastUpdateTime = currentTime;
        this.currentSpeed = currentSpeed;
    }

    // Alternatif: Perhitungan jarak menggunakan koordinat GPS
    calculateDistanceWithCoordinates(lat1, lon1, lat2, lon2) {
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

    updateAverageSpeed() {
        if (this.dataPoints > 0 && this.sessionStartTime) {
            const duration = (new Date() - this.sessionStartTime) / 3600000;
            const avgSpeed = duration > 0 ? this.totalDistance / duration : 0;
            document.getElementById('avgSpeed').textContent = avgSpeed.toFixed(1);
        }
    }

    async sendToFirebase() {
        if (!this.firebaseRef || !this.lastPosition) return;

        try {
            // ✅ ENHANCED: Clean and validate data before sending
            const gpsData = {
                driver: this.driverData.name,
                unit: this.driverData.unit,
                lat: parseFloat(this.lastPosition.lat.toFixed(6)),
                lng: parseFloat(this.lastPosition.lng.toFixed(6)),
                speed: parseFloat(this.lastPosition.speed.toFixed(1)),
                accuracy: parseFloat(this.lastPosition.accuracy.toFixed(1)),
                bearing: this.lastPosition.bearing ? parseFloat(this.lastPosition.bearing.toFixed(0)) : null,
                timestamp: new Date().toISOString(),
                lastUpdate: new Date().toLocaleTimeString('id-ID'),
                distance: parseFloat(this.totalDistance.toFixed(3)),
                journeyStatus: this.journeyStatus,
                batteryLevel: this.getBatteryLevel(),
                sessionId: this.driverData.sessionId,
                isOfflineData: false,
                fuel: this.calculateFuelLevel()
            };

            // Validate data before sending
            if (!this.isValidCoordinate(gpsData.lat, gpsData.lng)) {
                console.warn('Invalid coordinates, skipping Firebase update');
                return;
            }

            if (this.isOnline) {
                await this.firebaseRef.set(gpsData);
                this.addLog(`📡 Data terkirim: ${this.lastPosition.speed.toFixed(1)} km/h | ${this.totalDistance.toFixed(3)} km`, 'success');
                this.updateConnectionStatus(true);
                
                if (this.offlineQueue.getQueueSize() > 0) {
                    this.offlineQueue.processQueue();
                }
                
                // ✅ ENHANCED: Sync enhanced offline data
                this.enhancedOfflineManager.syncWhenOnline();
            } else {
                this.offlineQueue.addToQueue(gpsData);
                this.addLog(`💾 Data disimpan offline (${this.offlineQueue.getQueueSize()} dalam antrian)`, 'warning');
                this.updateConnectionStatus(false);
            }
            
        } catch (error) {
            console.error('Error sending to Firebase:', error);
            
            if (this.isOnline) {
                this.offlineQueue.addToQueue(gpsData);
                this.addLog(`❌ Gagal kirim, disimpan offline`, 'error');
            } else {
                this.addLog(`❌ Offline - data dalam antrian`, 'warning');
            }
            this.updateConnectionStatus(false);
        }
    }

    // ✅ NEW: Calculate fuel level based on distance
    calculateFuelLevel() {
        const baseFuel = 100;
        const fuelConsumptionRate = 0.25; // liters per km
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
                this.addLog('📱 Koneksi pulih - sync semua data', 'success');
                this.updateConnectionStatus(true);
                
                // Sync bertahap
                this.offlineQueue.processQueue();
                
                // ✅ ENHANCED: Sync enhanced offline data
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

    addLog(message, type = 'info') {
        const logContainer = document.getElementById('dataLogs');
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
        document.getElementById('currentTime').textContent = 
            new Date().toLocaleTimeString('id-ID');
    }

    updateSessionDuration() {
        if (!this.sessionStartTime) return;
        
        const now = new Date();
        const diff = now - this.sessionStartTime;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        document.getElementById('sessionDuration').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        setTimeout(() => this.updateSessionDuration(), 1000);
    }

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

    logout() {
        // Cleanup chat listener
        if (this.chatRef) {
            this.chatRef.off();
        }
        
        this.stopTracking();
        this.syncCompleteHistory();
        
        const sessionSummary = {
            driver: this.driverData.name,
            unit: this.driverData.unit,
            duration: document.getElementById('sessionDuration').textContent,
            totalDistance: this.totalDistance.toFixed(3),
            dataPoints: this.dataPoints,
            avgSpeed: document.getElementById('avgSpeed').textContent,
            sessionId: this.driverData.sessionId
        };
        
        console.log('Session Summary:', sessionSummary);
        this.addLog(`Session ended - Total: ${this.totalDistance.toFixed(3)} km`, 'info');
        
        this.driverData = null;
        this.firebaseRef = null;
        this.chatRef = null;
        this.chatMessages = [];
        this.unreadCount = 0;
        this.isChatOpen = false;
        this.chatInitialized = false;
        
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('driverApp').style.display = 'none';
        document.getElementById('loginForm').reset();
        
        // Reset semua data
        this.totalDistance = 0;
        this.dataPoints = 0;
        this.lastPosition = null;
        this.lastUpdateTime = null;
    }

    // Sync semua history ke Firebase
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
            // Kirim ke Firebase under history node
            const historyRef = database.ref('/history/' + this.driverData.unit + '/' + this.driverData.sessionId);
            
            // Push semua data sebagai object
            const historyObject = {};
            sessionHistory.forEach((point, index) => {
                historyObject['point_' + index] = {
                    lat: point.lat,
                    lng: point.lng,
                    speed: point.speed,
                    accuracy: point.accuracy,
                    bearing: point.bearing,
                    timestamp: point.timestamp,
                    isOnline: point.isOnline,
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
}

// Offline Queue Manager
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
        
        if (successItems.length > 0) {
            window.dtLogger?.addLog(`📡 Sync offline: ${successItems.length} data terkirim`, 'success');
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

// ✅ GLOBAL FUNCTIONS UNTUK CHAT - SESUAI DENGAN HTML BARU
function sendChatMessage() {
    if (window.dtLogger) {
        const input = document.getElementById('chatInput');
        if (input && input.value.trim()) {
            window.dtLogger.sendMessage(input.value);
            input.value = '';
        }
    }
}

function toggleChat() {
    if (window.dtLogger) {
        window.dtLogger.toggleChat();
    }
}

function handleChatInput(event) {
    if (window.dtLogger) {
        window.dtLogger.handleChatInput(event);
    }
}

// Global functions untuk button controls
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

// Initialize app
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
