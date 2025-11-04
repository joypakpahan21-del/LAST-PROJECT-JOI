// =============================================
// 🚀 ENHANCED MOBILE GPS TRACKING SYSTEM
// 📍 Script: script-mobile-complete.js
// 🎯 Version: 4.0 - Complete Integrated System
// 🌱 Optimized for Plantation Environment
// =============================================

// ✅ FIREBASE CONFIGURATION - IMPROVED
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBMiER_5b51IEEoxivkCliRC0WID1f-yzk",
    authDomain: "joi-gps-tracker.firebaseapp.com",
    databaseURL: "https://joi-gps-tracker-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "joi-gps-tracker",
    storageBucket: "joi-gps-tracker.firebasestorage.app",
    messagingSenderId: "216572191895",
    appId: "1:216572191895:web:a4fef1794daf200a2775d2"
};

// Initialize Firebase - IMPROVED
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
        console.log('✅ Firebase initialized successfully');
    } else {
        firebase.app(); // jika sudah ada, gunakan yang sudah ada
    }
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
}

const database = firebase.database();

// =============================================
// 🎯 ADVANCED KALMAN FILTER WITH MACHINE LEARNING
// =============================================

class AdvancedKalmanFilter {
    constructor() {
        this.state = {
            lat: 0, lng: 0,
            velocity_lat: 0, velocity_lng: 0,
            acceleration_lat: 0, acceleration_lng: 0
        };
        
        this.P = this.createIdentityMatrix(6);
        this.Q = this.createProcessNoiseMatrix();
        this.R = this.createMeasurementNoiseMatrix();
        
        this.constraints = {
            maxSpeed: 16.67,
            maxAcceleration: 3.0,
            maxDeceleration: -4.0,
            plantationBounds: {
                minLat: -6.5, maxLat: -5.8,
                minLng: 106.5, maxLng: 107.2
            }
        };
        
        this.mlModel = {
            errorPatterns: [],
            accuracyHistory: [],
            adaptiveWeights: { gps: 1.0, imu: 0.0, network: 0.0 },
            learningRate: 0.01
        };
        
        this.lastUpdateTime = Date.now();
        this.positionHistory = [];
        this.maxHistorySize = 61200;
        
        console.log('🎯 Advanced Kalman Filter initialized');
    }

    createIdentityMatrix(size) {
        const matrix = [];
        for (let i = 0; i < size; i++) {
            matrix[i] = [];
            for (let j = 0; j < size; j++) {
                matrix[i][j] = i === j ? 1 : 0;
            }
        }
        return matrix;
    }

    createProcessNoiseMatrix() {
        return [
            [0.1, 0, 0, 0, 0, 0],
            [0, 0.1, 0, 0, 0, 0],
            [0, 0, 0.01, 0, 0, 0],
            [0, 0, 0, 0.01, 0, 0],
            [0, 0, 0, 0, 0.001, 0],
            [0, 0, 0, 0, 0, 0.001]
        ];
    }

    createMeasurementNoiseMatrix() {
        return [
            [1, 0],
            [0, 1]
        ];
    }

    matrixMultiply(A, B) {
        const result = [];
        for (let i = 0; i < A.length; i++) {
            result[i] = [];
            for (let j = 0; j < B[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < A[0].length; k++) {
                    sum += A[i][k] * B[k][j];
                }
                result[i][j] = sum;
            }
        }
        return result;
    }

    matrixVectorMultiply(matrix, vector) {
        const result = [];
        for (let i = 0; i < matrix.length; i++) {
            let sum = 0;
            for (let j = 0; j < vector.length; j++) {
                sum += matrix[i][j] * vector[j];
            }
            result[i] = sum;
        }
        return result;
    }

    matrixTranspose(matrix) {
        return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
    }

    matrixAdd(A, B) {
        return A.map((row, i) => row.map((val, j) => val + B[i][j]));
    }

    matrixSubtract(A, B) {
        return A.map((row, i) => row.map((val, j) => val - B[i][j]));
    }

    vectorAdd(v1, v2) {
        return v1.map((val, i) => val + v2[i]);
    }

    vectorSubtract(v1, v2) {
        return v1.map((val, i) => val - v2[i]);
    }

    matrixInverse2x2(matrix) {
        const [[a, b], [c, d]] = matrix;
        const determinant = a * d - b * c;
        if (determinant === 0) return [[1, 0], [0, 1]];
        return [
            [d/determinant, -b/determinant],
            [-c/determinant, a/determinant]
        ];
    }

    calculateStateTransitionMatrix(dt) {
        return [
            [1, 0, dt, 0, 0.5*dt*dt, 0],
            [0, 1, 0, dt, 0, 0.5*dt*dt],
            [0, 0, 1, 0, dt, 0],
            [0, 0, 0, 1, 0, dt],
            [0, 0, 0, 0, 1, 0],
            [0, 0, 0, 0, 0, 1]
        ];
    }

    predict(dt) {
        if (dt <= 0) return;

        const F = this.calculateStateTransitionMatrix(dt);
        this.state = this.matrixVectorMultiply(F, Object.values(this.state));
        
        this.state = {
            lat: this.state[0], lng: this.state[1],
            velocity_lat: this.state[2], velocity_lng: this.state[3],
            acceleration_lat: this.state[4], acceleration_lng: this.state[5]
        };
        
        const F_T = this.matrixTranspose(F);
        const F_P = this.matrixMultiply(F, this.P);
        const F_P_FT = this.matrixMultiply(F_P, F_T);
        this.P = this.matrixAdd(F_P_FT, this.Q);
        
        this.applyPhysicalConstraints();
        this.lastUpdateTime = Date.now();
    }

    update(measurement, accuracy) {
        const H = [
            [1, 0, 0, 0, 0, 0],
            [0, 1, 0, 0, 0, 0]
        ];
        
        const z = [measurement.lat, measurement.lng];
        const H_x = this.matrixVectorMultiply(H, Object.values(this.state));
        const y = this.vectorSubtract(z, H_x);
        
        const H_T = this.matrixTranspose(H);
        const H_P = this.matrixMultiply(H, this.P);
        const H_P_HT = this.matrixMultiply(H_P, H_T);
        const S = this.matrixAdd(H_P_HT, this.R);
        
        const S_inv = this.matrixInverse2x2(S);
        const P_HT = this.matrixMultiply(this.P, H_T);
        const K = this.matrixMultiply(P_HT, S_inv);
        
        const K_y = this.matrixVectorMultiply(K, y);
        const stateArray = this.vectorAdd(Object.values(this.state), K_y);
        
        this.state = {
            lat: stateArray[0], lng: stateArray[1],
            velocity_lat: stateArray[2], velocity_lng: stateArray[3],
            acceleration_lat: stateArray[4], acceleration_lng: stateArray[5]
        };
        
        const I = this.createIdentityMatrix(6);
        const K_H = this.matrixMultiply(K, H);
        const I_KH = this.matrixSubtract(I, K_H);
        this.P = this.matrixMultiply(I_KH, this.P);
        
        this.applyPhysicalConstraints();
        this.adaptNoiseParameters(measurement, this.getPosition(), accuracy);
        this.addToPositionHistory(this.getPosition());
    }

    applyPhysicalConstraints() {
        const speed = this.getCurrentSpeed();
        const acceleration = this.getCurrentAcceleration();
        
        if (speed > this.constraints.maxSpeed) {
            const scale = this.constraints.maxSpeed / speed;
            this.state.velocity_lat *= scale;
            this.state.velocity_lng *= scale;
        }
        
        if (acceleration > this.constraints.maxAcceleration) {
            const scale = this.constraints.maxAcceleration / acceleration;
            this.state.acceleration_lat *= scale;
            this.state.acceleration_lng *= scale;
        }
        
        this.applyGeographicConstraints();
    }

    applyGeographicConstraints() {
        const { minLat, maxLat, minLng, maxLng } = this.constraints.plantationBounds;
        
        this.state.lat = Math.max(minLat, Math.min(maxLat, this.state.lat));
        this.state.lng = Math.max(minLng, Math.min(maxLng, this.state.lng));
    }

    adaptNoiseParameters(rawPosition, filteredPosition, accuracy) {
        this.mlModel.accuracyHistory.push({
            accuracy: accuracy,
            timestamp: Date.now(),
            signalStrength: this.getGPSSignalStrength(accuracy)
        });
        
        if (this.mlModel.accuracyHistory.length > 50) {
            this.mlModel.accuracyHistory.shift();
        }
        
        const accuracyFactor = Math.max(0.1, Math.min(1.0, accuracy / 50));
        this.R[0][0] = accuracyFactor * 2;
        this.R[1][1] = accuracyFactor * 2;
        
        const errorLat = Math.abs(rawPosition.lat - filteredPosition.lat);
        const errorLng = Math.abs(rawPosition.lng - filteredPosition.lng);
        
        if (errorLat > 0.0001 || errorLng > 0.0001) {
            this.mlModel.errorPatterns.push({
                error: { lat: errorLat, lng: errorLng },
                conditions: {
                    accuracy: accuracy,
                    time: Date.now(),
                    velocity: this.getCurrentSpeed()
                }
            });
            
            if (this.mlModel.errorPatterns.length > 100) {
                this.mlModel.errorPatterns.shift();
            }
        }
        
        this.updateAdaptiveWeights(accuracy);
    }

    updateAdaptiveWeights(currentAccuracy) {
        if (currentAccuracy < 10) {
            this.mlModel.adaptiveWeights.gps = 0.8;
        } else if (currentAccuracy < 25) {
            this.mlModel.adaptiveWeights.gps = 0.6;
        } else {
            this.mlModel.adaptiveWeights.gps = 0.4;
        }
        
        this.mlModel.adaptiveWeights.gps += this.mlModel.learningRate * (0.7 - this.mlModel.adaptiveWeights.gps);
        this.mlModel.adaptiveWeights.network = 1.0 - this.mlModel.adaptiveWeights.gps;
    }

    getGPSSignalStrength(accuracy) {
        if (accuracy < 5) return 'excellent';
        if (accuracy < 15) return 'good';
        if (accuracy < 30) return 'fair';
        return 'poor';
    }

    async filterPosition(rawPosition, accuracy) {
        const currentTime = Date.now();
        const dt = (currentTime - this.lastUpdateTime) / 1000;
        
        if (dt > 0) {
            this.predict(dt);
        }
        
        this.update(rawPosition, accuracy);
        
        const filteredPosition = this.getPosition();
        
        return {
            position: filteredPosition,
            velocity: this.getVelocity(),
            accuracy: this.calculateFilteredAccuracy(),
            confidence: this.calculateConfidence(),
            correctionsApplied: false,
            mlWeights: this.mlModel.adaptiveWeights
        };
    }

    getPosition() {
        return {
            lat: this.state.lat,
            lng: this.state.lng
        };
    }

    getVelocity() {
        return this.getCurrentSpeed() * 3.6;
    }

    getCurrentSpeed() {
        return Math.sqrt(this.state.velocity_lat ** 2 + this.state.velocity_lng ** 2);
    }

    getCurrentAcceleration() {
        return Math.sqrt(this.state.acceleration_lat ** 2 + this.state.acceleration_lng ** 2);
    }

    calculateFilteredAccuracy() {
        return Math.sqrt(this.P[0][0] ** 2 + this.P[1][1] ** 2);
    }

