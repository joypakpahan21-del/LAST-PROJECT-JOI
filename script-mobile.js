// =============================================
// 🚀 ENHANCED MOBILE GPS TRACKING SYSTEM
// 📍 REAL-TIME PLANTATION OPTIMIZED TRACKER - MULTI UNIT SUPPORT
// 🎯 Version: 9.0 - Multi Unit & Sequential Distance Calculation
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
// 🌱 PLANTATION SPECIFIC TRACKING SYSTEM - MULTI UNIT
// =============================================

class PlantationTrackingManager {
    constructor(unitId) {
        this.unitId = unitId; // ID unit untuk multi unit support
        this.state = 'STATIONARY'; // 'STATIONARY' | 'MOVING'
        this.stationaryPosition = null;
        this.consecutiveLowSpeedCount = 0;
        
        // Threshold khusus perkebunan
        this.movementThreshold = 15; // meter (lebih kecil untuk jalur kebun)
        this.minSpeedThreshold = 1.5; // km/h (kecepatan slow-moving equipment)
        this.gpsAccuracyThreshold = 25; // meter (GPS mungkin kurang akurat di kebun)
        
        // Filter settings
        this.positionHistory = [];
        this.maxHistorySize = 61200;
        this.totalDistanceMeters = 0;
        this.lastValidPosition = null;
        this.dataPointsCount = 0;
        
        // Sequential distance tracking
        this.sequentialDistances = []; // Menyimpan jarak antar titik
        this.lastCalculatedPoint = null;
        
        // Real-time statistics
        this.realTimeStats = {
            totalCalculations: 0,
            stationaryPoints: 0,
            movingPoints: 0,
            gpsDriftPoints: 0,
            totalTimeMs: 0,
            sequentialPoints: 0
        };
        
        console.log(`🌱 Plantation Tracking Manager initialized for Unit: ${unitId}`);
    }

    /**
     * Update position dengan state management dan sequential distance calculation
     */
    updatePosition(position, speed, accuracy, isBackground = false) {
        const timestamp = Date.now();
        this.realTimeStats.totalCalculations++;
        
        // Validasi posisi GPS
        if (!this.isValidPlantationPosition(position, accuracy)) {
            console.warn(`❌ [${this.unitId}] Posisi tidak valid, dilewati`);
            return { shouldRecord: false, distance: 0, state: this.state };
        }

        // Filter posisi untuk perkebunan
        const filteredPos = this.plantationFilter(position, speed, accuracy);
        
        let result;
        if (this.state === 'STATIONARY') {
            result = this.handleStationaryState(filteredPos, speed, accuracy);
        } else {
            result = this.handleMovingState(filteredPos, speed, accuracy);
        }

        // Hitung jarak sequential hanya jika diperlukan
        let sequentialDistance = 0;
        if (result.shouldRecord && this.lastValidPosition) {
            sequentialDistance = this.calculateSequentialDistance(
                this.lastValidPosition,
                filteredPos,
                result.state,
                speed
            );
            
            result.distance = sequentialDistance;
            this.totalDistanceMeters += sequentialDistance;
            
            // Simpan data sequential
            this.saveSequentialDistance(sequentialDistance, this.lastValidPosition, filteredPos);
            
            console.log(`🌱 [${this.unitId}] ${result.state} | Seq: ${sequentialDistance.toFixed(2)}m | Total: ${(this.totalDistanceMeters/1000).toFixed(3)}km | Points: ${this.dataPointsCount}`);
        }

        // Update last position untuk sequential calculation
        this.lastValidPosition = {
            ...filteredPos,
            timestamp: timestamp,
            dataPointId: this.dataPointsCount++,
            state: result.state,
            accuracy: accuracy,
            sequentialDistance: sequentialDistance
        };

        this.positionHistory.push(this.lastValidPosition);

        // Maintain history size
        if (this.positionHistory.length > this.maxHistorySize) {
            this.positionHistory.shift();
        }

        return {
            ...result,
            totalDistance: this.totalDistanceMeters,
            filteredPosition: filteredPos,
            sequentialDistance: sequentialDistance,
            dataPointId: this.lastValidPosition.dataPointId
        };
    }

