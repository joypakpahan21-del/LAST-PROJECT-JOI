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
try {
    if (firebase.apps.length === 0) {
        firebase.initializeApp(FIREBASE_CONFIG);
        console.log('✅ Firebase initialized successfully');
    } else {
        console.log('✅ Firebase already initialized');
    }
} catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw new Error(`Firebase initialization error: ${error.message}`);
}

const database = firebase.database();

// ==== ENHANCED GLOBAL INITIALIZATION WITH ERROR HANDLING ====
class GlobalGPSInitializer {
    constructor() {
        this.system = null;
        this.initializationAttempts = 0;
        this.maxAttempts = 3;
        this.initializationState = {
            isInitializing: false,
            isInitialized: false,
            lastError: null,
            dependencies: {
                firebase: false,
                map: false,
                dom: false
            }
        };
    }

    // ✅ ENHANCED: Safe initialization dengan comprehensive error handling
    async initializeSystem() {
        if (this.initializationState.isInitializing) {
            console.warn('⚠️ Initialization already in progress');
            return false;
        }

        if (this.initializationState.isInitialized && this.system) {
            console.log('✅ System already initialized');
            return true;
        }

        this.initializationState.isInitializing = true;
        this.initializationAttempts++;

        try {
            console.log(`🚀 Initializing GPS System (Attempt ${this.initializationAttempts}/${this.maxAttempts})...`);

            // ✅ Step 1: Validate dependencies
            await this.validateDependencies();
            
            // ✅ Step 2: Initialize Firebase dengan error handling
            await this.initializeFirebase();
            
            // ✅ Step 3: Initialize Map
            await this.initializeMapContainer();
            
            // ✅ Step 4: Create system instance dengan proper dependency injection
            this.system = this.createSystemInstance();
            
            // ✅ Step 5: Initialize subsystems
            await this.initializeSubsystems();

            this.initializationState.isInitialized = true;
            this.initializationState.isInitializing = false;
            this.initializationState.lastError = null;

            console.log('✅ GPS System initialized successfully');
            this.logInitializationSuccess();
            
            return true;

        } catch (error) {
            this.initializationState.isInitializing = false;
            this.initializationState.lastError = error;
            
            console.error('❌ System initialization failed:', error);
            this.handleInitializationError(error);
            
            // ✅ Auto-retry mechanism
            if (this.initializationAttempts < this.maxAttempts) {
                console.log(`🔄 Retrying initialization in 3 seconds...`);
                setTimeout(() => this.initializeSystem(), 3000);
            } else {
                this.showCriticalError('System initialization failed after multiple attempts');
            }
            
            return false;
        }
    }

    // ✅ ENHANCED: Dependency validation dengan detailed reporting
    async validateDependencies() {
        const errors = [];
        
        // Check Firebase
        if (typeof firebase === 'undefined') {
            errors.push('Firebase SDK not loaded');
        } else {
            this.initializationState.dependencies.firebase = true;
        }

        // Check Leaflet
        if (typeof L === 'undefined') {
            errors.push('Leaflet library not loaded');
        }

        // Check DOM elements
        const mapContainer = document.getElementById('map');
        if (!mapContainer) {
            errors.push('Map container not found');
        } else {
            this.initializationState.dependencies.dom = true;
        }

        // Check required HTML elements for chat system
        const requiredElements = ['monitorChatWindow', 'monitorChatToggle'];
        requiredElements.forEach(id => {
            if (!document.getElementById(id)) {
                errors.push(`Required element #${id} not found`);
            }
        });

        if (errors.length > 0) {
            throw new Error(`Dependency validation failed: ${errors.join(', ')}`);
        }

        console.log('✅ All dependencies validated successfully');
    }

    // ✅ ENHANCED: Firebase initialization dengan error handling
    async initializeFirebase() {
        return new Promise((resolve, reject) => {
            try {
                console.log('🔧 Initializing Firebase...');
                
                // Check if Firebase app already exists
                if (firebase.apps.length > 0) {
                    console.log('✅ Firebase app already initialized');
                    resolve();
                    return;
                }

                // Initialize Firebase dengan timeout
                const timeout = setTimeout(() => {
                    reject(new Error('Firebase initialization timeout'));
                }, 10000);

                // Initialize Firebase
                try {
                    firebase.initializeApp(FIREBASE_CONFIG);
                    clearTimeout(timeout);
                    
                    // Test connection
                    const connectedRef = firebase.database().ref(".info/connected");
                    connectedRef.once("value")
                        .then(snap => {
                            if (snap.val() === true) {
                                console.log('✅ Firebase connected successfully');
                                resolve();
                            } else {
                                reject(new Error('Firebase not connected'));
                            }
                        })
                        .catch(error => {
                            reject(new Error(`Firebase connection test failed: ${error.message}`));
                        });
                        
                } catch (firebaseError) {
                    clearTimeout(timeout);
                    reject(new Error(`Firebase initialization error: ${firebaseError.message}`));
                }

            } catch (error) {
                reject(new Error(`Firebase setup failed: ${error.message}`));
            }
        });
    }

    // ✅ ENHANCED: Map container initialization
    async initializeMapContainer() {
        return new Promise((resolve, reject) => {
            try {
                const mapContainer = document.getElementById('map');
                if (!mapContainer) {
                    throw new Error('Map container not found');
                }

                // Check if container has dimensions
                const styles = window.getComputedStyle(mapContainer);
                if (styles.width === '0px' || styles.height === '0px') {
                    console.warn('⚠️ Map container has zero dimensions, waiting for layout...');
                    setTimeout(() => {
                        this.initializeMapContainer().then(resolve).catch(reject);
                    }, 500);
                    return;
                }

                this.initializationState.dependencies.map = true;
                console.log('✅ Map container ready');
                resolve();

            } catch (error) {
                reject(new Error(`Map container initialization failed: ${error.message}`));
            }
        });
    }

    // ✅ ENHANCED: System instance creation dengan proper dependency injection
    createSystemInstance() {
        try {
            console.log('🔧 Creating GPS System instance...');
            
            const system = new OptimizedSAGMGpsTracking();
            
            // ✅ FIXED: Validasi instance creation
            if (!system || typeof system.initializeSystem !== 'function') {
                throw new Error('Invalid system instance created');
            }
            
            // ✅ FIXED: Set global reference dengan error handling
            try {
                window.gpsSystem = system;
                if (window.gpsSystem !== system) {
                    throw new Error('Failed to set global reference');
                }
            } catch (globalError) {
                console.warn('⚠️ Could not set global reference, using local instance:', globalError.message);
            }
            
            console.log('✅ System instance created successfully');
            return system;
            
        } catch (error) {
            throw new Error(`System instance creation failed: ${error.message}`);
        }
    }

    // ✅ ENHANCED: Subsystem initialization
    async initializeSubsystems() {
        const subsystems = [
            { name: 'Main System', method: 'initializeSystem' },
            { name: 'Chat System', method: 'setupMonitorChatSystem' },
            { name: 'Smooth Tracking', method: 'enableSmoothTracking' }
        ];

        for (const subsystem of subsystems) {
            try {
                if (typeof this.system[subsystem.method] === 'function') {
                    await this.system[subsystem.method].call(this.system);
                    console.log(`✅ ${subsystem.name} initialized`);
                }
            } catch (error) {
                console.warn(`⚠️ ${subsystem.name} initialization warning:`, error.message);
                // Continue with other subsystems even if one fails
            }
        }
    }

    // ✅ ENHANCED: Error handling dengan user feedback
    handleInitializationError(error) {
        console.error('🚨 Initialization Error:', error);
        
        const errorInfo = {
            attempt: this.initializationAttempts,
            maxAttempts: this.maxAttempts,
            timestamp: new Date().toISOString(),
            error: error.message,
            dependencies: this.initializationState.dependencies
        };

        // Save error log
        this.saveErrorLog(errorInfo);
        
        // Show user-friendly error message
        this.showErrorMessage(this.getUserFriendlyError(error));
    }