    calculateConfidence() {
        const accuracy = this.calculateFilteredAccuracy();
        return Math.max(0, 1 - accuracy / 100);
    }

    addToPositionHistory(position) {
        this.positionHistory.push({
            ...position,
            timestamp: Date.now(),
            velocity: this.getVelocity()
        });
        
        if (this.positionHistory.length > this.maxHistorySize) {
            this.positionHistory.shift();
        }
    }

    calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                 Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    reset() {
        this.state = {
            lat: 0, lng: 0,
            velocity_lat: 0, velocity_lng: 0,
            acceleration_lat: 0, acceleration_lng: 0
        };
        
        this.P = this.createIdentityMatrix(6);
        this.positionHistory = [];
        this.mlModel.errorPatterns = [];
        this.mlModel.accuracyHistory = [];
    }
}

// =============================================
// 🗺️ GOOGLE MAPS POLYLINE MANAGER
// =============================================

class GoogleMapsPolylineManager {
    constructor() {
        this.map = null;
        this.polyline = null;
        this.markers = [];
        this.pathCoordinates = [];
        this.maxPoints = 61200;
        this.isInitialized = false;
    }

    async initializeMap(containerId, initialPosition = { lat: -6.2088, lng: 106.8456 }) {
        try {
            await this.loadGoogleMapsAPI();
            
            this.map = new google.maps.Map(document.getElementById(containerId), {
                zoom: 15,
                center: initialPosition,
                mapTypeId: 'hybrid',
                styles: this.getMapStyles(),
                fullscreenControl: true,
                mapTypeControl: true
            });

            this.initializePolyline();
            this.isInitialized = true;
            
            console.log('✅ Google Maps initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Google Maps:', error);
            return false;
        }
    }

    loadGoogleMapsAPI() {
        return new Promise((resolve, reject) => {
            if (window.google && window.google.maps) {
                resolve();
                return;
            }

            const callbackName = 'googleMapsLoaded';
            window[callbackName] = () => {
                resolve();
                delete window[callbackName];
            };

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=${callbackName}&libraries=geometry`;
            script.async = true;
            script.defer = true;
            script.onerror = () => reject(new Error('Failed to load Google Maps API'));
            
            document.head.appendChild(script);
        });
    }

    getMapStyles() {
        return [
            {
                featureType: "all",
                elementType: "geometry",
                stylers: [{ color: "#242f3e" }]
            },
            {
                featureType: "landscape.man_made",
                elementType: "geometry",
                stylers: [{ color: "#2c3e50" }]
            }
        ];
    }

    initializePolyline() {
        this.polyline = new google.maps.Polyline({
            path: this.pathCoordinates,
            geodesic: true,
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 4
        });
        this.polyline.setMap(this.map);
    }

    addPoint(position, metadata = {}) {
        if (!this.isInitialized) return;

        const latLng = new google.maps.LatLng(position.lat, position.lng);
        this.pathCoordinates.push(latLng);

        if (this.pathCoordinates.length > this.maxPoints) {
            this.pathCoordinates.shift();
        }

        this.updatePolyline();

        if (this.pathCoordinates.length % 10 === 0) {
            this.map.panTo(latLng);
        }

        if (metadata.isSignificant) {
            this.addMarker(position, metadata);
        }

        this.updateStatisticsDisplay();
    }

    updatePolyline() {
        if (this.polyline) {
            this.polyline.setPath(this.pathCoordinates);
        }
    }

    addMarker(position, metadata = {}) {
        const marker = new google.maps.Marker({
            position: position,
            map: this.map,
            title: metadata.title || `Point ${this.markers.length + 1}`,
            label: metadata.label || '',
            animation: google.maps.Animation.DROP
        });

        if (metadata.description) {
            this.addInfoWindow(marker, metadata);
        }

        this.markers.push(marker);
    }

    addInfoWindow(marker, metadata) {
        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div class="map-info-window">
                    <h6>${metadata.title || 'Location Point'}</h6>
                    <p>${metadata.description}</p>
                    <small>${new Date().toLocaleString('id-ID')}</small>
                </div>
            `
        });

        marker.addListener('click', () => {
            infoWindow.open(this.map, marker);
        });
    }

