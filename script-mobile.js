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
        
        // NEW: Enhanced distance calculation
        this.lastUpdateTime = null;
        this.currentSpeed = 0;
        this.movingStartTime = null;
        this.isCurrentlyMoving = false;
        
        // NEW: Complete history tracking
        this.offlineHistory = [];
        this.maxOfflinePoints = 1000;
        this.isCollectingOfflineData = false;
        this.completeHistory = this.loadCompleteHistory(); // Load existing history
        
        this.offlineQueue = new OfflineQueueManager();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTime();
        this.checkNetworkStatus();
        setInterval(() => this.updateTime(), 1000);
        setInterval(() => this.checkNetworkStatus(), 5000);
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
            this.firebaseRef.set({
                driver: driverName,
                unit: unitNumber,
                sessionId: this.driverData.sessionId,
                journeyStatus: 'ready',
                lastUpdate: new Date().toLocaleTimeString('id-ID')
            });

            this.showDriverApp();
            this.startGPSTracking();
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
    }

    startGPSTracking() {
        if (!navigator.geolocation) {
            this.addLog('GPS tidak didukung di browser ini', 'error');
            return;
        }

        this.isTracking = true;
        
        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.handlePositionUpdate(position),
            (error) => this.handleGPSError(error),
            options
        );

        this.addLog('GPS tracking aktif - real-time ke Firebase', 'success');
    }

    startDataTransmission() {
        this.sendInterval = setInterval(() => {
            if (this.lastPosition) {
                this.sendToFirebase();
            }
        }, 2000);
    }

    // NEW: Simpan semua titik ke localStorage
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

    // NEW: Load history dari localStorage
    loadCompleteHistory() {
        try {
            const saved = localStorage.getItem('gps_complete_history');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    }

    // NEW: Sync semua history ke Firebase
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

    // PERBAIKAN BESAR: Enhanced position update dengan perhitungan jarak yang akurat
    handlePositionUpdate(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const speed = position.coords.speed !== null ? position.coords.speed * 3.6 : 0; // Convert m/s to km/h
        const accuracy = position.coords.accuracy;
        const bearing = position.coords.heading;
        const timestamp = new Date();
        
        // ✅ TAMBAHKAN INI: Simpan ke complete history (SELALU)
        this.saveToCompleteHistory({
            lat: lat,
            lng: lng,
            speed: speed,
            accuracy: accuracy,
            bearing: bearing,
            timestamp: timestamp.toISOString(),
            isOnline: this.isOnline
        });

        // Update UI
        document.getElementById('currentLat').textContent = lat.toFixed(6);
        document.getElementById('currentLng').textContent = lng.toFixed(6);
        document.getElementById('currentSpeed').textContent = speed.toFixed(1);
        document.getElementById('gpsAccuracy').textContent = accuracy.toFixed(1) + ' m';
        document.getElementById('gpsBearing').textContent = bearing ? bearing.toFixed(0) + '°' : '-';

        // PERBAIKAN: Hitung jarak berdasarkan kecepatan dan waktu
        this.calculateDistanceWithSpeed(speed, timestamp);

        // Simpan data terbaru
        this.lastPosition = { 
            lat, 
            lng, 
            speed, 
            accuracy, 
            bearing, 
            timestamp,
            distance: this.totalDistance
        };

        this.dataPoints++;
        document.getElementById('dataPoints').textContent = this.dataPoints;

        // Update average speed
        this.updateAverageSpeed();
    }

    // NEW: Enhanced distance calculation menggunakan rumus S = V × t
    calculateDistanceWithSpeed(currentSpeed, currentTime) {
        if (!this.lastUpdateTime) {
            this.lastUpdateTime = currentTime;
            return;
        }

        // Hitung selisih waktu dalam jam
        const timeDiff = (currentTime - this.lastUpdateTime) / 1000 / 3600; // dalam jam
        
        // Hanya hitung jika ada pergerakan (speed > 2 km/h untuk menghindari drift GPS)
        if (currentSpeed > 2 && this.journeyStatus === 'started') {
            // Rumus: Jarak (km) = Kecepatan (km/jam) × Waktu (jam)
            const distanceIncrement = currentSpeed * timeDiff;
            
            // Hanya tambahkan jika perhitungan valid
            if (distanceIncrement > 0 && distanceIncrement < 1) { // Batasi maksimal 1km per interval
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

    // Alternatif: Perhitungan jarak menggunakan koordinat GPS (lebih akurat untuk perpindahan kecil)
    calculateDistanceWithCoordinates(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth radius in km
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
            const duration = (new Date() - this.sessionStartTime) / 3600000; // hours
            const avgSpeed = duration > 0 ? this.totalDistance / duration : 0;
            document.getElementById('avgSpeed').textContent = avgSpeed.toFixed(1);
        }
    }

    async sendToFirebase() {
        if (!this.firebaseRef || !this.lastPosition) return;

        try {
            const gpsData = {
                driver: this.driverData.name,
                unit: this.driverData.unit,
                lat: this.lastPosition.lat,
                lng: this.lastPosition.lng,
                speed: this.lastPosition.speed,
                accuracy: this.lastPosition.accuracy,
                bearing: this.lastPosition.bearing,
                timestamp: new Date().toISOString(),
                lastUpdate: new Date().toLocaleTimeString('id-ID'),
                distance: parseFloat(this.totalDistance.toFixed(3)),
                journeyStatus: this.journeyStatus,
                batteryLevel: this.getBatteryLevel(),
                sessionId: this.driverData.sessionId,
                isOfflineData: false
            };

            if (this.isOnline) {
                await this.firebaseRef.set(gpsData);
                this.addLog(`📡 Data terkirim: ${this.lastPosition.speed.toFixed(1)} km/h | ${this.totalDistance.toFixed(3)} km`, 'success');
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

    getBatteryLevel() {
        // Simulasi level baterai
        return Math.max(20, Math.floor(Math.random() * 100));
    }

    checkNetworkStatus() {
        const wasOnline = this.isOnline;
        this.isOnline = navigator.onLine;
        
        if (wasOnline !== this.isOnline) {
            if (this.isOnline) {
                this.addLog('📱 Koneksi pulih - sync semua data', 'success');
                this.updateConnectionStatus(true);
                
                // ✅ MODIFIKASI INI: Sync bertahap
                // 1. Sync real-time data dulu
                this.offlineQueue.processQueue();
                
                // 2. Sync complete history setelah delay
                setTimeout(() => {
                    this.syncCompleteHistory();
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
        this.lastUpdateTime = new Date(); // Reset timer untuk perhitungan jarak
        document.getElementById('vehicleStatus').textContent = 'ON TRIP';
        document.getElementById('vehicleStatus').className = 'bg-success text-white rounded px-2 py-1';
        this.addLog('Perjalanan dimulai - GPS tracking aktif', 'success');
        
        // Kirim status awal ke Firebase
        this.sendToFirebase();
    }

    pauseJourney() {
        this.journeyStatus = 'paused';
        document.getElementById('vehicleStatus').textContent = 'PAUSED';
        document.getElementById('vehicleStatus').className = 'bg-warning text-dark rounded px-2 py-1';
        this.addLog('Perjalanan dijeda', 'warning');
        
        // Kirim status pause ke Firebase
        this.sendToFirebase();
    }

    endJourney() {
        this.journeyStatus = 'ended';
        document.getElementById('vehicleStatus').textContent = 'COMPLETED';
        document.getElementById('vehicleStatus').className = 'bg-info text-white rounded px-2 py-1';
        this.addLog(`Perjalanan selesai - Total jarak: ${this.totalDistance.toFixed(3)} km`, 'info');
        
        // Kirim data final ke Firebase
        this.sendToFirebase();
        
        // Sync complete history saat journey berakhir
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
        this.stopTracking();
        
        // Sync history terakhir sebelum logout
        this.syncCompleteHistory();
        
        // Log session summary
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
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('driverApp').style.display = 'none';
        document.getElementById('loginForm').reset();
        
        // Reset semua data
        this.totalDistance = 0;
        this.dataPoints = 0;
        this.lastPosition = null;
        this.lastUpdateTime = null;
    }
}

// Offline Queue Manager (tetap sama)
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

// Global functions
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