    /**
     * Hitung jarak sequential antar titik
     */
    calculateSequentialDistance(prevPos, currentPos, currentState, speed) {
        // Untuk unit diam, selalu return 0
        if (currentState === 'STATIONARY') {
            return 0;
        }

        const rawDistance = this.calculateHaversineDistance(
            prevPos.lat, prevPos.lng,
            currentPos.lat, currentPos.lng
        );
        
        // Filter berdasarkan kecepatan dan state
        if (speed === 0 && rawDistance < 10) {
            // Abaikan perpindahan kecil saat speed 0 (GPS drift)
            console.log(`📏 [${this.unitId}] GPS drift filtered: ${rawDistance.toFixed(2)}m`);
            return 0;
        }
        
        // Validasi rasio jarak-kecepatan
        if (speed > 0) {
            const expectedDistance = (speed / 3.6) * 10; // 10 detik interval
            const distanceRatio = rawDistance / expectedDistance;
            
            // Jika jarak tidak wajar untuk kecepatan tertentu
            if (distanceRatio < 0.1 || distanceRatio > 3.0) {
                console.warn(`📏 [${this.unitId}] Jarak tidak wajar: ${rawDistance.toFixed(2)}m untuk speed ${speed}km/h, rasio: ${distanceRatio.toFixed(2)}`);
                return 0;
            }
        }

        // DEBUG: Log sequential calculation
        console.log(`📍 [${this.unitId}] Sequential Calc:`, {
            from: `Point ${prevPos.dataPointId} (${prevPos.lat.toFixed(6)}, ${prevPos.lng.toFixed(6)})`,
            to: `Point ${this.dataPointsCount} (${currentPos.lat.toFixed(6)}, ${currentPos.lng.toFixed(6)})`,
            distance: rawDistance.toFixed(2) + 'm',
            state: currentState
        });

        return rawDistance;
    }

    /**
     * Simpan data sequential distance
     */
    saveSequentialDistance(distance, fromPoint, toPoint) {
        if (distance > 0) {
            const sequentialData = {
                fromPointId: fromPoint.dataPointId,
                toPointId: this.dataPointsCount,
                fromLat: fromPoint.lat,
                fromLng: fromPoint.lng,
                toLat: toPoint.lat,
                toLng: toPoint.lng,
                distance: distance,
                timestamp: Date.now(),
                state: this.state,
                totalDistance: this.totalDistanceMeters
            };
            
            this.sequentialDistances.push(sequentialData);
            this.realTimeStats.sequentialPoints++;
            
            // Maintain sequential data size
            if (this.sequentialDistances.length > 1000) {
                this.sequentialDistances.shift();
            }
        }
    }

    /**
     * Handle state saat kendaraan diam
     */
    handleStationaryState(position, speed, accuracy) {
        // Jika kecepatan signifikan, switch ke moving state
        if (speed > this.minSpeedThreshold) {
            this.state = 'MOVING';
            this.stationaryPosition = null;
            this.consecutiveLowSpeedCount = 0;
            this.realTimeStats.movingPoints++;
            return { shouldRecord: true, distance: 0, state: 'MOVING' };
        }

        // Jika belum ada posisi diam, set posisi pertama
        if (!this.stationaryPosition) {
            this.stationaryPosition = position;
            this.realTimeStats.stationaryPoints++;
            return { shouldRecord: true, distance: 0, state: 'STATIONARY' };
        }

        // Cek apakah ada perpindahan signifikan dari posisi diam
        const distanceFromStationary = this.calculateHaversineDistance(
            this.stationaryPosition.lat, this.stationaryPosition.lng,
            position.lat, position.lng
        );

        // Jika perpindahan melebihi threshold, mulai bergerak
        if (distanceFromStationary > this.movementThreshold) {
            this.state = 'MOVING';
            this.stationaryPosition = null;
            this.consecutiveLowSpeedCount = 0;
            this.realTimeStats.movingPoints++;
            return { 
                shouldRecord: true, 
                distance: distanceFromStationary, 
                state: 'MOVING' 
            };
        }

        // Tetap diam, tidak rekam jarak (tapi rekam posisi untuk monitoring)
        this.realTimeStats.stationaryPoints++;
        this.realTimeStats.gpsDriftPoints++;
        return { 
            shouldRecord: false, 
            distance: 0, 
            state: 'STATIONARY' 
        };
    }

