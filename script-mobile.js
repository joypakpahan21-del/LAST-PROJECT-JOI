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

// ✅ ENHANCED CIRCULAR BUFFER IMPLEMENTATION
class CircularBuffer {
    constructor(capacity) {
        this.capacity = capacity; // 61,200
        this.buffer = new Array(capacity);
        this.head = 0;
        this.tail = 0;
        this.count = 0;
        this.isFull = false;
    }

    push(item) {
        this.buffer[this.tail] = item;
        this.tail = (this.tail + 1) % this.capacity;
        
        if (this.isFull) {
            this.head = (this.head + 1) % this.capacity;
        } else {
            this.count++;
            if (this.count === this.capacity) {
                this.isFull = true;
            }
        }
    }

    getAll() {
        if (this.count === 0) return [];
        
        const result = [];
        if (this.isFull) {
            for (let i = 0; i < this.capacity; i++) {
                const index = (this.head + i) % this.capacity;
                result.push(this.buffer[index]);
            }
        } else {
            for (let i = 0; i < this.count; i++) {
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
        this.count = 0;
        this.isFull = false;
        this.buffer = new Array(this.capacity);
    }

    get count() {
        return this.isFull ? this.capacity : this.tail;
    }
}

// ✅ ENHANCED STORAGE MANAGER
class EnhancedStorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            WAYPOINTS: 'enhanced_gps_waypoints',
            SYNC_STATUS: 'enhanced_sync_status',
            SESSION_DATA: 'enhanced_session_data'
        };
        this.maxStorageSize = 5 * 1024 * 1024; // 5MB
    }

    saveWaypoint(waypoint) {
        try {
            const existing = this.loadAllWaypoints();
            
            // Check storage limits
            if (existing.length >= 61200) {
                // Remove oldest waypoints
                existing.splice(0, Math.floor(existing.length * 0.1)); // Remove oldest 10%
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
            this.handleStorageError(error, waypoint);
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
    }

    saveToStorage(waypoints) {
        try {
            const compressed = this.compressWaypoints(waypoints);
            localStorage.setItem(this.STORAGE_KEYS.WAYPOINTS, JSON.stringify(compressed));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                this.handleStorageFull(waypoints);
            } else {
                throw error;
            }
        }
    }

    compressWaypoints(waypoints) {
        return waypoints.map(wp => ({
            i: wp.id,           // id
            a: wp.lat,          // lat
            o: wp.lng,          // lng  
            c: wp.accuracy,     // accuracy
            s: wp.speed,        // speed
            b: wp.bearing,      // bearing
            t: wp.timestamp,    // timestamp
            d: wp.timeDisplay,  // timeDisplay
            z: wp.sessionId,    // sessionId
            u: wp.unit,         // unit
            r: wp.driver,       // driver
            y: wp.synced ? 1 : 0, // synced
            n: wp.isOnline ? 1 : 0 // isOnline
        }));
    }

    decompressWaypoints(compressed) {
        return compressed.map(wp => ({
            id: wp.i,
            lat: wp.a,
            lng: wp.o,
            accuracy: wp.c,
            speed: wp.s,
            bearing: wp.b,
            timestamp: wp.t,
            timeDisplay: wp.d,
            sessionId: wp.z,
            unit: wp.u,
            driver: wp.r,
            synced: wp.y === 1,
            isOnline: wp.n === 1
        }));
    }

    updateSyncStatus(status) {
        const existing = this.getSyncStatus();
        localStorage.setItem(this.STORAGE_KEYS.SYNC_STATUS, JSON.stringify({
            ...existing,
            ...status,
            updatedAt: new Date().toISOString()
        }));
    }

    getSyncStatus() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.SYNC_STATUS);
            return data ? JSON.parse(data) : {
                totalWaypoints: 0,
                unsyncedCount: 0,
                lastSync: null,
                lastSave: null
            };
        } catch (error) {
            return {
                totalWaypoints: 0,
                unsyncedCount: 0,
                lastSync: null,
                lastSave: null
            };
        }
    }

    handleStorageFull(waypoints) {
        // Remove oldest 25% of waypoints
        const keepCount = Math.floor(waypoints.length * 0.75);
        const trimmed = waypoints.slice(-keepCount);
        this.saveToStorage(trimmed);
        console.warn(`Storage full, trimmed to ${trimmed.length} waypoints`);
    }

    handleStorageError(error, waypoint) {
        console.error('Storage error:', error);
        // Implement fallback strategy here
    }
}