    updateStatisticsDisplay() {
        const stats = this.calculateRouteStatistics();
        const statsElement = document.getElementById('mapStatistics');
        
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="row text-center">
                    <div class="col-4">
                        <small class="text-muted">Total Points</small>
                        <div class="fw-bold text-primary">${stats.pointsCount}</div>
                    </div>
                    <div class="col-4">
                        <small class="text-muted">Distance</small>
                        <div class="fw-bold text-success">${stats.totalDistance} km</div>
                    </div>
                    <div class="col-4">
                        <small class="text-muted">Points</small>
                        <div class="fw-bold text-warning">${stats.pointsCount}</div>
                    </div>
                </div>
            `;
        }
    }

    calculateRouteStatistics() {
        if (this.pathCoordinates.length < 2) {
            return { totalDistance: 0, averageSpeed: 0, pointsCount: 0 };
        }

        let totalDistance = 0;
        for (let i = 1; i < this.pathCoordinates.length; i++) {
            const prev = this.pathCoordinates[i-1];
            const curr = this.pathCoordinates[i];
            totalDistance += google.maps.geometry.spherical.computeDistanceBetween(prev, curr);
        }

        return {
            totalDistance: (totalDistance / 1000).toFixed(3),
            pointsCount: this.pathCoordinates.length,
            averageSpeed: 0
        };
    }

    clearMap() {
        this.pathCoordinates = [];
        if (this.polyline) {
            this.polyline.setPath([]);
        }
        this.markers.forEach(marker => marker.setMap(null));
        this.markers = [];
    }

    exportRouteData() {
        return {
            coordinates: this.pathCoordinates.map(coord => ({
                lat: coord.lat(),
                lng: coord.lng()
            })),
            statistics: this.calculateRouteStatistics(),
            exportTime: new Date().toISOString()
        };
    }
}

// =============================================
// 📊 MASSIVE DATA COLLECTOR
// =============================================

class MassiveDataCollector {
    constructor() {
        this.dataPoints = [];
        this.maxDataPoints = 61200;
        this.collectionStartTime = null;
        this.samplingRate = 1000;
        this.dataStats = {
            totalCollected: 0,
            accuracyImprovement: 0,
            distanceCovered: 0,
            averageSpeed: 0
        };
    }

    startCollection() {
        this.collectionStartTime = Date.now();
        this.dataPoints = [];
        console.log(`🎯 Starting massive data collection: ${this.maxDataPoints} points target`);
    }

    addDataPoint(position, accuracy, metadata = {}) {
        const dataPoint = {
            timestamp: Date.now(),
            position: position,
            accuracy: accuracy,
            metadata: {
                ...metadata,
                pointNumber: this.dataPoints.length + 1,
                collectionTime: (Date.now() - this.collectionStartTime) / 1000
            }
        };

        this.dataPoints.push(dataPoint);

        if (this.dataPoints.length > this.maxDataPoints) {
            this.dataPoints.shift();
        }

        this.updateStatistics();

        if (this.dataPoints.length % 1000 === 0) {
            this.autoSave();
        }

        return this.dataPoints.length;
    }

    updateStatistics() {
        if (this.dataPoints.length < 2) return;

        this.dataStats.totalCollected = this.dataPoints.length;
        
        if (this.dataPoints.length > 10) {
            const earlyAccuracy = this.dataPoints.slice(0, 10).reduce((sum, point) => sum + point.accuracy, 0) / 10;
            const recentAccuracy = this.dataPoints.slice(-10).reduce((sum, point) => sum + point.accuracy, 0) / 10;
            this.dataStats.accuracyImprovement = ((earlyAccuracy - recentAccuracy) / earlyAccuracy * 100).toFixed(1);
        }

        let totalDistance = 0;
        for (let i = 1; i < this.dataPoints.length; i++) {
            const prev = this.dataPoints[i-1].position;
            const curr = this.dataPoints[i].position;
            totalDistance += this.calculateHaversineDistance(prev.lat, prev.lng, curr.lat, curr.lng);
        }
        this.dataStats.distanceCovered = totalDistance;

        console.log(`📊 Data Collection: ${this.dataPoints.length}/${this.maxDataPoints} points`);
    }

    calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                 Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    autoSave() {
        try {
            const backup = {
                dataPoints: this.dataPoints,
                statistics: this.dataStats,
                backupTime: new Date().toISOString(),
                totalPoints: this.dataPoints.length
            };
            
            localStorage.setItem('massive_data_backup', JSON.stringify(backup));
            console.log(`💾 Auto-saved ${this.dataPoints.length} data points`);
        } catch (error) {
            console.warn('Failed to auto-save data:', error);
        }
    }

    getCollectionProgress() {
        return {
            current: this.dataPoints.length,
            target: this.maxDataPoints,
            percentage: ((this.dataPoints.length / this.maxDataPoints) * 100).toFixed(1),
            remaining: this.maxDataPoints - this.dataPoints.length
        };
    }

    exportData() {
        return {
            metadata: {
                totalPoints: this.dataPoints.length,
                collectionDuration: this.collectionStartTime ? 
                    (Date.now() - this.collectionStartTime) / 1000 : 0,
                samplingRate: this.samplingRate,
                exportTime: new Date().toISOString()
            },
            statistics: this.dataStats,
            dataPoints: this.dataPoints
        };
    }

    clearData() {
        this.dataPoints = [];
        this.collectionStartTime = null;
        this.dataStats = {
            totalCollected: 0,
            accuracyImprovement: 0,
            distanceCovered: 0,
            averageSpeed: 0
        };
    }
}

// =============================================
// ⚡ REAL-TIME SPEED CALCULATOR - NO THRESHOLDS
// =============================================

class RealTimeSpeedCalculator {
    constructor() {
        this.positionHistory = [];
        this.maxHistorySize = 8;
        this.lastValidSpeed = 0;
        this.speedSmoothingFactor = 0.7;
    }

    calculateRealTimeSpeed(newPosition, previousPosition) {
        if (!previousPosition || !newPosition) return this.lastValidSpeed;

        const timeDiff = (newPosition.timestamp - previousPosition.timestamp);
        
        if (timeDiff <= 0) return this.lastValidSpeed;

        const distance = this.calculateHaversineDistance(
            previousPosition.lat, previousPosition.lng,
            newPosition.lat, newPosition.lng
        );

        const speedKmh = (distance / (timeDiff / 3600000));
        
        const MAX_PLANTATION_SPEED = 60;
        
        if (speedKmh > MAX_PLANTATION_SPEED) {
            console.warn(`🚫 Kecepatan ${speedKmh.toFixed(1)} km/h tidak realistis`);
            return this.lastValidSpeed;
        }

        const smoothedSpeed = this.smoothSpeed(speedKmh);
        this.lastValidSpeed = smoothedSpeed;
        
        return smoothedSpeed;
    }

    calculateHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                 Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
                 Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return distance;
    }

    toRad(degrees) {
        return degrees * (Math.PI/180);
    }

    smoothSpeed(newSpeed) {
        if (this.lastValidSpeed === 0) return newSpeed;
        return (this.speedSmoothingFactor * this.lastValidSpeed) + 
               ((1 - this.speedSmoothingFactor) * newSpeed);
    }
}

// =============================================
// 🔄 ENHANCED BACKGROUND SERVICE MANAGER - IMPROVED
// =============================================

class EnhancedBackgroundService {
    constructor(logger) {
        this.logger = logger;
        this.serviceWorker = null;
        this.backgroundSyncSupported = 'sync' in ServiceWorkerRegistration.prototype;
        this.periodicSyncSupported = 'periodicSync' in ServiceWorkerRegistration.prototype;
        this.isServiceWorkerActive = false;
        
        this.init();
    }

    async init() {
        await this.registerServiceWorker();
        await this.setupBackgroundSync();
        this.setupMessageHandling();
        this.updateSWStatus('connecting');
    }

    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('❌ Service Worker not supported');
            this.updateSWStatus('unsupported');
            return;
        }

        try {
            console.log('🔄 Attempting Enhanced Service Worker registration...');
            
            // Gunakan path yang konsisten
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/',
                updateViaCache: 'none'
            });

            this.serviceWorker = registration;
            this.isServiceWorkerActive = true;
            
            console.log('🚀 Enhanced Service Worker registered:', registration);
            
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('🔄 New Service Worker installing...');
                
                newWorker.addEventListener('statechange', () => {
                    console.log('🎯 Service Worker state:', newWorker.state);
                    if (newWorker.state === 'activated') {
                        this.updateSWStatus('connected');
                        setTimeout(() => this.triggerBackgroundSync(), 2000);
                        
                        // Notify new SW about current state
                        this.notifyServiceWorkerAboutState();
                    }
                });
            });

            if (registration.active) {
                this.updateSWStatus('connected');
                console.log('✅ Service Worker active and ready');
                this.notifyServiceWorkerAboutState();
            }

            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('🔄 Service Worker controller changed');
                this.updateSWStatus('connected');
                this.notifyServiceWorkerAboutState();
            });

            // Setup message listener untuk komunikasi dengan SW
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event);
            });

            setInterval(() => {
                try {
                    registration.update();
                    console.log('🔍 Checking for Service Worker updates...');
                } catch (updateError) {
                    console.warn('Service Worker update check failed:', updateError);
                }
            }, 60 * 60 * 1000);

        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
            this.updateSWStatus('error');
        }
    }

    // Tambahkan method baru untuk komunikasi dengan Service Worker
    notifyServiceWorkerAboutState() {
        if (!this.serviceWorker?.active) return;
        
        this.serviceWorker.active.postMessage({
            type: 'APP_STATE_UPDATE',
            data: {
                isTracking: this.logger.isTracking,
                driverData: this.logger.driverData,
                isOnline: this.logger.isOnline,
                lastPosition: this.logger.lastPosition
            }
        });
    }

    handleServiceWorkerMessage(event) {
        const { type, data } = event.data;
        
        switch (type) {
            case 'SYNC_STATUS':
                this.updateSyncStatus(data.status);
                break;
            case 'STORAGE_INFO_RESPONSE':
                this.handleStorageInfo(data);
                break;
            case 'HEALTH_CHECK':
                this.handleHealthCheckData(data);
                break;
            case 'SYNC_COMPLETED':
                this.handleSyncCompleted(data);
                break;
            case 'SYNC_FAILED':
                this.handleSyncFailed(data);
                break;
        }
    }

    handleStorageInfo(storageInfo) {
        console.log('💾 Storage Info:', storageInfo);
        
        if (storageInfo.storage?.status === 'warning') {
            this.logger.addLog('⚠️ Storage hampir penuh - melakukan cleanup', 'warning');
        }
    }

    handleHealthCheckData(healthData) {
        console.log('🔍 Health Check Data:', healthData);
        
        // Update UI dengan health data jika diperlukan
        if (healthData.syncQueueSize > 50) {
            this.logger.addLog(`📊 Sync queue: ${healthData.syncQueueSize} items`, 'info');
        }
    }

    async setupBackgroundSync() {
        if (!this.serviceWorker || !this.backgroundSyncSupported) {
            console.log('ℹ️ Background Sync not available');
            return;
        }

        try {
            await this.serviceWorker.sync.register('background-gps-sync');
            console.log('✅ Background Sync registered');

            if (this.periodicSyncSupported) {
                try {
                    await this.serviceWorker.periodicSync.register('periodic-gps-health-check', {
                        minInterval: 60 * 60 * 1000
                    });
                    console.log('✅ Periodic Sync registered');
                } catch (periodicError) {
                    console.log('ℹ️ Periodic Sync not supported');
                }
            }

        } catch (error) {
            console.warn('⚠️ Background Sync not available:', error);
        }
    }

    setupMessageHandling() {
        if (!navigator.serviceWorker) return;

        navigator.serviceWorker.addEventListener('message', (event) => {
            const { type, data } = event.data;
            
            switch (type) {
                case 'GPS_DATA_REQUEST':
                    this.handleGPSDataRequest();
                    break;
                case 'HEALTH_CHECK':
                    this.handleHealthCheck(event.ports[0]);
                    break;
                case 'STOP_TRACKING':
                    this.logger.stopTracking();
                    break;
            }
        });
    }

    async cacheGPSData(gpsData) {
        if (!this.serviceWorker || !this.serviceWorker.active) return;

        try {
            this.serviceWorker.active.postMessage({
                type: 'CACHE_GPS_DATA',
                data: gpsData
            });
        } catch (error) {
            console.error('Failed to cache GPS data:', error);
        }
    }

    async triggerBackgroundSync() {
        if (!this.serviceWorker || !this.backgroundSyncSupported) return;

        try {
            await this.serviceWorker.sync.register('background-gps-sync');
            console.log('🔄 Background sync triggered');
            this.updateSyncStatus('syncing');
        } catch (error) {
            console.error('Failed to trigger background sync:', error);
            this.updateSyncStatus('error');
        }
    }

    handleGPSDataRequest() {
        if (!this.logger.lastPosition) return;

        const gpsData = {
            lat: this.logger.lastPosition.lat,
            lng: this.logger.lastPosition.lng,
            speed: this.logger.currentSpeed,
            accuracy: this.logger.lastPosition.accuracy,
            timestamp: new Date().toISOString(),
            sessionId: this.logger.driverData?.sessionId
        };

        this.cacheGPSData(gpsData);
    }

    handleHealthCheck(port) {
        port.postMessage({ 
            status: 'healthy',
            tracking: this.logger.isTracking,
            lastUpdate: this.logger.lastPosition?.timestamp,
            backgroundActive: this.logger.backgroundManager?.isActive
        });
    }

    handleSyncCompleted(data) {
        console.log('✅ Background sync completed:', data);
        this.logger.addLog(`📡 Sync berhasil: ${data.successCount} data terkirim`, 'success');
        this.updateSyncStatus('completed');
    }

    handleSyncFailed(data) {
        console.error('❌ Background sync failed:', data);
        this.logger.addLog('❌ Sync gagal, data tetap disimpan offline', 'warning');
        this.updateSyncStatus('error');
    }

    updateSWStatus(status) {
        const swElement = document.getElementById('swStatus');
        const swBadge = document.getElementById('swStatusBadge');
        
        if (swElement) {
            swElement.className = `sw-status ${status}`;
            
            switch (status) {
                case 'connected':
                    swElement.textContent = '✅ SW Connected';
                    if (swBadge) swBadge.className = 'badge bg-success';
                    break;
                case 'connecting':
                    swElement.textContent = '🔄 SW Connecting';
                    if (swBadge) swBadge.className = 'badge bg-warning';
                    break;
                case 'error':
                    swElement.textContent = '❌ SW Error';
                    if (swBadge) swBadge.className = 'badge bg-danger';
                    break;
                case 'unsupported':
                    swElement.textContent = 'ℹ️ SW Unsupported';
                    if (swBadge) swBadge.className = 'badge bg-secondary';
                    break;
            }
        }
    }

    updateSyncStatus(status) {
        const syncElement = document.getElementById('syncStatus');
        const quickSyncElement = document.getElementById('quickSyncStatus');
        
        if (syncElement) {
            switch (status) {
                case 'syncing':
                    syncElement.innerHTML = `
                        <span class="processing-indicator">
                            <span class="processing-dots">
                                <span class="processing-dot"></span>
                                <span class="processing-dot"></span>
                                <span class="processing-dot"></span>
                            </span>
                            Syncing...
                        </span>
                    `;
                    break;
                case 'completed':
                    syncElement.innerHTML = '✅ Synced';
                    setTimeout(() => {
                        syncElement.innerHTML = '';
                    }, 3000);
                    break;
                case 'error':
                    syncElement.innerHTML = '❌ Sync Failed';
                    setTimeout(() => {
                        syncElement.innerHTML = '';
                    }, 3000);
                    break;
            }
        }
        
        if (quickSyncElement) {
            quickSyncElement.textContent = status === 'syncing' ? '🔄' : '';
        }
    }

    async requestPersistentStorage() {
        if (navigator.storage && navigator.storage.persist) {
            const isPersisted = await navigator.storage.persist();
            console.log('💾 Storage persisted:', isPersisted);
            return isPersisted;
        }
        return false;
    }

    async checkStorageQuota() {
        if (navigator.storage && navigator.storage.estimate) {
            const estimate = await navigator.storage.estimate();
            const percentage = (estimate.usage / estimate.quota) * 100;
            console.log(`💾 Storage: ${percentage.toFixed(1)}% used`);
            return percentage;
        }
        return 0;
    }
}

// =============================================
// 🔋 BATTERY MANAGER
// =============================================

class BatteryManager {
    constructor(logger) {
        this.logger = logger;
        this.level = 100;
        this.isCharging = false;
        this.isLowBattery = false;
        this.lowBatteryThreshold = 20;
        this.batteryUpdateCallbacks = [];
    }

    async init() {
        if (navigator.getBattery) {
            try {
                const battery = await navigator.getBattery();
                this.updateBatteryStatus(battery);
                
                battery.addEventListener('levelchange', () => {
                    this.updateBatteryStatus(battery);
                });
                
                battery.addEventListener('chargingchange', () => {
                    this.updateBatteryStatus(battery);
                });
                
                console.log('🔋 Battery API initialized');
            } catch (error) {
                console.log('🔋 Battery API not fully supported');
                this.simulateBattery();
            }
        } else {
            console.log('🔋 Battery API not supported');
            this.simulateBattery();
        }
    }

    updateBatteryStatus(battery) {
        this.level = Math.round(battery.level * 100);
        this.isCharging = battery.charging;
        this.isLowBattery = this.level <= this.lowBatteryThreshold;
        
        console.log(`🔋 Battery: ${this.level}%${this.isCharging ? ' (charging)' : ''}`);
        this.updateBatteryDisplay();
        
        if (this.isLowBattery && !this.isCharging) {
            this.handleLowBattery();
        }
        
        this.batteryUpdateCallbacks.forEach(callback => {
            callback(this.level, this.isCharging, this.isLowBattery);
        });
    }

    simulateBattery() {
        this.level = Math.max(20, Math.floor(Math.random() * 100));
        this.isCharging = false;
        this.isLowBattery = this.level <= this.lowBatteryThreshold;
        this.updateBatteryDisplay();
        
        setInterval(() => {
            if (!this.isCharging && this.level > 5) {
                this.level -= 1;
                this.isLowBattery = this.level <= this.lowBatteryThreshold;
                this.updateBatteryDisplay();
                
                if (this.isLowBattery) {
                    this.handleLowBattery();
                }
            }
        }, 60000);
    }

    updateBatteryDisplay() {
        const batteryElement = document.getElementById('batteryStatus');
        const batteryLevelElement = document.getElementById('batteryLevel');
        const batteryIconElement = document.getElementById('batteryIcon');
        const batteryDisplayElement = document.getElementById('batteryLevelDisplay');
        
        if (batteryElement && batteryLevelElement && batteryIconElement) {
            batteryLevelElement.textContent = `${this.level}%`;
            
            let batteryClass = 'battery-high';
            let batteryIcon = '🔋';
            
            if (this.isCharging) {
                batteryClass = 'battery-charging';
                batteryIcon = '⚡';
            } else if (this.level <= 10) {
                batteryClass = 'battery-low';
                batteryIcon = '🪫';
            } else if (this.level <= 30) {
                batteryClass = 'battery-low';
                batteryIcon = '🔋';
            } else if (this.level <= 60) {
                batteryClass = 'battery-medium';
                batteryIcon = '🔋';
            }
            
            batteryElement.className = `battery-status ${batteryClass}`;
            batteryIconElement.textContent = batteryIcon;
        }
        
        if (batteryDisplayElement) {
            batteryDisplayElement.textContent = `${this.level}%${this.isCharging ? ' ⚡' : ''}`;
            batteryDisplayElement.className = `fw-bold ${
                this.isLowBattery ? 'text-danger' : 
                this.level < 50 ? 'text-warning' : 'text-success'
            }`;
        }
        
        if (this.isLowBattery && !this.isCharging) {
            document.body.classList.add('low-battery');
        } else {
            document.body.classList.remove('low-battery');
        }
    }

    handleLowBattery() {
        console.warn(`🔋 Low battery: ${this.level}% - optimizing for battery life`);
        
        if (this.logger.backgroundManager) {
            this.logger.backgroundManager.optimizeForLowBattery();
        }
        
        if (!this.lowBatteryWarningShown) {
            this.lowBatteryWarningShown = true;
            
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('🔋 Battery Low', {
                    body: `Battery at ${this.level}%. GPS tracking optimized for battery life.`,
                    icon: '/icon-192.png',
                    tag: 'low-battery'
                });
            }
            
            this.logger.addLog(`🔋 Battery low: ${this.level}% - optimizing tracking`, 'warning');
        }
    }

    onBatteryUpdate(callback) {
        this.batteryUpdateCallbacks.push(callback);
    }
}

// =============================================
// 📍 GEOFENCE MANAGER
// =============================================

class GeofenceManager {
    constructor(logger) {
        this.logger = logger;
        this.geofences = new Map();
        this.lastTriggeredGeofence = null;
        this.currentGeofence = null;
    }

    setupGeofences() {
        this.addGeofence('office', -6.208800, 106.845600, 500, { name: 'Kantor Pusat' });
        this.addGeofence('warehouse', -6.220000, 106.830000, 300, { name: 'Gudang Utama' });
        this.addGeofence('client_site', -6.200000, 106.850000, 200, { name: 'Site Klien' });
        
        console.log('📍 Geofences initialized:', this.geofences.size);
    }

    addGeofence(id, lat, lng, radius, metadata = {}) {
        this.geofences.set(id, {
            id,
            lat,
            lng,
            radius,
            metadata,
            lastTriggered: null
        });
        
        console.log(`📍 Geofence added: ${id} (${radius}m radius)`);
        return this.geofences.get(id);
    }

    removeGeofence(id) {
        const removed = this.geofences.delete(id);
        console.log(`📍 Geofence ${removed ? 'removed' : 'not found'}: ${id}`);
        return removed;
    }

    checkPosition(position) {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;

        for (const [id, geofence] of this.geofences) {
            const distance = this.calculateDistance(
                currentLat, currentLng,
                geofence.lat, geofence.lng
            );

            const isInside = distance <= (geofence.radius / 1000);
            const wasInside = this.currentGeofence === id;
            
            if (isInside && !wasInside) {
                this.triggerGeofence(geofence, position, 'enter');
                this.currentGeofence = id;
            } else if (!isInside && wasInside) {
                this.triggerGeofence(geofence, position, 'exit');
                this.currentGeofence = null;
            }
        }
    }

    triggerGeofence(geofence, position, eventType) {
        console.log(`📍 Geofence ${eventType}: ${geofence.id}`);
        
        this.updateGeofenceStatus(geofence, eventType);
        
        this.logger.addLog(
            `📍 ${eventType.toUpperCase()} area: ${geofence.metadata.name || geofence.id}`,
            'info'
        );

        if (this.logger.firebaseRef && this.logger.driverData) {
            const geofenceData = {
                geofenceEvent: {
                    id: geofence.id,
                    type: eventType,
                    timestamp: new Date().toISOString(),
                    position: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    },
                    metadata: geofence.metadata
                }
            };

            this.logger.firebaseRef.update(geofenceData);
        }

        if (eventType === 'enter') {
            this.showGeofenceNotification(geofence, eventType);
        }
    }

    updateGeofenceStatus(geofence, eventType) {
        const geofenceElement = document.getElementById('geofenceStatus');
        const geofenceBadge = document.getElementById('geofenceStatusBadge');
        
        if (geofenceElement) {
            if (eventType === 'enter') {
                geofenceElement.textContent = `📍 ${geofence.metadata.name || geofence.id}`;
                geofenceElement.style.background = 'rgba(40, 167, 69, 0.3)';
            } else {
                geofenceElement.textContent = '📍 No Area';
                geofenceElement.style.background = 'rgba(255, 255, 255, 0.2)';
            }
        }
        
        if (geofenceBadge) {
            geofenceBadge.textContent = eventType === 'enter' ? 'In Area' : 'Active';
        }
    }

    showGeofenceNotification(geofence, eventType) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`📍 ${geofence.metadata.name || geofence.id}`, {
                body: `Anda ${eventType === 'enter' ? 'memasuki' : 'meninggalkan'} area ${geofence.metadata.name || geofence.id}`,
                icon: '/icon-192.png',
                tag: `geofence-${geofence.id}`,
                requireInteraction: true
            });
        }
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

    clearGeofences() {
        this.geofences.clear();
        this.currentGeofence = null;
        this.updateGeofenceStatus(null, 'exit');
    }
}

// =============================================
// 💾 ENHANCED STORAGE MANAGER
// =============================================

class EnhancedStorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            WAYPOINTS: 'enhanced_gps_waypoints',
            SYNC_STATUS: 'enhanced_sync_status',
            PERSISTED_SESSION: 'dt_gps_persisted_session',
            BACKGROUND_DATA: 'dt_gps_backup_data'
        };
    }

    saveWaypoint(waypoint) {
        try {
            const existing = this.loadAllWaypoints();
            
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
                lastSync: new Date().toLocaleString('id-ID')
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

// =============================================
// 📡 OFFLINE QUEUE MANAGER
// =============================================

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

// =============================================
// 🔄 ENHANCED BACKGROUND TRACKING MANAGER
// =============================================

class EnhancedBackgroundTrackingManager {
    constructor(logger) {
        this.logger = logger;
        this.isActive = false;
        this.backgroundWatchId = null;
        this.backgroundInterval = null;
        this.isInBackground = false;
        this.lastBackgroundPosition = null;
        this.backgroundUpdateCount = 0;
        this.consecutiveLowAccuracyCount = 0;
        this.maxConsecutiveLowAccuracy = 3;
        
        this.backgroundService = new EnhancedBackgroundService(logger);
        this.geofenceManager = new GeofenceManager(logger);
        this.batteryManager = new BatteryManager(logger);
        this.speedCalculator = new RealTimeSpeedCalculator();
        
        this.init();
    }

    async init() {
        await this.batteryManager.init();
        this.geofenceManager.setupGeofences();
        
        this.batteryManager.onBatteryUpdate((level, isCharging, isLowBattery) => {
            if (isLowBattery) {
                this.optimizeForLowBattery();
            }
        });
    }

    start() {
        if (this.isActive) return;
        
        console.log('🔄 Starting ENHANCED background tracking...');
        this.isActive = true;
        
        this.setupVisibilityHandlers();
        this.startBackgroundPositionWatch();
        this.startBackgroundProcessing();
        
        this.backgroundService.requestPersistentStorage();
        
        this.updateBackgroundIndicator();
        this.logger.addLog('🔄 Enhanced background tracking started', 'success');
    }

    startBackgroundProcessing() {
        this.backgroundInterval = setInterval(() => {
            this.processBackgroundData();
            
            if (this.batteryManager.isLowBattery) {
                this.optimizeForLowBattery();
            }
            
        }, this.getOptimizedInterval());
    }

    getOptimizedInterval() {
        if (this.batteryManager.isLowBattery) return 30000;
        if (this.isInBackground) return 15000;
        return 5000;
    }

    optimizeForLowBattery() {
        if (this.backgroundWatchId) {
            navigator.geolocation.clearWatch(this.backgroundWatchId);
        }
        
        const lowBatteryOptions = {
            enableHighAccuracy: false,
            timeout: 30000,
            maximumAge: 120000,
            distanceFilter: 50
        };

        this.backgroundWatchId = navigator.geolocation.watchPosition(
            (position) => this.handleBackgroundPosition(position),
            (error) => this.handleBackgroundError(error),
            lowBatteryOptions
        );
        
        console.log('🔋 Low battery mode activated - optimized for battery life');
    }

    startBackgroundPositionWatch() {
        if (!navigator.geolocation) {
            console.warn('❌ Geolocation not supported');
            return;
        }

        const backgroundOptions = {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 60000,
            distanceFilter: 0
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
        if (!this.isValidBackgroundPosition(position)) {
            this.consecutiveLowAccuracyCount++;
            
            if (this.consecutiveLowAccuracyCount >= this.maxConsecutiveLowAccuracy) {
                this.restartBackgroundGPS();
            }
            return;
        }
        
        this.consecutiveLowAccuracyCount = 0;
        this.lastBackgroundPosition = position;
        this.backgroundUpdateCount++;

        this.geofenceManager.checkPosition(position);

        this.processRealTimeBackgroundMovement(position);

        this.cachePositionForSync(position);
    }

    isValidBackgroundPosition(position) {
        const accuracy = position.coords.accuracy;
        
        if (accuracy > 100) {
            console.warn(`🎯 Background accuracy too low: ${accuracy}m`);
            return false;
        }
        
        if (!this.isValidCoordinate(
            position.coords.latitude, 
            position.coords.longitude
        )) {
            console.warn('🎯 Invalid coordinates in background');
            return false;
        }
        
        return true;
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

    processRealTimeBackgroundMovement(position) {
        if (!this.logger.driverData || !this.logger.isTracking) return;

        const currentTime = new Date().getTime();
        const currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: currentTime
        };

        if (this.lastBackgroundPosition) {
            const prevPosition = {
                lat: this.lastBackgroundPosition.coords.latitude,
                lng: this.lastBackgroundPosition.coords.longitude,
                timestamp: this.lastBackgroundPosition.timestamp
            };

            const distance = this.calculateDistance(
                prevPosition.lat, prevPosition.lng,
                currentPosition.lat, currentPosition.lng
            );

            const speed = this.speedCalculator.calculateRealTimeSpeed(currentPosition, prevPosition);

            this.logger.totalDistance += distance;
            this.logger.currentSpeed = speed;
            this.logger.dataPoints++;

            console.log(`📏 Background Movement: +${(distance * 1000).toFixed(3)}m | 🚀 ${speed.toFixed(1)} km/h | Total: ${this.logger.totalDistance.toFixed(6)}km`);

            const waypoint = {
                id: `wp_bg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                lat: parseFloat(position.coords.latitude.toFixed(6)),
                lng: parseFloat(position.coords.longitude.toFixed(6)),
                accuracy: parseFloat(position.coords.accuracy.toFixed(1)),
                speed: parseFloat(speed.toFixed(1)),
                bearing: position.coords.heading ? parseFloat(position.coords.heading.toFixed(0)) : null,
                timestamp: new Date().toISOString(),
                timeDisplay: new Date().toLocaleTimeString('id-ID'),
                sessionId: this.logger.driverData.sessionId,
                unit: this.logger.driverData.unit,
                driver: this.logger.driverData.name,
                synced: false,
                isOnline: this.logger.isOnline,
                lowAccuracy: position.coords.accuracy > 50,
                isSimulated: false,
                isBackground: true,
                batteryLevel: this.batteryManager.level,
                distanceIncrement: distance
            };