    /**
     * Handle state saat kendaraan bergerak
     */
    handleMovingState(position, speed, accuracy) {
        // Jika kecepatan sangat rendah, pertimbangkan untuk berhenti
        if (speed < 1.0) {
            this.consecutiveLowSpeedCount++;
            
            // Tunggu beberapa cycle sebelum switch ke stationary
            if (this.consecutiveLowSpeedCount > 3) {
                this.state = 'STATIONARY';
                this.stationaryPosition = position;
                this.realTimeStats.stationaryPoints++;
                return { 
                    shouldRecord: true, 
                    distance: 0, 
                    state: 'STATIONARY' 
                };
            }
        } else {
            this.consecutiveLowSpeedCount = 0;
        }

        this.realTimeStats.movingPoints++;
        return { shouldRecord: true, distance: 0, state: 'MOVING' };
    }

    /**
     * Filter khusus untuk kondisi perkebunan
     */
    plantationFilter(position, speed, accuracy) {
        if (!this.lastValidPosition) {
            return position;
        }
        
        // Tentukan strength filter berdasarkan state dan speed
        let filterStrength;
        if (this.state === 'STATIONARY' || speed < 2) {
            filterStrength = 0.8; // Strong filter saat diam/bergerak lambat
        } else {
            filterStrength = 0.3; // Light filter saat bergerak cepat
        }
        
        return {
            lat: this.lastValidPosition.lat * filterStrength + position.lat * (1 - filterStrength),
            lng: this.lastValidPosition.lng * filterStrength + position.lng * (1 - filterStrength),
            accuracy: accuracy
        };
    }

    /**
     * Validasi posisi untuk lingkungan perkebunan
     */
    isValidPlantationPosition(position, accuracy) {
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

        // Accuracy check untuk perkebunan (lebih longgar)
        if (accuracy > this.gpsAccuracyThreshold) {
            console.warn(`🎯 [${this.unitId}] Accuracy GPS buruk: ${accuracy}m`);
            return false;
        }

        return true;
    }

    /**
     * Haversine distance calculation
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
     * Dapatkan statistik tracking lengkap dengan sequential data
     */
    getTrackingStats() {
        return {
            ...this.realTimeStats,
            totalDistance: this.totalDistanceMeters,
            currentState: this.state,
            dataPoints: this.positionHistory.length,
            stationaryPosition: this.stationaryPosition,
            sequentialDistances: this.sequentialDistances.length,
            unitId: this.unitId,
            lastSequentialDistance: this.sequentialDistances.length > 0 ? 
                this.sequentialDistances[this.sequentialDistances.length - 1] : null
        };
    }

    /**
     * Dapatkan ringkasan sequential distances
     */
    getSequentialSummary() {
        const totalSequentialDistance = this.sequentialDistances.reduce((sum, seq) => sum + seq.distance, 0);
        
        return {
            totalPoints: this.dataPointsCount,
            sequentialSegments: this.sequentialDistances.length,
            totalSequentialDistance: totalSequentialDistance,
            averageSegmentDistance: this.sequentialDistances.length > 0 ? 
                totalSequentialDistance / this.sequentialDistances.length : 0,
            segments: this.sequentialDistances.slice(-10) // 10 segments terakhir
        };
    }

    /**
     * Reset tracker untuk unit baru
     */
    resetForNewUnit(newUnitId) {
        this.unitId = newUnitId;
        this.positionHistory = [];
        this.sequentialDistances = [];
        this.totalDistanceMeters = 0;
        this.dataPointsCount = 0;
        this.lastValidPosition = null;
        this.stationaryPosition = null;
        this.state = 'STATIONARY';
        
        console.log(`🔄 [${this.unitId}] Tracker reset for new unit`);
    }
}

// =============================================
// 🚀 MAIN TRACKING SYSTEM - MULTI UNIT MANAGER
// =============================================