// ✅ PERBAIKAN UTAMA: Enhanced Mobile GPS Logger dengan HAVERSINE FORMULA
class EnhancedDTGPSLogger {
    constructor() {
        // ✅ SOLUSI 1: FORCE GPS REAL MODE - UBAH DEFAULT KE REAL
        this.gpsMode = 'real'; // ← UBAH DARI 'simulated' KE 'real'
        
        // ✅ ENHANCED WAYPOINT CONFIG - 3600×17 = 61,200 waypoints
        this.waypointConfig = {
            collectionInterval: 1000, // 1 detik
            maxWaypoints: 61200,      // 3600×17 waypoints
            batchSize: 100,
            syncInterval: 30000,      // Sync every 30 detik saat online
            storageKey: 'enhanced_waypoints'
        };

        // ✅ ENHANCED WAYPOINT MANAGEMENT
        this.waypointBuffer = new CircularBuffer(this.waypointConfig.maxWaypoints);
        this.unsyncedWaypoints = new Set();
        this.waypointCollector = null;
        this.syncManager = null;
        this.storageManager = new EnhancedStorageManager();
        
        // Existing properties
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
        
        // ✅ STEP 8: Enhanced properties untuk Haversine Formula
        this.currentSpeed = 0;
        this.movingStartTime = null;
        this.isCurrentlyMoving = false;
        this.speedHistory = [];        // Untuk moving average
        this.lastUpdateTime = null;
        
        // Complete history tracking
        this.offlineHistory = [];
        this.maxOfflinePoints = 1000;
        this.isCollectingOfflineData = false;
        this.completeHistory = this.loadCompleteHistory();
        
        // ✅ CHAT SYSTEM PROPERTIES
        this.chatRef = null;
        this.chatMessages = [];
        this.unreadCount = 0;
        this.isChatOpen = false;
        this.chatInitialized = false;
        
        // ✅ PERBAIKAN: GPS Mode Management - default sudah 'real'
        this.simulatedInterval = null;
        this.simulationActive = false;
        this.gpsErrorCount = 0;
        this.maxGpsErrors = 2;
        
        this.offlineQueue = new OfflineQueueManager();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTime();
        this.checkNetworkStatus();
        setInterval(() => this.updateTime(), 1000);
        setInterval(() => this.checkNetworkStatus(), 5000);
        
        // ✅ LOAD EXISTING UNSYNCED WAYPOINTS
        this.loadUnsyncedWaypoints();
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Setup button listeners
        document.getElementById('startJourneyBtn')?.addEventListener('click', () => this.startJourney());
        document.getElementById('pauseJourneyBtn')?.addEventListener('click', () => this.pauseJourney());
        document.getElementById('endJourneyBtn')?.addEventListener('click', () => this.endJourney());
        document.getElementById('reportIssueBtn')?.addEventListener('click', () => this.reportIssue());
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());

