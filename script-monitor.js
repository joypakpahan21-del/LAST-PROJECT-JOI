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

// OPTIMIZED SAGM GPS TRACKING SYSTEM WITH ENHANCED CLEANUP
class OptimizedSAGMGpsTracking {
    constructor() {
        console.log('🚀 Initializing Optimized GPS Tracking System...');
        
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
        
        // ⚡ PERFORMANCE OPTIMIZATION
        this.updateDebounce = null;
        this.lastRenderTime = 0;
        this.renderThrottleMs = 500;
        
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
        
        // Chat System - Optimized
        this.monitorChatRefs = new Map();
        this.monitorChatMessages = new Map();
        this.monitorUnreadCounts = new Map();
        this.activeChatUnit = null;
        this.isMonitorChatOpen = false;
        this.monitorChatInitialized = false;
        
        // Route visualization
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

        this.initializeSystem();
    }

    // ===== INITIALIZATION METHODS =====
    initializeSystem() {
        try {
            console.log('🚀 Starting Optimized GPS Tracking System...');
            this.setupMap();
            this.setupEventHandlers();
            this.connectToFirebase();
            this.startPeriodicTasks();
            this.setupDataLogger();
            this.testFirebaseConnection();
            
            this.setupMonitorChatSystem();
            
            setTimeout(() => this.showDebugPanel(), 2000);
            
        } catch (error) {
            console.error('System initialization failed:', error);
            this.displayError('Gagal memulai sistem GPS');
        }
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

    debouncedProcessRealTimeData(data) {
        if (this.updateDebounce) {
            clearTimeout(this.updateDebounce);
        }
        this.updateDebounce = setTimeout(() => {
            this.processRealTimeData(data);
        }, 300);
    }

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
                return;
            }

            activeUnits.add(unitName);
            this.lastDataTimestamps.set(unitName, currentTime);
            this.driverOnlineStatus.set(unitName, true);

            const existingUnit = this.units.get(unitName);
            