            this.logger.processWaypoint(waypoint);
        }

        this.logger.lastPosition = {
            lat: currentPosition.lat,
            lng: currentPosition.lng,
            speed: this.logger.currentSpeed,
            accuracy: currentPosition.accuracy,
            bearing: position.coords.heading ? parseFloat(position.coords.heading.toFixed(0)) : null,
            timestamp: new Date()
        };

        this.logger.persistSession();
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

    restartBackgroundGPS() {
        console.log('🔄 Restarting background GPS due to poor accuracy...');
        
        if (this.backgroundWatchId) {
            navigator.geolocation.clearWatch(this.backgroundWatchId);
            this.backgroundWatchId = null;
        }
        
        this.consecutiveLowAccuracyCount = 0;
        
        setTimeout(() => {
            this.startBackgroundPositionWatch();
        }, 2000);
    }

    cachePositionForSync(position) {
        const gpsData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: this.logger.currentSpeed,
            timestamp: new Date().toISOString(),
            isBackground: true,
            batteryLevel: this.batteryManager.level,
            sessionId: this.logger.driverData?.sessionId,
            totalDistance: this.logger.totalDistance
        };

        this.backgroundService.cacheGPSData(gpsData);
    }

    async processBackgroundData() {
        if (!this.isInBackground || !this.lastBackgroundPosition) return;
        
        console.log('🔄 Processing background data...');
        
        if (this.backgroundUpdateCount % 10 === 0) {
            await this.backgroundService.triggerBackgroundSync();
        }
        
        if (this.backgroundUpdateCount % 30 === 0) {
            await this.backgroundService.checkStorageQuota();
        }
    }

    handleBackgroundError(error) {
        console.warn('Background GPS Error:', error);
        
        if (error.code === error.TIMEOUT) {
            console.log('⏱️ Background GPS timeout - will retry...');
            setTimeout(() => {
                if (this.isActive) {
                    this.startBackgroundPositionWatch();
                }
            }, 5000);
        }
    }

    setupVisibilityHandlers() {
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });

        document.addEventListener('freeze', () => {
            this.onFreeze();
        });

        document.addEventListener('resume', () => {
            this.onResume();
        });

        window.addEventListener('online', () => {
            this.onNetworkRestored();
        });

        window.addEventListener('offline', () => {
            this.onNetworkLost();
        });

        window.addEventListener('beforeunload', () => {
            this.persistState();
        });
    }

    handleVisibilityChange() {
        const wasInBackground = this.isInBackground;
        this.isInBackground = document.hidden;
        
        if (this.isInBackground && !wasInBackground) {
            this.onEnterBackground();
        } else if (!this.isInBackground && wasInBackground) {
            this.onEnterForeground();
        }
        
        this.updateBackgroundIndicator();
    }

    onEnterBackground() {
        console.log('🎯 Background mode: Enhanced tracking active');
        this.updateBackgroundIndicator(true);
        
        this.optimizeForBackground();
        
        this.persistState();
        
        this.notifyBackgroundState(true);
        
        this.logger.addLog('📱 App masuk background - tracking tetap aktif', 'info');
    }

    onEnterForeground() {
        console.log('🎯 Foreground mode: Restoring full features');
        this.updateBackgroundIndicator(false);
        
        this.restoreFromBackup();
        
        if (this.logger.isOnline) {
            setTimeout(() => {
                this.logger.syncWaypointsToServer();
                this.backgroundService.triggerBackgroundSync();
            }, 2000);
        }
        
        this.notifyBackgroundState(false);
        this.logger.addLog('📱 App aktif kembali - sync data background', 'success');
    }

    onFreeze() {
        console.log('❄️ Page freezing - persisting state');
        this.persistState();
        this.notifyBackgroundState(true);
    }

    onResume() {
        console.log('🔁 Page resuming - restoring state');
        this.restoreFromBackup();
        this.notifyBackgroundState(false);
    }

    onNetworkRestored() {
        console.log('📱 Network restored - triggering sync');
        this.updateOfflineIndicator(false);
        
        setTimeout(() => {
            this.backgroundService.triggerBackgroundSync();
            this.logger.syncWaypointsToServer();
        }, 3000);
        
        this.logger.addLog('📶 Koneksi pulih - sync data offline', 'success');
    }

    onNetworkLost() {
        console.log('📱 Network lost - caching data locally');
        this.updateOfflineIndicator(true);
        this.logger.addLog('📶 Koneksi terputus - data disimpan offline', 'warning');
    }

    notifyBackgroundState(isBackground) {
        if (this.backgroundService.serviceWorker?.active) {
            this.backgroundService.serviceWorker.active.postMessage({
                type: 'BACKGROUND_STATE_CHANGE',
                data: { isBackground }
            });
        }
        
        if (isBackground) {
            document.body.classList.add('background-mode');
        } else {
            document.body.classList.remove('background-mode');
        }
    }

    updateBackgroundIndicator(show = false) {
        const indicator = document.getElementById('backgroundIndicator');
        const statusBar = document.getElementById('backgroundStatusBar');
        
        if (indicator) {
            if (show && this.isInBackground) {
                indicator.style.display = 'block';
                indicator.textContent = '🔄 Background Tracking Active';
            } else {
                indicator.style.display = 'none';
            }
        }
        
        if (statusBar) {
            if (show && this.isInBackground) {
                statusBar.classList.add('active');
            } else {
                statusBar.classList.remove('active');
            }
        }
    }

    updateOfflineIndicator(show = false) {
        const offlineElement = document.getElementById('offlineIndicator');
        if (offlineElement) {
            if (show) {
                offlineElement.classList.add('active');
            } else {
                offlineElement.classList.remove('active');
            }
        }
    }

    optimizeForBackground() {
        if (this.backgroundInterval) {
            clearInterval(this.backgroundInterval);
        }
        
        this.backgroundInterval = setInterval(() => {
            this.processBackgroundData();
        }, 15000);
    }

    persistState() {
        if (!this.logger.driverData) return;
        
        const state = {
            driverData: this.logger.driverData,
            trackingData: {
                totalDistance: this.logger.totalDistance,
                dataPoints: this.logger.dataPoints,
                sessionStartTime: this.logger.sessionStartTime,
                journeyStatus: this.logger.journeyStatus,
                currentSpeed: this.logger.currentSpeed,
                lastPosition: this.logger.lastPosition
            },
            backgroundState: {
                lastBackgroundPosition: this.lastBackgroundPosition,
                backgroundUpdateCount: this.backgroundUpdateCount,
                isActive: this.isActive
            },
            persistedAt: new Date().toISOString()
        };

        this.logger.storageManager.backupBackgroundData(state);
    }

    restoreFromBackup() {
        const backup = this.logger.storageManager.loadBackgroundBackup();
        if (backup && backup.driverData) {
            console.log('📂 Restoring from background backup...');
            
            this.logger.totalDistance = backup.trackingData?.totalDistance || 0;
            this.logger.dataPoints = backup.trackingData?.dataPoints || 0;
            this.logger.currentSpeed = backup.trackingData?.currentSpeed || 0;
            
            this.logger.storageManager.clearBackgroundBackup();
        }
    }

    stop() {
        console.log('🛑 Stopping enhanced background tracking...');
        this.isActive = false;
        
        if (this.backgroundWatchId) {
            navigator.geolocation.clearWatch(this.backgroundWatchId);
            this.backgroundWatchId = null;
        }
        
        if (this.backgroundInterval) {
            clearInterval(this.backgroundInterval);
            this.backgroundInterval = null;
        }
        
        this.geofenceManager.clearGeofences();
        this.lastBackgroundPosition = null;
        this.backgroundUpdateCount = 0;
        this.consecutiveLowAccuracyCount = 0;
        
        this.updateBackgroundIndicator(false);
        this.updateOfflineIndicator(false);
        
        document.body.classList.remove('background-mode', 'low-battery');
    }
}