        // Simulation controls
        document.getElementById('simulateMovementBtn')?.addEventListener('click', () => this.simulateMovement());
        document.getElementById('sendTestMessageBtn')?.addEventListener('click', () => this.sendTestMessage());
        document.getElementById('switchGPSModeBtn')?.addEventListener('click', () => this.switchGPSMode());

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
    }

    // ✅ PERBAIKAN: GPS Mode Management dengan fallback
    getGPSMode() {
        const simulatedRadio = document.getElementById('simulatedGPS');
        return simulatedRadio?.checked ? 'simulated' : 'real';
    }

    switchGPSMode() {
        if (this.gpsMode === 'simulated') {
            this.gpsMode = 'real';
            this.stopSimulatedGPS();
            this.startRealGPSTracking();
        } else {
            this.gpsMode = 'simulated';
            this.stopRealGPSTracking();
            this.startSimulatedGPS();
        }
        
        this.updateGPSModeIndicator();
        this.addLog(`🔄 Switched to ${this.gpsMode.toUpperCase()} GPS mode`, 'info');
    }

    // ✅ SOLUSI 2: DISABLE AUTO-SWITCH - COMMENT AUTO-SWITCH UNTUK TEST
    switchToSimulatedMode() {
        this.gpsMode = 'simulated';
        this.stopRealGPSTracking();
        this.startSimulatedGPS();
        this.updateGPSModeIndicator();
        this.addLog('🎮 Mode GPS diubah otomatis ke SIMULATED karena error berulang', 'warning');
    }

    updateGPSModeIndicator() {
        const indicator = document.getElementById('gpsModeIndicator');
        if (indicator) {
            if (this.gpsMode === 'simulated') {
                indicator.textContent = '🎮 SIMULATED GPS';
                indicator.style.background = 'linear-gradient(135deg, #ff6b6b, #ffa726)';
            } else {
                indicator.textContent = '📍 REAL GPS';
                indicator.style.background = 'linear-gradient(135deg, #4ecdc4, #44a08d)';
            }
        }
    }

    // ✅ PERBAIKAN: Simulated GPS System dengan Haversine
    startSimulatedGPS() {
        console.log('🎮 Starting simulated GPS system');
        this.gpsMode = 'simulated';
        this.updateGPSModeIndicator();
        
        this.stopSimulatedGPS();
        
        // ✅ PERBAIKAN: Simulated route coordinates yang benar
        this.simulatedRoute = [
            { lat: -0.471859, lng: 101.420237 },
            { lat: -0.472000, lng: 101.421000 },
            { lat: -0.472500, lng: 101.422000 },
            { lat: -0.473000, lng: 101.423000 },
            { lat: -0.473500, lng: 101.424000 }
        ];
        this.currentRouteIndex = 0;
        
        this.simulatedInterval = setInterval(() => {
            this.generateSimulatedWaypoint();
        }, 2000);
        
        this.simulationActive = true;
        this.addLog('🎮 Simulated GPS activated - generating realistic movement data', 'success');
    }

    stopSimulatedGPS() {
        if (this.simulatedInterval) {
            clearInterval(this.simulatedInterval);
            this.simulatedInterval = null;
        }
        this.simulationActive = false;
    }

    generateSimulatedWaypoint() {
        if (!this.simulatedRoute || this.simulatedRoute.length === 0) return;
        
        const currentPoint = this.simulatedRoute[this.currentRouteIndex];
        const nextIndex = (this.currentRouteIndex + 1) % this.simulatedRoute.length;
        const nextPoint = this.simulatedRoute[nextIndex];
        
        const progress = Math.min(1, (Date.now() % 30000) / 30000);
        
        const lat = currentPoint.lat + (nextPoint.lat - currentPoint.lat) * progress;
        const lng = currentPoint.lng + (nextPoint.lng - currentPoint.lng) * progress;
        
        if (progress > 0.95) {
            this.currentRouteIndex = nextIndex;
        }
        
        const simulatedPosition = {
            lat: parseFloat(lat.toFixed(6)),
            lng: parseFloat(lng.toFixed(6)),
            accuracy: 5 + Math.random() * 10,
            speed: 20 + Math.random() * 40, // Speed GPS simulated
            bearing: Math.round(Math.random() * 360),
            timestamp: new Date(),
            isOnline: this.isOnline,
            isSimulated: true
        };

        // ✅ STEP 6: GUNAKAN HAVERSINE JUGA UNTUK SIMULATED
        this.calculateDistanceWithCoordinates(simulatedPosition);

        // ✅ PROCESS WAYPOINT
        this.processWaypoint({
            ...simulatedPosition,
            id: `wp_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sessionId: this.driverData?.sessionId || 'unknown',
            unit: this.driverData?.unit || 'unknown', 
            driver: this.driverData?.name || 'unknown',
            synced: false,
            lowAccuracy: false
        });
        
        this.lastPosition = simulatedPosition;
    }

    simulateMovement() {
        this.addLog('🚗 Simulating vehicle movement...', 'info');
        this.generateSimulatedWaypoint();
    }

    // ✅ SOLUSI 1: Force GPS High Accuracy - DENGAN DEFAULT REAL
    startRealGPSTracking() {
        if (!navigator.geolocation) {
            this.addLog('❌ GPS tidak didukung di browser ini', 'error');
            this.switchToSimulatedMode();
            return;
        }

        // ✅ PERBAIKAN: Force high accuracy dengan timeout lebih ketat
        const options = {
            enableHighAccuracy: true,    // ✅ PASTIKAN high accuracy
            timeout: 10000,              // ✅ Timeout 10 detik
            maximumAge: 0                // ✅ Jangan gunakan cache
        };

        // ✅ PERBAIKAN: Clear previous watch terlebih dahulu
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                // ✅ SOLUSI 3: TERIMA SEMUA ACCURACY - UBAH VALIDASI
                const accuracy = position.coords.accuracy;
                
                // ✅ PERBAIKAN: Terima data meski accuracy rendah untuk testing
                if (accuracy > 1000) { // Ubah dari 100 ke 1000
                    console.warn(`⚠️ Akurasi rendah: ${accuracy}m - tapi DITERIMA untuk testing`);
                    this.addLog(`⚠️ Akurasi rendah (${accuracy}m) - testing mode`, 'warning');
                    // TIDAK return, biarkan proses berlanjut
                }
                
                this.handleRealPositionUpdate(position);
            },
            (error) => this.handleGPSError(error),
            options
        );

        this.isTracking = true;
        this.addLog('📍 Real GPS tracking dengan high accuracy', 'success');
    }

    stopRealGPSTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        this.isTracking = false;
    }

    // ✅ STEP 4: Enhanced Position Update dengan Haversine
    handleRealPositionUpdate(position) {
        const accuracy = position.coords.accuracy;
        
        // ✅ SOLUSI 3: TERIMA SEMUA ACCURACY - UBAH VALIDASI
        if (accuracy > 1000) { // Ubah dari 100 ke 1000
            console.warn(`⚠️ Akurasi GPS rendah: ${accuracy}m - tapi DITERIMA untuk testing`);
            this.addLog(`⚠️ Akurasi GPS rendah (${accuracy}m) - data tetap diproses`, 'warning');
            // TIDAK return, biarkan proses berlanjut
        }

        const currentPosition = {
            lat: parseFloat(position.coords.latitude.toFixed(6)),
            lng: parseFloat(position.coords.longitude.toFixed(6)),
            accuracy: parseFloat(accuracy.toFixed(1)),
            speed: position.coords.speed ? parseFloat((position.coords.speed * 3.6).toFixed(1)) : 0,
            bearing: position.coords.heading ? parseFloat(position.coords.heading.toFixed(0)) : null,
            timestamp: new Date(),
            isOnline: this.isOnline,
            isSimulated: false
        };

        // ✅ VALIDASI KOORDINAT
        if (!this.isValidCoordinate(currentPosition.lat, currentPosition.lng)) {
            console.warn('❌ Invalid coordinates, skipping waypoint');
            return;
        }

        // ✅ STEP 1: PERHITUNGAN JARAK & KECEPATAN DENGAN HAVERSINE
        this.calculateDistanceWithCoordinates(currentPosition);

        // ✅ STEP 5: PROCESS WAYPOINT UNTUK DATA COLLECTION
        this.processWaypoint({
            ...currentPosition,
            id: `wp_real_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sessionId: this.driverData?.sessionId || 'unknown',
            unit: this.driverData?.unit || 'unknown',
            driver: this.driverData?.name || 'unknown',
            synced: false,
            lowAccuracy: accuracy > 50
        });

        // ✅ SIMPAN SEBAGAI POSISI TERAKHIR
        this.lastPosition = currentPosition;
    }

    // ✅ SOLUSI 2: Enhanced GPS Error Handling - DISABLE AUTO-SWITCH
    handleGPSError(error) {
        this.gpsErrorCount++;
        
        let message = 'GPS Error: ';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message += 'Izin GPS ditolak - ';
                message += '📱 BUKA SETTINGS → SITE SETTINGS → LOCATION → ALLOW';
                // ✅ SOLUSI 2: COMMENT AUTO-SWITCH UNTUK TEST
                // this.switchToSimulatedMode();
                break;
                
            case error.POSITION_UNAVAILABLE:
                message += 'Posisi tidak tersedia - pastikan GPS device aktif';
                break;
                
            case error.TIMEOUT:
                message += 'Timeout - coba area dengan sinyal better';
                break;
                
            default:
                message += 'Error tidak diketahui';
                break;
        }
        
        // ✅ SOLUSI 2: COMMENT AUTO-SWITCH UNTUK TEST
        // Auto-switch setelah 2 error (bukan 3)
        // if (this.gpsErrorCount >= 2 && this.gpsMode === 'real') {
        //     this.addLog(`🔄 Auto-switch ke Simulated GPS setelah ${this.gpsErrorCount} error`, 'warning');
        //     this.switchToSimulatedMode();
        //     return;
        // }
        
        this.addLog(message, 'error');
    }

    // ✅ STEP 1: GANTI METHOD PERHITUNGAN LAMA DENGAN HAVERSINE
    calculateDistanceWithCoordinates(currentPosition) {
        if (!this.lastPosition || !this.lastPosition.lat || !this.lastPosition.timestamp) {
            // Simpan position pertama sebagai reference
            this.lastPosition = currentPosition;
            return 0;
        }

        // ✅ HITUNG JARAK DENGAN HAVERSINE FORMULA
        const distanceKm = this.haversineDistance(
            this.lastPosition.lat, 
            this.lastPosition.lng,
            currentPosition.lat, 
            currentPosition.lng
        );

        // ✅ HITUNG SELISIH WAKTU (dalam jam)
        const timeDiffMs = currentPosition.timestamp - this.lastPosition.timestamp;
        const timeDiffHours = timeDiffMs / 1000 / 3600;

        // ✅ FILTER: Abaikan jika waktu terlalu singkat atau jarak tidak signifikan
        if (timeDiffMs < 1000) { // Minimal 1 detik
            console.log('⏱️ Waktu terlalu singkat, skip perhitungan');
            return 0;
        }

        // ✅ FILTER BERDASARKAN AKURASI GPS
        const maxAccuracy = 1000; // Meter - DITINGKATKAN UNTUK TESTING
        if (currentPosition.accuracy > maxAccuracy) {
            console.warn(`🎯 Akurasi GPS ${currentPosition.accuracy}m terlalu rendah, skip perhitungan`);
            return 0;
        }

        // ✅ FILTER JARAK MINIMAL (menghindari GPS drift)
        const minDistance = 0.005; // 5 meter
        if (distanceKm < minDistance) {
            console.log(`📏 Jarak ${(distanceKm * 1000).toFixed(1)}m terlalu pendek, skip`);
            return 0;
        }

        // ✅ HITUNG KECEPATAN SEBENARNYA
        let actualSpeed = 0;
        if (timeDiffHours > 0) {
            actualSpeed = distanceKm / timeDiffHours; // km/jam
            
            // ✅ FILTER KECEPATAN TIDAK REALISTIS
            const MAX_REALISTIC_SPEED = 120; // km/h untuk dump truck
            if (actualSpeed > MAX_REALISTIC_SPEED) {
                console.warn(`🚫 Kecepatan ${actualSpeed.toFixed(1)} km/h tidak realistis, diabaikan`);
                return 0;
            }
        }

        // ✅ UPDATE TOTAL JARAK HANYA JIKA SEDANG BERGERAK
        if (actualSpeed > 2 && this.journeyStatus === 'started') { // Minimal 2 km/h
            this.totalDistance += distanceKm;
            
            // ✅ SMOOTHING KECEPATAN DENGAN MOVING AVERAGE
            this.currentSpeed = this.smoothSpeed(actualSpeed);
            
            // ✅ UPDATE UI
            document.getElementById('todayDistance').textContent = this.totalDistance.toFixed(3);
            document.getElementById('currentSpeed').textContent = this.currentSpeed.toFixed(1);
            
            console.log(`📏 +${(distanceKm * 1000).toFixed(1)}m | 🚀 ${actualSpeed.toFixed(1)} km/h | Total: ${this.totalDistance.toFixed(3)}km`);
            
            // ✅ UPDATE RATA-RATA KECEPATAN
            this.updateAverageSpeed();
            
            return distanceKm;
        }
        
        return 0;
    }

    // ✅ STEP 2: METHOD HAVERSINE DISTANCE
    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius bumi dalam kilometer
        
        // Konversi derajat ke radian
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Jarak dalam kilometer
        
        return distance;
    }

    // ✅ STEP 3: METHOD SMOOTHING KECEPATAN
    smoothSpeed(newSpeed) {
        if (!this.speedHistory) {
            this.speedHistory = [];
        }
        
        // ✅ SIMPAN MAX 5 NILAI TERAKHIR UNTUK MOVING AVERAGE
        this.speedHistory.push(newSpeed);
        if (this.speedHistory.length > 5) {
            this.speedHistory.shift();
        }
        
        // ✅ HITUNG RATA-RATA
        const sum = this.speedHistory.reduce((a, b) => a + b, 0);
        const average = sum / this.speedHistory.length;
        
        return average;
    }

    // ✅ STEP 7: METHOD UPDATE AVERAGE SPEED
    updateAverageSpeed() {
        if (this.dataPoints > 0 && this.sessionStartTime && this.totalDistance > 0) {
            const durationHours = (new Date() - this.sessionStartTime) / 3600000;
            const avgSpeed = durationHours > 0 ? this.totalDistance / durationHours : 0;
            
            document.getElementById('avgSpeed').textContent = avgSpeed.toFixed(1);
        }
    }

    // ✅ STEP 5: UPDATE METHOD PROCESS WAYPOINT
    processWaypoint(waypoint) {
        // ✅ VALIDASI KOORDINAT
        if (!this.isValidCoordinate(waypoint.lat, waypoint.lng)) {
            console.warn('❌ Invalid coordinates, skipping waypoint:', waypoint);
            return;
        }

        // ✅ SIMPAN KE BUFFER & STORAGE
        this.waypointBuffer.push(waypoint);
        this.unsyncedWaypoints.add(waypoint.id);
        this.storageManager.saveWaypoint(waypoint);
        
        // ✅ UPDATE DISPLAY
        this.updateGPSDisplay(waypoint);
        this.updateWaypointDisplay();
        
        // ✅ INCREMENT DATA POINTS
        this.dataPoints++;
        document.getElementById('dataPoints').textContent = this.dataPoints;

        console.log(`📍 ${waypoint.isSimulated ? '🎮 Simulated' : '📡 Real'} GPS: ${waypoint.lat}, ${waypoint.lng}, Speed: ${this.currentSpeed.toFixed(1)} km/h`);
    }

    // ✅ SIMULATION TEST METHODS
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

    // ✅ CHAT SYSTEM 
    setupChatSystem() {
        if (!this.driverData) return;
        
        console.log('💬 Setting up enhanced chat system for unit:', this.driverData.unit);
        
        this.chatRef = database.ref('/chat/' + this.driverData.unit);
        this.chatRef.off();
        
        this.chatRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            if (message && message.id !== this.lastMessageId) {
                this.handleNewMessage(message);
            }
        });
        
        this.chatInitialized = true;
        console.log('💬 Enhanced chat system activated for unit:', this.driverData.unit);
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

    // ✅ SOLUSI 3: GPS Diagnostic Check
    async checkGPSCapabilities() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve({ supported: false, message: 'GPS tidak didukung' });
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const accuracy = position.coords.accuracy;
                    resolve({
                        supported: true,
                        accuracy: accuracy,
                        highAccuracy: accuracy < 50,
                        message: `GPS aktif - Akurasi: ${accuracy}m`
                    });
                },
                (error) => {
                    resolve({
                        supported: true,
                        accuracy: null,
                        highAccuracy: false,
                        message: `GPS error: ${this.getGPSErrorMessage(error)}`
                    });
                },
                options
            );
        });
    }

    // ✅ METHOD BARU: Get GPS error message yang user-friendly
    getGPSErrorMessage(error) {
        switch(error.code) {
            case error.PERMISSION_DENIED: return 'IZIN DITOLAK - klik 🔒 di address bar';
            case error.POSITION_UNAVAILABLE: return 'GPS DEVICE MATI - hidupkan GPS';
            case error.TIMEOUT: return 'TIMEOUT - coba area terbuka';
            default: return 'Unknown error';
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

    // ✅ CORE APPLICATION METHODS
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

            // ✅ PASTIKAN DEFAULT REAL GPS TERPAKAI
            const simulatedRadio = document.getElementById('simulatedGPS');
            if (simulatedRadio && simulatedRadio.checked) {
                this.gpsMode = 'simulated';
            } else {
                this.gpsMode = 'real'; // Default real GPS
            }

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
                timestamp: new Date().toISOString(),
                gpsMode: this.gpsMode
            };

            this.firebaseRef.set(cleanData);

            this.showDriverApp();
            this.startWaypointCollection(); // ✅ START ENHANCED WAYPOINT COLLECTION
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

    // ✅ PERBAIKAN: showDriverApp dengan GPS Diagnostic
    async showDriverApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('driverApp').style.display = 'block';
        
        document.getElementById('vehicleName').textContent = this.driverData.unit;
        document.getElementById('driverDisplayName').textContent = this.driverData.name;
        
        this.sessionStartTime = new Date();
        this.lastUpdateTime = new Date();
        this.updateSessionDuration();
        
        // ✅ UPDATE WAYPOINT DISPLAY
        this.updateWaypointDisplay();
        
        // ✅ SETUP CHAT SYSTEM SETELAH LOGIN
        this.setupChatSystem();
        
        this.updateGPSModeIndicator();
        
        // ✅ PERBAIKAN: Cek GPS capabilities dulu
        const gpsCheck = await this.checkGPSCapabilities();
        this.addLog(`📡 Status GPS: ${gpsCheck.message}`, 
                    gpsCheck.highAccuracy ? 'success' : 'warning');

        // Delay startup GPS
        setTimeout(() => {
            if (this.gpsMode === 'simulated') {
                this.startSimulatedGPS();
            } else {
                if (gpsCheck.supported && !gpsCheck.highAccuracy) {
                    this.addLog('⚠️ GPS device terdeteksi tapi akurasi rendah', 'warning');
                }
                this.startRealGPSTracking();
            }
        }, 1000);
        
        this.addLog(`✅ Login berhasil - ${this.driverData.name} (${this.driverData.unit}) - Mode: ${this.gpsMode.toUpperCase()}`, 'success');
    }

    // ✅ ENHANCED WAYPOINT COLLECTION SYSTEM
    startWaypointCollection() {
        console.log('📍 Starting enhanced waypoint collection (1 second interval)');
        
        // Clear existing collector
        this.stopWaypointCollection();
        
        // Start new collector dengan interval 1 detik
        this.waypointCollector = setInterval(() => {
            this.collectWaypoint();
        }, this.waypointConfig.collectionInterval);
        
        // Start background sync
        this.syncManager = setInterval(() => {
            if (this.isOnline) {
                this.syncWaypointsToServer();
            }
        }, this.waypointConfig.syncInterval);
        
        this.addLog('🚀 Enhanced waypoint collection started (1s interval)', 'success');
    }

    stopWaypointCollection() {
        if (this.waypointCollector) {
            clearInterval(this.waypointCollector);
            this.waypointCollector = null;
        }
        if (this.syncManager) {
            clearInterval(this.syncManager);
            this.syncManager = null;
        }
    }

    collectWaypoint() {
        if (!navigator.geolocation) {
            console.error('GPS not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const currentPosition = {
                    lat: parseFloat(position.coords.latitude.toFixed(6)),
                    lng: parseFloat(position.coords.longitude.toFixed(6)),
                    accuracy: parseFloat(position.coords.accuracy.toFixed(1)),
                    speed: position.coords.speed ? parseFloat((position.coords.speed * 3.6).toFixed(1)) : 0,
                    bearing: position.coords.heading ? parseFloat(position.coords.heading.toFixed(0)) : null,
                    timestamp: new Date(),
                    isOnline: this.isOnline
                };

                // ✅ VALIDATE COORDINATES (Kebun Tempuling area)
                if (!this.isValidCoordinate(currentPosition.lat, currentPosition.lng)) {
                    console.warn('Invalid coordinates, skipping waypoint');
                    return;
                }

                // ✅ GUNAKAN HAVERSINE UNTUK PERHITUNGAN
                this.calculateDistanceWithCoordinates(currentPosition);

                // ✅ PROCESS WAYPOINT
                this.processWaypoint({
                    ...currentPosition,
                    id: `wp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    sessionId: this.driverData?.sessionId || 'unknown',
                    unit: this.driverData?.unit || 'unknown',
                    driver: this.driverData?.name || 'unknown',
                    synced: false
                });
                
            },
            (error) => {
                this.handleGPSError(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    }

    isValidCoordinate(lat, lng) {
        // Validate for Kebun Tempuling area
        if (lat < -1 || lat > 1 || lng < 102.5 || lng > 103.5) {
            return false;
        }
        if (isNaN(lat) || isNaN(lng)) {
            return false;
        }
        return true;
    }

    updateGPSDisplay(waypoint) {
        document.getElementById('currentLat').textContent = waypoint.lat.toFixed(6);
        document.getElementById('currentLng').textContent = waypoint.lng.toFixed(6);
        document.getElementById('currentSpeed').textContent = this.currentSpeed.toFixed(1); // Gunakan speed dari Haversine
        document.getElementById('gpsAccuracy').textContent = waypoint.accuracy.toFixed(1) + ' m';
        document.getElementById('gpsBearing').textContent = waypoint.bearing ? waypoint.bearing + '°' : '-';
    }

    updateWaypointDisplay() {
        // Update waypoint counters in UI if elements exist
        const waypointCountElement = document.getElementById('waypointCount');
        const unsyncedCountElement = document.getElementById('unsyncedCount');
        const waypointStatusElement = document.getElementById('waypointStatus');
        
        if (waypointCountElement) {
            waypointCountElement.textContent = this.waypointBuffer.count;
        }
        if (unsyncedCountElement) {
            unsyncedCountElement.textContent = this.unsyncedWaypoints.size;
        }
        if (waypointStatusElement) {
            waypointStatusElement.textContent = this.isOnline ? 
                'Mengumpulkan waypoint...' : 
                `Offline (${this.unsyncedWaypoints.size} menunggu sync)`;
        }
    }

    startDataTransmission() {
        this.sendInterval = setInterval(() => {
            if (this.lastPosition) {
                this.sendToFirebase();
            }
        }, 2000);
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
                speed: parseFloat(this.currentSpeed.toFixed(1)), // Gunakan speed dari Haversine
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
                gpsMode: this.gpsMode,
                isSimulated: this.gpsMode === 'simulated'
            };

            // Validate data before sending
            if (!this.isValidCoordinate(gpsData.lat, gpsData.lng)) {
                console.warn('Invalid coordinates, skipping Firebase update');
                return;
            }

            if (this.isOnline) {
                await this.firebaseRef.set(gpsData);
                this.addLog(`📡 Data terkirim: ${this.currentSpeed.toFixed(1)} km/h | ${this.totalDistance.toFixed(3)} km`, 'success');
                this.updateConnectionStatus(true);
                
                if (this.offlineQueue.getQueueSize() > 0) {
                    this.offlineQueue.processQueue();
                }
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

    // ✅ ENHANCED NETWORK HANDLING
    checkNetworkStatus() {
        const wasOnline = this.isOnline;
        this.isOnline = navigator.onLine;
        
        if (wasOnline !== this.isOnline) {
            if (this.isOnline) {
                this.addLog('📱 Koneksi pulih - sync semua waypoint', 'success');
                this.updateConnectionStatus(true);
                
                // ✅ IMMEDIATE SYNC WHEN COMING ONLINE
                setTimeout(() => {
                    this.syncWaypointsToServer();
                    this.offlineQueue.processQueue();
                    this.syncCompleteHistory();
                }, 2000);
                
            } else {
                this.addLog('📱 Koneksi terputus - menyimpan waypoint lokal', 'warning');
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
            status.textContent = `OFFLINE (${this.unsyncedWaypoints.size} waypoint menunggu)`;
            status.className = 'text-danger';
            
            const queueSize = this.offlineQueue.getQueueSize();
            if (queueSize > 0) {
                status.textContent = `OFFLINE (${this.unsyncedWaypoints.size} waypoint, ${queueSize} data antrian)`;
            }
        }
        
        // Update waypoint display status
        this.updateWaypointDisplay();
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
        
        // ✅ SYNC ALL WAYPOINTS BEFORE ENDING
        if (this.isOnline) {
            this.syncWaypointsToServer();
        }
    }

    reportIssue() {
        const issues = [
            'Mesin bermasalah',
            'Ban bocor', 
            'Bahan bakar habis',
            'Kecelakaan kecil',
            'Lainnya'
        ];
        
        const issue = prompt('Lapor masalah:\n' + issues.join('\n'));
        if (issue) {
            this.addLog(`Laporan: ${issue}`, 'warning');
        }
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
        
        // ✅ STOP WAYPOINT COLLECTION
        this.stopWaypointCollection();
        
        this.isTracking = false;
    }

    // ✅ ENHANCED LOGOUT
    logout() {
        // Sync semua data sebelum logout
        if (this.isOnline) {
            this.syncWaypointsToServer();
            this.syncCompleteHistory();
        }
        
        // Cleanup waypoint collection
        this.stopWaypointCollection();
        
        // Cleanup chat listener
        if (this.chatRef) {
            this.chatRef.off();
        }
        
        this.stopTracking();
        
        const sessionSummary = {
            driver: this.driverData.name,
            unit: this.driverData.unit,
            duration: document.getElementById('sessionDuration').textContent,
            totalDistance: this.totalDistance.toFixed(3),
            dataPoints: this.dataPoints,
            waypointsCollected: this.waypointBuffer.count,
            unsyncedWaypoints: this.unsyncedWaypoints.size,
            avgSpeed: document.getElementById('avgSpeed').textContent,
            sessionId: this.driverData.sessionId
        };
        
        console.log('Session Summary:', sessionSummary);
        this.addLog(`Session ended - ${this.waypointBuffer.count} waypoints collected`, 'info');
        
        // Reset waypoint data
        this.waypointBuffer.clear();
        this.unsyncedWaypoints.clear();
        
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
        this.currentSpeed = 0;
        this.speedHistory = [];
    }

    // ✅ ENHANCED SYNC MANAGEMENT
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
                
                // ✅ MARK AS SYNCED
                batch.forEach(waypoint => {
                    waypoint.synced = true;
                    this.unsyncedWaypoints.delete(waypoint.id);
                });
                
                // ✅ UPDATE STORAGE
                this.storageManager.markWaypointsAsSynced(batch.map(wp => wp.id));
                
                this.addLog(`📡 Batch ${index + 1}/${batches.length} synced (${batch.length} waypoints)`, 'success');
                
            } catch (error) {
                console.error(`❌ Batch ${index + 1} sync failed:`, error);
                this.addLog(`❌ Batch ${index + 1} sync failed`, 'error');
                break; // Stop on first failure
            }
        }

        if (successfulBatches > 0) {
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
        
        // Load existing history
        let history = this.loadCompleteHistory();
        
        // Add new point
        history.push(historyPoint);
        
        // Maintain size limit
        if (history.length > this.maxOfflinePoints) {
            history = history.slice(-this.maxOfflinePoints);
        }
        
        // Save back to storage
        localStorage.setItem('gps_complete_history', JSON.stringify(history));
        this.completeHistory = history;
        
        console.log(`💾 Saved to history: ${history.length} points`);
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

// ✅ GLOBAL FUNCTIONS UNTUK CHAT
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
    if (window.dtLogger) {
        window.dtLogger.reportIssue();
    }
}

function logout() {
    if (window.dtLogger) {
        if (confirm('Yakin ingin logout?')) {
            window.dtLogger.logout();
        }
    }
}

// Initialize app dengan EnhancedDTGPSLogger
document.addEventListener('DOMContentLoaded', function() {
    window.dtLogger = new EnhancedDTGPSLogger();
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
