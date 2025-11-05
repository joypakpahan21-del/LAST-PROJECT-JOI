// =============================================
// 🚀 ENHANCED MOBILE GPS TRACKING SYSTEM
// 📍 REAL-TIME 61,200 POINTS HAVERSINE CALCULATOR
// 🎯 Version: 6.0 - Pure Real-time Data Logger
// =============================================

// ✅ FIREBASE CONFIGURATION
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
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
        console.log('✅ Firebase initialized successfully');
    } else {
        firebase.app();
    }
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
}

const database = firebase.database();

// =============================================
// 📍 PURE REAL-TIME HAVERSINE CALCULATOR - 61,200 POINTS
// =============================================

class EnhancedHaversineCalculator {
    constructor() {
        this.positionHistory = [];
        this.maxHistorySize = 61200; // 17 jam × 3600 detik = 61,200 titik
        this.speedHistory = [];
        this.lastCalculationTime = 0;
        this.calculationInterval = 100; // 0.1 detik untuk real-time
        this.lastValidSpeed = 0;
        this.smoothingFactor = 0.3; // Smoothing minimal untuk real-time
        this.totalDistanceMeters = 0;
        this.lastValidPosition = null;
        this.dataPointsCount = 0;
        
        // Real-time statistics
        this.realTimeStats = {
            totalCalculations: 0,
            averageInterval: 0,
            maxSpeed: 0,
            minSpeed: Infinity,
            totalTimeMs: 0
        };
        
        console.log('📍 Haversine Calculator initialized for 61,200 real-time points');
    }