// =============================================
// 🚀 COMPLETE ENHANCED MOBILE GPS LOGGER
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
        this.storageManager = new EnhancedStorageManager();
        
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
        this.speedHistory = [];
        
        this.completeHistory = this.loadCompleteHistory();
        
        // Advanced Features Integration
        this.kalmanFilter = new AdvancedKalmanFilter();
        this.useKalmanFilter = true;
        this.mapsManager = new GoogleMapsPolylineManager();
        this.dataCollector = new MassiveDataCollector();
        
        this.backgroundManager = new EnhancedBackgroundTrackingManager(this);
        this.isInBackground = false;
        
        this.chatRef = null;
        this.chatMessages = [];
        this.unreadCount = 0;
        this.isChatOpen = false;
        this.chatInitialized = false;
        this.lastMessageId = null;
        
        this.offlineQueue = new OfflineQueueManager();
        this.speedCalculator = new RealTimeSpeedCalculator();
        
        this.init();
    }

    init() {
        try {
            this.setupEventListeners();
            this.updateTime();
            this.checkNetworkStatus();
            setInterval(() => this.updateTime(), 1000);
            setInterval(() => this.checkNetworkStatus(), 5000);
            
            this.loadUnsyncedWaypoints();
            
            setTimeout(() => {
                this.checkPersistedSession();
            }, 1000);
            
            console.log('🚀 Enhanced DT GPS Logger initialized - COMPLETE SYSTEM READY');
        } catch (error) {
            console.error('❌ Error during initialization:', error);
        }
    }

    checkPersistedSession() {
        try {
            const persistedSession = this.storageManager.loadPersistedSession();
            if (persistedSession && persistedSession.driverData) {
                console.log('📂 Found persisted session, validating...');
                
                if (!persistedSession.driverData.unit || !persistedSession.driverData.name) {
                    console.warn('❌ Invalid session data, clearing...');
                    this.storageManager.clearPersistedSession();
                    return;
                }
                
                const persistedAt = new Date(persistedSession.persistedAt);
                const now = new Date();
                const hoursDiff = (now - persistedAt) / (1000 * 60 * 60);
                
                if (hoursDiff < 6) {
                    console.log('🔄 Restoring persisted session...');
                    this.restoreSession(persistedSession);
                } else {
                    console.log('🕒 Persisted session expired, clearing...');
                    this.storageManager.clearPersistedSession();
                }
            } else {
                console.log('📭 No persisted session found');
            }
        } catch (error) {
            console.error('❌ Error checking persisted session:', error);
            this.storageManager.clearPersistedSession();
        }
    }

    restoreSession(sessionData) {
        if (!sessionData || !sessionData.driverData) {
            console.log('❌ No valid session data to restore');
            return;
        }
        
        try {
            this.driverData = sessionData.driverData;
            this.totalDistance = sessionData.trackingData?.totalDistance || 0;
            this.dataPoints = sessionData.trackingData?.dataPoints || 0;
            this.sessionStartTime = new Date(sessionData.trackingData?.sessionStartTime || new Date());
            this.journeyStatus = sessionData.trackingData?.journeyStatus || 'ready';
            this.currentSpeed = sessionData.trackingData?.currentSpeed || 0;
            
            if (!this.driverData.unit || !this.driverData.name) {
                console.error('❌ Invalid driver data in persisted session');
                this.storageManager.clearPersistedSession();
                return;
            }
            
            this.firebaseRef = database.ref('/units/' + this.driverData.unit);
            
            this.showDriverApp();
            this.backgroundManager.start();
            this.startDataTransmission();
            
            this.addLog('✅ Session dipulihkan - tracking berjalan di background', 'success');
            this.addLog(`📊 Data sebelumnya: ${this.totalDistance.toFixed(3)} km, ${this.dataPoints} waypoints`, 'info');
            
        } catch (error) {
            console.error('Error restoring session:', error);
            this.storageManager.clearPersistedSession();
            this.addLog('❌ Gagal memulihkan session', 'error');
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

        this.setupButtonListeners();
        
        document.addEventListener('visibilitychange', () => {
            const wasInBackground = this.isInBackground;
            this.isInBackground = document.hidden;
            
            if (document.hidden) {
                console.log('📱 App moved to background');
                if (!wasInBackground) {
                    this.addLog('📱 Mode background aktif', 'info');
                    this.persistSession();
                }
            } else {
                console.log('📱 App returned to foreground');
                if (wasInBackground) {
                    this.addLog('📱 Mode foreground aktif', 'success');
                    this.updateWaypointDisplay();
                    this.updateSessionDuration();
                    
                    if (this.isOnline) {
                        setTimeout(() => {
                            this.syncWaypointsToServer();
                            this.offlineQueue.processQueue();
                        }, 1000);
                    }
                }
            }
        });
    }

    setupButtonListeners() {
        document.getElementById('startJourneyBtn')?.addEventListener('click', () => this.startJourney());
        document.getElementById('pauseJourneyBtn')?.addEventListener('click', () => this.pauseJourney());
        document.getElementById('endJourneyBtn')?.addEventListener('click', () => this.endJourney());
        document.getElementById('reportIssueBtn')?.addEventListener('click', () => this.reportIssue());
        document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());

        document.getElementById('sendTestMessageBtn')?.addEventListener('click', () => this.sendTestMessage());
        document.getElementById('forceSyncBtn')?.addEventListener('click', () => this.forceSync());
        document.getElementById('gpsDiagnosticBtn')?.addEventListener('click', () => this.runGPSDiagnostic());

        document.getElementById('chatToggle')?.addEventListener('click', () => this.toggleChat());
        document.getElementById('closeChatBtn')?.addEventListener('click', () => this.toggleChat());
        document.getElementById('sendChatBtn')?.addEventListener('click', () => this.sendChatMessage());
        
        // ✅ TAMBAHKAN EVENT LISTENER UNTUK TOMBOL KALMAN
        document.getElementById('toggleKalmanBtn')?.addEventListener('click', () => this.toggleKalmanFilter());
        
        // ✅ TAMBAHKAN TOMBOL TEST SERVICE WORKER
        document.getElementById('testSWBtn')?.addEventListener('click', () => this.testServiceWorker());
        document.getElementById('testStorageBtn')?.addEventListener('click', () => this.testStorageInfo());
        
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });
        }

        document.getElementById('quickStatusBtn')?.addEventListener('click', () => this.showQuickStatus());
        document.getElementById('refreshDataBtn')?.addEventListener('click', () => this.forceSync());
    }

    // ✅ TAMBAHKAN METHOD toggleKalmanFilter()
    toggleKalmanFilter() {
        this.useKalmanFilter = !this.useKalmanFilter;
        const status = this.useKalmanFilter ? 'AKTIF' : 'NON-AKTIF';
        this.addLog(`🎯 Kalman Filter: ${status}`, this.useKalmanFilter ? 'success' : 'warning');
        
        const button = document.getElementById('toggleKalmanBtn');
        const statusElement = document.getElementById('kalmanStatus');
        const filterStatusElement = document.getElementById('kalmanFilterStatus');
        
        if (button) {
            button.textContent = `Kalman: ${status}`;
            button.className = this.useKalmanFilter ? 
                'btn btn-success btn-sm w-100' : 'btn btn-secondary btn-sm w-100';
        }
        
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = this.useKalmanFilter ? 'text-success' : 'text-secondary';
        }
        
        if (filterStatusElement) {
            filterStatusElement.textContent = status;
            filterStatusElement.className = `fw-bold ${this.useKalmanFilter ? 'text-success' : 'text-secondary'}`;
        }
    }

    // ✅ TAMBAHKAN METHOD initializeGoogleMaps()
    async initializeGoogleMaps(containerId) {
        try {
            const success = await this.mapsManager.initializeMap(containerId);
            if (success) {
                this.addLog('🗺️ Google Maps berhasil diinisialisasi', 'success');
                
                // Tambahkan marker awal
                if (this.lastPosition) {
                    this.mapsManager.addPoint(this.lastPosition, {
                        isSignificant: true,
                        title: 'Posisi Awal',
                        description: `Driver: ${this.driverData.name} | Unit: ${this.driverData.unit}`
                    });
                }
            } else {
                this.addLog('❌ Gagal menginisialisasi Google Maps', 'warning');
            }
        } catch (error) {
            console.error('Failed to initialize Google Maps:', error);
            this.addLog('❌ Error inisialisasi Google Maps', 'error');
        }
    }

    async handleEnhancedPositionUpdate(position) {
        if (!this.isValidGPSPosition(position)) {
            return;
        }

        const accuracy = position.coords.accuracy;
        const rawPosition = {
            lat: parseFloat(position.coords.latitude.toFixed(6)),
            lng: parseFloat(position.coords.longitude.toFixed(6)),
            accuracy: parseFloat(accuracy.toFixed(1))
        };

        let processedPosition = rawPosition;
        let kalmanConfidence = 1.0;
        let filteredSpeed = this.currentSpeed;

        // Apply Kalman Filter if enabled
        if (this.useKalmanFilter && accuracy <= 100) {
            try {
                const filteredResult = await this.kalmanFilter.filterPosition(rawPosition, accuracy);
                processedPosition = filteredResult.position;
                kalmanConfidence = filteredResult.confidence;
                filteredSpeed = filteredResult.velocity;
                
                console.log(`🎯 Kalman: ${accuracy}m → ${filteredResult.accuracy.toFixed(1)}m | Confidence: ${(kalmanConfidence * 100).toFixed(1)}%`);
            } catch (error) {
                console.warn('Kalman filter error:', error);
            }
        }

        const currentPosition = {
            lat: processedPosition.lat,
            lng: processedPosition.lng,
            accuracy: processedPosition.accuracy,
            speed: filteredSpeed,
            bearing: position.coords.heading ? parseFloat(position.coords.heading.toFixed(0)) : null,
            timestamp: new Date().getTime(),
            isOnline: this.isOnline,
            processed: this.useKalmanFilter,
            kalmanConfidence: kalmanConfidence,
            altitude: position.coords.altitude ? parseFloat(position.coords.altitude.toFixed(1)) : null,
            altitudeAccuracy: position.coords.altitudeAccuracy ? parseFloat(position.coords.altitudeAccuracy.toFixed(1)) : null
        };

        this.calculateRealTimeMovement(currentPosition);

        // Update Google Maps
        if (this.mapsManager && this.mapsManager.isInitialized) {
            this.mapsManager.addPoint(processedPosition, {
                isSignificant: this.dataPoints % 60 === 0,
                title: `Point ${this.dataPoints + 1}`,
                description: `Speed: ${filteredSpeed.toFixed(1)} km/h | Accuracy: ${processedPosition.accuracy}m`
            });
        }

        // Add to massive data collector
        this.dataCollector.addDataPoint(processedPosition, accuracy, {
            speed: filteredSpeed,
            kalmanApplied: this.useKalmanFilter,
            kalmanConfidence: kalmanConfidence
        });

        const waypoint = {
            ...currentPosition,
            id: `wp_${this.useKalmanFilter ? 'kf_' : 'raw_'}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            sessionId: this.driverData?.sessionId || 'unknown',
            unit: this.driverData?.unit || 'unknown',
            driver: this.driverData?.name || 'unknown',
            synced: false,
            isBackground: this.isInBackground,
            dataPointNumber: this.dataCollector.dataPoints.length,
            kalmanFiltered: this.useKalmanFilter,
            rawAccuracy: accuracy,
            processedAccuracy: processedPosition.accuracy
        };

        this.processWaypoint(waypoint);
        this.lastPosition = currentPosition;
        this.currentSpeed = filteredSpeed;

        if (this.dataPoints % 10 === 0) {
            this.persistSession();
        }

        this.updateAccuracyStatistics();
    }

    calculateRealTimeMovement(currentPosition) {
        if (!this.lastPosition || !this.lastPosition.timestamp) {
            this.lastPosition = currentPosition;
            return 0;
        }

        const timeDiffMs = currentPosition.timestamp - this.lastPosition.timestamp;
        
        if (timeDiffMs <= 0) {
            return 0;
        }

        const distanceKm = this.haversineDistance(
            this.lastPosition.lat, 
            this.lastPosition.lng,
            currentPosition.lat, 
            currentPosition.lng
        );

        const speed = this.speedCalculator.calculateRealTimeSpeed(currentPosition, this.lastPosition);

        if (this.journeyStatus === 'started') {
            this.totalDistance += distanceKm;
            this.currentSpeed = speed;
            
            if (!this.isInBackground) {
                document.getElementById('todayDistance').textContent = this.totalDistance.toFixed(3);
                document.getElementById('currentSpeed').textContent = this.currentSpeed.toFixed(1);
            }
            
            console.log(`📏 Real-time: +${(distanceKm * 1000).toFixed(3)}m | 🚀 ${speed.toFixed(1)} km/h | Total: ${this.totalDistance.toFixed(6)}km`);
            
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

    updateAccuracyStatistics() {
        const accuracyElement = document.getElementById('accuracyImprovement');
        const confidenceElement = document.getElementById('kalmanConfidence');
        const dataProgressElement = document.getElementById('dataCollectionProgress');

        if (accuracyElement) {
            accuracyElement.textContent = `${this.dataCollector.dataStats.accuracyImprovement}%`;
        }

        if (confidenceElement && this.useKalmanFilter) {
            const confidence = this.kalmanFilter.calculateConfidence();
            confidenceElement.textContent = `${(confidence * 100).toFixed(1)}%`;
        }

        if (dataProgressElement) {
            const progress = this.dataCollector.getCollectionProgress();
            dataProgressElement.textContent = `${progress.percentage}%`;
        }
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
        
        if (accuracy > 100000) {
            console.warn('🎯 GPS accuracy extremely poor:', accuracy, 'm - skipping');
            return false;
        }
        
        return true;
    }

    startRealGPSTracking() {
        if (!navigator.geolocation) {
            this.addLog('❌ GPS tidak didukung di browser ini', 'error');
            this.showGPSInstructions();
            return;
        }

        console.log('📍 Starting REAL-TIME GPS tracking with Kalman Filter...');
        
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
            distanceFilter: 0
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => {
                console.log('📍 GPS position received');
                this.handleEnhancedPositionUpdate(position);
            },
            (error) => {
                console.warn('❌ GPS watchPosition error:', error);
                this.handleGPSError(error);
            },
            options
        );

        this.isTracking = true;
        this.addLog('📍 Enhanced GPS Real-time diaktifkan - semua pergerakan terdeteksi', 'success');
        this.addLog(`🎯 Kalman Filter: ${this.useKalmanFilter ? 'AKTIF' : 'NON-AKTIF'}`, 'info');
        
        // Start massive data collection
        this.dataCollector.startCollection();
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const accuracy = pos.coords.accuracy;
                let accuracyMessage = `✅ GPS Aktif - Akurasi: ${accuracy}m`;
                
                if (accuracy > 100) {
                    accuracyMessage += ' - Cari area terbuka';
                    this.addLog(accuracyMessage, 'warning');
                } else if (accuracy > 50) {
                    accuracyMessage += ' - Akurasi sedang';
                    this.addLog(accuracyMessage, 'info');
                } else {
                    this.addLog(accuracyMessage, 'success');
                }
            },
            (err) => {
                let message = '⚠️ GPS initialization: ';
                switch(err.code) {
                    case err.PERMISSION_DENIED:
                        message += 'Izin ditolak - aktifkan lokasi di browser';
                        break;
                    case err.POSITION_UNAVAILABLE:
                        message += 'Posisi tidak tersedia - periksa GPS device';
                        break;
                    case err.TIMEOUT:
                        message += 'Timeout - cari sinyal lebih baik';
                        break;
                    default:
                        message += 'Error tidak diketahui';
                }
                this.addLog(message, 'warning');
            },
            { 
                enableHighAccuracy: true, 
                timeout: 8000,
                maximumAge: 0 
            }
        );
    }

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
                instructions = 'Aktifkan GPS/Lokasi di pengaturan device dan pastikan sinyal baik';
                break;
                
            case error.TIMEOUT:
                message = '⏱️ Timeout GPS';
                instructions = 'Cari area dengan sinyal lebih baik atau restart GPS';
                break;
                
            default:
                message = '❌ Error GPS Tidak Diketahui';
                instructions = 'Coba restart aplikasi atau device';
                break;
        }
        
        this.addLog(`${message} - ${instructions}`, 'error');
        
        if (error.code !== error.PERMISSION_DENIED) {
            setTimeout(() => {
                if (this.isTracking) {
                    navigator.geolocation.getCurrentPosition(
                        () => this.addLog('✅ GPS berhasil dipulihkan', 'success'),
                        (err) => console.warn('GPS recovery failed:', err),
                        { enableHighAccuracy: false, timeout: 10000 }
                    );
                }
            }, 10000);
        }
    }

    showGPSInstructions() {
        const instructions = document.getElementById('gpsInstructions');
        if (instructions) {
            instructions.style.display = 'block';
        }
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
                fuel: 100, accuracy: 0, timestamp: new Date().toISOString(),
                gpsMode: 'enhanced',
                isActive: true,
                batteryLevel: this.getBatteryLevel(),
                kalmanFilter: this.useKalmanFilter
            };

            this.firebaseRef.set(cleanData);
            this.showDriverApp();
            this.startDataTransmission();
            
            this.backgroundManager.start();
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

    // ✅ UPDATE METHOD showDriverApp() - TAMBAHKAN INISIALISASI MAPS
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
        
        // Initialize Google Maps
        this.initializeGoogleMaps('mapContainer');
        
        this.startRealGPSTracking();
        
        this.addLog(`✅ Login berhasil - ${this.driverData.name} (${this.driverData.unit})`, 'success');
        this.addLog('🔄 Background tracking aktif - aplikasi tetap berjalan meski dimatikan', 'info');
        this.addLog('📊 Massive data collection dimulai - target 61,200 data points', 'info');
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

        console.log(`📍 ${waypoint.isBackground ? 'BACKGROUND' : 'FOREGROUND'} GPS: ${waypoint.lat}, ${waypoint.lng}, Speed: ${waypoint.speed} km/h`);
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

    updateGPSDisplay(waypoint) {
        document.getElementById('currentLat').textContent = waypoint.lat.toFixed(6);
        document.getElementById('currentLng').textContent = waypoint.lng.toFixed(6);
        document.getElementById('currentSpeed').textContent = this.currentSpeed.toFixed(1);
        document.getElementById('gpsAccuracy').textContent = waypoint.accuracy.toFixed(1) + ' m';
        document.getElementById('gpsBearing').textContent = waypoint.bearing ? waypoint.bearing + '°' : '-';
        
        this.updateGPSAccuracyDisplay(waypoint.accuracy);
        
        // Update Kalman filter status
        if (this.useKalmanFilter) {
            const kalmanElement = document.getElementById('kalmanStatus');
            if (kalmanElement) {
                kalmanElement.textContent = `AKTIF (${(waypoint.kalmanConfidence * 100).toFixed(1)}% confidence)`;
                kalmanElement.className = 'text-success fw-bold';
            }
        }
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

    updateWaypointDisplay() {
        const waypointCount = document.getElementById('waypointCount');
        const unsyncedCount = document.getElementById('unsyncedCount');
        const waypointStatus = document.getElementById('waypointStatus');

        if (waypointCount) waypointCount.textContent = this.waypointBuffer.length;
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
        if (this.sendInterval) {
            clearInterval(this.sendInterval);
        }
        
        this.sendInterval = setInterval(() => {
            if (this.lastPosition) {
                this.sendToFirebaseWithCaching(); // Gunakan method baru dengan caching
            }
        }, this.isInBackground ? 30000 : 5000);
    }

    /**
     * Enhanced method untuk mengirim data GPS ke Service Worker
     */
    async sendToFirebaseWithCaching() {
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
                isOfflineData: !this.isOnline,
                fuel: this.calculateFuelLevel(),
                gpsMode: 'enhanced',
                isActive: true,
                isBackground: this.isInBackground,
                appState: this.isInBackground ? 'background' : 'foreground',
                kalmanFilter: this.useKalmanFilter,
                dataPoints: this.dataPoints,
                waypointsCollected: this.waypointBuffer.length,
                waypointId: `wp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            };

            // Selalu cache data ke Service Worker terlebih dahulu
            await this.cacheGPSDataInSW(gpsData);

            if (this.isOnline) {
                await this.firebaseRef.set(gpsData);
                if (!this.isInBackground) {
                    this.addLog(`📡 Data terkirim: ${this.currentSpeed.toFixed(1)} km/h | ${this.totalDistance.toFixed(3)} km`, 'success');
                }
                this.updateConnectionStatus(true);
            } else {
                if (!this.isInBackground) {
                    this.addLog(`💾 Data disimpan offline (${await this.getCachedItemsCount()} dalam antrian)`, 'warning');
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

    /**
     * Cache GPS data ke Service Worker
     */
    async cacheGPSDataInSW(gpsData) {
        if (!navigator.serviceWorker?.controller) {
            console.warn('Service Worker not available for caching');
            return;
        }

        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                if (event.data.type === 'CACHE_GPS_DATA_RESPONSE') {
                    resolve(event.data.success);
                }
            };

            navigator.serviceWorker.controller.postMessage({
                type: 'CACHE_GPS_DATA',
                data: gpsData
            }, [messageChannel.port2]);
        });
    }

    /**
     * Get jumlah cached items dari Service Worker
     */
    async getCachedItemsCount() {
        if (!navigator.serviceWorker?.controller) return 0;

        return new Promise((resolve) => {
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                if (event.data.type === 'SYNC_STATUS_RESPONSE') {
                    resolve(event.data.data?.totalItems || 0);
                }
            };

            navigator.serviceWorker.controller.postMessage({
                type: 'GET_SYNC_STATUS'
            }, [messageChannel.port2]);
        });
    }

    /**
     * Enhanced sync method dengan Service Worker integration
     */
    async forceSyncWithSW() {
        this.addLog('🔄 Memaksa sinkronisasi dengan Service Worker...', 'info');
        
        if (!navigator.serviceWorker?.controller) {
            this.addLog('❌ Service Worker tidak tersedia', 'error');
            return;
        }

        try {
            // Trigger manual sync via Service Worker
            const messageChannel = new MessageChannel();
            
            messageChannel.port1.onmessage = (event) => {
                if (event.data.type === 'SYNC_STATUS_RESPONSE') {
                    this.addLog(`📡 Sync status: ${event.data.data.status}`, 'info');
                }
            };

            navigator.serviceWorker.controller.postMessage({
                type: 'TRIGGER_SYNC'
            }, [messageChannel.port2]);

            // Juga sync waypoints biasa
            this.syncWaypointsToServer();
            
            if (this.offlineQueue.getQueueSize() > 0) {
                this.offlineQueue.processQueue();
            }
            
        } catch (error) {
            console.error('Force sync with SW failed:', error);
            this.addLog('❌ Gagal trigger sync dengan Service Worker', 'error');
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
        if (navigator.getBattery) {
            navigator.getBattery().then(battery => {
                return Math.round(battery.level * 100);
            });
        }
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
        const wrapper = document.getElementById('connectionStatusWrapper');
        
        if (connected) {
            if (dot) dot.className = 'connection-dot connected';
            if (status) {
                status.textContent = 'TERHUBUNG';
                status.className = 'text-success';
            }
        } else {
            if (dot) dot.className = 'connection-dot disconnected';
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
        this.addLog('Perjalanan dimulai - GPS tracking aktif', 'success');
        this.sendToFirebaseWithCaching();
    }

    pauseJourney() {
        this.journeyStatus = 'paused';
        const vehicleStatus = document.getElementById('vehicleStatus');
        if (vehicleStatus && !this.isInBackground) {
            vehicleStatus.textContent = 'PAUSED';
            vehicleStatus.className = 'bg-warning text-dark rounded px-2 py-1';
        }
        this.addLog('Perjalanan dijeda', 'warning');
        this.sendToFirebaseWithCaching();
    }

    endJourney() {
        this.journeyStatus = 'ended';
        const vehicleStatus = document.getElementById('vehicleStatus');
        if (vehicleStatus && !this.isInBackground) {
            vehicleStatus.textContent = 'COMPLETED';
            vehicleStatus.className = 'bg-info text-white rounded px-2 py-1';
        }
        this.addLog(`Perjalanan selesai - Total jarak: ${this.totalDistance.toFixed(3)} km`, 'info');
        this.sendToFirebaseWithCaching();
        
        if (this.isOnline) {
            this.syncWaypointsToServer();
        }
        
        // Export data collection
        const exportedData = this.dataCollector.exportData();
        console.log('📊 Data Collection Summary:', exportedData);
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
        this.forceSyncWithSW(); // Gunakan method baru dengan Service Worker
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

            const accuracy = position.coords.accuracy;
            const diagnosticMessage = `
✅ GPS Diagnostic Result:
• Latitude: ${position.coords.latitude.toFixed(6)}
• Longitude: ${position.coords.longitude.toFixed(6)}
• Accuracy: ${accuracy}m
• Speed: ${position.coords.speed ? (position.coords.speed * 3.6).toFixed(1) + ' km/h' : 'N/A'}
• Altitude: ${position.coords.altitude ? position.coords.altitude.toFixed(1) + 'm' : 'N/A'}
• Heading: ${position.coords.heading ? position.coords.heading + '°' : 'N/A'}
• Timestamp: ${new Date().toLocaleTimeString('id-ID')}
• Kalman Filter: ${this.useKalmanFilter ? 'AKTIF' : 'NON-AKTIF'}
• Data Points: ${this.dataPoints}
• Total Distance: ${this.totalDistance.toFixed(3)} km
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

        const unsynced = this.waypointBuffer.filter(wp => !wp.synced);
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
            totalWaypoints: this.waypointBuffer.length,
            batchIndex: batchIndex,
            kalmanFilter: this.useKalmanFilter,
            dataCollectorPoints: this.dataCollector.dataPoints.length
        };

        await batchRef.set(batchData);
        console.log(`✅ Batch ${batchIndex} uploaded: ${batch.length} waypoints`);
    }

    createBatches(array, batchSize) {
        const batches = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
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
        
        this.stopRealGPSTracking();
        this.isTracking = false;
    }

    stopRealGPSTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        this.isTracking = false;
    }

    showQuickStatus() {
        const status = this.getQuickStatus();
        alert(`Quick Status:\n${status}`);
    }

    getQuickStatus() {
        return `
Enhanced GPS Tracking System:
Driver: ${this.driverData?.name || '-'}
Unit: ${this.driverData?.unit || '-'}
Status: ${this.journeyStatus || 'ready'}
Distance: ${this.totalDistance?.toFixed(3) || '0.000'} km
Speed: ${this.currentSpeed?.toFixed(1) || '0.0'} km/h
Waypoints: ${this.waypointBuffer?.length || 0}
Unsynced: ${this.unsyncedWaypoints?.size || 0}
Connection: ${this.isOnline ? 'ONLINE' : 'OFFLINE'}
GPS Accuracy: ${this.lastPosition?.accuracy || '0'} m
Session Duration: ${document.getElementById('sessionDuration')?.textContent || '00:00:00'}
Background: ${this.backgroundManager?.isActive ? 'ACTIVE' : 'INACTIVE'}
Battery: ${this.backgroundManager?.batteryManager?.level || '0'}%
Kalman Filter: ${this.useKalmanFilter ? 'ACTIVE' : 'INACTIVE'}
Data Collection: ${this.dataCollector.dataPoints.length}/${this.dataCollector.maxDataPoints}
Google Maps: ${this.mapsManager.isInitialized ? 'ACTIVE' : 'INACTIVE'}
Service Worker: ${navigator.serviceWorker?.controller ? 'ACTIVE' : 'INACTIVE'}
                `.trim();
    }

    // ✅ TAMBAHKAN METHOD TESTING SERVICE WORKER
    async testServiceWorker() {
        if (!navigator.serviceWorker) {
            this.addLog('❌ Service Worker not supported', 'error');
            return;
        }
        
        try {
            const registration = await navigator.serviceWorker.ready;
            this.addLog('✅ Service Worker ready', 'success');
            
            // Test message passing
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
                this.addLog(`📩 Response from SW: ${JSON.stringify(event.data)}`, 'info');
            };
            
            registration.active.postMessage({
                type: 'GET_SYNC_STATUS'
            }, [messageChannel.port2]);
            
        } catch (error) {
            this.addLog(`❌ SW test failed: ${error.message}`, 'error');
        }
    }

    async testStorageInfo() {
        if (!navigator.serviceWorker?.controller) {
            this.addLog('❌ Service Worker controller not available', 'error');
            return;
        }

        try {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
                this.addLog(`💾 Storage Info: ${JSON.stringify(event.data)}`, 'info');
            };
            
            navigator.serviceWorker.controller.postMessage({
                type: 'GET_STORAGE_INFO'
            }, [messageChannel.port2]);
        } catch (error) {
            this.addLog(`❌ Storage test failed: ${error.message}`, 'error');
        }
    }

    logout() {
        if (confirm('Yakin ingin logout? Tracking akan dihentikan permanen.')) {
            this.stopRealGPSTracking();
            this.backgroundManager.stop();
            
            if (this.sendInterval) {
                clearInterval(this.sendInterval);
            }
            
            if (this.firebaseRef) {
                this.firebaseRef.update({
                    isActive: false,
                    lastUpdate: new Date().toLocaleTimeString('id-ID'),
                    journeyStatus: 'ended',
                    timestamp: new Date().toISOString()
                }).catch(error => {
                    console.error('Error updating Firebase status:', error);
                });
            }
            
            if (this.chatRef) {
                this.chatRef.off();
            }
            
            if (navigator.serviceWorker?.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'LOGOUT_CLEANUP'
                });
            }
            
            this.clearPersistedSession();
            
            if (this.isOnline) {
                this.syncWaypointsToServer();
                this.offlineQueue.processQueue();
            }
            
            const sessionSummary = {
                driver: this.driverData.name,
                unit: this.driverData.unit,
                duration: document.getElementById('sessionDuration')?.textContent || '00:00:00',
                totalDistance: this.totalDistance.toFixed(3),
                dataPoints: this.dataPoints,
                waypointsCollected: this.waypointBuffer.length,
                unsyncedWaypoints: this.unsyncedWaypoints.size,
                avgSpeed: document.getElementById('avgSpeed')?.textContent || '0',
                sessionId: this.driverData.sessionId,
                kalmanFilter: this.useKalmanFilter,
                dataCollection: this.dataCollector.dataPoints.length
            };
            
            console.log('Session Summary:', sessionSummary);
            this.addLog(`Session ended - ${this.waypointBuffer.length} waypoints collected`, 'info');
            
            // Export final data
            const finalData = this.dataCollector.exportData();
            console.log('Final Data Collection:', finalData);
            
            this.waypointBuffer = [];
            this.unsyncedWaypoints.clear();
            this.dataCollector.clearData();
            
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
            this.isTracking = false;
            
            this.addLog('✅ Logout berhasil - semua tracking dihentikan', 'success');
        }
    }
}

// =============================================
// 🚀 APPLICATION INITIALIZATION - IMPROVED
// =============================================

document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🚀 Starting Enhanced DT GPS Logger with Service Worker...');
        
        // Initialize the main logger
        window.dtLogger = new EnhancedDTGPSLogger();
        console.log('✅ Enhanced DT GPS Logger successfully initialized');
        
        // Setup global error handler
        window.addEventListener('error', function(event) {
            console.error('Global error:', event.error);
            if (window.dtLogger && !window.dtLogger.isInBackground) {
                window.dtLogger.addLog('⚠️ Error sistem terdeteksi', 'warning');
            }
        });

        window.addEventListener('unhandledrejection', function(event) {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault();
        });

        // Initialize additional features after a short delay
        setTimeout(() => {
            if (window.dtLogger && window.dtLogger.driverData) {
                console.log('🚀 All advanced features activated');
                window.dtLogger.updateKalmanFilterDisplay();
            }
            
            // Check Service Worker status
            if (navigator.serviceWorker?.controller) {
                console.log('✅ Service Worker is controlling the page');
            }
        }, 1000);

    } catch (error) {
        console.error('❌ Failed to initialize Enhanced DT GPS Logger:', error);
        
        // Show user-friendly error message
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

// Enhanced online/offline handlers dengan Service Worker
window.addEventListener('online', () => {
    if (window.dtLogger) {
        console.log('📱 Network online - triggering sync procedures');
        
        window.dtLogger.addLog('📶 Koneksi pulih - memulai sinkronisasi', 'success');
        
        setTimeout(() => {
            // Trigger Service Worker sync
            if (navigator.serviceWorker?.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'TRIGGER_SYNC'
                });
            }
            
            // Juga sync waypoints biasa
            window.dtLogger.syncWaypointsToServer();
            window.dtLogger.offlineQueue.processQueue();
        }, 2000);
    }
});

window.addEventListener('offline', () => {
    if (window.dtLogger) {
        console.log('📱 Network offline - enabling offline mode');
        window.dtLogger.addLog('📶 Koneksi terputus - mode offline aktif', 'warning');
    }
});

// Handle page lifecycle events
window.addEventListener('beforeunload', () => {
    if (window.dtLogger) {
        console.log('📱 Page unloading - saving state');
        window.dtLogger.persistSession();
    }
});

window.addEventListener('freeze', () => {
    if (window.dtLogger) {
        console.log('❄️ Page freezing - emergency save');
        window.dtLogger.persistSession();
        
        // Notify Service Worker about freeze
        if (navigator.serviceWorker?.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'EMERGENCY_BACKUP'
            });
        }
    }
});

window.addEventListener('resume', () => {
    if (window.dtLogger && window.dtLogger.driverData) {
        console.log('🔁 Page resuming from freeze');
        window.dtLogger.addLog('🔁 App dilanjutkan dari sleep mode', 'info');
        
        if (!window.dtLogger.isTracking) {
            window.dtLogger.startRealGPSTracking();
        }
        
        // Trigger sync setelah resume
        setTimeout(() => {
            if (window.dtLogger.isOnline) {
                window.dtLogger.forceSyncWithSW();
            }
        }, 3000);
    }
});

// Additional initialization for enhanced features
document.addEventListener('DOMContentLoaded', function() {
    // Character counter for chat input
    const chatInput = document.getElementById('chatInput');
    const charCounter = document.getElementById('charCounter');
    
    if (chatInput && charCounter) {
        chatInput.addEventListener('input', function() {
            const length = this.value.length;
            charCounter.textContent = `${length}/500`;
            
            if (length > 450) {
                charCounter.className = 'text-warning';
            } else if (length > 490) {
                charCounter.className = 'text-danger';
            } else {
                charCounter.className = 'text-muted';
            }
        });
    }

    // Update fuel level display
    function updateFuelStatus() {
        const fuelElement = document.getElementById('fuelLevel');
        if (fuelElement && window.dtLogger) {
            const fuel = window.dtLogger.calculateFuelLevel();
            fuelElement.textContent = fuel + '%';
            
            if (fuel < 25) {
                fuelElement.className = 'fw-bold text-danger';
            } else if (fuel < 50) {
                fuelElement.className = 'fw-bold text-warning';
            } else {
                fuelElement.className = 'fw-bold text-success';
            }
        }
    }

    // Update status every 30 seconds
    setInterval(() => {
        updateFuelStatus();
        
        // Update last update time
        const lastUpdateElement = document.getElementById('lastUpdateTime');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = new Date().toLocaleTimeString('id-ID');
        }
    }, 30000);

    // Initial update
    updateFuelStatus();
});

console.log('📍 script-mobile-complete.js loaded successfully - COMPLETE INTEGRATED SYSTEM WITH SERVICE WORKER');