class EnhancedHaversineCalculator {
    constructor() {
        this.unitId = null; // Current active unit
        this.plantationManager = null;
        this.speedHistory = [];
        this.offlineBuffer = [];
        this.maxOfflineBuffer = 10000;
        this.isOnline = navigator.onLine;
        
        // Multi-unit support
        this.unitSessions = new Map(); // Store sessions for multiple units
        this.currentSessionId = null;
        
        // Real-time statistics
        this.realTimeStats = {
            totalCalculations: 0,
            averageInterval: 0,
            maxSpeed: 0,
            minSpeed: Infinity,
            totalTimeMs: 0,
            offlinePoints: 0,
            backgroundPoints: 0,
            unitsTracked: 0
        };
        
        console.log('📍 Enhanced Plantation GPS Tracker - Multi Unit Initialized');
    }

    /**
     * Set active unit untuk tracking
     */
    setActiveUnit(unitId, driverName = 'Unknown') {
        this.unitId = unitId;
        
        // Cek apakah unit sudah ada sessionnya
        if (this.unitSessions.has(unitId)) {
            this.plantationManager = this.unitSessions.get(unitId);
            console.log(`🔄 [${unitId}] Resuming existing session`);
        } else {
            // Buat plantation manager baru untuk unit ini
            this.plantationManager = new PlantationTrackingManager(unitId);
            this.unitSessions.set(unitId, this.plantationManager);
            this.realTimeStats.unitsTracked++;
            console.log(`🚀 [${unitId}] New session created for driver: ${driverName}`);
        }
        
        this.currentSessionId = this.generateSessionId(unitId, driverName);
        
        // Load offline data untuk unit ini
        this.loadOfflineData();
        
        return this.plantationManager;
    }