    /**
     * Haversine formula untuk menghitung jarak antara dua koordinat
     */
    calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        try {
            const R = 6371000; // Radius bumi dalam meter
            const dLat = this.toRad(lat2 - lat1);
            const dLon = this.toRad(lon2 - lon1);
            
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                     Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
                     Math.sin(dLon/2) * Math.sin(dLon/2);
            
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            const distance = R * c;
            
            return distance;
        } catch (error) {
            console.error('Error in Haversine calculation:', error);
            return 0;
        }
    }

    toRad(degrees) {
        return degrees * (Math.PI/180);
    }

    /**
     * Menambahkan posisi baru - REAL-TIME DATA LOGGER
     */
    addPosition(position, accuracy) {
        const timestamp = Date.now();
        
        if (!this.isValidPosition(position, accuracy)) {
            console.warn('❌ Posisi tidak valid, dilewati');
            return null;
        }

        const positionData = {
            lat: parseFloat(position.lat),
            lng: parseFloat(position.lng),
            accuracy: parseFloat(accuracy),
            timestamp: timestamp,
            dataPointId: this.dataPointsCount++
        };

        // REAL-TIME CALCULATION - TANPA FILTER
        let instantDistance = 0;
        let instantSpeed = 0;
        let timeDiffSeconds = 0;

        if (this.lastValidPosition) {
            // Hitung jarak menggunakan Haversine
            instantDistance = this.calculateHaversineDistance(
                this.lastValidPosition.lat, this.lastValidPosition.lng,
                positionData.lat, positionData.lng
            );
            
            // DATA LOGGER MURNI - akumulasi semua jarak
            this.totalDistanceMeters += Math.abs(instantDistance);
            
            // Hitung kecepatan instan
            timeDiffSeconds = (timestamp - this.lastValidPosition.timestamp) / 1000;
            if (timeDiffSeconds > 0) {
                instantSpeed = (instantDistance / 1000) / (timeDiffSeconds / 3600); // km/h
            }

            // Update real-time stats
            this.updateRealTimeStats(instantDistance, timeDiffSeconds, instantSpeed);
            
            console.log(`📏 Point ${this.dataPointsCount}: ${instantDistance.toFixed(6)}m | Speed: ${instantSpeed.toFixed(3)} km/h | Total: ${(this.totalDistanceMeters/1000).toFixed(6)}km`);
        }

        this.lastValidPosition = positionData;
        this.positionHistory.push(positionData);

        // Maintain 61,200 data points - cyclic buffer
        if (this.positionHistory.length > this.maxHistorySize) {
            const removed = this.positionHistory.shift();
            console.log(`🔄 Cycled data point: ${removed.dataPointId} (Total: ${this.positionHistory.length})`);
        }

        return {
            instantDistance,
            instantSpeed,
            timeDiffSeconds,
            totalDistance: this.totalDistanceMeters,
            dataPointId: positionData.dataPointId
        };
    }

    /**
     * Update real-time statistics
     */
    updateRealTimeStats(distance, timeDiff, speed) {
        this.realTimeStats.totalCalculations++;
        this.realTimeStats.totalTimeMs += timeDiff * 1000;
        
        // Update average interval
        const totalTime = this.realTimeStats.averageInterval * (this.realTimeStats.totalCalculations - 1);
        this.realTimeStats.averageInterval = (totalTime + timeDiff) / this.realTimeStats.totalCalculations;
        
        // Update max/min speed
        if (speed > this.realTimeStats.maxSpeed) {
            this.realTimeStats.maxSpeed = speed;
        }
        if (speed < this.realTimeStats.minSpeed && speed > 0) {
            this.realTimeStats.minSpeed = speed;
        }
    }

    /**
     * Validasi posisi GPS - HANYA UNTUK DATA CORRUPT
     */
    isValidPosition(position, accuracy) {
        if (!position || position.lat === undefined || position.lng === undefined) {
            return false;
        }

        if (isNaN(position.lat) || isNaN(position.lng)) {
            return false;
        }

        if (position.lat === 0 && position.lng === 0) {
            return false;
        }

        if (Math.abs(position.lat) > 90 || Math.abs(position.lng) > 180) {
            return false;
        }

        return true;
    }

    /**
     * Menghitung kecepatan real-time - OPTIMIZED UNTUK 61,200 POINTS
     */
    calculateRealTimeSpeed() {
        const now = Date.now();
        
        if (now - this.lastCalculationTime < this.calculationInterval) {
            return this.lastValidSpeed;
        }

        if (this.positionHistory.length < 2) {
            return 0;
        }

        // Ambil dua posisi terakhir untuk perhitungan real-time
        const recentPositions = this.getRecentPositions(2);
        if (recentPositions.length < 2) {
            return this.lastValidSpeed;
        }

        const pos1 = recentPositions[0];
        const pos2 = recentPositions[1];

        const timeDiffMs = pos2.timestamp - pos1.timestamp;
        const timeDiffHours = timeDiffMs / 3600000;
        
        if (timeDiffHours <= 0) {
            return this.lastValidSpeed;
        }

        const distanceMeters = this.calculateHaversineDistance(
            pos1.lat, pos1.lng,
            pos2.lat, pos2.lng
        );

        // REAL-TIME CALCULATION - TANPA FILTER
        const instantSpeed = (distanceMeters / 1000) / timeDiffHours;

        // Smoothing minimal untuk real-time
        const smoothedSpeed = this.smoothSpeed(instantSpeed);

        this.lastValidSpeed = smoothedSpeed;
        this.lastCalculationTime = now;

        // Simpan ke history
        this.speedHistory.push({
            speed: smoothedSpeed,
            distance: distanceMeters,
            timestamp: now,
            timeDiff: timeDiffMs
        });

        if (this.speedHistory.length > 1000) {
            this.speedHistory.shift();
        }

        return smoothedSpeed;
    }

    /**
     * Mendapatkan posisi terbaru
     */
    getRecentPositions(count) {
        if (this.positionHistory.length === 0) return [];
        const startIndex = Math.max(0, this.positionHistory.length - count);
        return this.positionHistory.slice(startIndex);
    }

    /**
     * Smoothing kecepatan - MINIMAL UNTUK REAL-TIME
     */
    smoothSpeed(newSpeed) {
        if (this.lastValidSpeed === 0) return newSpeed;
        return (this.smoothingFactor * this.lastValidSpeed) + 
               ((1 - this.smoothingFactor) * newSpeed);
    }

    /**
     * Mendapatkan total jarak REAL tanpa filter
     */
    getTotalDistance() {
        return this.totalDistanceMeters / 1000;
    }

    /**
     * Get comprehensive real-time data
     */
    getRealTimeData() {
        const currentSpeed = this.calculateRealTimeSpeed();
        
        return {
            currentSpeed: currentSpeed,
            totalDistance: this.getTotalDistance(),
            dataPoints: this.dataPointsCount,
            positionHistorySize: this.positionHistory.length,
            lastPosition: this.lastValidPosition,
            stats: this.realTimeStats,
            averageSpeed: this.calculateAverageSpeed(),
            trackingDuration: this.realTimeStats.totalTimeMs / 1000
        };
    }

    /**
     * Calculate average speed dari seluruh perjalanan
     */
    calculateAverageSpeed() {
        if (this.positionHistory.length < 2) return 0;
        
        const firstPoint = this.positionHistory[0];
        const lastPoint = this.positionHistory[this.positionHistory.length - 1];
        
        const totalTimeHours = (lastPoint.timestamp - firstPoint.timestamp) / 3600000;
        if (totalTimeHours <= 0) return 0;
        
        return this.getTotalDistance() / totalTimeHours;
    }

    /**
     * Get data untuk export/analisis
     */
    getExportData() {
        return {
            metadata: {
                totalDataPoints: this.dataPointsCount,
                trackingDuration: this.realTimeStats.totalTimeMs / 1000,
                exportTime: new Date().toISOString(),
                totalDistance: this.getTotalDistance(),
                averageSpeed: this.calculateAverageSpeed(),
                maxSpeed: this.realTimeStats.maxSpeed,
                minSpeed: this.realTimeStats.minSpeed
            },
            positionHistory: this.positionHistory,
            speedHistory: this.speedHistory,
            statistics: this.realTimeStats
        };
    }

    reset() {
        this.positionHistory = [];
        this.speedHistory = [];
        this.lastValidSpeed = 0;
        this.lastCalculationTime = 0;
        this.totalDistanceMeters = 0;
        this.lastValidPosition = null;
        this.dataPointsCount = 0;
        this.realTimeStats = {
            totalCalculations: 0,
            averageInterval: 0,
            maxSpeed: 0,
            minSpeed: Infinity,
            totalTimeMs: 0
        };
    }
}