    // ✅ ENHANCED: User-friendly error messages
    getUserFriendlyError(error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('firebase')) {
            return 'Koneksi database gagal. Periksa koneksi internet Anda.';
        } else if (errorMessage.includes('map')) {
            return 'Peta tidak dapat dimuat. Periksa koneksi internet Anda.';
        } else if (errorMessage.includes('dependency')) {
            return 'Beberapa komponen sistem tidak terload dengan benar. Refresh halaman.';
        } else {
            return 'Sistem mengalami gangguan. Silakan refresh halaman.';
        }
    }

    showErrorMessage(message) {
        // Remove existing error messages
        const existingErrors = document.querySelectorAll('.system-error-message');
        existingErrors.forEach(el => el.remove());
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'system-error-message alert alert-warning alert-dismissible fade show';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 99999;
            min-width: 300px;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <strong>⚠️ System Notice</strong><br>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            <div class="mt-2">
                <small>Attempt ${this.initializationAttempts}/${this.maxAttempts}</small>
                <button class="btn btn-sm btn-outline-secondary ms-2" onclick="window.globalInitializer.initializeSystem()">
                    Try Again
                </button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    }

    showCriticalError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'system-critical-error alert alert-danger';
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 99999;
            text-align: center;
            border-radius: 0;
        `;
        errorDiv.innerHTML = `
            <strong>🚨 Critical System Error</strong><br>
            ${message}<br>
            <small>Please refresh the page or contact support.</small>
        `;
        
        document.body.appendChild(errorDiv);
    }

    saveErrorLog(errorInfo) {
        try {
            const logs = JSON.parse(localStorage.getItem('gps_system_error_logs') || '[]');
            logs.push({
                ...errorInfo,
                id: 'err_' + Date.now(),
                userAgent: navigator.userAgent
            });
            
            // Keep only last 50 errors
            if (logs.length > 50) {
                logs.splice(0, logs.length - 50);
            }
            
            localStorage.setItem('gps_system_error_logs', JSON.stringify(logs));
        } catch (e) {
            console.warn('Could not save error log:', e);
        }
    }

    logInitializationSuccess() {
        const successInfo = {
            timestamp: new Date().toISOString(),
            attempts: this.initializationAttempts,
            dependencies: this.initializationState.dependencies,
            performance: {
                memory: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1048576),
                    total: Math.round(performance.memory.totalJSHeapSize / 1048576)
                } : null,
                timing: performance.timing ? {
                    loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart
                } : null
            }
        };
        
        console.log('🎉 System initialization completed:', successInfo);
    }

    // ✅ ENHANCED: System status check
    getSystemStatus() {
        return {
            ...this.initializationState,
            system: !!this.system,
            attempts: this.initializationAttempts,
            timestamp: new Date().toISOString()
        };
    }

    // ✅ ENHANCED: Safe cleanup
    cleanup() {
        this.initializationState.isInitializing = false;
        
        if (this.system && typeof this.system.cleanup === 'function') {
            try {
                this.system.cleanup();
            } catch (error) {
                console.error('Error during system cleanup:', error);
            }
        }
        
        this.system = null;
        window.gpsSystem = null;
        
        // Remove error messages
        document.querySelectorAll('.system-error-message, .system-critical-error').forEach(el => el.remove());
        
        console.log('🧹 Global initializer cleanup completed');
    }
}

// ==== ENHANCED SMOOTH LIVE TRACKING SYSTEM ====
class SmoothLiveTracking {
    constructor(gpsSystem) {
        // ✅ FIXED: Constructor menerima parameter gpsSystem
        if (!gpsSystem) {
            throw new Error('SmoothLiveTracking requires gpsSystem parameter');
        }
        
        this.gpsSystem = gpsSystem; // ✅ SIMPAN REFERENCE
        this.unitAnimations = new Map();
        this.interpolationEnabled = true;
        this.animationDuration = 2000; // 2 detik untuk smooth movement
        this.lastPositions = new Map();
        this.performanceOptimizer = new PerformanceOptimizer();
    }

    // ✅ FIXED: Akses markers dan units melalui gpsSystem
    get markers() {
        return this.gpsSystem.markers;
    }

    get units() {
        return this.gpsSystem.units;
    }

    get unitHistory() {
        return this.gpsSystem.unitHistory;
    }

    // Enhanced real-time data processing
    processLiveData(unitName, newData) {
        const currentTime = Date.now();
        
        if (!this.lastPositions.has(unitName)) {
            // First position - langsung set
            this.updateUnitPositionImmediately(unitName, newData);
        } else {
            // Interpolate between positions untuk smooth movement
            this.animateUnitMovement(unitName, newData);
        }
        
        this.lastPositions.set(unitName, {
            ...newData,
            timestamp: currentTime
        });
    }

    // Smooth animation seperti Google Maps
    animateUnitMovement(unitName, newData) {
        const marker = this.markers.get(unitName);
        if (!marker) return;

        const lastPosition = this.lastPositions.get(unitName);
        const newLatLng = L.latLng(newData.lat, newData.lng);
        
        if (!this.interpolationEnabled) {
            // Instant movement
            marker.setLatLng(newLatLng);
            return;
        }

        // Cancel existing animation
        if (this.unitAnimations.has(unitName)) {
            cancelAnimationFrame(this.unitAnimations.get(unitName));
        }

        // Calculate animation parameters
        const startLatLng = marker.getLatLng();
        const startTime = Date.now();
        const duration = this.calculateAnimationDuration(startLatLng, newLatLng);

        // Animation function
        const animate = () => {
            if (!this.performanceOptimizer.shouldUpdate()) {
                this.unitAnimations.set(unitName, requestAnimationFrame(animate));
                return;
            }

            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function untuk smooth movement
            const easeProgress = this.easeInOutCubic(progress);
            
            // Interpolate position
            const currentLat = startLatLng.lat + (newLatLng.lat - startLatLng.lat) * easeProgress;
            const currentLng = startLatLng.lng + (newLatLng.lng - startLatLng.lng) * easeProgress;
            
            marker.setLatLng([currentLat, currentLng]);
            
            // Rotate marker berdasarkan bearing
            if (newData.bearing) {
                this.rotateMarker(marker, newData.bearing);
            }
            
            // Update popup dengan data real-time
            this.updateMarkerPopup(marker, unitName, {
                ...newData,
                lat: currentLat,
                lng: currentLng
            });
            
            if (progress < 1) {
                this.unitAnimations.set(unitName, requestAnimationFrame(animate));
            } else {
                this.unitAnimations.delete(unitName);
                // Final position update
                this.updateMarkerPopup(marker, unitName, newData);
            }
        };

        this.unitAnimations.set(unitName, requestAnimationFrame(animate));
    }

    calculateAnimationDuration(startLatLng, endLatLng) {
        const distance = this.calculateDistance(
            startLatLng.lat, startLatLng.lng,
            endLatLng.lat, endLatLng.lng
        );
        
        // Durasi berdasarkan jarak (max 3 detik)
        const baseDuration = Math.min(3000, distance * 100); // 100ms per meter
        return Math.max(500, baseDuration); // Minimum 500ms
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    rotateMarker(marker, bearing) {
        const icon = marker.getElement();
        if (icon) {
            icon.style.transform = `rotate(${bearing}deg)`;
            icon.style.transition = 'transform 1s ease-out';
        }
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

    updateUnitPositionImmediately(unitName, data) {
        const marker = this.markers.get(unitName);
        if (marker) {
            marker.setLatLng([data.lat, data.lng]);
            
            // Update bearing jika ada
            if (data.bearing) {
                this.rotateMarker(marker, data.bearing);
            }
            
            // Update popup dengan info real-time
            this.updateMarkerPopup(marker, unitName, data);
        }
    }

    updateMarkerPopup(marker, unitName, data) {
        const popupContent = this.createEnhancedUnitPopup(unitName, data);
        marker.setPopupContent(popupContent);
    }

    createEnhancedUnitPopup(unitName, data) {
        const unit = this.units.get(unitName);
        if (!unit) return '';

        const isOnline = unit.isOnline;
        const routePoints = this.unitHistory.get(unitName)?.length || 0;
        
        return `
            <div class="unit-popup">
                <div class="popup-header">
                    <h6 class="mb-0">🚛 ${unitName} ${isOnline ? '🟢' : '🔴'}</h6>
                </div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Driver:</span>
                        <span class="info-value">${unit.driver || 'Tidak diketahui'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status:</span>
                        <span class="info-value ${unit.status === 'moving' ? 'text-warning' : unit.status === 'active' ? 'text-success' : 'text-danger'}">
                            ${unit.status === 'moving' ? '🚗 Dalam Perjalanan' : unit.status === 'active' ? '🟢 Aktif' : '🔴 Non-Aktif'}
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Kecepatan:</span>
                        <span class="info-value">${data.speed ? data.speed.toFixed(1) : '0'} km/h</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Arah:</span>
                        <span class="info-value">${data.bearing ? data.bearing.toFixed(0) + '°' : '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Akurasi:</span>
                        <span class="info-value">${data.accuracy ? data.accuracy.toFixed(1) + ' m' : '-'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Update:</span>
                        <span class="info-value">${new Date().toLocaleTimeString('id-ID')}</span>
                    </div>
                </div>
                <div class="popup-footer">
                    <small class="text-muted">Live tracking aktif</small>
                </div>
            </div>
        `;
    }
}

// ==== PERFORMANCE OPTIMIZER ====
class PerformanceOptimizer {
    constructor() {
        this.frameRate = 60;
        this.lastUpdateTime = 0;
        this.updateInterval = 1000 / this.frameRate; // 60 FPS
        this.lastUpdates = new Map();
    }

    shouldUpdate() {
        const now = Date.now();
        if (now - this.lastUpdateTime >= this.updateInterval) {
            this.lastUpdateTime = now;
            return true;
        }
        return false;
    }

    // Throttle Firebase updates
    throttleFirebaseUpdate(unitName, data) {
        const now = Date.now();
        const lastUpdate = this.lastUpdates.get(unitName) || 0;
        
        if (now - lastUpdate >= 1000) { // Max 1 update per second per unit
            this.lastUpdates.set(unitName, now);
            return true;
        }
        return false;
    }

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// ==== ENHANCED OFFLINE DATA MANAGER FOR MONITOR ====
class MonitorOfflineManager {
    constructor() {
        this.offlineUnits = new Map();
        this.offlineData = new Map();
        this.maxOfflineStorage = 1000;
        this.cleanupInterval = null;
        this.init();
    }

    init() {
        this.startCleanupInterval();
        this.setupOfflineUI();
    }

    setupOfflineUI() {
        const offlineHtml = `
            <div id="monitorOfflineContainer" class="offline-units-container">
                <div class="offline-section-header">
                    <h6>📴 Units Offline</h6>
                    <small id="offlineUnitsCount">0 units</small>
                </div>
                <div id="offlineUnitsList" class="offline-units-list">
                    <!-- Offline units will be populated here -->
                </div>
            </div>
        `;
        
        // Add to sidebar or appropriate location
        const sidebar = document.querySelector('.sidebar .p-3');
        if (sidebar) {
            sidebar.insertAdjacentHTML('beforeend', offlineHtml);
        }
    }

    // Track unit yang offline
    trackOfflineUnit(unitName, unitData) {
        if (!this.offlineUnits.has(unitName)) {
            this.offlineUnits.set(unitName, {
                ...unitData,
                wentOffline: new Date(),
                lastKnownPosition: {
                    lat: unitData.latitude,
                    lng: unitData.longitude
                }
            });
            
            this.updateOfflineUI();
            this.logOfflineEvent(unitName, 'went_offline');
        }
    }

    // Unit kembali online
    unitBackOnline(unitName) {
        if (this.offlineUnits.has(unitName)) {
            const offlineData = this.offlineUnits.get(unitName);
            this.logOfflineEvent(unitName, 'back_online', {
                offlineDuration: Date.now() - new Date(offlineData.wentOffline).getTime()
            });
            
            this.offlineUnits.delete(unitName);
            this.updateOfflineUI();
        }
    }

    updateOfflineUI() {
        const container = document.getElementById('offlineUnitsList');
        const countElement = document.getElementById('offlineUnitsCount');
        
        if (!container || !countElement) return;

        const offlineCount = this.offlineUnits.size;
        countElement.textContent = `${offlineCount} units`;

        if (offlineCount === 0) {
            container.innerHTML = `
                <div class="offline-placeholder">
                    <small class="text-muted">Semua units online</small>
                </div>
            `;
            return;
        }

        let html = '';
        this.offlineUnits.forEach((unit, unitName) => {
            const offlineTime = new Date(unit.wentOffline);
            const duration = this.formatDuration(Date.now() - offlineTime.getTime());
            
            html += `
                <div class="offline-unit-item">
                    <div class="offline-unit-header">
                        <span class="unit-name">${unitName}</span>
                        <span class="offline-badge">🔴</span>
                    </div>
                    <div class="offline-unit-details">
                        <small>Driver: ${unit.driver || 'Unknown'}</small>
                        <small>Offline: ${duration}</small>
                        <small>Lokasi: ${unit.lastKnownPosition.lat.toFixed(4)}, ${unit.lastKnownPosition.lng.toFixed(4)}</small>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours} jam ${minutes % 60} menit`;
        if (minutes > 0) return `${minutes} menit`;
        return `${seconds} detik`;
    }

    logOfflineEvent(unitName, event, metadata = {}) {
        const eventData = {
            unit: unitName,
            event: event,
            timestamp: new Date().toISOString(),
            ...metadata
        };
        
        console.log(`📴 Offline Event: ${unitName} - ${event}`, eventData);
        
        // Simpan ke localStorage untuk analytics
        this.saveOfflineEvent(eventData);
    }

    saveOfflineEvent(eventData) {
        const events = JSON.parse(localStorage.getItem('monitor_offline_events') || '[]');
        events.push(eventData);
        
        // Maintain size limit
        if (events.length > this.maxOfflineStorage) {
            events = events.slice(-this.maxOfflineStorage);
        }
        
        localStorage.setItem('monitor_offline_events', JSON.stringify(events));
    }

    startCleanupInterval() {
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldOfflineData();
        }, 30000); // Setiap 30 detik
    }

    cleanupOldOfflineData() {
        const now = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        this.offlineUnits.forEach((unit, unitName) => {
            const offlineTime = new Date(unit.wentOffline).getTime();
            if (now - offlineTime > twentyFourHours) {
                console.log(`🧹 Removing old offline unit: ${unitName}`);
                this.offlineUnits.delete(unitName);
            }
        });
        
        this.updateOfflineUI();
    }
}

// ENHANCED SAGM GPS TRACKING SYSTEM WITH SMOOTH ANIMATION CHAT
class OptimizedSAGMGpsTracking {
    constructor() {
        console.log('🚀 Initializing Enhanced GPS Tracking System with Smooth Animation Chat...');
        
        // 🔄 ENHANCED MEMORY MANAGEMENT
        this.units = new Map();
        this.markers = new Map();
        this.unitPolylines = new Map();
        this.unitHistory = new Map();
        this.unitSessions = new Map();
        this.driverOnlineStatus = new Map();
        this.lastDataTimestamps = new Map();
        
        // 🧹 ENHANCED CLEANUP SYSTEM
        this.cleanupCallbacks = [];
        this.intervals = new Set();
        this.firebaseListeners = new Map();
        this.cleanupInterval = null;
        this.lastCleanupTime = null;
        this.inactiveUnitTracker = new Map();
        this.dataCorrectionQueue = new Map();
        
        // ⚡ PERFORMANCE OPTIMIZATION
        this.updateDebounce = null;
        this.lastRenderTime = 0;
        this.renderThrottleMs = 500;
        
        // ✅ ENHANCED: Smooth Live Tracking dengan dependency injection
        this.smoothTracker = new SmoothLiveTracking(this); // ✅ PASS THIS KE SmoothLiveTracking
        
        // ✅ ENHANCED: Monitor Offline Manager
        this.offlineManager = new MonitorOfflineManager();
        
        // System state
        this.map = null;
        this.importantMarkers = [];
        this.activeUnits = 0;
        this.totalDistance = 0;
        this.avgSpeed = 0;
        this.totalFuelConsumption = 0;
        this.lastUpdate = new Date();
        this.autoRefreshInterval = null;
        this.firebaseListener = null;
        
        // ✅ ENHANCED CHAT SYSTEM WITH SMOOTH ANIMATION
        this.monitorChatRefs = new Map();
        this.monitorChatMessages = new Map();
        this.monitorUnreadCounts = new Map();
        this.activeChatUnit = null;
        this.isMonitorChatOpen = false;
        this.monitorChatInitialized = false;
        this.isMonitorTyping = false;
        this.monitorTypingTimeout = null;
        
        // Chat event handlers for cleanup
        this.chatWindowClickHandler = null;
        this.documentClickHandler = null;
        this.escapeKeyHandler = null;
        
        // Route visualization - ENHANCED
        this.showRoutes = true;
        this.routeColors = new Map();
        this.routeControls = null;
        this.maxRoutePoints = 200;
        
        // Data Logger System
        this.dataLogger = {
            logs: [],
            maxLogs: 1000,
            logLevels: {
                INFO: 'info',
                SUCCESS: 'success', 
                WARNING: 'warning',
                ERROR: 'error',
                GPS: 'gps',
                SYSTEM: 'system'
            },
            autoExport: false,
            exportInterval: null
        };
        
        // Vehicle configuration
        this.vehicleConfig = {
            fuelEfficiency: 4.5,
            maxSpeed: 80,
            fuelTankCapacity: 100,
            baseFuelConsumption: 0.25,
            movingFuelConsumption: 0.22,
            idleFuelConsumptionPerMin: 0.013
        };

        // Important locations
        this.importantLocations = {
            PKS_SAGM: { 
                lat: -0.43452332690449164, 
                lng: 102.96741072417917, 
                name: "PKS SAGM",
                type: "pks"
            },
            KANTOR_KEBUN: { 
                lat: -0.3575865859028525, 
                lng: 102.95047687287101, 
                name: "Kantor Kebun PT SAGM",
                type: "office"
            }
        };

        this.config = {
            center: [
                (this.importantLocations.PKS_SAGM.lat + this.importantLocations.KANTOR_KEBUN.lat) / 2,
                (this.importantLocations.PKS_SAGM.lng + this.importantLocations.KANTOR_KEBUN.lng) / 2
            ],
            zoom: 13
        };

        // Initialize system nanti setelah validasi
    }

    // ===== INITIALIZATION METHODS =====
    initializeSystem() {
        try {
            console.log('🚀 Starting Enhanced GPS Tracking System with Smooth Animation Chat...');
            this.setupMap();
            this.setupEventHandlers();
            this.connectToFirebase();
            this.startPeriodicTasks();
            this.setupDataLogger();
            this.testFirebaseConnection();
            
            // ✅ SETUP CHAT WINDOW BEHAVIOR WITH SMOOTH ANIMATION
            this.setupChatWindowBehavior();
            
            // ✅ ENHANCED CHAT SYSTEM
            this.setupMonitorChatSystem();
            
            // ✅ ENHANCED: Enable smooth tracking
            this.enableSmoothTracking();
            
            setTimeout(() => this.showDebugPanel(), 2000);
            
        } catch (error) {
            console.error('System initialization failed:', error);
            this.displayError('Gagal memulai sistem GPS');
            throw error; // Re-throw untuk ditangani oleh global initializer
        }
    }

    // ✅ ENHANCED: Enable smooth tracking
    enableSmoothTracking() {
        this.smoothTracker.interpolationEnabled = true;
        this.smoothTracker.animationDuration = 1500;
        console.log('🔄 Smooth tracking enabled - Google Maps style');
        this.logData('Smooth tracking diaktifkan - Google Maps style', 'system');
    }

    // ===== ENHANCED FIREBASE METHODS =====
    connectToFirebase() {
        try {
            console.log('🟡 Connecting to Firebase...');
            
            this.cleanupFirebaseListeners();

            const connectionListener = database.ref('.info/connected').on('value', (snapshot) => {
                const connected = snapshot.val();
                this.updateConnectionStatus(connected);
                
                if (connected) {
                    this.logData('Firebase connected', 'success');
                    setTimeout(() => this.forceCleanupInactiveUnits(), 2000);
                } else {
                    this.logData('Firebase disconnected', 'warning');
                    this.markAllUnitsOffline();
                }
            });
            this.firebaseListeners.set('connection', connectionListener);

            // ✅ ENHANCED: Real-time listener dengan optimasi
            const unitsListener = database.ref('/units').on('value', 
                (snapshot) => {
                    try {
                        const data = snapshot.val();
                        if (data) {
                            this.debouncedProcessRealTimeData(data);
                        } else {
                            console.log('⚠️ No data received from Firebase');
                            this.forceCleanupInactiveUnits();
                        }
                    } catch (processError) {
                        console.error('❌ Error processing data:', processError);
                        this.logData('Data processing error', 'error', { error: processError.message });
                    }
                }, 
                (error) => {
                    console.error('❌ Firebase listener error:', error);
                    this.logData('Firebase listener error', 'error', { 
                        error: error.message,
                        code: error.code
                    });
                    
                    setTimeout(() => {
                        console.log('🔄 Retrying Firebase connection...');
                        this.connectToFirebase();
                    }, 3000);
                }
            );
            this.firebaseListeners.set('units', unitsListener);

            const removalListener = database.ref('/units').on('child_removed', (snapshot) => {
                this.handleDataRemoval(snapshot.key);
            });
            this.firebaseListeners.set('removal', removalListener);

            console.log('✅ Firebase listeners setup completed');
            
        } catch (error) {
            console.error('🔥 Critical Firebase error:', error);
            this.logData('Critical Firebase error', 'error', { error: error.message });
            setTimeout(() => this.connectToFirebase(), 5000);
        }
    }

    debouncedProcessRealTimeData = this.smoothTracker.performanceOptimizer.debounce((data) => {
        this.processRealTimeData(data);
    }, 300);

    // ===== ENHANCED PROCESS REAL-TIME DATA =====
    processRealTimeData(firebaseData) {
        if (!firebaseData) {
            this.logData('No real-time data from Firebase', 'warning');
            this.forceCleanupInactiveUnits();
            return;
        }

        const unitCount = Object.keys(firebaseData).length;
        console.log(`🔄 Real-time update: ${unitCount} active units`);

        const activeUnits = new Set();
        const currentTime = Date.now();
        
        Object.keys(firebaseData).forEach(unitName => {
            this.inactiveUnitTracker.set(unitName, 0);
        });

        Object.entries(firebaseData).forEach(([unitName, unitData]) => {
            if (!this.validateUnitData(unitName, unitData)) {
                this.correctUnitData(unitName, unitData);
                return;
            }

            activeUnits.add(unitName);
            this.lastDataTimestamps.set(unitName, currentTime);
            this.driverOnlineStatus.set(unitName, true);

            // ✅ ENHANCED: Track unit back online
            this.offlineManager.unitBackOnline(unitName);

            const existingUnit = this.units.get(unitName);
            
            if (existingUnit) {
                this.refreshUnitData(existingUnit, unitData);
                
                // ✅ ENHANCED: Process live data dengan smooth animation
                if (unitData.lat && unitData.lng) {
                    this.smoothTracker.processLiveData(unitName, {
                        lat: unitData.lat,
                        lng: unitData.lng,
                        speed: unitData.speed || 0,
                        bearing: unitData.bearing || null,
                        accuracy: unitData.accuracy || 0
                    });
                }
            } else {
                const newUnit = this.createNewUnit(unitName, unitData);
                if (newUnit) {
                    this.units.set(unitName, newUnit);
                    this.unitSessions.set(unitName, {
                        sessionId: unitData.sessionId,
                        startTime: currentTime,
                        lastActivity: currentTime
                    });
                    
                    // Setup chat for new unit
                    if (!this.monitorChatRefs.has(unitName)) {
                        this.setupUnitChatListener(unitName);
                    }
                }
            }
        });

        this.gradualCleanupInactiveUnits(activeUnits);
        this.updateStatistics();
        this.scheduleRender();
    }

    // ✅ ENHANCED CHAT SYSTEM METHODS WITH SMOOTH ANIMATION
    setupMonitorChatSystem() {
        console.log('💬 Initializing enhanced monitor chat system with smooth animation...');
        
        // Listen for new chat units
        database.ref('/chat').on('child_added', (snapshot) => {
            const unitName = snapshot.key;
            console.log(`💬 New chat unit detected: ${unitName}`);
            this.setupUnitChatListener(unitName);
        });

        database.ref('/chat').on('child_removed', (snapshot) => {
            const unitName = snapshot.key;
            this.cleanupUnitChatListener(unitName);
        });

        // Listen for all units to populate chat list
        database.ref('/units').on('value', (snapshot) => {
            const unitsData = snapshot.val();
            if (unitsData) {
                Object.keys(unitsData).forEach(unitName => {
                    if (!this.monitorChatRefs.has(unitName)) {
                        this.setupUnitChatListener(unitName);
                    }
                });
            }
        });

        this.setupChatEventHandlers();
        this.monitorChatInitialized = true;
        
        console.log('💬 Enhanced monitor chat system with smooth animation activated');
        this.logData('Sistem chat monitor dengan animasi smooth diaktifkan', 'system');
    }

    // ✅ IMPROVED UNIT CHAT LISTENER
    setupUnitChatListener(unitName) {
        if (this.monitorChatRefs.has(unitName)) return;
        
        console.log(`💬 Setting up chat listener for unit: ${unitName}`);
        
        const chatRef = database.ref('/chat/' + unitName);
        this.monitorChatRefs.set(unitName, chatRef);
        this.monitorChatMessages.set(unitName, []);
        this.monitorUnreadCounts.set(unitName, 0);
        
        // Clear previous listeners
        chatRef.off();
        
        // Listen for new messages
        chatRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            this.handleMonitorChatMessage(unitName, message);
        });
        
        // Listen for typing indicators
        const typingRef = database.ref('/typing/' + unitName);
        typingRef.on('value', (snapshot) => {
            const typingData = snapshot.val();
            this.handleMonitorTypingIndicator(unitName, typingData);
        });

        this.updateMonitorChatUnitSelect();
        console.log(`💬 Now actively listening to chat for unit: ${unitName}`);
    }

    // ✅ IMPROVED MESSAGE HANDLING
    handleMonitorChatMessage(unitName, message) {
        if (!message || message.type === 'monitor') return;
        
        if (!this.monitorChatMessages.has(unitName)) {
            this.monitorChatMessages.set(unitName, []);
        }
        
        const messages = this.monitorChatMessages.get(unitName);
        
        // Prevent duplicates
        const messageExists = messages.some(msg => 
            msg.id === message.id || 
            (msg.timestamp === message.timestamp && msg.sender === message.sender)
        );
        
        if (messageExists) return;
        
        messages.push(message);
        
        // Update unread count if not viewing this chat
        if (this.activeChatUnit !== unitName) {
            const currentCount = this.monitorUnreadCounts.get(unitName) || 0;
            this.monitorUnreadCounts.set(unitName, currentCount + 1);
        }
        
        this.updateMonitorChatUI();
        this.updateMonitorChatUnitSelect();
        
        // Show notification if not viewing this chat
        if (this.activeChatUnit !== unitName) {
            this.showMonitorChatNotification(unitName, message);
        }
        
        console.log(`💬 New message from ${unitName}:`, message);
    }

    // ✅ ENHANCED TOGGLE CHAT METHOD WITH SMOOTH ANIMATION
    toggleMonitorChat() {
        this.isMonitorChatOpen = !this.isMonitorChatOpen;
        const chatWindow = document.getElementById('monitorChatWindow');
        const chatToggle = document.getElementById('monitorChatToggle');
        
        if (chatWindow) {
            if (this.isMonitorChatOpen) {
                // ✅ BUKA CHAT WINDOW DENGAN ANIMASI SMOOTH
                chatWindow.style.display = 'flex';
                
                // Trigger reflow untuk memastikan animasi berjalan
                void chatWindow.offsetWidth;
                
                // Apply animation
                chatWindow.style.animation = 'slideInUp 0.3s ease-out forwards';
                
                // Update UI components
                this.updateMonitorChatUnitSelect();
                this.updateMonitorChatUI();
                
                // Auto-focus dengan delay untuk smooth experience
                if (this.activeChatUnit) {
                    setTimeout(() => {
                        const chatInput = document.getElementById('monitorChatInput');
                        if (chatInput) {
                            chatInput.focus();
                            chatInput.select();
                        }
                    }, 350);
                }
                
                // Update toggle button state
                if (chatToggle) {
                    chatToggle.innerHTML = '💬 Tutup Chat <span id="monitorUnreadBadge" class="badge bg-danger" style="display: none;"></span>';
                    chatToggle.classList.add('btn-secondary');
                    chatToggle.classList.remove('btn-primary');
                }
                
            } else {
                // ✅ TUTUP CHAT WINDOW DENGAN ANIMASI SMOOTH
                chatWindow.style.animation = 'slideOutDown 0.25s ease-in forwards';
                
                // Stop typing indicator immediately
                this.stopMonitorTyping();
                
                // Update toggle button state
                if (chatToggle) {
                    chatToggle.innerHTML = '💬 Chat dengan Driver <span id="monitorUnreadBadge" class="badge bg-danger" style="display: none;"></span>';
                    chatToggle.classList.add('btn-primary');
                    chatToggle.classList.remove('btn-secondary');
                }
                
                // Hide after animation completes
                setTimeout(() => {
                    if (!this.isMonitorChatOpen) {
                        chatWindow.style.display = 'none';
                        // Reset animation for next open
                        chatWindow.style.animation = '';
                    }
                }, 250);
            }
        }
    }

    // ✅ ENHANCED CHAT WINDOW BEHAVIOR WITH PROPER CLEANUP
    setupChatWindowBehavior() {
        const chatWindow = document.getElementById('monitorChatWindow');
        const chatToggle = document.getElementById('monitorChatToggle');
        
        if (chatWindow && chatToggle) {
            // Store reference to bound functions for cleanup
            this.chatWindowClickHandler = (e) => e.stopPropagation();
            this.documentClickHandler = (e) => {
                if (this.isMonitorChatOpen && 
                    !chatWindow.contains(e.target) && 
                    !chatToggle.contains(e.target)) {
                    this.toggleMonitorChat();
                }
            };
            this.escapeKeyHandler = (e) => {
                if (e.key === 'Escape' && this.isMonitorChatOpen) {
                    this.toggleMonitorChat();
                }
            };
            
            // Add event listeners
            chatWindow.addEventListener('click', this.chatWindowClickHandler);
            document.addEventListener('click', this.documentClickHandler);
            document.addEventListener('keydown', this.escapeKeyHandler);
        }
    }

    // ✅ CLEANUP CHAT EVENT LISTENERS
    cleanupChatEventListeners() {
        const chatWindow = document.getElementById('monitorChatWindow');
        
        if (chatWindow && this.chatWindowClickHandler) {
            chatWindow.removeEventListener('click', this.chatWindowClickHandler);
        }
        
        if (this.documentClickHandler) {
            document.removeEventListener('click', this.documentClickHandler);
        }
        
        if (this.escapeKeyHandler) {
            document.removeEventListener('keydown', this.escapeKeyHandler);
        }
    }

    // ✅ IMPROVED SEND MESSAGE METHOD
    async sendMonitorMessage() {
        const messageInput = document.getElementById('monitorChatInput');
        const messageText = messageInput?.value.trim();
        
        if (!messageText || !this.activeChatUnit || !this.monitorChatRefs.has(this.activeChatUnit)) {
            return;
        }
        
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const messageData = {
            id: messageId,
            text: messageText,
            sender: 'MONITOR',
            unit: this.activeChatUnit,
            timestamp: new Date().toISOString(),
            timeDisplay: new Date().toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            type: 'monitor',
            status: 'sent'
        };
        
        try {
            const chatRef = this.monitorChatRefs.get(this.activeChatUnit);
            await chatRef.push(messageData);
            
            // Add to local messages for instant feedback
            if (!this.monitorChatMessages.has(this.activeChatUnit)) {
                this.monitorChatMessages.set(this.activeChatUnit, []);
            }
            this.monitorChatMessages.get(this.activeChatUnit).push(messageData);
            
            this.updateMonitorChatUI();
            this.logData(`💬 Pesan ke ${this.activeChatUnit}: "${messageText}"`, 'info');
            
            // Clear input
            if (messageInput) messageInput.value = '';
            
            // Stop typing indicator
            this.stopMonitorTyping();
            
        } catch (error) {
            console.error('Failed to send monitor message:', error);
            this.logData('❌ Gagal mengirim pesan ke driver', 'error');
        }
    }

    // ✅ TYPING INDICATOR METHODS FOR MONITOR
    startMonitorTyping() {
        if (!this.activeChatUnit) return;
        
        const typingRef = database.ref('/typing/' + this.activeChatUnit + '/monitor');
        typingRef.set({
            isTyping: true,
            name: 'MONITOR',
            timestamp: Date.now()
        });
        
        this.isMonitorTyping = true;
    }

    stopMonitorTyping() {
        if (!this.activeChatUnit || !this.isMonitorTyping) return;
        
        const typingRef = database.ref('/typing/' + this.activeChatUnit + '/monitor');
        typingRef.set({
            isTyping: false,
            name: 'MONITOR', 
            timestamp: Date.now()
        });
        
        this.isMonitorTyping = false;
    }

    handleMonitorTypingIndicator(unitName, typingData) {
        if (!typingData || unitName !== this.activeChatUnit) return;
        
        const driverTyping = typingData.driver;
        const typingIndicator = document.getElementById('monitorTypingIndicator');
        
        if (typingIndicator && driverTyping && driverTyping.isTyping) {
            typingIndicator.style.display = 'block';
            typingIndicator.innerHTML = `
                <div class="typing-indicator">
                    <span>${driverTyping.name} sedang mengetik</span>
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            `;
        } else if (typingIndicator) {
            typingIndicator.style.display = 'none';
        }
    }

    // ✅ IMPROVED CHAT UI FOR MONITOR
    updateMonitorChatUI() {
        const messageList = document.getElementById('monitorChatMessages');
        const unreadBadge = document.getElementById('monitorUnreadBadge');
        const chatInput = document.getElementById('monitorChatInput');
        const sendBtn = document.getElementById('monitorSendBtn');
        const unitSelect = document.getElementById('monitorChatUnitSelect');
        
        if (!messageList) return;
        
        // Calculate total unread count
        let totalUnread = 0;
        this.monitorUnreadCounts.forEach(count => totalUnread += count);
        
        // Update unread badge
        if (unreadBadge) {
            unreadBadge.textContent = totalUnread > 0 ? totalUnread : '';
            unreadBadge.style.display = totalUnread > 0 ? 'inline' : 'none';
        }
        
        const hasActiveUnit = !!this.activeChatUnit;
        
        // Update input and button states
        if (chatInput) chatInput.disabled = !hasActiveUnit;
        if (sendBtn) sendBtn.disabled = !hasActiveUnit;
        if (unitSelect) unitSelect.value = this.activeChatUnit || '';
        
        // Update placeholder based on active unit
        if (messageList && !hasActiveUnit) {
            messageList.innerHTML = `
                <div class="chat-placeholder text-center text-muted py-4">
                    <small>Pilih unit untuk memulai percakapan...</small>
                </div>
            `;
            return;
        }
        
        // Render messages for active unit
        const activeMessages = this.monitorChatMessages.get(this.activeChatUnit) || [];
        
        if (activeMessages.length === 0) {
            messageList.innerHTML = `
                <div class="chat-placeholder text-center text-muted py-4">
                    <small>Mulai percakapan dengan driver ${this.activeChatUnit}...</small>
                </div>
            `;
            return;
        }
        
        messageList.innerHTML = '';
        
        // Group messages by date
        const groupedMessages = this.groupMonitorMessagesByDate(activeMessages);
        
        Object.keys(groupedMessages).forEach(date => {
            // Add date separator
            if (Object.keys(groupedMessages).length > 1) {
                const dateElement = document.createElement('div');
                dateElement.className = 'chat-date-separator';
                dateElement.innerHTML = `<span>${date}</span>`;
                messageList.appendChild(dateElement);
            }
            
            // Add messages for this date
            groupedMessages[date].forEach(message => {
                const messageElement = this.createMonitorMessageElement(message);
                messageList.appendChild(messageElement);
            });
        });
        
        // Add typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'monitorTypingIndicator';
        typingIndicator.style.display = 'none';
        messageList.appendChild(typingIndicator);
        
        // Auto scroll to bottom with smooth behavior
        setTimeout(() => {
            messageList.scrollTo({
                top: messageList.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

    // ✅ GROUP MESSAGES FOR MONITOR
    groupMonitorMessagesByDate(messages) {
        const grouped = {};
        
        messages.forEach(message => {
            const messageDate = new Date(message.timestamp);
            const dateKey = messageDate.toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            
            grouped[dateKey].push(message);
        });
        
        // Sort messages within each date
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });
        
        return grouped;
    }

    // ✅ CREATE MESSAGE ELEMENT FOR MONITOR
    createMonitorMessageElement(message) {
        const messageElement = document.createElement('div');
        const isMonitorMessage = message.type === 'monitor';
        
        messageElement.className = `chat-message ${isMonitorMessage ? 'message-sent' : 'message-received'}`;
        
        messageElement.innerHTML = `
            <div class="message-content">
                ${!isMonitorMessage ? 
                    `<div class="message-sender">${this.escapeHtml(message.sender)} (${message.unit})</div>` : ''}
                <div class="message-text">${this.escapeHtml(message.text)}</div>
                <div class="message-footer">
                    <span class="message-time">${message.timeDisplay}</span>
                    ${isMonitorMessage ? 
                        `<span class="message-status">✓</span>` : ''}
                </div>
            </div>
        `;
        
        return messageElement;
    }

    // ✅ IMPROVED CHAT EVENT HANDLERS
    setupChatEventHandlers() {
        const chatInput = document.getElementById('monitorChatInput');
        const unitSelect = document.getElementById('monitorChatUnitSelect');
        
        let typingTimer;
        
        // Chat input handlers
        if (chatInput) {
            chatInput.addEventListener('input', () => {
                if (!this.activeChatUnit) return;
                
                this.startMonitorTyping();
                
                clearTimeout(typingTimer);
                typingTimer = setTimeout(() => {
                    this.stopMonitorTyping();
                }, 2000);
            });
            
            chatInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    this.sendMonitorMessage();
                }
            });
            
            chatInput.addEventListener('blur', () => {
                this.stopMonitorTyping();
            });
        }
        
        // Unit select handler
        if (unitSelect) {
            unitSelect.addEventListener('change', (e) => {
                this.selectChatUnit(e.target.value);
            });
        }
    }

    // ✅ IMPROVED UNIT SELECTION
    selectChatUnit(unitName) {
        if (unitName === this.activeChatUnit) return;
        
        // Stop typing for previous unit
        this.stopMonitorTyping();
        
        this.activeChatUnit = unitName;
        
        // Clear unread count for selected unit
        if (unitName && this.monitorUnreadCounts.has(unitName)) {
            this.monitorUnreadCounts.set(unitName, 0);
        }
        
        this.updateMonitorChatUI();
        this.updateMonitorChatUnitSelect();
        
        // Focus on input dengan smooth transition
        const chatInput = document.getElementById('monitorChatInput');
        if (chatInput) {
            setTimeout(() => {
                chatInput.focus();
                chatInput.select();
            }, 150);
        }
        
        console.log(`💬 Now chatting with unit: ${unitName}`);
        this.logData(`Memulai chat dengan unit ${unitName}`, 'info');
    }

    // ✅ IMPROVED UNIT SELECT UPDATE
    updateMonitorChatUnitSelect() {
        const unitSelect = document.getElementById('monitorChatUnitSelect');
        if (!unitSelect) return;
        
        const currentValue = unitSelect.value;
        
        unitSelect.innerHTML = '<option value="">Pilih Unit...</option>';
        
        // Add all units that have chat capability
        const allUnits = new Set([
            ...this.monitorChatRefs.keys(),
            ...Array.from(this.units.keys())
        ]);
        
        allUnits.forEach(unitName => {
            const unreadCount = this.monitorUnreadCounts.get(unitName) || 0;
            const option = document.createElement('option');
            option.value = unitName;
            option.textContent = unreadCount > 0 ? 
                `${unitName} 💬 (${unreadCount} baru)` : unitName;
            unitSelect.appendChild(option);
        });
        
        // Restore selection if still valid
        if (currentValue && allUnits.has(currentValue)) {
            unitSelect.value = currentValue;
        } else if (this.activeChatUnit && allUnits.has(this.activeChatUnit)) {
            unitSelect.value = this.activeChatUnit;
        }
    }

    // ✅ HANDLE CHAT INPUT
    handleMonitorChatInput(event) {
        if (event.key === 'Enter') {
            this.sendMonitorMessage();
        }
    }

    // ✅ SHOW CHAT NOTIFICATION
    showMonitorChatNotification(unitName, message) {
        const notification = document.createElement('div');
        notification.className = 'chat-notification alert alert-warning';
        notification.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>💬 Pesan Baru dari ${unitName}</strong>
                    <div class="small">${message.sender}: ${message.text}</div>
                </div>
                <button type="button" class="btn-close btn-sm" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 80px;
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

    // ✅ CLEANUP UNIT CHAT LISTENER
    cleanupUnitChatListener(unitName) {
        if (this.monitorChatRefs.has(unitName)) {
            const chatRef = this.monitorChatRefs.get(unitName);
            chatRef.off();
            
            this.monitorChatRefs.delete(unitName);
            this.monitorChatMessages.delete(unitName);
            this.monitorUnreadCounts.delete(unitName);
            
            this.updateMonitorChatUnitSelect();
            
            if (this.activeChatUnit === unitName) {
                this.activeChatUnit = null;
                this.updateMonitorChatUI();
            }
            
            console.log(`💬 Stopped listening to chat for unit: ${unitName}`);
        }
    }

    // ✅ ESCAPE HTML FOR SECURITY
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== EXISTING GPS TRACKING METHODS =====
    validateUnitData(unitName, unitData) {
        if (!unitData) return false;
        if (unitData.lat === undefined || unitData.lng === undefined) return false;
        
        const lat = parseFloat(unitData.lat);
        const lng = parseFloat(unitData.lng);
        return !isNaN(lat) && !isNaN(lng);
    }

    correctUnitData(unitName, unitData) {
        console.log(`🛠️ Correcting invalid data for ${unitName}`);
        // Implementation for data correction
    }

    createNewUnit(unitName, firebaseData) {
        if (!this.validateUnitData(unitName, firebaseData)) return null;

        return {
            id: this.getUnitId(unitName),
            name: unitName,
            afdeling: this.determineAfdeling(unitName),
            status: this.determineStatus(firebaseData.journeyStatus),
            latitude: parseFloat(firebaseData.lat),
            longitude: parseFloat(firebaseData.lng),
            speed: parseFloat(firebaseData.speed) || 0,
            lastUpdate: firebaseData.lastUpdate || new Date().toLocaleTimeString('id-ID'),
            distance: parseFloat(firebaseData.distance) || 0,
            fuelLevel: this.computeFuelLevel(100, firebaseData.distance, firebaseData.journeyStatus),
            fuelUsed: this.computeFuelUsage(firebaseData.distance, firebaseData.journeyStatus),
            driver: firebaseData.driver || 'Unknown',
            accuracy: parseFloat(firebaseData.accuracy) || 0,
            batteryLevel: firebaseData.batteryLevel || null,
            lastLat: parseFloat(firebaseData.lat),
            lastLng: parseFloat(firebaseData.lng),
            isOnline: true,
            sessionId: firebaseData.sessionId,
            lastFuelUpdate: Date.now()
        };
    }

    getUnitId(unitName) {
        const unitIdMap = {
            'DT-06': 1, 'DT-07': 2, 'DT-12': 3, 'DT-13': 4, 'DT-15': 5, 'DT-16': 6,
            'DT-17': 7, 'DT-18': 8, 'DT-23': 9, 'DT-24': 10, 'DT-25': 11, 'DT-26': 12,
            'DT-27': 13, 'DT-28': 14, 'DT-29': 15, 'DT-32': 16, 'DT-33': 17, 'DT-34': 18,
            'DT-35': 19, 'DT-36': 20, 'DT-37': 21, 'DT-38': 22, 'DT-39': 23
        };
        return unitIdMap[unitName] || Date.now();
    }

    determineAfdeling(unitName) {
        const afdelingMap = {
            'DT-06': 'AFD I', 'DT-07': 'AFD I', 'DT-12': 'AFD II', 'DT-13': 'AFD II',
            'DT-15': 'AFD III', 'DT-16': 'AFD III', 'DT-17': 'AFD IV', 'DT-18': 'AFD IV',
            'DT-23': 'AFD V', 'DT-24': 'AFD V', 'DT-25': 'KKPA', 'DT-26': 'KKPA',
            'DT-27': 'KKPA', 'DT-28': 'AFD II', 'DT-29': 'AFD III', 'DT-32': 'AFD I',
            'DT-33': 'AFD IV', 'DT-34': 'AFD V', 'DT-35': 'KKPA', 'DT-36': 'AFD II',
            'DT-37': 'AFD III', 'DT-38': 'AFD I', 'DT-39': 'AFD IV'
        };
        return afdelingMap[unitName] || 'AFD I';
    }

    determineStatus(journeyStatus) {
        const statusMap = {
            'started': 'moving',
            'moving': 'moving', 
            'active': 'active',
            'paused': 'active',
            'ended': 'inactive',
            'ready': 'inactive'
        };
        return statusMap[journeyStatus] || 'active';
    }

    refreshUnitData(unit, firebaseData) {
        const now = Date.now();
        
        unit.latitude = firebaseData.lat || unit.latitude;
        unit.longitude = firebaseData.lng || unit.longitude;
        unit.speed = firebaseData.speed || unit.speed;
        unit.status = this.determineStatus(firebaseData.journeyStatus) || unit.status;
        unit.lastUpdate = firebaseData.lastUpdate || unit.lastUpdate;
        unit.driver = firebaseData.driver || unit.driver;
        unit.accuracy = firebaseData.accuracy || unit.accuracy;
        unit.batteryLevel = firebaseData.batteryLevel || unit.batteryLevel;
        unit.fuelLevel = this.computeFuelLevel(100, unit.distance, unit.status);
        unit.lastLat = firebaseData.lat;
        unit.lastLng = firebaseData.lng;
        unit.isOnline = true;
        unit.lastFuelUpdate = now;

        this.addHistoryPoint(unit);
    }

    // ===== STATISTICS METHODS =====
    updateStatistics() {
        let activeUnits = 0;
        let totalDistance = 0;
        let totalSpeed = 0;
        let totalFuel = 0;
        let unitCount = 0;

        this.units.forEach(unit => {
            if (unit.isOnline) {
                unitCount++;
                if (unit.status === 'active' || unit.status === 'moving') {
                    activeUnits++;
                }
                totalDistance += unit.distance || 0;
                totalSpeed += unit.speed || 0;
                totalFuel += unit.fuelUsed || 0;
            }
        });

        const avgSpeed = unitCount > 0 ? totalSpeed / unitCount : 0;

        this.activeUnits = activeUnits;
        this.totalDistance = totalDistance;
        this.avgSpeed = avgSpeed;
        this.totalFuelConsumption = totalFuel;

        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        updateElement('activeUnits', `${activeUnits}/${this.units.size}`);
        updateElement('totalDistance', `${totalDistance.toFixed(1)} km`);
        updateElement('avgSpeed', `${avgSpeed.toFixed(1)} km/h`);
        updateElement('totalFuel', `${totalFuel.toFixed(1)} L`);
        
        const activeDetail = document.getElementById('activeUnitsDetail');
        if (activeDetail) {
            activeDetail.textContent = `${unitCount} units terdeteksi`;
        }

        const distanceDetail = document.getElementById('distanceDetail');
        if (distanceDetail) {
            distanceDetail.textContent = `${this.units.size} units`;
        }

        const dataCount = document.getElementById('dataCount');
        if (dataCount) {
            dataCount.textContent = this.unitHistory.size;
        }
    }

    // ===== MAP METHODS =====
    setupMap() {
        try {
            console.log('🗺️ Initializing map...');
            
            // Pastikan container map ada dan visible
            const mapContainer = document.getElementById('map');
            if (!mapContainer) {
                throw new Error('Map container not found');
            }

            // Force container dimensions
            mapContainer.style.height = '500px';
            mapContainer.style.width = '100%';
            mapContainer.style.minHeight = '500px';
            
            // Beri waktu untuk render CSS
            setTimeout(() => {
                try {
                    this.map = L.map('map').setView(this.config.center, this.config.zoom);
                    console.log('✅ Map instance created');

                    const googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                        attribution: '© Google Satellite',
                        maxZoom: 22,
                        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
                    });

                    googleSatellite.addTo(this.map);
                    console.log('✅ Tile layer added');

                    // Add controls
                    L.control.scale({ imperial: false }).addTo(this.map);
                    L.control.zoom({ position: 'topright' }).addTo(this.map);
                    console.log('✅ Map controls added');

                    this.addLocationMarkers();
                    console.log('✅ Location markers added');

                    // Test map interaction
                    this.map.whenReady(() => {
                        console.log('🎉 Map fully loaded and ready');
                        this.logData('Peta berhasil dimuat', 'success');
                    });

                } catch (mapError) {
                    console.error('❌ Map initialization error:', mapError);
                    this.showMapError();
                }
            }, 100);

        } catch (error) {
            console.error('Map setup failed:', error);
            this.showMapError();
            throw new Error('Gagal menyiapkan peta: ' + error.message);
        }
    }

    // Tambahkan method untuk error handling
    showMapError() {
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div class="alert alert-danger text-center m-3">
                    <h5>❌ Gagal Memuat Peta</h5>
                    <p>Terjadi kesalahan saat memuat peta. Periksa:</p>
                    <ul class="text-start">
                        <li>Koneksi internet</li>
                        <li>Browser support</li>
                        <li>Console untuk error details</li>
                    </ul>
                    <button class="btn btn-warning btn-sm" onclick="window.gpsSystem.setupMap()">
                        🔄 Coba Lagi
                    </button>
                </div>
            `;
        }
    }

    addLocationMarkers() {
        try {
            this.importantMarkers.forEach(marker => {
                if (marker && this.map) {
                    this.map.removeLayer(marker);
                }
            });
            this.importantMarkers = [];

            const pksIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-icon pks" title="PKS SAGM">🏭</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const pksMarker = L.marker([this.importantLocations.PKS_SAGM.lat, this.importantLocations.PKS_SAGM.lng], { icon: pksIcon })
                .bindPopup(this.createLocationInfo('PKS SAGM', 'pks'))
                .addTo(this.map);

            const officeIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-icon office" title="Kantor Kebun">🏢</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const officeMarker = L.marker([this.importantLocations.KANTOR_KEBUN.lat, this.importantLocations.KANTOR_KEBUN.lng], { icon: officeIcon })
                .bindPopup(this.createLocationInfo('Kantor Kebun PT SAGM', 'office'))
                .addTo(this.map);

            this.importantMarkers.push(pksMarker, officeMarker);
            console.log('✅ Location markers added');

        } catch (error) {
            console.error('Failed to add location markers:', error);
        }
    }

    createLocationInfo(name, type) {
        return `
            <div class="unit-popup">
                <div class="popup-header">
                    <h6 class="mb-0">${type === 'pks' ? '🏭' : '🏢'} ${name}</h6>
                </div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Tipe:</span>
                        <span class="info-value">${type === 'pks' ? 'Pabrik Kelapa Sawit' : 'Kantor Operasional'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status:</span>
                        <span class="info-value">Operasional</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Lokasi:</span>
                        <span class="info-value">Kebun Tempuling</span>
                    </div>
                </div>
            </div>
        `;
    }

    // ===== ROUTE HISTORY METHODS =====
    initializeUnitHistory(unit) {
        if (!this.unitHistory.has(unit.name)) {
            this.unitHistory.set(unit.name, []);
        }
        this.addHistoryPoint(unit);
    }

    addHistoryPoint(unit) {
        if (!this.unitHistory.has(unit.name)) {
            this.unitHistory.set(unit.name, []);
        }

        const history = this.unitHistory.get(unit.name);
        const timestamp = new Date().toISOString();

        const point = {
            timestamp: timestamp,
            latitude: unit.latitude,
            longitude: unit.longitude,
            speed: unit.speed,
            distance: unit.distance,
            status: unit.status,
            fuelLevel: unit.fuelLevel
        };

        history.push(point);

        if (history.length > this.maxRoutePoints) {
            this.unitHistory.set(unit.name, history.slice(-this.maxRoutePoints));
        }

        this.updateUnitRoute(unit);
    }

    updateUnitRoute(unit) {
        const history = this.unitHistory.get(unit.name);
        if (!history || history.length < 1) return;

        const routePoints = history.map(point => [
            point.latitude, point.longitude
        ]);

        const routeColor = this.getRouteColor(unit.name);

        if (this.unitPolylines.has(unit.name)) {
            try {
                this.unitPolylines.get(unit.name).setLatLngs(routePoints);
            } catch (error) {
                this.map.removeLayer(this.unitPolylines.get(unit.name));
                this.unitPolylines.delete(unit.name);
                this.createRoutePolyline(unit, routePoints, routeColor);
            }
        } else {
            this.createRoutePolyline(unit, routePoints, routeColor);
        }
    }

    createRoutePolyline(unit, routePoints, routeColor) {
        try {
            const style = this.getRouteStyle(unit.status, routeColor);
            this.unitPolylines.set(unit.name, L.polyline(routePoints, style));
            
            if (this.showRoutes) {
                this.unitPolylines.get(unit.name).addTo(this.map);
            }

        } catch (error) {
            this.logData(`Failed to create route for ${unit.name}`, 'error', {
                unit: unit.name,
                error: error.message
            });
        }
    }

    getRouteStyle(status, color) {
        const baseStyle = {
            color: color,
            weight: 5,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round',
            className: 'route-line smooth-route',
            smoothFactor: 1.0
        };

        switch(status) {
            case 'moving':
                return { ...baseStyle, opacity: 0.9, weight: 6, dashArray: null };
            case 'active':
                return { ...baseStyle, opacity: 0.7, weight: 5, dashArray: '8, 12' };
            case 'inactive':
                return { ...baseStyle, opacity: 0.4, weight: 4, dashArray: '4, 8' };
            default:
                return baseStyle;
        }
    }

    getRouteColor(unitName) {
        if (!this.routeColors.has(unitName)) {
            const colors = [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
                '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
                '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
                '#F9E79F', '#ABEBC6', '#E8DAEF', '#FAD7A0', '#AED6F1',
                '#A3E4D7', '#F5B7B1', '#D2B4DE', '#FDEBD0', '#A9DFBF'
            ];
            this.routeColors.set(unitName, colors[this.routeColors.size % colors.length]);
        }
        return this.routeColors.get(unitName);
    }

    // ===== DISPLAY METHODS =====
    scheduleRender() {
        const now = Date.now();
        if (now - this.lastRenderTime < this.renderThrottleMs) {
            return;
        }
        
        this.lastRenderTime = now;
        this.refreshDisplay();
    }

    refreshDisplay() {
        this.cleanupOrphanedMarkers();
        this.updateStatistics();
        this.renderUnitList();
        this.updateMapMarkers();
    }

    renderUnitList() {
        const unitList = document.getElementById('unitList');
        if (!unitList) return;

        if (this.units.size === 0) {
            unitList.innerHTML = `
                <div class="text-center text-muted py-4">
                    <div class="mb-2">📭</div>
                    <small>Tidak ada unit aktif</small>
                    <br>
                    <small class="text-muted">Menunggu koneksi dari driver...</small>
                </div>
            `;
            return;
        }

        unitList.innerHTML = '';
        this.units.forEach(unit => {
            const unitElement = document.createElement('div');
            unitElement.className = `unit-item ${unit.status}`;
            unitElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${unit.name} ${unit.isOnline ? '🟢' : '🔴'}</h6>
                        <small class="text-muted">${unit.afdeling} - ${unit.driver || 'No Driver'}</small>
                    </div>
                    <span class="badge ${unit.status === 'active' ? 'bg-success' : unit.status === 'moving' ? 'bg-warning' : 'bg-danger'}">
                        ${unit.status === 'active' ? 'Aktif' : unit.status === 'moving' ? 'Berjalan' : 'Non-Aktif'}
                    </span>
                </div>
                <div class="mt-2">
                    <small class="text-muted">
                        Kecepatan: ${unit.speed} km/h<br>
                        Jarak: ${unit.distance.toFixed(2)} km<br>
                        Bahan Bakar: ${unit.fuelLevel}%<br>
                        Update: ${unit.lastUpdate}
                    </small>
                </div>
            `;
            unitList.appendChild(unitElement);
        });
    }

    updateMapMarkers() {
        this.markers.forEach((marker, unitName) => {
            if (!this.units.has(unitName)) {
                if (marker && this.map) {
                    this.map.removeLayer(marker);
                }
                this.markers.delete(unitName);
            }
        });

        this.units.forEach((unit, unitName) => {
            if (!this.markers.has(unitName)) {
                this.createUnitMarker(unit);
            } else {
                this.refreshUnitMarker(unit);
            }
        });
    }

    createUnitMarker(unit) {
        const markerIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-icon ${unit.status} ${unit.isOnline ? '' : 'offline'}" 
                     title="${unit.name} ${unit.isOnline ? '' : '(OFFLINE)'}">🚛</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const marker = L.marker([unit.latitude, unit.longitude], { icon: markerIcon })
            .bindPopup(this.createUnitPopup(unit))
            .addTo(this.map);
        
        this.markers.set(unit.name, marker);
    }

    refreshUnitMarker(unit) {
        const marker = this.markers.get(unit.name);
        if (marker) {
            marker.setLatLng([unit.latitude, unit.longitude]);
            marker.setPopupContent(this.createUnitPopup(unit));
            
            const markerIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-icon ${unit.status} ${unit.isOnline ? '' : 'offline'}" 
                         title="${unit.name} ${unit.isOnline ? '' : '(OFFLINE)'}">🚛</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });
            marker.setIcon(markerIcon);
        }
    }

    createUnitPopup(unit) {
        const routePoints = this.unitHistory.get(unit.name)?.length || 0;
        const routeInfo = routePoints > 0 ? `
            <div class="info-item">
                <span class="info-label">Points Rute:</span>
                <span class="info-value">${routePoints}</span>
            </div>
        ` : '<div class="info-item"><span class="info-value text-muted">Belum ada data rute</span></div>';

        const onlineStatus = unit.isOnline ? 
            '<span class="badge bg-success">ONLINE</span>' : 
            '<span class="badge bg-danger">OFFLINE</span>';

        return `
            <div class="unit-popup">
                <div class="popup-header">
                    <h6 class="mb-0">🚛 ${unit.name} ${onlineStatus}</h6>
                </div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Driver:</span>
                        <span class="info-value">${unit.driver || 'Tidak diketahui'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Afdeling:</span>
                        <span class="info-value">${unit.afdeling}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status:</span>
                        <span class="info-value ${unit.status === 'moving' ? 'text-warning' : unit.status === 'active' ? 'text-success' : 'text-danger'}">
                            ${unit.status === 'moving' ? 'Dalam Perjalanan' : unit.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Kecepatan:</span>
                        <span class="info-value">${unit.speed.toFixed(1)} km/h</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Jarak Tempuh:</span>
                        <span class="info-value">${unit.distance.toFixed(2)} km</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Bahan Bakar:</span>
                        <span class="info-value">${unit.fuelLevel.toFixed(1)}%</span>
                    </div>
                    ${routeInfo}
                </div>
            </div>
        `;
    }

    // ===== DATA LOGGER METHODS =====
    setupDataLogger() {
        this.loadLogs();
        this.renderLogger();
        this.startAutoExport();
        
        this.logData('Enhanced GPS Monitoring System with Smooth Animation Chat initialized', 'system', {
            timestamp: new Date().toISOString(),
            version: '4.0'
        });
    }

    logData(message, level = 'info', metadata = {}) {
        const logEntry = {
            id: 'LOG_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            timeDisplay: new Date().toLocaleTimeString('id-ID'),
            dateDisplay: new Date().toLocaleDateString('id-ID'),
            level: level,
            message: message,
            metadata: metadata
        };

        this.dataLogger.logs.unshift(logEntry);

        if (this.dataLogger.logs.length > this.dataLogger.maxLogs) {
            this.dataLogger.logs = this.dataLogger.logs.slice(0, this.dataLogger.maxLogs);
        }

        this.saveLogs();
        this.renderLogger();
        
        console.log(`[${level.toUpperCase()}] ${message}`, metadata);
    }

    loadLogs() {
        try {
            const savedLogs = localStorage.getItem('sagm_data_logs');
            if (savedLogs) {
                this.dataLogger.logs = JSON.parse(savedLogs);
            }
        } catch (error) {
            console.error('Failed to load logs:', error);
            this.dataLogger.logs = [];
        }
    }

    saveLogs() {
        try {
            localStorage.setItem('sagm_data_logs', JSON.stringify(this.dataLogger.logs));
        } catch (error) {
            console.error('Failed to save logs:', error);
        }
    }

    renderLogger() {
        const container = document.getElementById('dataLoggerContainer');
        if (!container) return;

        let html = `
            <div class="card">
                <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">📊 Data Logger System</h6>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-light" onclick="window.gpsSystem.clearAllLogs()">
                            🗑️ Clear
                        </button>
                        <button class="btn btn-outline-light" onclick="window.gpsSystem.exportLogData()">
                            📥 Export
                        </button>
                    </div>
                </div>
                <div class="card-body p-0">
                    <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                        <table class="table table-sm table-striped mb-0">
                            <thead class="table-light sticky-top">
                                <tr>
                                    <th width="120">Waktu</th>
                                    <th width="80">Level</th>
                                    <th>Pesan</th>
                                    <th width="100">Unit</th>
                                </tr>
                            </thead>
                            <tbody>
        `;

        if (this.dataLogger.logs.length === 0) {
            html += `
                <tr>
                    <td colspan="4" class="text-center text-muted py-3">
                        Tidak ada data log
                    </td>
                </tr>
            `;
        } else {
            this.dataLogger.logs.forEach(log => {
                const levelBadge = this.getLogLevelBadge(log.level);
                const unitInfo = log.metadata.unit ? `<span class="badge bg-primary">${log.metadata.unit}</span>` : '';
                
                html += `
                    <tr class="log-entry log-${log.level}">
                        <td><small>${log.timeDisplay}</small></td>
                        <td>${levelBadge}</td>
                        <td>
                            <div class="log-message">${log.message}</div>
                            ${log.metadata.details ? `<small class="text-muted">${log.metadata.details}</small>` : ''}
                        </td>
                        <td>${unitInfo}</td>
                    </tr>
                `;
            });
        }

        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    getLogLevelBadge(level) {
        const badges = {
            'info': '<span class="badge bg-info">INFO</span>',
            'success': '<span class="badge bg-success">SUCCESS</span>',
            'warning': '<span class="badge bg-warning">WARNING</span>',
            'error': '<span class="badge bg-danger">ERROR</span>',
            'gps': '<span class="badge bg-primary">GPS</span>',
            'system': '<span class="badge bg-secondary">SYSTEM</span>'
        };
        return badges[level] || '<span class="badge bg-dark">UNKNOWN</span>';
    }

    clearAllLogs() {
        if (confirm('Yakin ingin menghapus semua logs?')) {
            this.dataLogger.logs = [];
            this.saveLogs();
            this.renderLogger();
            this.logData('All logs cleared', 'system');
        }
    }

    exportLogData() {
        const exportData = {
            exportedAt: new Date().toISOString(),
            totalLogs: this.dataLogger.logs.length,
            system: 'SAGM GPS Tracking System',
            logs: this.dataLogger.logs
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sagm-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.logData('Logs exported successfully', 'success', {
            file: link.download,
            totalLogs: this.dataLogger.logs.length
        });
    }

    // ===== CLEANUP METHODS =====
    gradualCleanupInactiveUnits(activeUnits) {
        const now = Date.now();
        const inactiveThreshold = 30000;
        const removalThreshold = 60000;

        this.units.forEach((unit, unitName) => {
            if (!activeUnits.has(unitName)) {
                const currentCount = this.inactiveUnitTracker.get(unitName) || 0;
                this.inactiveUnitTracker.set(unitName, currentCount + 1);
                
                const timeSinceLastUpdate = now - (this.lastDataTimestamps.get(unitName) || 0);
                
                if (timeSinceLastUpdate > inactiveThreshold && unit.isOnline) {
                    unit.isOnline = false;
                    this.logData(`Unit marked offline: ${unitName}`, 'warning', {
                        unit: unitName,
                        lastUpdate: timeSinceLastUpdate
                    });
                    
                    // ✅ ENHANCED: Track offline unit
                    this.offlineManager.trackOfflineUnit(unitName, unit);
                }
                
                if (timeSinceLastUpdate > removalThreshold) {
                    this.logData(`Removing inactive unit: ${unitName}`, 'info', {
                        unit: unitName,
                        inactiveTime: timeSinceLastUpdate
                    });
                    this.removeUnitCompletely(unitName);
                }
            } else {
                this.inactiveUnitTracker.set(unitName, 0);
            }
        });
    }

    forceCleanupInactiveUnits() {
        console.log('🧹 FORCE CLEANUP: Removing all inactive units');
        
        const now = Date.now();
        const unitsToRemove = [];
        
        this.units.forEach((unit, unitName) => {
            const timeSinceLastUpdate = now - (this.lastDataTimestamps.get(unitName) || 0);
            
            if (timeSinceLastUpdate > 15000) {
                unitsToRemove.push(unitName);
            }
        });

        unitsToRemove.forEach(unitName => {
            this.logData(`Force removing: ${unitName}`, 'warning', {
                unit: unitName,
                inactiveTime: now - (this.lastDataTimestamps.get(unitName) || 0)
            });
            this.removeUnitCompletely(unitName);
        });

        this.scheduleRender();
    }

    removeUnitCompletely(unitName) {
        console.log(`🗑️ Removing unit completely: ${unitName}`);
        
        this.units.delete(unitName);
        
        const marker = this.markers.get(unitName);
        if (marker && this.map) {
            this.map.removeLayer(marker);
            this.markers.delete(unitName);
        }
        
        const polyline = this.unitPolylines.get(unitName);
        if (polyline && this.map) {
            this.map.removeLayer(polyline);
            this.unitPolylines.delete(unitName);
        }
        
        this.driverOnlineStatus.delete(unitName);
        this.lastDataTimestamps.delete(unitName);
        this.unitSessions.delete(unitName);
        this.inactiveUnitTracker.delete(unitName);
        this.unitHistory.delete(unitName);
        this.routeColors.delete(unitName);
        
        // Cleanup chat for this unit
        this.cleanupUnitChatListener(unitName);
        
        // ✅ ENHANCED: Remove from offline tracking
        this.offlineManager.unitBackOnline(unitName);
        
        this.scheduleRender();
    }

    forceCleanupAllData() {
        console.log('🧹 FORCE CLEANUP ALL: Removing ALL units and data');
        
        const unitsToRemove = Array.from(this.units.keys());
        
        unitsToRemove.forEach(unitName => {
            this.logData(`Force removing ALL: ${unitName}`, 'warning');
            this.removeUnitCompletely(unitName);
        });

        this.scheduleRender();
    }

    cleanupOrphanedMarkers() {
        this.markers.forEach((marker, unitName) => {
            if (!this.units.has(unitName)) {
                console.log(`🧹 Removing orphaned marker: ${unitName}`);
                if (marker && this.map) {
                    this.map.removeLayer(marker);
                }
                this.markers.delete(unitName);
            }
        });
    }

    cleanupFirebaseListeners() {
        this.firebaseListeners.forEach((listener, key) => {
            try {
                if (key === 'connection') {
                    database.ref('.info/connected').off('value', listener);
                } else if (key === 'units') {
                    database.ref('/units').off('value', listener);
                } else if (key === 'removal') {
                    database.ref('/units').off('child_removed', listener);
                }
            } catch (error) {
                console.warn(`Error cleaning up listener ${key}:`, error);
            }
        });
        this.firebaseListeners.clear();
    }

    // ===== EVENT HANDLERS =====
    setupEventHandlers() {
        const searchInput = document.getElementById('searchUnit');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.applyFilters());
        }

        const filters = ['filterAfdeling', 'filterStatus', 'filterFuel'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.applyFilters());
            }
        });

        database.ref('.info/connected').on('value', (snapshot) => {
            this.updateConnectionStatus(snapshot.val());
        });
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('firebaseStatus');
        if (statusElement) {
            if (connected) {
                statusElement.innerHTML = '🟢 TERHUBUNG KE FIREBASE';
                statusElement.className = 'text-success';
            } else {
                statusElement.innerHTML = '🔴 FIREBASE OFFLINE';
                statusElement.className = 'text-danger';
            }
        }
    }

    applyFilters() {
        const searchTerm = document.getElementById('searchUnit')?.value.toLowerCase() || '';
        const afdelingFilter = document.getElementById('filterAfdeling')?.value || '';
        const statusFilter = document.getElementById('filterStatus')?.value || '';
        const fuelFilter = document.getElementById('filterFuel')?.value || '';

        console.log('Applying filters:', { searchTerm, afdelingFilter, statusFilter, fuelFilter });
    }

    // ===== UTILITY METHODS =====
    computeFuelConsumption(distance, status) {
        let rate;
        switch(status) {
            case 'moving': rate = this.vehicleConfig.movingFuelConsumption; break;
            case 'active': rate = this.vehicleConfig.baseFuelConsumption; break;
            default: rate = this.vehicleConfig.baseFuelConsumption * 0.5;
        }
        return distance * rate;
    }

    computeFuelUsage(distance, status) {
        if (!distance) return 0;
        
        let rate;
        switch(status) {
            case 'moving': rate = this.vehicleConfig.movingFuelConsumption; break;
            case 'active': rate = this.vehicleConfig.baseFuelConsumption; break;
            default: rate = this.vehicleConfig.baseFuelConsumption * 0.5;
        }
        return distance * rate;
    }

    computeFuelLevel(initialFuel, distance, status) {
        if (!distance) return initialFuel;
        
        const fuelUsed = this.computeFuelUsage(distance, status);
        const fuelRemaining = Math.max(0, initialFuel - fuelUsed);
        const fuelPercentage = (fuelRemaining / this.vehicleConfig.fuelTankCapacity) * 100;
        
        return Math.max(5, Math.min(100, fuelPercentage));
    }

    computeDistance(lat1, lon1, lat2, lon2) {
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

    // ===== PERIODIC TASKS =====
    startPeriodicTasks() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();

        const cleanupInterval = setInterval(() => {
            this.forceCleanupInactiveUnits();
            this.cleanupOrphanedMarkers();
            this.lastCleanupTime = new Date();
        }, 30000);
        this.intervals.add(cleanupInterval);

        const healthInterval = setInterval(() => {
            this.logData('System health check', 'info', {
                activeUnits: this.units.size,
                markers: this.markers.size,
                polylines: this.unitPolylines.size,
                chatUnits: this.monitorChatRefs.size
            });
        }, 60000);
        this.intervals.add(healthInterval);

        const statusInterval = setInterval(() => {
            const now = Date.now();
            this.lastDataTimestamps.forEach((lastUpdate, unitName) => {
                const timeDiff = now - lastUpdate;
                if (timeDiff > 15000) {
                    this.markUnitOffline(unitName);
                }
            });
        }, 5000);
        this.intervals.add(statusInterval);
    }

    markUnitOffline(unitName) {
        const unit = this.units.get(unitName);
        if (unit) {
            this.logData(`Unit marked offline: ${unitName}`, 'warning', {
                unit: unitName,
                driver: unit.driver,
                lastLocation: { lat: unit.latitude, lng: unit.longitude }
            });
            
            this.removeUnitCompletely(unitName);
        }
    }

    handleDataRemoval(unitName) {
        this.logData(`Data removed for unit: ${unitName}`, 'info', {
            unit: unitName,
            action: 'logout'
        });
        
        this.removeUnitCompletely(unitName);
    }

    markAllUnitsOffline() {
        this.units.forEach(unit => {
            unit.isOnline = false;
        });
        this.scheduleRender();
    }

    // ===== SYSTEM METHODS =====
    refreshData() {
        console.log('🔄 Manual refresh with cleanup');
        this.logData('Manual refresh initiated', 'info');
        this.forceCleanupInactiveUnits();
        this.loadInitialData();
    }

    async loadInitialData() {
        this.showLoadingIndicator(true);
        
        try {
            const snapshot = await database.ref('/units').once('value');
            const firebaseData = snapshot.val();
            
            this.clearAllData();
            
            if (firebaseData && Object.keys(firebaseData).length > 0) {
                let loadedCount = 0;
                
                Object.entries(firebaseData).forEach(([unitName, unitData]) => {
                    if (this.validateUnitData(unitName, unitData)) {
                        const unit = this.createNewUnit(unitName, unitData);
                        if (unit) {
                            this.units.set(unitName, unit);
                            loadedCount++;
                            
                            // Setup chat for this unit
                            if (!this.monitorChatRefs.has(unitName)) {
                                this.setupUnitChatListener(unitName);
                            }
                        }
                    }
                });
                
                this.logData('Initial data loaded successfully', 'success', {
                    units: loadedCount,
                    total: Object.keys(firebaseData).length
                });
            } else {
                this.logData('No initial data found', 'warning');
            }
            
            this.scheduleRender();
            
        } catch (error) {
            console.error('Failed to load initial data:', error);
            this.logData('Failed to load initial data', 'error', { error: error.message });
        } finally {
            this.showLoadingIndicator(false);
        }
    }

    clearAllData() {
        console.log('🧹 Clearing ALL system data...');
        
        this.units.clear();
        this.markers.clear();
        this.unitPolylines.clear();
        this.unitHistory.clear();
        this.unitSessions.clear();
        this.driverOnlineStatus.clear();
        this.lastDataTimestamps.clear();
        this.inactiveUnitTracker.clear();
        this.routeColors.clear();
        
        // Cleanup all chat listeners
        this.monitorChatRefs.forEach((ref, unitName) => {
            ref.off();
        });
        this.monitorChatRefs.clear();
        this.monitorChatMessages.clear();
        this.monitorUnreadCounts.clear();
        
        this.importantMarkers = [];
        this.dataLogger.logs = [];
        
        this.activeUnits = 0;
        this.totalDistance = 0;
        this.avgSpeed = 0;
        this.totalFuelConsumption = 0;
        
        this.activeChatUnit = null;
        this.isMonitorChatOpen = false;
        
        console.log('✅ All data cleared');
    }

    showLoadingIndicator(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'block' : 'none';
        }
    }

    displayError(message) {
        this.logData(message, 'error');
        
        const notification = document.createElement('div');
        notification.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    testFirebaseConnection() {
        console.log('🔍 Testing Firebase connection...');
        
        database.ref('.info/connected').once('value')
            .then((snapshot) => {
                const connected = snapshot.val();
                console.log('📡 Firebase Connected:', connected);
                alert(`Firebase Connection: ${connected ? 'CONNECTED ✅' : 'DISCONNECTED ❌'}`);
            })
            .catch((error) => {
                console.error('❌ Firebase connection test failed:', error);
                alert('Firebase Connection Test: FAILED ❌');
            });
    }

    showDebugPanel() {
        const debugHtml = `
            <div class="debug-panel card position-fixed" style="bottom: 10px; right: 10px; width: 400px; z-index: 9999;">
                <div class="card-header bg-dark text-white d-flex justify-content-between">
                    <span>🐛 Debug Panel</span>
                    <button class="btn btn-sm btn-outline-light" onclick="this.closest('.debug-panel').remove()">×</button>
                </div>
                <div class="card-body p-2">
                    <div class="mb-2">
                        <strong>Firebase Status:</strong> 
                        <span id="debugFirebaseStatus">Checking...</span>
                    </div>
                    <div class="mb-2">
                        <strong>Units Loaded:</strong> 
                        <span id="debugUnitsCount">${this.units.size}</span>
                    </div>
                    <div class="mb-2">
                        <strong>Chat Units:</strong> 
                        <span id="debugChatUnits">${this.monitorChatRefs.size}</span>
                    </div>
                    <div class="mb-2">
                        <strong>Offline Units:</strong> 
                        <span id="debugOfflineUnits">${this.offlineManager.offlineUnits.size}</span>
                    </div>
                    <div class="mb-2">
                        <strong>Last Update:</strong> 
                        <span id="debugLastUpdate">${new Date().toLocaleTimeString()}</span>
                    </div>
                    <button class="btn btn-sm btn-warning w-100" onclick="window.gpsSystem.testFirebaseConnection()">
                        Test Connection
                    </button>
                    <button class="btn btn-sm btn-danger w-100 mt-1" onclick="forceCleanup()">
                        🧹 Force Cleanup
                    </button>
                    <button class="btn btn-sm btn-info w-100 mt-1" onclick="window.gpsSystem.enableSmoothTracking()">
                        🚀 Smooth Tracking
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', debugHtml);
        
        setInterval(() => {
            const statusElement = document.getElementById('debugFirebaseStatus');
            const unitsElement = document.getElementById('debugUnitsCount');
            const chatUnitsElement = document.getElementById('debugChatUnits');
            const offlineUnitsElement = document.getElementById('debugOfflineUnits');
            const updateElement = document.getElementById('debugLastUpdate');
            
            if (statusElement) {
                database.ref('.info/connected').once('value').then((snapshot) => {
                    statusElement.textContent = snapshot.val() ? '🟢 CONNECTED' : '🔴 DISCONNECTED';
                    statusElement.className = snapshot.val() ? 'text-success' : 'text-danger';
                });
            }
            
            if (unitsElement) {
                unitsElement.textContent = this.units.size;
            }
            
            if (chatUnitsElement) {
                chatUnitsElement.textContent = this.monitorChatRefs.size;
            }
            
            if (offlineUnitsElement) {
                offlineUnitsElement.textContent = this.offlineManager.offlineUnits.size;
            }
            
            if (updateElement) {
                updateElement.textContent = new Date().toLocaleTimeString();
            }
        }, 2000);
    }

    downloadRouteData() {
        const exportData = {
            timestamp: new Date().toISOString(),
            totalUnits: this.units.size,
            routes: {}
        };

        this.units.forEach((unit, unitName) => {
            exportData.routes[unitName] = {
                driver: unit.driver,
                totalDistance: unit.distance,
                routePoints: this.unitHistory.get(unitName)?.length || 0,
                history: this.unitHistory.get(unitName) || []
            };
        });

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `routes-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.logData('Route data exported', 'success');
    }

    // ===== ENHANCED CLEANUP WITH CHAT SUPPORT =====
    cleanup() {
        console.log('🧹 Comprehensive system cleanup with chat support...');
        
        // Cleanup chat event listeners
        this.cleanupChatEventListeners();
        
        // Cleanup Firebase listeners
        this.cleanupFirebaseListeners();
        
        // Cleanup intervals
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();
        
        // Cleanup debounce
        if (this.updateDebounce) {
            clearTimeout(this.updateDebounce);
        }
        
        // Cleanup all chat Firebase listeners
        this.monitorChatRefs.forEach(ref => ref.off());
        this.monitorChatRefs.clear();
        
        database.ref('/chat').off('child_added');
        database.ref('/chat').off('child_removed');
        
        // Clear all data
        this.clearAllData();
        
        // Cleanup map
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        
        // Cleanup data logger
        if (this.dataLogger.exportInterval) {
            clearInterval(this.dataLogger.exportInterval);
        }
        
        console.log('✅ System cleanup with chat support completed');
    }
}

// ===== GLOBAL INITIALIZATION AND MANAGEMENT =====
let globalInitializer;

// Global functions
function refreshData() {
    if (window.gpsSystem) {
        window.gpsSystem.refreshData();
    }
}

function forceCleanup() {
    if (window.gpsSystem) {
        window.gpsSystem.forceCleanupAllData();
        alert('Force cleanup executed! All sticky data removed.');
    }
}

function exportData() {
    if (window.gpsSystem) {
        window.gpsSystem.downloadRouteData();
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('show');
    }
}

// ✅ ENHANCED CHAT GLOBAL FUNCTIONS
function toggleMonitorChat() {
    if (window.gpsSystem) {
        window.gpsSystem.toggleMonitorChat();
    }
}

function handleMonitorChatInput(event) {
    if (window.gpsSystem) {
        window.gpsSystem.handleMonitorChatInput(event);
    }
}

function sendMonitorMessage() {
    if (window.gpsSystem) {
        window.gpsSystem.sendMonitorMessage();
    }
}

function selectChatUnit(unitName) {
    if (window.gpsSystem) {
        window.gpsSystem.selectChatUnit(unitName);
    }
}

// ✅ ENHANCED: Event listener dengan global initializer
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 DOM Content Loaded - Starting Enhanced GPS System...');
    
    // Cleanup existing instances
    if (window.gpsSystem) {
        window.gpsSystem.cleanup();
        window.gpsSystem = null;
    }
    
    if (window.globalInitializer) {
        window.globalInitializer.cleanup();
        window.globalInitializer = null;
    }
    
    // Initialize dengan enhanced error handling
    try {
        globalInitializer = new GlobalGPSInitializer();
        window.globalInitializer = globalInitializer;
        
        const success = await globalInitializer.initializeSystem();
        
        if (success) {
            console.log('🎉 Enhanced GPS System started successfully!');
        } else {
            console.error('❌ Enhanced GPS System failed to start');
        }
    } catch (error) {
        console.error('💥 Critical system initialization error:', error);
        alert('Sistem gagal dimulai. Silakan refresh halaman.');
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.globalInitializer) {
        window.globalInitializer.cleanup();
    }
    
    if (window.gpsSystem) {
        window.gpsSystem.cleanup();
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        // Page became visible, check system status
        if (window.globalInitializer && !window.globalInitializer.initializationState.isInitialized) {
            console.log('🔄 Page visible, reinitializing system...');
            window.globalInitializer.initializeSystem();
        }
    }
});
