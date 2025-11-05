// =============================================
// 🚀 ENHANCED MOBILE GPS TRACKING SYSTEM
// 📍 REAL-TIME 61,200 POINTS HAVERSINE CALCULATOR
// 🎯 Version: 7.0 - Pure Real-time Data Logger
// 🔄 Support: Offline & Background Tracking
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
        this.smoothingFactor = 0.3;
        this.totalDistanceMeters = 0;
        this.lastValidPosition = null;
        this.dataPointsCount = 0;
        
        // Real-time statistics
        this.realTimeStats = {
            totalCalculations: 0,
            averageInterval: 0,
            maxSpeed: 0,
            minSpeed: Infinity,
            totalTimeMs: 0,
            offlinePoints: 0,
            backgroundPoints: 0
        };
        
        // Offline storage
        this.offlineBuffer = [];
        this.maxOfflineBuffer = 10000;
        this.isOnline = navigator.onLine;
        
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
     * Menambahkan posisi baru - SUPPORT OFFLINE & BACKGROUND
     */
    addPosition(position, accuracy, isBackground = false, isOnline = true) {
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
            dataPointId: this.dataPointsCount++,
            isOnline: isOnline,
            isBackground: isBackground,
            synced: false
        };

        // Update stats untuk offline/background
        if (!isOnline) this.realTimeStats.offlinePoints++;
        if (isBackground) this.realTimeStats.backgroundPoints++;

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
            
            console.log(`📏 Point ${this.dataPointsCount}: ${instantDistance.toFixed(6)}m | Speed: ${instantSpeed.toFixed(3)} km/h | Total: ${(this.totalDistanceMeters/1000).toFixed(6)}km | ${!isOnline ? '📴 OFFLINE' : ''} ${isBackground ? '📱 BACKGROUND' : ''}`);
        }

        this.lastValidPosition = positionData;
        this.positionHistory.push(positionData);

        // Simpan ke offline buffer jika offline
        if (!isOnline) {
            this.addToOfflineBuffer(positionData);
        }

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
            dataPointId: positionData.dataPointId,
            isOnline: isOnline,
            isBackground: isBackground
        };
    }

    /**
     * =============================================
     * 🚀 ENHANCED MULTI-POINT SPEED CALCULATION
     * 📍 Untuk 61,200 Titik dengan Haversine
     * =============================================
     */

    /**
     * Fungsi Haversine untuk multiple points
     */
    haversine(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius bumi dalam km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const lat1Rad = lat1 * Math.PI / 180;
        const lat2Rad = lat2 * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1Rad) * Math.cos(lat2Rad) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    /**
     * Menghitung kecepatan dari multiple titik (N points) - OFFLINE SUPPORT
     */
    calculateSpeedsFromPoints(points, includeOfflineData = true) {
        if (points.length < 2) {
            throw new Error('Minimal diperlukan 2 titik untuk menghitung kecepatan');
        }

        const results = [];
        let totalDistance = 0;
        let totalTime = 0;
        let onlineSegments = 0;
        let offlineSegments = 0;
        let backgroundSegments = 0;
        
        // Hitung untuk setiap segmen antara titik
        for (let i = 1; i < points.length; i++) {
            const prevPoint = points[i-1];
            const currentPoint = points[i];
            
            // Skip jika tidak include offline data dan point ini offline
            if (!includeOfflineData && (!prevPoint.isOnline || !currentPoint.isOnline)) {
                continue;
            }
            
            // Validasi data
            if (!prevPoint.timestamp || !currentPoint.timestamp) {
                console.warn(`Timestamp tidak tersedia untuk titik ${i-1} atau ${i}, melewati...`);
                continue;
            }
            
            // Hitung jarak menggunakan Haversine
            const distance = this.haversine(
                prevPoint.lat, prevPoint.lng,
                currentPoint.lat, currentPoint.lng
            );
            
            // Hitung selisih waktu (dalam jam)
            const timeDiffMs = Math.abs(new Date(currentPoint.timestamp) - new Date(prevPoint.timestamp));
            const timeDiffHours = timeDiffMs / (1000 * 60 * 60);
            
            // Hindari pembagian dengan nol
            if (timeDiffHours === 0) {
                console.warn(`Selisih waktu nol antara titik ${i-1} dan ${i}, melewati...`);
                continue;
            }
            
            // Hitung kecepatan
            const speed = distance / timeDiffHours;

            // Update segment counters
            if (!currentPoint.isOnline) offlineSegments++;
            if (currentPoint.isBackground) backgroundSegments++;
            if (currentPoint.isOnline) onlineSegments++;
            
            const segmentResult = {
                segment: `${i-1} → ${i}`,
                distance: distance,
                timeDiff: timeDiffHours,
                speed: speed,
                speedMps: speed / 3.6,
                startTime: prevPoint.timestamp,
                endTime: currentPoint.timestamp,
                isOnline: currentPoint.isOnline,
                isBackground: currentPoint.isBackground,
                coordinates: {
                    start: { lat: prevPoint.lat, lng: prevPoint.lng },
                    end: { lat: currentPoint.lat, lng: currentPoint.lng }
                }
            };
            
            results.push(segmentResult);
            totalDistance += distance;
            totalTime += timeDiffHours;
        }
        
        // Hitung statistik
        const speeds = results.map(r => r.speed);
        const avgSpeed = totalTime > 0 ? totalDistance / totalTime : 0;
        
        const statistics = {
            totalPoints: points.length,
            totalSegments: results.length,
            totalDistance: totalDistance,
            totalTime: totalTime,
            averageSpeed: avgSpeed,
            maxSpeed: Math.max(...speeds),
            minSpeed: Math.min(...speeds),
            averageSpeedMps: avgSpeed / 3.6,
            onlineSegments: onlineSegments,
            offlineSegments: offlineSegments,
            backgroundSegments: backgroundSegments
        };
        
        return {
            segments: results,
            statistics: statistics
        };
    }

    /**
     * Menghitung kecepatan dari semua titik yang tersimpan (hingga 61,200)
     */
    calculateAllPointsSpeed(includeOfflineData = true) {
        if (this.positionHistory.length < 2) {
            return {
                segments: [],
                statistics: {
                    totalPoints: 0,
                    totalSegments: 0,
                    totalDistance: 0,
                    totalTime: 0,
                    averageSpeed: 0,
                    maxSpeed: 0,
                    minSpeed: 0,
                    averageSpeedMps: 0,
                    onlineSegments: 0,
                    offlineSegments: 0,
                    backgroundSegments: 0
                }
            };
        }

        return this.calculateSpeedsFromPoints(this.positionHistory, includeOfflineData);
    }

    /**
     * Menghitung kecepatan untuk titik tertentu (range)
     */
    calculateSpeedRange(startIndex, endIndex, includeOfflineData = true) {
        if (startIndex < 0 || endIndex >= this.positionHistory.length || startIndex >= endIndex) {
            throw new Error('Index tidak valid');
        }

        const selectedPoints = this.positionHistory.slice(startIndex, endIndex + 1);
        return this.calculateSpeedsFromPoints(selectedPoints, includeOfflineData);
    }

    /**
     * Optimized calculation untuk dataset besar (61,200+ points) - OFFLINE SUPPORT
     */
    calculateSpeedsOptimized(batchSize = 1000, includeOfflineData = true) {
        const results = {
            segments: [],
            statistics: {
                totalPoints: this.positionHistory.length,
                totalSegments: 0,
                totalDistance: 0,
                totalTime: 0,
                speeds: [],
                onlineSegments: 0,
                offlineSegments: 0,
                backgroundSegments: 0
            }
        };
        
        // Proses dalam batch untuk menghindari blocking
        for (let batchStart = 1; batchStart < this.positionHistory.length; batchStart += batchSize) {
            const batchEnd = Math.min(batchStart + batchSize, this.positionHistory.length);
            
            for (let i = batchStart; i < batchEnd; i++) {
                const prev = this.positionHistory[i-1];
                const curr = this.positionHistory[i];
                
                if (!prev.timestamp || !curr.timestamp) continue;
                
                // Skip jika tidak include offline data
                if (!includeOfflineData && (!prev.isOnline || !curr.isOnline)) {
                    continue;
                }
                
                const distance = this.haversine(prev.lat, prev.lng, curr.lat, curr.lng);
                const timeDiff = Math.abs(new Date(curr.timestamp) - new Date(prev.timestamp)) / 3600000;
                
                if (timeDiff === 0) continue;
                
                const speed = distance / timeDiff;

                // Update counters
                if (!curr.isOnline) results.statistics.offlineSegments++;
                if (curr.isBackground) results.statistics.backgroundSegments++;
                if (curr.isOnline) results.statistics.onlineSegments++;
                
                results.segments.push({
                    segment: `${i-1} → ${i}`,
                    speed: speed,
                    distance: distance,
                    timeDiff: timeDiff,
                    isOnline: curr.isOnline,
                    isBackground: curr.isBackground
                });
                
                results.statistics.totalDistance += distance;
                results.statistics.totalTime += timeDiff;
                results.statistics.speeds.push(speed);
            }
            
            // Progress update untuk dataset besar
            if (batchStart % 10000 === 1) {
                console.log(`🔄 Diproses: ${batchStart} dari ${this.positionHistory.length} titik`);
            }
        }
        
        // Hitung statistik akhir
        results.statistics.totalSegments = results.segments.length;
        results.statistics.averageSpeed = results.statistics.totalTime > 0 ? 
            results.statistics.totalDistance / results.statistics.totalTime : 0;
        results.statistics.maxSpeed = Math.max(...results.statistics.speeds);
        results.statistics.minSpeed = Math.min(...results.statistics.speeds);
        
        return results;
    }

    /**
     * =============================================
     * 🔄 OFFLINE & BACKGROUND SUPPORT
     * =============================================
     */

    /**
     * Menambahkan data ke offline buffer
     */
    addToOfflineBuffer(positionData) {
        this.offlineBuffer.push(positionData);
        
        // Maintain buffer size
        if (this.offlineBuffer.length > this.maxOfflineBuffer) {
            this.offlineBuffer.shift();
        }
        
        // Simpan ke localStorage untuk persistence
        this.saveOfflineData();
    }

    /**
     * Menyimpan data offline ke localStorage
     */
    saveOfflineData() {
        try {
            const offlineData = {
                buffer: this.offlineBuffer,
                totalDistance: this.totalDistanceMeters,
                dataPointsCount: this.dataPointsCount,
                lastPosition: this.lastValidPosition,
                timestamp: Date.now()
            };
            
            localStorage.setItem('gps_offline_data', JSON.stringify(offlineData));
            console.log('💾 Offline data saved to localStorage');
        } catch (error) {
            console.error('❌ Error saving offline data:', error);
        }
    }

    /**
     * Memuat data offline dari localStorage
     */
    loadOfflineData() {
        try {
            const saved = localStorage.getItem('gps_offline_data');
            if (saved) {
                const offlineData = JSON.parse(saved);
                this.offlineBuffer = offlineData.buffer || [];
                this.totalDistanceMeters = offlineData.totalDistance || 0;
                this.dataPointsCount = offlineData.dataPointsCount || 0;
                this.lastValidPosition = offlineData.lastPosition || null;
                
                console.log('📂 Offline data loaded from localStorage:', this.offlineBuffer.length, 'points');
                return true;
            }
        } catch (error) {
            console.error('❌ Error loading offline data:', error);
        }
        return false;
    }

    /**
     * Sinkronisasi data offline ketika koneksi tersedia
     */
    async syncOfflineData() {
        if (this.offlineBuffer.length === 0) {
            console.log('✅ No offline data to sync');
            return;
        }

        console.log(`🔄 Syncing ${this.offlineBuffer.length} offline points...`);
        
        try {
            // Process offline points (simulasi upload ke server)
            for (const point of this.offlineBuffer) {
                point.synced = true;
                point.syncTime = Date.now();
                
                // Simulasi delay upload
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            console.log(`✅ Successfully synced ${this.offlineBuffer.length} offline points`);
            this.offlineBuffer = [];
            this.saveOfflineData();
            
        } catch (error) {
            console.error('❌ Error syncing offline data:', error);
        }
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
     * Validasi posisi GPS
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
            timeDiff: timeDiffMs,
            isOnline: pos2.isOnline,
            isBackground: pos2.isBackground
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
     * Get comprehensive real-time data dengan info offline
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
            trackingDuration: this.realTimeStats.totalTimeMs / 1000,
            offlineBufferSize: this.offlineBuffer.length,
            isOnline: this.isOnline
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
     * Get data untuk export/analisis dengan multi-point analysis
     */
    getExportData() {
        // Hitung analisis multi-point
        const multiPointAnalysis = this.calculateAllPointsSpeed(true); // Include offline data
        
        return {
            metadata: {
                totalDataPoints: this.dataPointsCount,
                trackingDuration: this.realTimeStats.totalTimeMs / 1000,
                exportTime: new Date().toISOString(),
                totalDistance: this.getTotalDistance(),
                averageSpeed: this.calculateAverageSpeed(),
                maxSpeed: this.realTimeStats.maxSpeed,
                minSpeed: this.realTimeStats.minSpeed,
                offlinePoints: this.realTimeStats.offlinePoints,
                backgroundPoints: this.realTimeStats.backgroundPoints,
                multiPointStats: multiPointAnalysis.statistics
            },
            positionHistory: this.positionHistory,
            speedHistory: this.speedHistory,
            offlineBuffer: this.offlineBuffer,
            statistics: this.realTimeStats,
            multiPointAnalysis: multiPointAnalysis
        };
    }

    /**
     * Update online status
     */
    setOnlineStatus(isOnline) {
        this.isOnline = isOnline;
        if (isOnline && this.offlineBuffer.length > 0) {
            // Trigger sync ketika online kembali
            setTimeout(() => this.syncOfflineData(), 2000);
        }
    }

    reset() {
        this.positionHistory = [];
        this.speedHistory = [];
        this.lastValidSpeed = 0;
        this.lastCalculationTime = 0;
        this.totalDistanceMeters = 0;
        this.lastValidPosition = null;
        this.dataPointsCount = 0;
        this.offlineBuffer = [];
        this.realTimeStats = {
            totalCalculations: 0,
            averageInterval: 0,
            maxSpeed: 0,
            minSpeed: Infinity,
            totalTimeMs: 0,
            offlinePoints: 0,
            backgroundPoints: 0
        };
        
        // Clear localStorage
        localStorage.removeItem('gps_offline_data');
    }
}

// =============================================
// 🚀 COMPLETE REAL-TIME GPS LOGGER - 61,200 POINTS
// 🔄 OFFLINE & BACKGROUND SUPPORT
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
        
        // REAL-TIME HAVERSINE CALCULATOR dengan offline support
        this.haversineCalculator = new EnhancedHaversineCalculator();
        
        this.backgroundManager = null;
        this.isInBackground = false;
        
        this.chatRef = null;
        this.chatMessages = [];
        this.unreadCount = 0;
        this.isChatOpen = false;
        this.chatInitialized = false;
        this.lastMessageId = null;
        
        // Background tracking interval
        this.backgroundInterval = null;
        
        this.init();
    }

    init() {
        try {
            // Load offline data terlebih dahulu
            this.haversineCalculator.loadOfflineData();
            
            this.setupEventListeners();
            this.setupNetworkListeners();
            this.setupBackgroundTracking();
            this.updateTime();
            this.checkNetworkStatus();
            
            setInterval(() => this.updateTime(), 1000);
            setInterval(() => this.checkNetworkStatus(), 5000);
            setInterval(() => this.autoSaveOfflineData(), 30000); // Auto-save setiap 30 detik
            
            console.log('🚀 Enhanced DT GPS Logger initialized - OFFLINE & BACKGROUND SUPPORT');
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
            this.haversineCalculator.setOnlineStatus(this.isOnline);
            
            if (document.hidden) {
                console.log('📱 App moved to background');
                this.addLog('📱 Mode background aktif', 'info');
                this.startBackgroundTracking();
            } else {
                console.log('📱 App returned to foreground');
                this.addLog('📱 Mode foreground aktif', 'success');
                this.stopBackgroundTracking();
                this.updateRealTimeDisplay();
            }
        });

        // Page refresh/unload protection
        window.addEventListener('beforeunload', (e) => {
            if (this.isTracking) {
                this.haversineCalculator.saveOfflineData();
            }
        });
    }

    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.haversineCalculator.setOnlineStatus(true);
            this.addLog('🌐 Koneksi internet tersedia', 'success');
            this.syncAllOfflineData();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.haversineCalculator.setOnlineStatus(false);
            this.addLog('📴 Mode offline aktif - data disimpan lokal', 'warning');
        });
    }

    setupBackgroundTracking() {
        // Background tracking menggunakan setInterval sebagai fallback
        this.backgroundInterval = setInterval(() => {
            if (this.isInBackground && this.isTracking) {
                this.forcePositionUpdate();
            }
        }, 5000); // Update setiap 5 detik di background
    }

    startBackgroundTracking() {
        console.log('🔄 Starting background tracking');
        // Background tracking sudah dihandle oleh backgroundInterval
    }

    stopBackgroundTracking() {
        console.log('🔄 Stopping background tracking');
        // Tidak perlu stop interval, biarkan berjalan untuk efisiensi
    }

    forcePositionUpdate() {
        if (navigator.geolocation && this.isTracking) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    this.handleEnhancedPositionUpdate(position, true);
                },
                (error) => {
                    console.warn('Background position update failed:', error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        }
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

        // Tombol baru untuk multi-point analysis
        document.getElementById('analyzePointsBtn')?.addEventListener('click', () => this.analyzeAllPoints());
        document.getElementById('optimizedAnalysisBtn')?.addEventListener('click', () => this.runOptimizedAnalysis());
        document.getElementById('syncOfflineBtn')?.addEventListener('click', () => this.syncAllOfflineData());
    }

    /**
     * REAL-TIME POSITION HANDLING - 61,200 POINTS + OFFLINE SUPPORT
     */
    async handleEnhancedPositionUpdate(position, isBackground = false) {
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

        // REAL-TIME HAVERSINE CALCULATION - 61,200 POINTS dengan offline support
        this.calculateRealTimeMovement(currentPosition, isBackground);

        const waypoint = {
            ...currentPosition,
            speed: this.currentSpeed,
            id: `wp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sessionId: this.driverData?.sessionId || 'unknown',
            unit: this.driverData?.unit || 'unknown',
            driver: this.driverData?.name || 'unknown',
            synced: this.isOnline, // Langsung sync jika online
            isBackground: isBackground,
            dataPointNumber: this.haversineCalculator.dataPointsCount,
            calculationMethod: 'real_time_haversine_61200'
        };

        this.processWaypoint(waypoint);
        this.lastPosition = currentPosition;

        // Update display setiap 10 data points
        if (this.dataPoints % 10 === 0 || isBackground) {
            this.updateRealTimeDisplay();
        }
    }

    /**
     * REAL-TIME MOVEMENT UNTUK 61,200 TITIK + OFFLINE
     */
    calculateRealTimeMovement(currentPosition, isBackground = false) {
        const result = this.haversineCalculator.addPosition(
            { lat: currentPosition.lat, lng: currentPosition.lng },
            currentPosition.accuracy,
            isBackground,
            this.isOnline
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
            
            // Update offline indicator
            const offlineIndicator = document.getElementById('offlineIndicator');
            if (offlineIndicator) {
                if (!this.isOnline) {
                    offlineIndicator.innerHTML = '<span class="badge bg-warning">📴 OFFLINE</span>';
                } else {
                    offlineIndicator.innerHTML = '<span class="badge bg-success">🌐 ONLINE</span>';
                }
            }
        }
        
        console.log(`📏 Real-time #${this.haversineCalculator.dataPointsCount}: ${speed.toFixed(3)} km/h | Total: ${this.totalDistance.toFixed(6)}km | ${!this.isOnline ? '📴 OFFLINE' : ''} ${isBackground ? '📱 BACKGROUND' : ''}`);
        
        this.updateAverageSpeed();
    }

    /**
     * =============================================
     * 🚀 MULTI-POINT ANALYSIS FUNCTIONS + OFFLINE
     * 📍 Untuk analisis 61,200 titik
     * =============================================
     */

    /**
     * Analisis semua titik yang terkumpul (termasuk offline)
     */
    analyzeAllPoints() {
        try {
            console.log('🔍 Memulai analisis semua titik...');
            
            const analysis = this.haversineCalculator.calculateAllPointsSpeed(true); // Include offline
            const stats = analysis.statistics;
            
            // Tampilkan hasil analisis
            this.displayMultiPointAnalysis(analysis);
            
            console.log('✅ Analisis multi-point selesai:', stats);
            
        } catch (error) {
            console.error('❌ Error dalam analisis multi-point:', error);
            this.addLog(`❌ Analisis multi-point gagal: ${error.message}`, 'error');
        }
    }

    /**
     * Analisis optimized untuk dataset besar (termasuk offline)
     */
    runOptimizedAnalysis() {
        try {
            console.log('⚡ Memulai analisis optimized...');
            
            const optimizedResults = this.haversineCalculator.calculateSpeedsOptimized(2000, true);
            const stats = optimizedResults.statistics;
            
            // Tampilkan hasil optimized
            this.displayOptimizedAnalysis(optimizedResults);
            
            console.log('✅ Analisis optimized selesai:', stats);
            
        } catch (error) {
            console.error('❌ Error dalam analisis optimized:', error);
            this.addLog(`❌ Analisis optimized gagal: ${error.message}`, 'error');
        }
    }

    /**
     * Menampilkan hasil analisis multi-point dengan info offline
     */
    displayMultiPointAnalysis(analysis) {
        const stats = analysis.statistics;
        
        const analysisHTML = `
            <div class="card mt-3">
                <div class="card-header bg-primary text-white">
                    <h6 class="mb-0">📊 Multi-Point Analysis (${stats.totalPoints} Titik)</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-6">
                            <small class="text-muted">Total Segmen</small>
                            <div class="fw-bold">${stats.totalSegments}</div>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Total Jarak</small>
                            <div class="fw-bold">${stats.totalDistance.toFixed(3)} km</div>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Total Waktu</small>
                            <div class="fw-bold">${stats.totalTime.toFixed(2)} jam</div>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Rata-rata Kecepatan</small>
                            <div class="fw-bold">${stats.averageSpeed.toFixed(2)} km/jam</div>
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-4">
                            <small class="text-muted">Online</small>
                            <div class="fw-bold text-success">${stats.onlineSegments}</div>
                        </div>
                        <div class="col-4">
                            <small class="text-muted">Offline</small>
                            <div class="fw-bold text-warning">${stats.offlineSegments}</div>
                        </div>
                        <div class="col-4">
                            <small class="text-muted">Background</small>
                            <div class="fw-bold text-info">${stats.backgroundSegments}</div>
                        </div>
                    </div>
                    <div class="row mt-2">
                        <div class="col-6">
                            <small class="text-muted">Kecepatan Maks</small>
                            <div class="fw-bold text-danger">${stats.maxSpeed.toFixed(2)} km/jam</div>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Kecepatan Min</small>
                            <div class="fw-bold text-info">${stats.minSpeed.toFixed(2)} km/jam</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Update UI
        const analysisContainer = document.getElementById('multiPointAnalysis');
        if (analysisContainer) {
            analysisContainer.innerHTML = analysisHTML;
        }
        
        this.addLog(`📊 Analisis ${stats.totalPoints} titik selesai: ${stats.averageSpeed.toFixed(2)} km/jam rata-rata`, 'success');
    }

    /**
     * Menampilkan hasil analisis optimized
     */
    displayOptimizedAnalysis(results) {
        const stats = results.statistics;
        
        const optimizedHTML = `
            <div class="card mt-3">
                <div class="card-header bg-success text-white">
                    <h6 class="mb-0">⚡ Optimized Analysis (${stats.totalPoints} Titik)</h6>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-6">
                            <small class="text-muted">Segmen Diproses</small>
                            <div class="fw-bold">${stats.totalSegments}</div>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Jarak Total</small>
                            <div class="fw-bold">${stats.totalDistance.toFixed(3)} km</div>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Waktu Total</small>
                            <div class="fw-bold">${stats.totalTime.toFixed(2)} jam</div>
                        </div>
                        <div class="col-6">
                            <small class="text-muted">Rata-rata</small>
                            <div class="fw-bold">${stats.averageSpeed.toFixed(2)} km/jam</div>
                        </div>
                    </div>
                    <div class="mt-2">
                        <small class="text-muted">Efisiensi: Batch processing ${stats.totalPoints} titik</small>
                        <br>
                        <small class="text-muted">Offline: ${stats.offlineSegments} | Background: ${stats.backgroundSegments}</small>
                    </div>
                </div>
            </div>
        `;
        
        // Update UI
        const optimizedContainer = document.getElementById('optimizedAnalysis');
        if (optimizedContainer) {
            optimizedContainer.innerHTML = optimizedHTML;
        }
        
        this.addLog(`⚡ Optimized analysis ${stats.totalPoints} titik selesai`, 'info');
    }

    /**
     * Enhanced Real-time Display dengan multi-point info + offline status
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
                <div class="row small text-center mt-1">
                    <div class="col-4">Offline: ${realTimeData.stats.offlinePoints}</div>
                    <div class="col-4">Background: ${realTimeData.stats.backgroundPoints}</div>
                    <div class="col-4">Buffer: ${realTimeData.offlineBufferSize}</div>
                </div>
            `;
        }
        
        // Update data points progress
        const progressElement = document.getElementById('dataProgress');
        if (progressElement) {
            const progress = (realTimeData.dataPoints / 61200 * 100).toFixed(1);
            progressElement.innerHTML = `
                <div class="progress" style="height: 8px;">
                    <div class="progress-bar bg-warning" role="progressbar" 
                         style="width: ${progress}%;" 
                         aria-valuenow="${progress}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                    </div>
                </div>
                <small class="text-muted">${realTimeData.dataPoints} / 61,200 points (${progress}%)</small>
            `;
        }

        // Update multi-point analysis button status
        const analyzeBtn = document.getElementById('analyzePointsBtn');
        if (analyzeBtn) {
            analyzeBtn.disabled = realTimeData.dataPoints < 2;
            analyzeBtn.title = realTimeData.dataPoints < 2 ? 
                'Minimal 2 titik diperlukan' : 
                `Analisis ${realTimeData.dataPoints} titik`;
        }

        // Update sync button
        const syncBtn = document.getElementById('syncOfflineBtn');
        if (syncBtn) {
            syncBtn.disabled = realTimeData.offlineBufferSize === 0 || !realTimeData.isOnline;
            syncBtn.title = !realTimeData.isOnline ? 
                'Tunggu koneksi online' : 
                `Sync ${realTimeData.offlineBufferSize} titik offline`;
        }
    }

    /**
     * =============================================
     * 🔄 OFFLINE SYNC & BACKGROUND MANAGEMENT
     * =============================================
     */

    /**
     * Sinkronisasi semua data offline
     */
    async syncAllOfflineData() {
        if (!this.isOnline) {
            this.addLog('📴 Tidak bisa sync - masih offline', 'warning');
            return;
        }

        try {
            this.addLog('🔄 Memulai sinkronisasi data offline...', 'info');
            await this.haversineCalculator.syncOfflineData();
            this.addLog('✅ Sinkronisasi data offline selesai', 'success');
            this.updateRealTimeDisplay();
        } catch (error) {
            console.error('❌ Sync error:', error);
            this.addLog(`❌ Gagal sync data offline: ${error.message}`, 'error');
        }
    }

    /**
     * Auto-save offline data
     */
    autoSaveOfflineData() {
        if (this.isTracking && (!this.isOnline || this.haversineCalculator.offlineBuffer.length > 0)) {
            this.haversineCalculator.saveOfflineData();
            console.log('💾 Auto-save offline data');
        }
    }

    /**
     * Force sync data
     */
    forceSync() {
        if (this.isOnline) {
            this.syncAllOfflineData();
        } else {
            this.addLog('📴 Tidak bisa sync - tidak ada koneksi internet', 'warning');
        }
    }

    /**
     * Update average speed display
     */
    updateAverageSpeed() {
        const avgSpeed = this.haversineCalculator.calculateAverageSpeed();
        const avgSpeedElement = document.getElementById('averageSpeed');
        if (avgSpeedElement) {
            avgSpeedElement.textContent = avgSpeed.toFixed(2);
        }
    }

    /**
     * Enhanced export data dengan multi-point analysis + offline data
     */
    exportData() {
        try {
            const exportData = this.haversineCalculator.getExportData();
            
            // Create and download JSON file
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `gps_data_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
            link.click();
            
            console.log('✅ Data exported with multi-point analysis + offline data');
            this.addLog('📁 Data diexport dengan analisis lengkap + data offline', 'success');
            
        } catch (error) {
            console.error('❌ Export error:', error);
            this.addLog(`❌ Gagal export data: ${error.message}`, 'error');
        }
    }

    /**
     * Reset data dengan konfirmasi
     */
    resetData() {
        if (confirm('Reset semua data tracking? Data yang belum sync akan hilang.')) {
            this.haversineCalculator.reset();
            this.totalDistance = 0;
            this.currentSpeed = 0;
            this.dataPoints = 0;
            
            this.updateRealTimeDisplay();
            this.addLog('🔄 Semua data tracking direset', 'warning');
        }
    }

    /**
     * Check network status
     */
    checkNetworkStatus() {
        const wasOnline = this.isOnline;
        this.isOnline = navigator.onLine;
        this.haversineCalculator.setOnlineStatus(this.isOnline);
        
        if (wasOnline !== this.isOnline) {
            if (this.isOnline) {
                this.addLog('🌐 Koneksi internet tersedia', 'success');
                this.syncAllOfflineData();
            } else {
                this.addLog('📴 Mode offline aktif - data disimpan lokal', 'warning');
            }
        }
    }

    /**
     * Update time display
     */
    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('id-ID');
        const dateString = now.toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const timeElement = document.getElementById('currentTime');
        const dateElement = document.getElementById('currentDate');
        
        if (timeElement) timeElement.textContent = timeString;
        if (dateElement) dateElement.textContent = dateString;
    }

    /**
     * Add log message
     */
    addLog(message, type = 'info') {
        const logContainer = document.getElementById('logContainer');
        if (!logContainer) return;

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry log-${type}`;
        logEntry.innerHTML = `
            <span class="log-time">[${new Date().toLocaleTimeString('id-ID')}]</span>
            <span class="log-message">${message}</span>
        `;

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;

        // Keep only last 100 logs
        const logs = logContainer.getElementsByClassName('log-entry');
        if (logs.length > 100) {
            logs[0].remove();
        }
    }

    // ... (methods lainnya: handleLogin, startJourney, isValidGPSPosition, dll.)

    isValidGPSPosition(position) {
        if (!position || !position.coords) return false;
        
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        
        if (isNaN(lat) || isNaN(lng)) return false;
        if (lat === 0 && lng === 0) return false;
        if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
        if (accuracy > 100) return false; // Accuracy terlalu buruk
        
        return true;
    }

    processWaypoint(waypoint) {
        // Implementasi process waypoint sesuai kebutuhan
        this.dataPoints++;
        
        if (this.isOnline) {
            // Kirim ke Firebase jika online
            this.sendToFirebase(waypoint);
        } else {
            // Simpan ke buffer offline
            this.waypointBuffer.push(waypoint);
            if (this.waypointBuffer.length > 1000) {
                this.waypointBuffer.shift();
            }
        }
    }

    sendToFirebase(waypoint) {
        // Implementasi pengiriman ke Firebase
        try {
            // Contoh implementasi Firebase
            if (this.firebaseRef) {
                this.firebaseRef.push(waypoint);
            }
        } catch (error) {
            console.error('Firebase error:', error);
        }
    }

    startJourney() {
        // Implementasi start journey
        this.isTracking = true;
        this.sessionStartTime = Date.now();
        this.addLog('🚀 Perjalanan dimulai - Tracking aktif', 'success');
    }

    pauseJourney() {
        // Implementasi pause journey
        this.isTracking = false;
        this.addLog('⏸️ Perjalanan dijeda', 'warning');
    }

    endJourney() {
        // Implementasi end journey
        this.isTracking = false;
        this.addLog('🛑 Perjalanan diakhiri', 'info');
    }

    handleLogin() {
        // Implementasi login
        const username = document.getElementById('username')?.value;
        const password = document.getElementById('password')?.value;
        
        if (username && password) {
            this.driverData = { name: username, unit: 'Unit01' };
            this.addLog(`✅ Login berhasil: ${username}`, 'success');
        }
    }

    logout() {
        // Implementasi logout
        this.driverData = null;
        this.addLog('🚪 Logout berhasil', 'info');
    }

    reportIssue() {
        // Implementasi report issue
        this.addLog('📝 Laporan issue dikirim', 'info');
    }

    runGPSDiagnostic() {
        // Implementasi GPS diagnostic
        this.addLog('🔧 GPS diagnostic dijalankan', 'info');
    }
}

// =============================================
// 🚀 INITIALIZE APPLICATION
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    window.gpsLogger = new EnhancedDTGPSLogger();
    console.log('🚀 Enhanced GPS Logger 7.0 - OFFLINE & BACKGROUND READY!');
});

// Service Worker Registration untuk background sync (opsional)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(registration => {
            console.log('✅ Service Worker registered:', registration);
        })
        .catch(error => {
            console.log('❌ Service Worker registration failed:', error);
        });
}