// =============================================
// 🚀 COMPLETE REAL-TIME GPS LOGGER - 61,200 POINTS
// =============================================

class EnhancedDTGPSLogger {
    constructor() {
        this.waypointConfig = {
            collectionInterval: 1000,
            maxWaypoints: 61200,
            batchSize: 100,
            syncInterval: 30000,
        };

        this.waypointBuffer = [];
        this.unsyncedWaypoints = new Set();
        
        this.driverData = null;
        this.watchId = null;
        this.isTracking = false;
        this.sendInterval = null;
        this.sessionStartTime = null;
        this.totalDistance = 0;
        this.lastPosition = null;
        this.dataPoints = 0;
        this.isOnline = navigator.onLine;
        this.journeyStatus = 'ready';
        this.firebaseRef = null;
        
        this.lastUpdateTime = null;
        this.currentSpeed = 0;
        
        // REAL-TIME HAVERSINE CALCULATOR
        this.haversineCalculator = new EnhancedHaversineCalculator();
        
        this.backgroundManager = null;
        this.isInBackground = false;
        
        this.chatRef = null;
        this.chatMessages = [];
        this.unreadCount = 0;
        this.isChatOpen = false;
        this.chatInitialized = false;
        this.lastMessageId = null;
        
        this.init();
    }