            if (existingUnit) {
                this.refreshUnitData(existingUnit, unitData);
            } else {
                const newUnit = this.createNewUnit(unitName, unitData);
                if (newUnit) {
                    this.units.set(unitName, newUnit);
                    this.unitSessions.set(unitName, {
                        sessionId: unitData.sessionId,
                        startTime: currentTime,
                        lastActivity: currentTime
                    });
                }
            }
        });

        this.gradualCleanupInactiveUnits(activeUnits);
        this.scheduleRender();
    }

    validateUnitData(unitName, unitData) {
        if (!unitData) {
            console.warn(`❌ Invalid unit data for ${unitName}: null data`);
            return false;
        }

        if (unitData.lat === undefined || unitData.lng === undefined) {
            console.warn(`❌ Invalid coordinates for ${unitName}:`, unitData);
            return false;
        }

        if (isNaN(parseFloat(unitData.lat)) || isNaN(parseFloat(unitData.lng))) {
            console.warn(`❌ Invalid numeric coordinates for ${unitName}:`, unitData);
            return false;
        }

        const lat = parseFloat(unitData.lat);
        const lng = parseFloat(unitData.lng);
        
        if (lat < -1 || lat > 1 || lng < 102.5 || lng > 103.5) {
            console.warn(`❌ Suspicious coordinates for ${unitName}: ${lat}, ${lng}`);
            return false;
        }

        return true;
    }

    // ===== ENHANCED CLEANUP SYSTEM =====
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
        
        this.scheduleRender();
    }

    markAllUnitsOffline() {
        this.units.forEach(unit => {
            unit.isOnline = false;
        });
        this.scheduleRender();
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

    // ===== ENHANCED PERIODIC TASKS =====
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
                memory: this.getMemoryUsage()
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

    // ===== ENHANCED CLEANUP METHOD =====
    cleanup() {
        console.log('🧹 Comprehensive system cleanup...');
        
        this.cleanupFirebaseListeners();
        
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();
        
        if (this.updateDebounce) {
            clearTimeout(this.updateDebounce);
        }
        
        database.ref('/chat').off('child_added');
        database.ref('/chat').off('child_removed');
        this.monitorChatRefs.forEach(ref => ref.off());
        this.monitorChatRefs.clear();
        
        this.clearAllData();
        
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        
        if (this.dataLogger.exportInterval) {
            clearInterval(this.dataLogger.exportInterval);
        }
        
        console.log('✅ System cleanup completed');
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
        this.monitorChatRefs.clear();
        this.monitorChatMessages.clear();
        this.monitorUnreadCounts.clear();
        
        this.importantMarkers = [];
        this.dataLogger.logs = [];
        
        this.activeUnits = 0;
        this.totalDistance = 0;
        this.avgSpeed = 0;
        this.totalFuelConsumption = 0;
        
        console.log('✅ All data cleared');
    }

    // ===== UNIT MANAGEMENT METHODS =====
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

    createNewUnit(unitName, firebaseData) {
        if (!this.validateUnitData(unitName, firebaseData)) {
            return null;
        }

        const initialFuel = 100;
        
        const unit = {
            id: this.getUnitId(unitName),
            name: unitName,
            afdeling: this.determineAfdeling(unitName),
            status: this.determineStatus(firebaseData.journeyStatus),
            latitude: parseFloat(firebaseData.lat),
            longitude: parseFloat(firebaseData.lng),
            speed: parseFloat(firebaseData.speed) || 0,
            lastUpdate: firebaseData.lastUpdate || new Date().toLocaleTimeString('id-ID'),
            distance: parseFloat(firebaseData.distance) || 0,
            fuelLevel: this.computeFuelLevel(initialFuel, firebaseData.distance, firebaseData.journeyStatus),
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

        this.initializeUnitHistory(unit);
        return unit;
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
        const timeDiff = (now - unit.lastFuelUpdate) / 1000 / 60;
        
        if (unit.lastLat && unit.lastLng && firebaseData.lat && firebaseData.lng) {
            const distance = this.computeDistance(
                unit.lastLat, unit.lastLng, 
                firebaseData.lat, firebaseData.lng
            );
            
            if (distance > 0.01) {
                unit.distance += distance;
                unit.fuelUsed += this.computeFuelConsumption(distance, unit.status);
            }
        }

        if (unit.status === 'active' && timeDiff > 1) {
            const idleConsumption = timeDiff * this.vehicleConfig.idleFuelConsumptionPerMin;
            unit.fuelUsed += idleConsumption;
        }

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

    // ===== MAP METHODS =====
    setupMap() {
        try {
            this.map = L.map('map').setView(this.config.center, this.config.zoom);

            const googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                attribution: '© Google Satellite',
                maxZoom: 22,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
            });

            const googleHybrid = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
                attribution: '© Google Hybrid',
                maxZoom: 22,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
            });

            const openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap',
                maxZoom: 20
            });

            googleSatellite.addTo(this.map);

            const baseMaps = {
                "🛰️ Google Satellite": googleSatellite,
                "🛰️ Google Hybrid": googleHybrid,
                "🗺️ OpenStreetMap": openStreetMap
            };

            L.control.layers(baseMaps).addTo(this.map);
            L.control.scale({ imperial: false }).addTo(this.map);
            L.control.zoom({ position: 'topright' }).addTo(this.map);

            this.addLocationMarkers();
            this.addRouteControls();

        } catch (error) {
            console.error('Map setup failed:', error);
            throw new Error('Gagal menyiapkan peta');
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
        const pksDetails = `
            <div class="info-item">
                <span class="info-label">Kapasitas:</span>
                <span class="info-value">45 Ton TBS/Jam</span>
            </div>
        `;

        const officeDetails = `
            <div class="info-item">
                <span class="info-label">Jam Operasi:</span>
                <span class="info-value">07:00 - 16:00</span>
            </div>
        `;

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
                    ${type === 'pks' ? pksDetails : officeDetails}
                </div>
            </div>
        `;
    }

    addRouteControls() {
        const routeControl = L.control({ position: 'topright' });
        
        routeControl.onAdd = (map) => {
            const div = L.DomUtil.create('div', 'route-controls');
            div.innerHTML = `
                <div class="btn-group-vertical">
                    <button class="btn btn-sm btn-success" onclick="window.gpsSystem.toggleRouteDisplay()" 
                            title="${this.showRoutes ? 'Sembunyikan Rute' : 'Tampilkan Rute'}">
                        ${this.showRoutes ? '🗺️' : '🚫'} Rute
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="window.gpsSystem.removeAllRoutes()" 
                            title="Hapus Semua Rute">
                        🗑️ Hapus
                    </button>
                    <button class="btn btn-sm btn-info" onclick="window.gpsSystem.downloadRouteData()" 
                            title="Export Data Rute">
                        📊 Export
                    </button>
                </div>
            `;
            return div;
        };
        
        routeControl.addTo(this.map);
        this.routeControls = routeControl;
    }

    // ===== ROUTE VISUALIZATION METHODS =====
    createRoutePolyline(unit, routePoints, routeColor) {
        try {
            const style = this.getRouteStyle(unit.status, routeColor);
            this.unitPolylines.set(unit.name, L.polyline(routePoints, style));
            
            if (this.showRoutes) {
                this.unitPolylines.get(unit.name).addTo(this.map);
            }

            this.unitPolylines.get(unit.name).bindPopup(this.createRoutePopup(unit));
            this.unitPolylines.get(unit.name).on('click', () => {
                this.centerOnUnit(unit);
            });

            this.logData(`Route polyline created for ${unit.name}`, 'system', {
                unit: unit.name,
                points: routePoints.length
            });
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
            weight: 4,
            opacity: 0.7,
            lineCap: 'round',
            className: 'route-line'
        };

        switch(status) {
            case 'moving':
                return { ...baseStyle, opacity: 0.9, weight: 5, dashArray: null };
            case 'active':
                return { ...baseStyle, opacity: 0.7, weight: 4, dashArray: '5, 10' };
            case 'inactive':
                return { ...baseStyle, opacity: 0.4, weight: 3, dashArray: '2, 8' };
            default:
                return baseStyle;
        }
    }

    createRoutePopup(unit) {
        const routePoints = this.unitHistory.get(unit.name)?.length || 0;
        const totalDistance = unit.distance.toFixed(2);
        const fuelUsed = unit.fuelUsed.toFixed(2);
        const routeColor = this.getRouteColor(unit.name);

        return `
            <div class="route-popup">
                <div class="popup-header">
                    <h6 class="mb-0">🗺️ Rute ${unit.name}</h6>
                </div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Driver:</span>
                        <span class="info-value">${unit.driver || 'Tidak diketahui'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Total Jarak:</span>
                        <span class="info-value">${totalDistance} km</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Bahan Bakar Digunakan:</span>
                        <span class="info-value">${fuelUsed} L</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Points Rute:</span>
                        <span class="info-value">${routePoints}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Warna Rute:</span>
                        <span class="info-value">
                            <span style="color: ${routeColor}">■</span> ${routeColor}
                        </span>
                    </div>
                </div>
            </div>
        `;
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
        this.saveHistory();
    }

    updateUnitRoute(unit) {
        const history = this.unitHistory.get(unit.name);
        if (!history || history.length < 1) {
            return;
        }

        const routePoints = history.map(point => [
            point.latitude, point.longitude
        ]);

        const routeColor = this.getRouteColor(unit.name);

        if (this.unitPolylines.has(unit.name)) {
            try {
                this.unitPolylines.get(unit.name).setLatLngs(routePoints);
                const style = this.getRouteStyle(unit.status, routeColor);
                this.unitPolylines.get(unit.name).setStyle(style);
            } catch (error) {
                this.map.removeLayer(this.unitPolylines.get(unit.name));
                this.unitPolylines.delete(unit.name);
                this.createRoutePolyline(unit, routePoints, routeColor);
            }
        } else {
            this.createRoutePolyline(unit, routePoints, routeColor);
        }
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

    updateStatistics() {
        let activeUnits = 0;
        let totalDistance = 0;
        let totalSpeed = 0;
        let totalFuel = 0;

        this.units.forEach(unit => {
            if (unit.status === 'active' || unit.status === 'moving') {
                activeUnits++;
            }
            totalDistance += unit.distance;
            totalSpeed += unit.speed;
            totalFuel += unit.fuelUsed;
        });

        const avgSpeed = this.units.size > 0 ? totalSpeed / this.units.size : 0;

        this.activeUnits = activeUnits;
        this.totalDistance = totalDistance;
        this.avgSpeed = avgSpeed;
        this.totalFuelConsumption = totalFuel;

        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        updateElement('activeUnits', `${activeUnits}/23`);
        updateElement('totalDistance', `${totalDistance.toFixed(1)} km`);
        updateElement('avgSpeed', `${avgSpeed.toFixed(1)} km/h`);
        updateElement('totalFuel', `${totalFuel.toFixed(1)} L`);

        const fuelEfficiency = totalDistance > 0 ? totalDistance / totalFuel : 0;
        updateElement('fuelEfficiency', `${fuelEfficiency.toFixed(1)} km/L`);
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
            <div class="info-item">
                <span class="info-label">Warna Rute:</span>
                <span class="info-value" style="color: ${this.getRouteColor(unit.name)}">■ ${this.getRouteColor(unit.name)}</span>
            </div>
            <div class="text-center mt-2">
                <button class="btn btn-sm btn-outline-primary w-100" 
                        onclick="window.gpsSystem.centerOnUnit('${unit.name}')">
                    🔍 Fokus & Lihat Rute
                </button>
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

    // ===== DATA MANAGEMENT =====
    loadHistoryData() {
        try {
            const savedHistory = localStorage.getItem('sagm_unit_history');
            if (savedHistory) {
                const historyData = JSON.parse(savedHistory);
                this.unitHistory = new Map(Object.entries(historyData));
                this.logData('Route history loaded', 'system', {
                    units: this.unitHistory.size
                });
            }
        } catch (error) {
            console.error('Failed to load history:', error);
            this.unitHistory = new Map();
        }
    }

    saveHistory() {
        try {
            const historyObj = Object.fromEntries(this.unitHistory);
            localStorage.setItem('sagm_unit_history', JSON.stringify(historyObj));
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    }

    // ===== DATA LOGGER METHODS =====
    setupDataLogger() {
        this.loadLogs();
        this.renderLogger();
        this.startAutoExport();
        
        this.logData('Optimized GPS Monitoring System initialized', 'system', {
            timestamp: new Date().toISOString(),
            version: '3.0'
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
                        <button class="btn btn-outline-light" onclick="window.gpsSystem.toggleAutoExport()">
                            ${this.dataLogger.autoExport ? '⏹️ Auto Export' : '▶️ Auto Export'}
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
                                    <th width="80">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
        `;

        if (this.dataLogger.logs.length === 0) {
            html += `
                <tr>
                    <td colspan="5" class="text-center text-muted py-3">
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
                        <td>
                            <button class="btn btn-sm btn-outline-secondary" onclick="window.gpsSystem.showLogDetails('${log.id}')">
                                👁️
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        html += `
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="card-footer bg-light">
                    <div class="row text-center">
                        <div class="col-3">
                            <small class="text-muted d-block">Total Logs</small>
                            <strong>${this.dataLogger.logs.length}</strong>
                        </div>
                        <div class="col-3">
                            <small class="text-muted d-block">Info</small>
                            <span class="badge bg-info">${this.getLogCount('info')}</span>
                        </div>
                        <div class="col-3">
                            <small class="text-muted d-block">Warning</small>
                            <span class="badge bg-warning">${this.getLogCount('warning')}</span>
                        </div>
                        <div class="col-3">
                            <small class="text-muted d-block">Error</small>
                            <span class="badge bg-danger">${this.getLogCount('error')}</span>
                        </div>
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

    getLogCount(level) {
        return this.dataLogger.logs.filter(log => log.level === level).length;
    }

    showLogDetails(logId) {
        const log = this.dataLogger.logs.find(l => l.id === logId);
        if (!log) return;

        const details = JSON.stringify(log.metadata, null, 2);
        const modalHtml = `
            <div class="modal fade" id="logDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Log Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-3">
                                <div class="col-6">
                                    <strong>Waktu:</strong> ${log.timeDisplay}
                                </div>
                                <div class="col-6">
                                    <strong>Level:</strong> ${this.getLogLevelBadge(log.level)}
                                </div>
                            </div>
                            <div class="mb-3">
                                <strong>Pesan:</strong><br>
                                ${log.message}
                            </div>
                            <div>
                                <strong>Metadata:</strong>
                                <pre class="bg-light p-3 mt-2" style="font-size: 12px; max-height: 300px; overflow-y: auto;">${details}</pre>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const existingModal = document.getElementById('logDetailsModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('logDetailsModal'));
        modal.show();
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

    startAutoExport() {
        if (this.dataLogger.exportInterval) {
            clearInterval(this.dataLogger.exportInterval);
        }

        this.dataLogger.exportInterval = setInterval(() => {
            if (this.dataLogger.autoExport && this.dataLogger.logs.length > 0) {
                this.exportLogData();
            }
        }, 300000);
    }

    toggleAutoExport() {
        this.dataLogger.autoExport = !this.dataLogger.autoExport;
        this.renderLogger();
        this.logData(
            this.dataLogger.autoExport ? 'Auto export enabled' : 'Auto export disabled',
            'system'
        );
    }

    // ===== CHAT SYSTEM METHODS =====
    setupMonitorChatSystem() {
        console.log('💬 Initializing monitor chat system...');
        
        database.ref('/chat').on('child_added', (snapshot) => {
            const unitName = snapshot.key;
            console.log(`💬 New chat unit detected: ${unitName}`);
            this.setupUnitChatListener(unitName);
        });

        database.ref('/chat').on('child_removed', (snapshot) => {
            const unitName = snapshot.key;
            this.cleanupUnitChatListener(unitName);
        });

        this.monitorChatInitialized = true;
        console.log('💬 Monitor chat system activated');
        this.logData('Sistem chat monitor aktif - bisa komunikasi dengan semua driver', 'system');
    }

    setupUnitChatListener(unitName) {
        if (this.monitorChatRefs.has(unitName)) return;
        
        const chatRef = database.ref('/chat/' + unitName);
        this.monitorChatRefs.set(unitName, chatRef);
        this.monitorChatMessages.set(unitName, []);
        this.monitorUnreadCounts.set(unitName, 0);
        
        chatRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            this.handleMonitorChatMessage(unitName, message);
        });

        this.updateMonitorChatUnitSelect();
        
        console.log(`💬 Now listening to chat for unit: ${unitName}`);
    }

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

    handleMonitorChatMessage(unitName, message) {
        if (!this.monitorChatMessages.has(unitName)) {
            this.monitorChatMessages.set(unitName, []);
        }
        
        const messages = this.monitorChatMessages.get(unitName);
        
        const messageExists = messages.some(msg => 
            msg.timestamp === message.timestamp && msg.sender === message.sender
        );
        
        if (!messageExists) {
            messages.push(message);
            
            if (message.type !== 'monitor' && this.activeChatUnit !== unitName) {
                const currentCount = this.monitorUnreadCounts.get(unitName) || 0;
                this.monitorUnreadCounts.set(unitName, currentCount + 1);
            }
            
            this.updateMonitorChatUI();
            
            if (this.activeChatUnit !== unitName && message.type !== 'monitor') {
                this.showMonitorChatNotification(unitName, message);
            }
            
            console.log(`💬 New message from ${unitName}:`, message);
        }
    }

    async sendMonitorMessage() {
        const messageText = document.getElementById('monitorChatInput')?.value.trim();
        if (!messageText || !this.activeChatUnit || !this.monitorChatRefs.has(this.activeChatUnit)) return;
        
        const messageData = {
            text: messageText,
            sender: 'MONITOR',
            unit: this.activeChatUnit,
            timestamp: new Date().toISOString(),
            timeDisplay: new Date().toLocaleTimeString('id-ID'),
            type: 'monitor'
        };
        
        try {
            const chatRef = this.monitorChatRefs.get(this.activeChatUnit);
            await chatRef.push(messageData);
            this.logData(`💬 Pesan ke ${this.activeChatUnit}: "${messageText}"`, 'info');
            
            const chatInput = document.getElementById('monitorChatInput');
            if (chatInput) chatInput.value = '';
            
        } catch (error) {
            console.error('Failed to send monitor message:', error);
            this.logData('❌ Gagal mengirim pesan ke driver', 'error');
        }
    }

    updateMonitorChatUI() {
        const messageList = document.getElementById('monitorChatMessages');
        const unreadBadge = document.getElementById('monitorUnreadBadge');
        const chatInput = document.getElementById('monitorChatInput');
        const sendBtn = document.getElementById('monitorSendBtn');
        
        if (!messageList) return;
        
        let totalUnread = 0;
        this.monitorUnreadCounts.forEach(count => totalUnread += count);
        
        if (unreadBadge) {
            unreadBadge.textContent = totalUnread > 0 ? totalUnread : '';
            unreadBadge.style.display = totalUnread > 0 ? 'block' : 'none';
        }
        
        const hasActiveUnit = !!this.activeChatUnit;
        if (chatInput) chatInput.disabled = !hasActiveUnit;
        if (sendBtn) sendBtn.disabled = !hasActiveUnit;
        
        messageList.innerHTML = '';
        
        if (!this.activeChatUnit) {
            messageList.innerHTML = `
                <div class="chat-placeholder text-center text-muted py-4">
                    <small>Pilih unit untuk memulai percakapan...</small>
                </div>
            `;
            return;
        }
        
        const activeMessages = this.monitorChatMessages.get(this.activeChatUnit) || [];
        
        if (activeMessages.length === 0) {
            messageList.innerHTML = `
                <div class="chat-placeholder text-center text-muted py-4">
                    <small>Mulai percakapan dengan driver ${this.activeChatUnit}...</small>
                </div>
            `;
            return;
        }
        
        activeMessages.forEach(message => {
            const messageElement = document.createElement('div');
            const isMonitorMessage = message.type === 'monitor';
            messageElement.className = `chat-message ${isMonitorMessage ? 'message-sent' : 'message-received'}`;
            
            messageElement.innerHTML = `
                <div class="message-content">
                    ${!isMonitorMessage ? 
                      `<div class="message-sender">${this.escapeHtml(message.sender)} (${message.unit})</div>` : ''}
                    <div class="message-text">${this.escapeHtml(message.text)}</div>
                    <div class="message-time">${message.timeDisplay}</div>
                </div>
            `;
            
            messageList.appendChild(messageElement);
        });
        
        messageList.scrollTop = messageList.scrollHeight;
    }

    setupChatEventHandlers() {
        const unitSelect = document.getElementById('monitorChatUnitSelect');
        if (unitSelect) {
            unitSelect.addEventListener('change', (e) => {
                this.selectChatUnit(e.target.value);
            });
        }
    }

    updateMonitorChatUnitSelect() {
        const unitSelect = document.getElementById('monitorChatUnitSelect');
        if (!unitSelect) return;
        
        const currentValue = unitSelect.value;
        
        unitSelect.innerHTML = '<option value="">Pilih Unit...</option>';
        
        this.monitorChatRefs.forEach((ref, unitName) => {
            const unreadCount = this.monitorUnreadCounts.get(unitName) || 0;
            const option = document.createElement('option');
            option.value = unitName;
            option.textContent = unreadCount > 0 ? 
                `${unitName} (${unreadCount} pesan baru)` : unitName;
            unitSelect.appendChild(option);
        });
        
        if (currentValue && this.monitorChatRefs.has(currentValue)) {
            unitSelect.value = currentValue;
        }
        
        this.setupChatEventHandlers();
    }

    selectChatUnit(unitName) {
        this.activeChatUnit = unitName;
        
        if (unitName && this.monitorUnreadCounts.has(unitName)) {
            this.monitorUnreadCounts.set(unitName, 0);
        }
        
        this.updateMonitorChatUI();
        this.updateMonitorChatUnitSelect();
        
        console.log(`💬 Now chatting with unit: ${unitName}`);
    }

    toggleMonitorChat() {
        this.isMonitorChatOpen = !this.isMonitorChatOpen;
        const chatWindow = document.getElementById('monitorChatWindow');
        
        if (chatWindow) {
            chatWindow.style.display = this.isMonitorChatOpen ? 'block' : 'none';
            
            if (this.isMonitorChatOpen) {
                this.updateMonitorChatUnitSelect();
                this.updateMonitorChatUI();
            }
        }
    }

    handleMonitorChatInput(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.sendMonitorMessage();
        }
    }

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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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

    centerOnUnit(unitOrName) {
        let unit;
        if (typeof unitOrName === 'string') {
            unit = this.units.get(unitOrName);
        } else {
            unit = unitOrName;
        }

        if (unit && this.map) {
            this.map.setView([unit.latitude, unit.longitude], 15);
            const marker = this.markers.get(unit.name);
            if (marker) {
                marker.openPopup();
            }
            this.logData(`Map centered on ${unit.name}`, 'info', {
                unit: unit.name,
                location: { lat: unit.latitude, lng: unit.longitude }
            });
        }
    }

    toggleRouteDisplay() {
        this.showRoutes = !this.showRoutes;
        
        this.unitPolylines.forEach((polyline, unitName) => {
            if (this.showRoutes) {
                this.map.addLayer(polyline);
            } else {
                this.map.removeLayer(polyline);
            }
        });

        this.logData(
            this.showRoutes ? 'Routes displayed' : 'Routes hidden',
            'system'
        );
    }

    removeAllRoutes() {
        this.unitPolylines.forEach((polyline, unitName) => {
            this.map.removeLayer(polyline);
        });
        this.unitPolylines.clear();
        this.unitHistory.clear();
        this.saveHistory();
        this.logData('All routes removed', 'system');
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
                        <strong>Last Update:</strong> 
                        <span id="debugLastUpdate">${new Date().toLocaleTimeString()}</span>
                    </div>
                    <button class="btn btn-sm btn-warning w-100" onclick="window.gpsSystem.testFirebaseConnection()">
                        Test Connection
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', debugHtml);
        
        setInterval(() => {
            const statusElement = document.getElementById('debugFirebaseStatus');
            const unitsElement = document.getElementById('debugUnitsCount');
            const updateElement = document.getElementById('debugLastUpdate');
            
            if (statusElement) {
                database.ref('.info/connected').on('value', (snapshot) => {
                    statusElement.textContent = snapshot.val() ? '🟢 CONNECTED' : '🔴 DISCONNECTED';
                    statusElement.className = snapshot.val() ? 'text-success' : 'text-danger';
                });
            }
            
            if (unitsElement) {
                unitsElement.textContent = this.units.size;
            }
            
            if (updateElement) {
                updateElement.textContent = new Date().toLocaleTimeString();
            }
        }, 2000);
    }

    testFirebaseConnection() {
        console.log('🔍 Testing Firebase connection...');
        
        database.ref('.info/connected').on('value', (snapshot) => {
            const connected = snapshot.val();
            console.log('📡 Firebase Connected:', connected);
        });

        database.ref('/units').once('value')
            .then((snapshot) => {
                const data = snapshot.val();
                console.log('📊 Raw Firebase Data:', data);
                
                if (data) {
                    console.log('✅ Data found, units:', Object.keys(data));
                } else {
                    console.log('❌ No data found in /units path');
                }
            })
            .catch((error) => {
                console.error('❌ Firebase read error:', error);
            });
    }

    // ===== FUEL CALCULATION METHODS =====
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

    getMemoryUsage() {
        if (performance.memory) {
            const memory = performance.memory;
            return {
                used: Math.round(memory.usedJSHeapSize / 1048576),
                total: Math.round(memory.totalJSHeapSize / 1048576),
                limit: Math.round(memory.jsHeapSizeLimit / 1048576)
            };
        }
        return { used: 'N/A', total: 'N/A', limit: 'N/A' };
    }

    refreshData() {
        console.log('🔄 Manual refresh with cleanup');
        this.logData('Manual refresh initiated', 'info');
        this.forceCleanupInactiveUnits();
        this.loadInitialData();
    }
}

// Initialize the system
let gpsSystem;

// Enhanced global refresh function
function refreshData() {
    if (window.gpsSystem) {
        console.log('🔄 MANUAL REFRESH WITH CLEANUP');
        window.gpsSystem.refreshData();
        
        const refreshBtn = document.getElementById('refreshBtn');
        const refreshIcon = document.getElementById('refreshIcon');
        
        if (refreshBtn && refreshIcon) {
            refreshBtn.disabled = true;
            refreshIcon.innerHTML = '⏳';
            
            setTimeout(() => {
                refreshBtn.disabled = false;
                refreshIcon.innerHTML = '🔄';
            }, 3000);
        }
    }
}

// Manual cleanup function
function forceCleanup() {
    if (window.gpsSystem) {
        window.gpsSystem.forceCleanupInactiveUnits();
        alert('Force cleanup executed!');
    }
}

// Add cleanup button untuk debugging
function addCleanupButton() {
    const existingBtn = document.querySelector('.cleanup-debug-btn');
    if (existingBtn) existingBtn.remove();

    const cleanupBtn = document.createElement('button');
    cleanupBtn.className = 'btn btn-sm btn-danger position-fixed cleanup-debug-btn';
    cleanupBtn.style.cssText = 'bottom: 20px; right: 20px; z-index: 1000;';
    cleanupBtn.innerHTML = '🧹 Force Cleanup';
    cleanupBtn.onclick = forceCleanup;
    document.body.appendChild(cleanupBtn);
}

// Event listener dengan enhanced cleanup
document.addEventListener('DOMContentLoaded', function() {
    if (window.gpsSystem) {
        window.gpsSystem.cleanup();
    }
    
    gpsSystem = new OptimizedSAGMGpsTracking();
    window.gpsSystem = gpsSystem;
    
    setTimeout(addCleanupButton, 3000);
});

// Global functions
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

function toggleRoutes() {
    if (window.gpsSystem) {
        window.gpsSystem.toggleRouteDisplay();
    }
}

function clearRoutes() {
    if (window.gpsSystem) {
        window.gpsSystem.removeAllRoutes();
    }
}

// Global functions untuk chat system
function toggleMonitorChat() {
    if (window.gpsSystem) {
        window.gpsSystem.toggleMonitorChat();
    }
}

function selectChatUnit(unitName) {
    if (window.gpsSystem) {
        window.gpsSystem.selectChatUnit(unitName);
    }
}

function sendMonitorMessage() {
    if (window.gpsSystem) {
        window.gpsSystem.sendMonitorMessage();
    }
}

function handleMonitorChatInput(event) {
    if (window.gpsSystem) {
        window.gpsSystem.handleMonitorChatInput(event);
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.gpsSystem) {
        window.gpsSystem.cleanup();
    }
});

// Prevent multiple instances
if (window.gpsSystem) {
    window.gpsSystem.cleanup();
}