    /**
     * Generate session ID unik untuk unit
     */
    generateSessionId(unitId, driverName) {
        return `SESS_${unitId}_${driverName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Menambahkan posisi baru dengan plantation optimization untuk unit aktif
     */
    addPosition(position, accuracy, isBackground = false, isOnline = true) {
        if (!this.plantationManager) {
            console.error('❌ No active unit set for tracking');
            return null;
        }

        const timestamp = Date.now();
        
        // Gunakan plantation manager untuk processing
        const speed = 0; // Akan dihitung berdasarkan movement
        const result = this.plantationManager.updatePosition(
            position, speed, accuracy, isBackground
        );

        if (!result.shouldRecord) {
            return null;
        }

        const positionData = {
            lat: parseFloat(position.lat),
            lng: parseFloat(position.lng),
            accuracy: parseFloat(accuracy),
            timestamp: timestamp,
            dataPointId: this.plantationManager.dataPointsCount,
            isOnline: isOnline,
            isBackground: isBackground,
            state: result.state,
            synced: false,
            unitId: this.unitId,
            sessionId: this.currentSessionId,
            sequentialDistance: result.sequentialDistance
        };

        // Update stats
        if (!isOnline) this.realTimeStats.offlinePoints++;
        if (isBackground) this.realTimeStats.backgroundPoints++;
        this.realTimeStats.totalCalculations++;

        // Simpan ke offline buffer jika offline
        if (!isOnline) {
            this.addToOfflineBuffer(positionData);
        }

        return {
            instantDistance: result.distance || 0,
            instantSpeed: this.calculateInstantSpeed(result),
            timeDiffSeconds: 0,
            totalDistance: this.plantationManager.totalDistanceMeters,
            dataPointId: positionData.dataPointId,
            isOnline: isOnline,
            isBackground: isBackground,
            state: result.state,
            unitId: this.unitId,
            sequentialDistance: result.sequentialDistance,
            sequentialSummary: this.plantationManager.getSequentialSummary()
        };
    }

    /**
     * Hitung kecepatan instan berdasarkan state dan movement
     */
    calculateInstantSpeed(result) {
        if (result.state === 'STATIONARY') {
            return 0;
        }
        
        // Untuk moving state, estimasi speed berdasarkan movement pattern
        return result.distance > 0 ? (result.distance / 10) * 3.6 : 0;
    }

    /**
     * Dapatkan statistik untuk unit aktif
     */
    getCurrentUnitStats() {
        if (!this.plantationManager) {
            return null;
        }
        
        const plantationStats = this.plantationManager.getTrackingStats();
        return {
            ...plantationStats,
            offlineBuffer: this.offlineBuffer.length,
            isOnline: this.isOnline,
            realTimeStats: this.realTimeStats,
            sessionId: this.currentSessionId
        };
    }

    /**
     * Dapatkan ringkasan semua unit
     */
    getAllUnitsSummary() {
        const summary = {
            totalUnits: this.unitSessions.size,
            activeUnit: this.unitId,
            units: []
        };
        
        for (const [unitId, manager] of this.unitSessions) {
            const stats = manager.getTrackingStats();
            summary.units.push({
                unitId: unitId,
                totalDistance: stats.totalDistance,
                dataPoints: stats.dataPoints,
                currentState: stats.currentState,
                sequentialSegments: stats.sequentialDistances
            });
        }
        
        return summary;
    }

    /**
     * Ganti unit aktif
     */
    switchActiveUnit(newUnitId, driverName = 'Unknown') {
        console.log(`🔄 Switching to unit: ${newUnitId}`);
        
        // Simpan data unit sebelumnya
        this.saveOfflineData();
        
        // Set unit baru sebagai aktif
        return this.setActiveUnit(newUnitId, driverName);
    }

    /**
     * =============================================
     * 🔄 OFFLINE & BACKGROUND SUPPORT - MULTI UNIT
     * =============================================
     */

    addToOfflineBuffer(positionData) {
        // Tambahkan unit info ke offline data
        const offlineData = {
            ...positionData,
            offlineTimestamp: Date.now(),
            deviceId: this.getDeviceId()
        };
        
        this.offlineBuffer.push(offlineData);
        
        if (this.offlineBuffer.length > this.maxOfflineBuffer) {
            this.offlineBuffer.shift();
        }
        
        this.saveOfflineData();
    }

    saveOfflineData() {
        try {
            const offlineData = {
                buffer: this.offlineBuffer,
                currentUnit: this.unitId,
                unitSessions: Array.from(this.unitSessions.entries()).map(([unitId, manager]) => ({
                    unitId: unitId,
                    totalDistance: manager.totalDistanceMeters,
                    dataPointsCount: manager.dataPointsCount,
                    lastPosition: manager.lastValidPosition
                })),
                timestamp: Date.now()
            };
            
            localStorage.setItem(`gps_offline_data_${this.getDeviceId()}`, JSON.stringify(offlineData));
            console.log(`💾 [${this.unitId}] Offline data saved`);
        } catch (error) {
            console.error('❌ Error saving offline data:', error);
        }
    }

    loadOfflineData() {
        try {
            const saved = localStorage.getItem(`gps_offline_data_${this.getDeviceId()}`);
            if (saved) {
                const offlineData = JSON.parse(saved);
                this.offlineBuffer = offlineData.buffer || [];
                
                // Restore unit sessions
                if (offlineData.unitSessions) {
                    offlineData.unitSessions.forEach(session => {
                        if (!this.unitSessions.has(session.unitId)) {
                            const manager = new PlantationTrackingManager(session.unitId);
                            manager.totalDistanceMeters = session.totalDistance || 0;
                            manager.dataPointsCount = session.dataPointsCount || 0;
                            manager.lastValidPosition = session.lastPosition || null;
                            this.unitSessions.set(session.unitId, manager);
                        }
                    });
                }
                
                console.log(`📂 [${this.unitId}] Offline data loaded: ${this.offlineBuffer.length} points, ${this.unitSessions.size} units`);
                return true;
            }
        } catch (error) {
            console.error('❌ Error loading offline data:', error);
        }
        return false;
    }

    async syncOfflineData() {
        if (this.offlineBuffer.length === 0) {
            console.log('✅ No offline data to sync');
            return;
        }

        console.log(`🔄 [${this.unitId}] Syncing ${this.offlineBuffer.length} offline points...`);
        
        try {
            for (const point of this.offlineBuffer) {
                point.synced = true;
                point.syncTime = Date.now();
                await this.saveToFirebase(point);
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            console.log(`✅ [${this.unitId}] Successfully synced ${this.offlineBuffer.length} offline points`);
            this.offlineBuffer = [];
            this.saveOfflineData();
            
        } catch (error) {
            console.error('❌ Error syncing offline data:', error);
        }
    }

    /**
     * Dapatkan statistik lengkap
     */
    getFullStats() {
        if (!this.plantationManager) {
            return {
                error: 'No active unit',
                multiUnitSummary: this.getAllUnitsSummary()
            };
        }

        const plantationStats = this.plantationManager.getTrackingStats();
        return {
            ...plantationStats,
            offlineBuffer: this.offlineBuffer.length,
            isOnline: this.isOnline,
            realTimeStats: this.realTimeStats,
            multiUnitSummary: this.getAllUnitsSummary(),
            sequentialSummary: this.plantationManager.getSequentialSummary()
        };
    }

    /**
     * Utility function untuk device ID
     */
    getDeviceId() {
        let deviceId = localStorage.getItem('deviceId');
        if (!deviceId) {
            deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', deviceId);
        }
        return deviceId;
    }

    /**
     * Save to Firebase dengan unit information
     */
    async saveToFirebase(trackingData, gpsData = null) {
        if (!this.isOnline) {
            return;
        }

        try {
            const tripData = {
                latitude: gpsData?.lat || trackingData.lat,
                longitude: gpsData?.lng || trackingData.lng,
                speed: trackingData.instantSpeed || 0,
                totalDistance: trackingData.totalDistance || 0,
                state: trackingData.state,
                accuracy: gpsData?.accuracy || trackingData.accuracy,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                deviceId: this.getDeviceId(),
                dataPointId: trackingData.dataPointId,
                unitId: trackingData.unitId || this.unitId,
                sessionId: trackingData.sessionId || this.currentSessionId,
                sequentialDistance: trackingData.sequentialDistance || 0
            };

            const newDataKey = database.ref().child('trips').push().key;
            const updates = {};
            updates['/trips/' + newDataKey] = tripData;
            
            await database.ref().update(updates);
            console.log(`✅ [${this.unitId}] Data saved to Firebase`);
            
        } catch (error) {
            console.error('❌ Firebase save error:', error);
            // Save to offline buffer jika gagal
            this.addToOfflineBuffer(trackingData);
        }
    }
}

// =============================================
// 📱 MAIN APPLICATION INITIALIZATION - MULTI UNIT
// =============================================

// Global instances
let plantationTracker;
let gpsWatchId = null;
let currentUnitInfo = null;

// Initialize the tracking system dengan unit
function initPlantationTracking(unitId = null, driverName = 'Unknown') {
    try {
        plantationTracker = new EnhancedHaversineCalculator();
        
        // Set unit aktif jika provided
        if (unitId) {
            plantationTracker.setActiveUnit(unitId, driverName);
            currentUnitInfo = { unitId, driverName };
        }
        
        console.log('🌱 Plantation GPS Tracking System Initialized - Multi Unit Ready');
        
        // Start GPS tracking jika unit sudah diset
        if (unitId) {
            startGPSTracking();
        }
        
        // Setup online/offline detection
        setupConnectivityMonitoring();
        
        return plantationTracker;
    } catch (error) {
        console.error('❌ Failed to initialize plantation tracking:', error);
        return null;
    }
}

// Start GPS tracking untuk unit aktif
function startGPSTracking() {
    if (!navigator.geolocation) {
        console.error('❌ Geolocation is not supported by this browser');
        return;
    }

    if (!plantationTracker || !plantationTracker.unitId) {
        console.error('❌ No active unit set for GPS tracking');
        return;
    }

    const options = {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000
    };

    gpsWatchId = navigator.geolocation.watchPosition(
        handleGPSSuccess,
        handleGPSError,
        options
    );

    console.log(`📍 GPS Tracking Started for Unit: ${plantationTracker.unitId}`);
}

// Handle successful GPS position
function handleGPSSuccess(position) {
    if (!plantationTracker || !plantationTracker.unitId) {
        console.error('❌ No active unit for GPS data');
        return;
    }

    const gpsData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || 0,
        heading: position.coords.heading,
        altitude: position.coords.altitude
    };

    const isOnline = navigator.onLine;
    const isBackground = document.hidden || document.visibilityState === 'hidden';

    // Process dengan plantation tracker
    const result = plantationTracker.addPosition(
        gpsData,
        gpsData.accuracy,
        isBackground,
        isOnline
    );

    if (result) {
        updateDisplay(result);
        plantationTracker.saveToFirebase(result, gpsData);
    }
}

// Handle GPS errors
function handleGPSError(error) {
    console.error('❌ GPS Error:', error);
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            console.error('User denied the request for Geolocation.');
            break;
        case error.POSITION_UNAVAILABLE:
            console.error('Location information is unavailable.');
            break;
        case error.TIMEOUT:
            console.error('The request to get user location timed out.');
            break;
        default:
            console.error('An unknown error occurred.');
            break;
    }
}

// Update display dengan data terbaru
function updateDisplay(trackingData) {
    try {
        // Update speed display
        const speedElement = document.querySelector('#kecepatan-saat-ini');
        if (speedElement) {
            speedElement.textContent = trackingData.instantSpeed.toFixed(1) + ' km/h';
        }

        // Update distance display
        const distanceElement = document.querySelector('#jarak-hari-ini');
        if (distanceElement) {
            const distanceKm = trackingData.totalDistance / 1000;
            distanceElement.textContent = distanceKm.toFixed(3);
        }

        // Update status based on state
        const statusElement = document.querySelector('#status-unit');
        if (statusElement) {
            const state = trackingData.state || 'UNKNOWN';
            statusElement.textContent = state === 'STATIONARY' ? 'DIAM' : 'BERGERAK';
            statusElement.className = state === 'STATIONARY' ? 'status-diam' : 'status-bergerak';
        }

        // Update waypoint counter
        const waypointElement = document.querySelector('#total-waypoint');
        if (waypointElement) {
            waypointElement.textContent = plantationTracker.plantationManager.dataPointsCount;
        }

        // Update unit info
        const unitElement = document.querySelector('#vehicleName');
        if (unitElement && currentUnitInfo) {
            unitElement.textContent = currentUnitInfo.unitId;
        }

        // Update sequential info jika ada
        if (trackingData.sequentialSummary) {
            console.log('📊 Sequential Summary:', trackingData.sequentialSummary);
        }

    } catch (error) {
        console.error('Error updating display:', error);
    }
}

// Setup connectivity monitoring
function setupConnectivityMonitoring() {
    window.addEventListener('online', () => {
        console.log('🌐 Device is online');
        if (plantationTracker) {
            plantationTracker.isOnline = true;
            plantationTracker.syncOfflineData();
        }
    });

    window.addEventListener('offline', () => {
        console.log('📴 Device is offline');
        if (plantationTracker) {
            plantationTracker.isOnline = false;
        }
    });
}

// Background sync service
function setupBackgroundSync() {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('gps-data-sync')
                .then(() => console.log('✅ Background sync registered'))
                .catch(err => console.error('❌ Background sync failed:', err));
        });
    }
}

// Switch active unit
function switchActiveUnit(newUnitId, driverName) {
    if (plantationTracker) {
        plantationTracker.switchActiveUnit(newUnitId, driverName);
        currentUnitInfo = { unitId: newUnitId, driverName };
        console.log(`🔄 Switched to unit: ${newUnitId}, Driver: ${driverName}`);
        
        // Restart GPS tracking untuk unit baru
        if (gpsWatchId) {
            navigator.geolocation.clearWatch(gpsWatchId);
        }
        startGPSTracking();
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing Plantation GPS Tracking System...');
    initPlantationTracking();
    
    // Setup background sync
    setupBackgroundSync();
    
    // Periodic stats logging
    setInterval(() => {
        if (plantationTracker) {
            const stats = plantationTracker.getFullStats();
            console.log('📊 Plantation Stats:', stats);
            
            // Log sequential info
            if (stats.sequentialSummary) {
                console.log('📍 Sequential Tracking:', stats.sequentialSummary);
            }
        }
    }, 60000);
});

// Export for global access
window.PlantationTracker = {
    instance: plantationTracker,
    init: initPlantationTracking,
    switchUnit: switchActiveUnit,
    getStats: () => plantationTracker ? plantationTracker.getFullStats() : null,
    getAllUnits: () => plantationTracker ? plantationTracker.getAllUnitsSummary() : null
};

console.log('🌱 Plantation Mobile GPS Tracker v9.0 - Multi Unit & Sequential Distance Loaded');