    init() {
        try {
            this.setupEventListeners();
            this.updateTime();
            this.checkNetworkStatus();
            setInterval(() => this.updateTime(), 1000);
            setInterval(() => this.checkNetworkStatus(), 5000);
            
            console.log('🚀 Enhanced DT GPS Logger initialized - REAL-TIME 61,200 POINTS');
        } catch (error) {
            console.error('❌ Error during initialization:', error);
        }
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        this.setupButtonListeners();
        
        document.addEventListener('visibilitychange', () => {
            this.isInBackground = document.hidden;
            if (document.hidden) {
                console.log('📱 App moved to background');
                this.addLog('📱 Mode background aktif', 'info');
            } else {
                console.log('📱 App returned to foreground');
                this.addLog('📱 Mode foreground aktif', 'success');
                this.updateRealTimeDisplay();
            }
        });
    }

    setupButtonListeners() {
        document.getElementById('startJourneyBtn')?.addEventListener('click', () => this.startJourney());
        document.getElementById('pauseJourneyBtn')?.addEventListener('click', () => this.pauseJourney());
        document.getElementById('endJourneyBtn')?.addEventListener('click', () => this.endJourney());
        document.getElementById('reportIssueBtn')?.addEventListener('click', () => this.reportIssue());
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());

        document.getElementById('forceSyncBtn')?.addEventListener('click', () => this.forceSync());
        document.getElementById('gpsDiagnosticBtn')?.addEventListener('click', () => this.runGPSDiagnostic());

        document.getElementById('exportDataBtn')?.addEventListener('click', () => this.exportData());
        document.getElementById('resetDataBtn')?.addEventListener('click', () => this.resetData());
    }

    /**
     * REAL-TIME POSITION HANDLING - 61,200 POINTS
     */
    async handleEnhancedPositionUpdate(position) {
        if (!this.isValidGPSPosition(position)) {
            return;
        }

        const accuracy = position.coords.accuracy;
        const rawPosition = {
            lat: parseFloat(position.coords.latitude.toFixed(8)),
            lng: parseFloat(position.coords.longitude.toFixed(8)),
            accuracy: parseFloat(accuracy.toFixed(2))
        };

        const currentPosition = {
            lat: rawPosition.lat,
            lng: rawPosition.lng,
            accuracy: rawPosition.accuracy,
            speed: this.currentSpeed,
            bearing: position.coords.heading ? parseFloat(position.coords.heading.toFixed(0)) : null,
            timestamp: new Date().getTime(),
            isOnline: this.isOnline,
            altitude: position.coords.altitude ? parseFloat(position.coords.altitude.toFixed(1)) : null,
            altitudeAccuracy: position.coords.altitudeAccuracy ? parseFloat(position.coords.altitudeAccuracy.toFixed(1)) : null
        };

        // REAL-TIME HAVERSINE CALCULATION - 61,200 POINTS
        this.calculateRealTimeMovement(currentPosition);

        const waypoint = {
            ...currentPosition,
            speed: this.currentSpeed,
            id: `wp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sessionId: this.driverData?.sessionId || 'unknown',
            unit: this.driverData?.unit || 'unknown',
            driver: this.driverData?.name || 'unknown',
            synced: false,
            isBackground: this.isInBackground,
            dataPointNumber: this.haversineCalculator.dataPointsCount,
            calculationMethod: 'real_time_haversine_61200'
        };

        this.processWaypoint(waypoint);
        this.lastPosition = currentPosition;

        // Update display setiap 10 data points
        if (this.dataPoints % 10 === 0) {
            this.updateRealTimeDisplay();
        }
    }

    /**
     * REAL-TIME MOVEMENT UNTUK 61,200 TITIK
     */
    calculateRealTimeMovement(currentPosition) {
        const result = this.haversineCalculator.addPosition(
            { lat: currentPosition.lat, lng: currentPosition.lng },
            currentPosition.accuracy
        );

        if (!result) {
            return;
        }

        const speed = this.haversineCalculator.calculateRealTimeSpeed();
        const distanceKm = this.haversineCalculator.getTotalDistance();

        // REAL-TIME UPDATE - tidak peduli status journey
        this.totalDistance = distanceKm;
        this.currentSpeed = speed;
        
        // Real-time display dengan presisi tinggi
        if (!this.isInBackground) {
            document.getElementById('todayDistance').textContent = this.totalDistance.toFixed(6);
            document.getElementById('currentSpeed').textContent = this.currentSpeed.toFixed(3);
            document.getElementById('dataPoints').textContent = this.haversineCalculator.dataPointsCount;
        }
        
        console.log(`📏 Real-time #${this.haversineCalculator.dataPointsCount}: ${speed.toFixed(3)} km/h | Total: ${this.totalDistance.toFixed(6)}km`);
        
        this.updateAverageSpeed();
    }

    /**
     * Enhanced Real-time Display
     */
    updateRealTimeDisplay() {
        const realTimeData = this.haversineCalculator.getRealTimeData();
        
        // Update main display
        const statsElement = document.getElementById('haversineStats');
        if (statsElement) {
            statsElement.innerHTML = `
                <small class="text-muted">Real-time Haversine Tracking</small>
                <div class="row small text-center">
                    <div class="col-4">Points: ${realTimeData.dataPoints}</div>
                    <div class="col-4">Current: ${realTimeData.currentSpeed.toFixed(2)}km/h</div>
                    <div class="col-4">Avg: ${realTimeData.averageSpeed.toFixed(2)}km/h</div>
                    <div class="col-4">Max: ${realTimeData.stats.maxSpeed.toFixed(2)}km/h</div>
                    <div class="col-4">Distance: ${realTimeData.totalDistance.toFixed(3)}km</div>
                    <div class="col-4">Duration: ${(realTimeData.trackingDuration / 60).toFixed(1)}m</div>
                </div>
            `;
        }
        
        // Update data points progress
        const progressElement = document.getElementById('dataProgress');
        if (progressElement) {
            const progress = (realTimeData.dataPoints / 61200 * 100).toFixed(1);
            progressElement.textContent = `${progress}% (${realTimeData.dataPoints}/61200)`;
            progressElement.className = `fw-bold ${
                progress > 90 ? 'text-danger' : 
                progress > 70 ? 'text-warning' : 'text-success'
            }`;
        }
        
        // Update session duration
        this.updateSessionDuration();
    }

    /**
     * Enhanced GPS Display dengan data real-time
     */
    updateGPSDisplay(waypoint) {
        document.getElementById('currentLat').textContent = waypoint.lat.toFixed(8);
        document.getElementById('currentLng').textContent = waypoint.lng.toFixed(8);
        document.getElementById('currentSpeed').textContent = this.currentSpeed.toFixed(3);
        document.getElementById('gpsAccuracy').textContent = waypoint.accuracy.toFixed(2) + ' m';
        document.getElementById('totalDistance').textContent = this.totalDistance.toFixed(6);
        document.getElementById('dataPoints').textContent = this.haversineCalculator.dataPointsCount;
        
        if (waypoint.bearing) {
            document.getElementById('gpsBearing').textContent = waypoint.bearing + '°';
        }
        
        this.updateGPSAccuracyDisplay(waypoint.accuracy);
        this.updateRealTimeDisplay();
    }

    updateGPSAccuracyDisplay(accuracy) {
        const accuracyElement = document.getElementById('gpsAccuracyStatus');
        if (!accuracyElement) return;
        
        let status = '';
        let className = '';
        
        if (accuracy <= 10) {
            status = 'Excellent';
            className = 'gps-accuracy-excellent';
        } else if (accuracy <= 25) {
            status = 'Good';
            className = 'gps-accuracy-good';
        } else if (accuracy <= 50) {
            status = 'Fair';
            className = 'gps-accuracy-fair';
        } else if (accuracy <= 100) {
            status = 'Poor';
            className = 'gps-accuracy-poor';
        } else {
            status = 'Bad';
            className = 'gps-accuracy-bad';
        }
        
        accuracyElement.textContent = `${accuracy}m (${status})`;
        accuracyElement.className = `accuracy-indicator ${className}`;
    }

    isValidGPSPosition(position) {
        if (!position || !position.coords) return false;
        
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        
        if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
            return false;
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return false;
        }
        
        if (lat === 0 && lng === 0) {
            return false;
        }
        
        return true;
    }

    startRealGPSTracking() {
        if (!navigator.geolocation) {
            this.addLog('❌ GPS tidak didukung di browser ini', 'error');
            return;
        }

        console.log('📍 Starting REAL-TIME GPS tracking - 61,200 Points...');
        
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
            distanceFilter: 0 // No filter, dapatkan semua data
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                this.handleEnhancedPositionUpdate(position);
            },
            (error) => {
                this.handleGPSError(error);
            },
            options
        );

        this.isTracking = true;
        this.addLog('📍 Real-time GPS tracking diaktifkan - 61,200 points capacity', 'success');
    }

    handleGPSError(error) {
        let message = '';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message = '❌ Izin GPS Ditolak - aktifkan lokasi di browser';
                break;
            case error.POSITION_UNAVAILABLE:
                message = '❌ GPS Device Tidak Aktif';
                break;
            case error.TIMEOUT:
                message = '⏱️ Timeout GPS - cari sinyal lebih baik';
                break;
            default:
                message = '❌ Error GPS Tidak Diketahui';
                break;
        }
        
        this.addLog(message, 'error');
    }

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
                accuracy: 0, timestamp: new Date().toISOString(),
                isActive: true,
                trackingMode: 'real_time_61200_points'
            };

            this.firebaseRef.set(cleanData);
            this.showDriverApp();
            this.startDataTransmission();
            
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
        
        this.startRealGPSTracking();
        
        this.addLog(`✅ Login berhasil - ${this.driverData.name} (${this.driverData.unit})`, 'success');
        this.addLog('🚀 Real-time tracking aktif - 61,200 points capacity', 'info');
    }

    processWaypoint(waypoint) {
        if (!this.isValidCoordinate(waypoint.lat, waypoint.lng)) {
            console.warn('❌ Invalid coordinates, skipping waypoint:', waypoint);
            return;
        }

        this.waypointBuffer.push(waypoint);
        this.unsyncedWaypoints.add(waypoint.id);
        
        if (!this.isInBackground) {
            this.updateGPSDisplay(waypoint);
        }
        
        this.dataPoints++;
        if (!this.isInBackground) {
            document.getElementById('dataPoints').textContent = this.dataPoints;
        }

        console.log(`📍 GPS Point: ${waypoint.lat}, ${waypoint.lng}, Speed: ${waypoint.speed} km/h`);
    }

    isValidCoordinate(lat, lng) {
        if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) {
            return false;
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            return false;
        }
        
        if (lat === 0 && lng === 0) {
            return false;
        }
        
        return true;
    }

    updateAverageSpeed() {
        if (this.dataPoints > 0 && this.sessionStartTime && this.totalDistance > 0) {
            const durationHours = (new Date() - this.sessionStartTime) / 3600000;
            const avgSpeed = durationHours > 0 ? this.totalDistance / durationHours : 0;
            
            if (!this.isInBackground) {
                document.getElementById('avgSpeed').textContent = avgSpeed.toFixed(2);
            }
        }
    }

    startDataTransmission() {
        if (this.sendInterval) {
            clearInterval(this.sendInterval);
        }
        
        this.sendInterval = setInterval(() => {
            if (this.lastPosition) {
                this.sendToFirebase();
            }
        }, 5000);
    }

    async sendToFirebase() {
        if (!this.firebaseRef || !this.lastPosition) return;

        try {
            const realTimeData = this.haversineCalculator.getRealTimeData();
            
            const gpsData = {
                driver: this.driverData.name,
                unit: this.driverData.unit,
                lat: parseFloat(this.lastPosition.lat.toFixed(8)),
                lng: parseFloat(this.lastPosition.lng.toFixed(8)),
                speed: parseFloat(this.currentSpeed.toFixed(3)),
                accuracy: parseFloat(this.lastPosition.accuracy.toFixed(2)),
                bearing: this.lastPosition.bearing ? parseFloat(this.lastPosition.bearing.toFixed(0)) : null,
                timestamp: new Date().toISOString(),
                lastUpdate: new Date().toLocaleTimeString('id-ID'),
                distance: parseFloat(this.totalDistance.toFixed(6)),
                journeyStatus: this.journeyStatus,
                sessionId: this.driverData.sessionId,
                isActive: true,
                dataPoints: this.dataPoints,
                totalDataPoints: realTimeData.dataPoints,
                trackingMode: 'real_time_61200_points',
                averageSpeed: realTimeData.averageSpeed.toFixed(2),
                maxSpeed: realTimeData.stats.maxSpeed.toFixed(2)
            };

            await this.firebaseRef.set(gpsData);
            if (!this.isInBackground) {
                this.addLog(`📡 Data terkirim: ${this.currentSpeed.toFixed(3)} km/h | ${this.totalDistance.toFixed(6)} km`, 'success');
            }
            this.updateConnectionStatus(true);
            
        } catch (error) {
            console.error('Error sending to Firebase:', error);
            if (!this.isInBackground) {
                this.addLog(`❌ Gagal kirim data`, 'error');
            }
        }
    }

    checkNetworkStatus() {
        const wasOnline = this.isOnline;
        this.isOnline = navigator.onLine;
        
        if (wasOnline !== this.isOnline) {
            if (this.isOnline) {
                this.addLog('📱 Koneksi pulih', 'success');
                this.updateConnectionStatus(true);
            } else {
                this.addLog('📱 Koneksi terputus - data disimpan lokal', 'warning');
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
            if (dot) dot.className = 'connection-dot connected';
            if (status) {
                status.textContent = 'TERHUBUNG';
                status.className = 'text-success';
            }
        } else {
            if (dot) dot.className = 'connection-dot disconnected';
            if (status) {
                status.textContent = 'OFFLINE';
                status.className = 'text-danger';
            }
        }
    }

    addLog(message, type = 'info') {
        if (this.isInBackground && type !== 'error') {
            return;
        }
        
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
        
        if (logContainer.children.length > 8) {
            logContainer.removeChild(logContainer.lastChild);
        }
        
        console.log(`📝 [${type.toUpperCase()}] ${message}`);
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
        this.addLog('Perjalanan dimulai - Real-time tracking aktif', 'success');
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
        this.addLog(`Perjalanan selesai - Total jarak: ${this.totalDistance.toFixed(6)} km`, 'info');
        this.sendToFirebase();
        
        // Export data akhir
        this.exportData();
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

    forceSync() {
        this.addLog('🔄 Memaksa sinkronisasi data...', 'info');
        this.sendToFirebase();
        this.updateRealTimeDisplay();
    }

    async runGPSDiagnostic() {
        this.addLog('📡 Menjalankan diagnostic GPS lengkap...', 'info');
        
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

            const realTimeData = this.haversineCalculator.getRealTimeData();
            
            const diagnosticMessage = `
✅ REAL-TIME GPS DIAGNOSTIC:
• Data Points: ${realTimeData.dataPoints}/61,200
• Current Speed: ${this.currentSpeed.toFixed(3)} km/h
• Total Distance: ${this.totalDistance.toFixed(6)} km
• Average Speed: ${realTimeData.averageSpeed.toFixed(2)} km/h
• Max Speed: ${realTimeData.stats.maxSpeed.toFixed(2)} km/h
• Tracking Duration: ${(realTimeData.trackingDuration / 60).toFixed(1)} menit
• GPS Accuracy: ${position.coords.accuracy}m
• Coordinates: ${position.coords.latitude.toFixed(8)}, ${position.coords.longitude.toFixed(8)}
• Altitude: ${position.coords.altitude ? position.coords.altitude.toFixed(1) + 'm' : 'N/A'}
• Heading: ${position.coords.heading ? position.coords.heading + '°' : 'N/A'}
                    `.trim();

            this.addLog(diagnosticMessage, 'success');

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

    exportData() {
        const exportData = this.haversineCalculator.getExportData();
        
        // Create downloadable JSON file
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gps_data_${this.driverData.unit}_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        this.addLog(`📊 Data diexport: ${exportData.metadata.totalDataPoints} points, ${exportData.metadata.totalDistance} km`, 'success');
        
        return exportData;
    }

    resetData() {
        if (confirm('Yakin ingin reset semua data? Total jarak dan points akan dikembalikan ke 0.')) {
            this.haversineCalculator.reset();
            this.totalDistance = 0;
            this.currentSpeed = 0;
            this.dataPoints = 0;
            this.waypointBuffer = [];
            this.unsyncedWaypoints.clear();
            
            this.updateRealTimeDisplay();
            this.addLog('🔄 Semua data telah direset', 'warning');
        }
    }

    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }
        if (this.sendInterval) {
            clearInterval(this.sendInterval);
        }
        
        this.isTracking = false;
        this.addLog('🛑 Tracking dihentikan', 'info');
    }

    logout() {
        if (confirm('Yakin ingin logout? Tracking akan dihentikan.')) {
            this.stopTracking();
            
            if (this.firebaseRef) {
                this.firebaseRef.update({
                    isActive: false,
                    lastUpdate: new Date().toLocaleTimeString('id-ID'),
                    journeyStatus: 'ended',
                    timestamp: new Date().toISOString()
                });
            }
            
            // Export data sebelum logout
            this.exportData();
            
            const loginScreen = document.getElementById('loginScreen');
            const driverApp = document.getElementById('driverApp');
            const loginForm = document.getElementById('loginForm');
            
            if (loginScreen) loginScreen.style.display = 'block';
            if (driverApp) driverApp.style.display = 'none';
            if (loginForm) loginForm.reset();
            
            this.driverData = null;
            this.firebaseRef = null;
            this.totalDistance = 0;
            this.dataPoints = 0;
            this.lastPosition = null;
            
            this.addLog('✅ Logout berhasil', 'success');
        }
    }
}

// =============================================
// 🚀 APPLICATION INITIALIZATION
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Starting Real-time GPS Logger - 61,200 Points...');
        
        window.dtLogger = new EnhancedDTGPSLogger();
        console.log('✅ Real-time GPS Logger successfully initialized');

        window.addEventListener('error', function(event) {
            console.error('Global error:', event.error);
        });

        window.addEventListener('unhandledrejection', function(event) {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });

    } catch (error) {
        console.error('❌ Failed to initialize GPS Logger:', error);
        
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.innerHTML = `
                <div class="alert alert-danger">
                    <h4>❌ Gagal Menginisialisasi Aplikasi</h4>
                    <p>Terjadi kesalahan saat memuat aplikasi. Silakan refresh halaman.</p>
                    <small>Error: ${error.message}</small>
                    <br><br>
                    <button class="btn btn-warning btn-sm" onclick="window.location.reload()">
                        🔄 Refresh Halaman
                    </button>
                </div>
            `;
        }
    }
});

console.log('📍 script-mobile.js loaded successfully - REAL-TIME 61,200 POINTS');
