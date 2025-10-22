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

// ==== MAIN ADVANCED GPS TRACKING SYSTEM ====
class AdvancedSAGMGpsTracking {
    constructor() {
        console.log('🚀 Initializing Advanced GPS Tracking System with Complete Analytics...');
        
        // 🔄 ENHANCED MEMORY MANAGEMENT
        this.units = new Map();
        this.markers = new Map();
        this.unitPolylines = new Map();
        this.unitHistory = new Map();
        this.unitSessions = new Map();
        this.driverOnlineStatus = new Map();
        this.lastDataTimestamps = new Map();
        
        // 🎯 ANALYTICS SYSTEMS
        this.analyticsEngine = new AnalyticsEngine(this);
        this.geofencingManager = new GeofencingManager(this);
        this.violationDetector = new ViolationDetector(this);
        this.fuelMonitor = new FuelMonitor(this);
        this.performanceManager = new PerformanceManager(this);
        this.heatmapManager = new HeatmapManager(this);
        this.maintenancePredictor = new MaintenancePredictor(this);
        this.reportGenerator = new ReportGenerator(this);
        this.notificationSystem = new NotificationSystem(this);
        
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
        
        // System state
        this.map = null;
        this.importantMarkers = [];
        this.activeUnits = 0;
        this.totalDistance = 0;
        this.avgSpeed = 0;
        this.totalFuelConsumption = 0;
        this.avgPerformanceScore = 0;
        this.totalViolations = 0;
        this.lastUpdate = new Date();
        this.autoRefreshInterval = null;
        this.firebaseListener = null;
        
        // ✅ ENHANCED CHAT SYSTEM
        this.monitorChatRefs = new Map();
        this.monitorChatMessages = new Map();
        this.monitorUnreadCounts = new Map();
        this.activeChatUnit = null;
        this.isMonitorChatOpen = false;
        this.monitorChatInitialized = false;
        this.isMonitorTyping = false;
        this.monitorTypingTimeout = null;
        
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
                SYSTEM: 'system',
                ANALYTICS: 'analytics',
                VIOLATION: 'violation',
                MAINTENANCE: 'maintenance'
            }
        };
        
        // Vehicle configuration
        this.vehicleConfig = {
            fuelEfficiency: 4.5,
            maxSpeed: 80,
            optimalSpeed: 40,
            fuelTankCapacity: 100,
            baseFuelConsumption: 0.25,
            movingFuelConsumption: 0.22,
            idleFuelConsumptionPerMin: 0.013,
            dailyDistanceTarget: 100,
            maxIdleTime: 30, // minutes
            maintenanceIntervals: {
                oilChange: 5000,
                tireRotation: 10000,
                brakeService: 15000,
                majorService: 20000
            }
        };

        // Important locations dengan zona
        this.importantLocations = {
            PKS_SAGM: { 
                lat: -0.43452332690449164, 
                lng: 102.96741072417917, 
                name: "PKS SAGM",
                type: "pks",
                radius: 500
            },
            KANTOR_KEBUN: { 
                lat: -0.3575865859028525, 
                lng: 102.95047687287101, 
                name: "Kantor Kebun PT SAGM",
                type: "office", 
                radius: 300
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
            console.log('🚀 Starting Advanced GPS Tracking System with Complete Analytics...');
            this.setupMap();
            this.setupEventHandlers();
            this.connectToFirebase();
            this.startPeriodicTasks();
            this.setupDataLogger();
            this.testFirebaseConnection();
            
            // Initialize analytics systems
            this.analyticsEngine.initialize();
            this.geofencingManager.initialize();
            this.violationDetector.initialize();
            this.fuelMonitor.initialize();
            this.performanceManager.initialize();
            this.heatmapManager.initialize();
            this.maintenancePredictor.initialize();
            this.notificationSystem.initialize();
            
            // Setup chat system
            this.setupMonitorChatSystem();
            this.setupChatWindowBehavior();
            
            setTimeout(() => this.showDebugPanel(), 2000);
            
        } catch (error) {
            console.error('System initialization failed:', error);
            this.displayError('Gagal memulai sistem GPS Analytics');
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
                    this.logData('Firebase connected - Analytics system ready', 'success');
                    setTimeout(() => this.loadInitialData(), 1000);
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

    // ===== PROCESS REAL-TIME DATA WITH ANALYTICS =====
    processRealTimeData(firebaseData) {
        if (!firebaseData) {
            this.logData('No real-time data from Firebase', 'warning');
            return;
        }

        const unitCount = Object.keys(firebaseData).length;
        console.log(`🔄 Real-time analytics update: ${unitCount} active units`);

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

            const existingUnit = this.units.get(unitName);
            
            if (existingUnit) {
                this.refreshUnitData(existingUnit, unitData);
                // Run analytics on updated data
                this.analyticsEngine.processUnitData(existingUnit);
                this.violationDetector.checkViolations(existingUnit);
                this.fuelMonitor.monitorFuelUsage(existingUnit);
                this.geofencingManager.checkUnitZones(existingUnit);
            } else {
                const newUnit = this.createNewUnit(unitName, unitData);
                if (newUnit) {
                    this.units.set(unitName, newUnit);
                    this.unitSessions.set(unitName, {
                        sessionId: unitData.sessionId,
                        startTime: currentTime,
                        lastActivity: currentTime
                    });
                    
                    // Initialize analytics for new unit
                    this.analyticsEngine.initializeUnit(newUnit);
                    this.maintenancePredictor.initializeUnit(newUnit);
                    
                    if (!this.monitorChatRefs.has(unitName)) {
                        this.setupUnitChatListener(unitName);
                    }
                }
            }
        });

        this.gradualCleanupInactiveUnits(activeUnits);
        this.updateStatistics();
        this.updateAnalyticsDashboard();
        this.scheduleRender();
    }

    // ===== ENHANCED UNIT CREATION WITH ANALYTICS =====
    createNewUnit(unitName, firebaseData) {
        if (!this.validateUnitData(unitName, firebaseData)) return null;

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
            fuelLevel: this.computeFuelLevel(100, firebaseData.distance, firebaseData.journeyStatus),
            fuelUsed: this.computeFuelUsage(firebaseData.distance, firebaseData.journeyStatus),
            driver: firebaseData.driver || 'Unknown',
            accuracy: parseFloat(firebaseData.accuracy) || 0,
            batteryLevel: firebaseData.batteryLevel || null,
            lastLat: parseFloat(firebaseData.lat),
            lastLng: parseFloat(firebaseData.lng),
            isOnline: true,
            sessionId: firebaseData.sessionId,
            lastFuelUpdate: Date.now(),
            
            // Analytics fields
            analytics: {
                performanceScore: 75, // Default score
                efficiency: 0,
                violations: [],
                dailyDistance: 0,
                idleTime: 0,
                fuelEfficiency: 0,
                lastScoreUpdate: Date.now(),
                zoneEntries: [],
                maintenanceAlerts: []
            }
        };

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
        
        unit.latitude = parseFloat(firebaseData.lat) || unit.latitude;
        unit.longitude = parseFloat(firebaseData.lng) || unit.longitude;
        unit.speed = parseFloat(firebaseData.speed) || unit.speed;
        unit.status = this.determineStatus(firebaseData.journeyStatus) || unit.status;
        unit.lastUpdate = firebaseData.lastUpdate || unit.lastUpdate;
        unit.driver = firebaseData.driver || unit.driver;
        unit.accuracy = parseFloat(firebaseData.accuracy) || unit.accuracy;
        unit.batteryLevel = firebaseData.batteryLevel || unit.batteryLevel;
        unit.fuelLevel = this.computeFuelLevel(100, unit.distance, unit.status);
        unit.lastLat = parseFloat(firebaseData.lat);
        unit.lastLng = parseFloat(firebaseData.lng);
        unit.isOnline = true;
        unit.lastFuelUpdate = now;

        this.addHistoryPoint(unit);
    }

    // ===== ENHANCED STATISTICS WITH ANALYTICS =====
    updateStatistics() {
        let activeUnits = 0;
        let totalDistance = 0;
        let totalSpeed = 0;
        let totalFuel = 0;
        let unitCount = 0;
        let totalScore = 0;
        let totalViolations = 0;

        this.units.forEach(unit => {
            if (unit.isOnline) {
                unitCount++;
                if (unit.status === 'active' || unit.status === 'moving') {
                    activeUnits++;
                }
                totalDistance += unit.distance || 0;
                totalSpeed += unit.speed || 0;
                totalFuel += unit.fuelUsed || 0;
                totalScore += unit.analytics.performanceScore || 0;
                totalViolations += unit.analytics.violations?.length || 0;
            }
        });

        const avgSpeed = unitCount > 0 ? totalSpeed / unitCount : 0;
        const avgScore = unitCount > 0 ? totalScore / unitCount : 0;

        this.activeUnits = activeUnits;
        this.totalDistance = totalDistance;
        this.avgSpeed = avgSpeed;
        this.totalFuelConsumption = totalFuel;
        this.avgPerformanceScore = Math.round(avgScore);
        this.totalViolations = totalViolations;

        this.updateDisplayElements();
    }

    updateDisplayElements() {
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        updateElement('activeUnits', `${this.activeUnits}/${this.units.size}`);
        updateElement('totalDistance', `${this.totalDistance.toFixed(1)} km`);
        updateElement('avgSpeed', `${this.avgSpeed.toFixed(1)} km/h`);
        updateElement('totalFuel', `${this.totalFuelConsumption.toFixed(1)} L`);
        updateElement('avgScore', `${this.avgPerformanceScore}`);
        updateElement('totalViolations', `${this.totalViolations}`);
        
        // Quick analytics
        updateElement('quickTotalDistance', `${this.totalDistance.toFixed(0)} km`);
        updateElement('quickTotalFuel', `${this.totalFuelConsumption.toFixed(0)} L`);
        updateElement('quickViolations', `${this.totalViolations}`);
        updateElement('quickEfficiency', `${this.avgPerformanceScore}%`);
        
        // Dashboard elements
        updateElement('averageScore', this.avgPerformanceScore);
        updateElement('bestUnit', this.performanceManager.getBestUnit() || '-');
        updateElement('systemEfficiency', this.avgPerformanceScore);
    }

    // ===== ANALYTICS DASHBOARD UPDATE =====
    updateAnalyticsDashboard() {
        this.analyticsEngine.updateDashboard();
        this.performanceManager.updateRankings();
        this.violationDetector.updateViolationsDisplay();
        this.fuelMonitor.updateFuelDisplay();
        this.maintenancePredictor.updateMaintenanceDisplay();
    }

    // ===== ENHANCED RENDERING =====
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
        this.updateAnalyticsDashboard();
    }

    // ===== ENHANCED UNIT LIST RENDERING WITH SCORES =====
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
        
        // Sort units by performance score
        const sortedUnits = Array.from(this.units.values()).sort((a, b) => 
            (b.analytics.performanceScore || 0) - (a.analytics.performanceScore || 0)
        );

        sortedUnits.forEach(unit => {
            const score = unit.analytics.performanceScore || 0;
            const scoreClass = this.getScoreClass(score);
            const violationCount = unit.analytics.violations?.length || 0;
            const maintenanceAlert = unit.analytics.maintenanceAlerts?.length > 0;
            
            const unitElement = document.createElement('div');
            unitElement.className = `unit-item ${unit.status} ${scoreClass}`;
            unitElement.onclick = () => this.showUnitAnalytics(unit.name);
            
            unitElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">
                            ${unit.name} ${unit.isOnline ? '🟢' : '🔴'}
                            ${violationCount > 0 ? '<span class="badge bg-danger ms-1">⚠️ ' + violationCount + '</span>' : ''}
                            ${maintenanceAlert ? '<span class="badge bg-warning ms-1">🔧</span>' : ''}
                        </h6>
                        <small class="text-muted">${unit.afdeling} - ${unit.driver || 'No Driver'}</small>
                    </div>
                    <div class="text-end">
                        <span class="badge ${unit.status === 'active' ? 'bg-success' : unit.status === 'moving' ? 'bg-warning' : 'bg-danger'}">
                            ${unit.status === 'active' ? 'Aktif' : unit.status === 'moving' ? 'Berjalan' : 'Non-Aktif'}
                        </span>
                        <div class="mt-1">
                            <small class="text-${scoreClass.replace('score-', '')}">
                                ⭐ ${score}
                            </small>
                        </div>
                    </div>
                </div>
                <div class="mt-2">
                    <small class="text-muted">
                        Kecepatan: ${unit.speed} km/h | Jarak: ${unit.distance.toFixed(1)} km<br>
                        Bahan Bakar: ${unit.fuelLevel}% | Efisiensi: ${unit.analytics.efficiency || 0}%<br>
                        Update: ${unit.lastUpdate}
                    </small>
                </div>
            `;
            unitList.appendChild(unitElement);
        });
    }

    getScoreClass(score) {
        if (score >= 90) return 'score-excellent';
        if (score >= 80) return 'score-good';
        if (score >= 70) return 'score-average';
        if (score >= 60) return 'score-poor';
        return 'score-bad';
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

            googleSatellite.addTo(this.map);

            L.control.scale({ imperial: false }).addTo(this.map);
            L.control.zoom({ position: 'topright' }).addTo(this.map);

            this.addLocationMarkers();

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

    // ===== MAP MARKERS METHODS =====
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
        const score = unit.analytics.performanceScore || 0;
        const violations = unit.analytics.violations?.length || 0;
        const efficiency = unit.analytics.efficiency || 0;
        
        const routeInfo = routePoints > 0 ? `
            <div class="info-item">
                <span class="info-label">Points Rute:</span>
                <span class="info-value">${routePoints}</span>
            </div>
        ` : '<div class="info-item"><span class="info-value text-muted">Belum ada data rute</span></div>';

        const onlineStatus = unit.isOnline ? 
            '<span class="badge bg-success">ONLINE</span>' : 
            '<span class="badge bg-danger">OFFLINE</span>';

        const scoreBadge = `<span class="badge bg-${this.getScoreClass(score).replace('score-', '')}">⭐ ${score}</span>`;

        return `
            <div class="unit-popup">
                <div class="popup-header">
                    <h6 class="mb-0">🚛 ${unit.name} ${onlineStatus} ${scoreBadge}</h6>
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
                    <div class="info-item">
                        <span class="info-label">Efisiensi:</span>
                        <span class="info-value">${efficiency}%</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Pelanggaran:</span>
                        <span class="info-value ${violations > 0 ? 'text-danger' : 'text-success'}">${violations}</span>
                    </div>
                    ${routeInfo}
                </div>
                <div class="mt-2">
                    <button class="btn btn-sm btn-primary w-100" onclick="window.gpsSystem.showUnitAnalytics('${unit.name}')">
                        📊 Lihat Analytics
                    </button>
                </div>
            </div>
        `;
    }

    // ===== ANALYTICS SYSTEMS INTEGRATION =====
    showUnitAnalytics(unitName) {
        this.analyticsEngine.showUnitAnalytics(unitName);
    }

    // ===== DATA VALIDATION & CORRECTION =====
    validateUnitData(unitName, unitData) {
        if (!unitData) return false;
        if (unitData.lat === undefined || unitData.lng === undefined) return false;
        
        const lat = parseFloat(unitData.lat);
        const lng = parseFloat(unitData.lng);
        return !isNaN(lat) && !isNaN(lng);
    }

    correctUnitData(unitName, unitData) {
        console.log(`🛠️ Correcting invalid data for ${unitName}`);
        this.logData(`Data correction for ${unitName}`, 'warning', { unitData });
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

    // ===== CLEANUP METHODS =====
    gradualCleanupInactiveUnits(activeUnits) {
        const now = Date.now();
        const inactiveThreshold = 60000;
        const removalThreshold = 120000;

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
        console.log('🧹 FORCE CLEANUP: Removing truly inactive units');
        
        const now = Date.now();
        const removalThreshold = 120000;
        const unitsToRemove = [];
        
        this.units.forEach((unit, unitName) => {
            const timeSinceLastUpdate = now - (this.lastDataTimestamps.get(unitName) || 0);
            
            if (timeSinceLastUpdate > removalThreshold) {
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

        if (unitsToRemove.length > 0) {
            console.log(`🧹 Removed ${unitsToRemove.length} inactive units`);
        }

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
        
        this.cleanupUnitChatListener(unitName);
        
        // Cleanup analytics data
        this.analyticsEngine.cleanupUnit(unitName);
        this.violationDetector.cleanupUnit(unitName);
        this.fuelMonitor.cleanupUnit(unitName);
        this.performanceManager.cleanupUnit(unitName);
        this.maintenancePredictor.cleanupUnit(unitName);
        
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
                statusElement.className = 'connection-status connection-online';
            } else {
                statusElement.innerHTML = '🔴 FIREBASE OFFLINE';
                statusElement.className = 'connection-status connection-offline';
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

    // ===== PERIODIC TASKS =====
    startPeriodicTasks() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();

        const cleanupInterval = setInterval(() => {
            this.forceCleanupInactiveUnits();
            this.cleanupOrphanedMarkers();
            this.lastCleanupTime = new Date();
        }, 60000);
        this.intervals.add(cleanupInterval);

        const healthInterval = setInterval(() => {
            this.logData('System health check', 'info', {
                activeUnits: this.units.size,
                markers: this.markers.size,
                polylines: this.unitPolylines.size,
                chatUnits: this.monitorChatRefs.size
            });
        }, 120000);
        this.intervals.add(healthInterval);

        const statusInterval = setInterval(() => {
            const now = Date.now();
            this.lastDataTimestamps.forEach((lastUpdate, unitName) => {
                const timeDiff = now - lastUpdate;
                if (timeDiff > 90000) {
                    this.markUnitOffline(unitName);
                }
            });
        }, 30000);
        this.intervals.add(statusInterval);

        const analyticsInterval = setInterval(() => {
            this.analyticsEngine.updateAllCharts();
        }, 30000);
        this.intervals.add(analyticsInterval);
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
        console.log('🔄 Manual refresh initiated');
        this.logData('Manual refresh initiated', 'info');
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
                            
                            // Initialize analytics
                            this.analyticsEngine.initializeUnit(unit);
                            this.maintenancePredictor.initializeUnit(unit);
                            
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
        this.avgPerformanceScore = 0;
        this.totalViolations = 0;
        
        this.activeChatUnit = null;
        this.isMonitorChatOpen = false;
        
        // Clear analytics systems
        this.analyticsEngine.clearAll();
        this.geofencingManager.clearAll();
        this.violationDetector.clearAll();
        this.fuelMonitor.clearAll();
        this.performanceManager.clearAll();
        this.heatmapManager.clearAll();
        this.maintenancePredictor.clearAll();
        
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
            })
            .catch((error) => {
                console.error('❌ Firebase connection test failed:', error);
            });
    }

    showDebugPanel() {
        const debugHtml = `
            <div class="debug-panel card position-fixed" style="bottom: 10px; right: 10px; width: 400px; z-index: 9999;">
                <div class="card-header bg-dark text-white d-flex justify-content-between">
                    <span>🐛 Advanced Debug Panel</span>
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
                        <strong>Analytics Score:</strong> 
                        <span id="debugAvgScore">${this.avgPerformanceScore}</span>
                    </div>
                    <div class="mb-2">
                        <strong>Violations:</strong> 
                        <span id="debugViolations">${this.totalViolations}</span>
                    </div>
                    <div class="mb-2">
                        <strong>Chat Units:</strong> 
                        <span id="debugChatUnits">${this.monitorChatRefs.size}</span>
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
                    <button class="btn btn-sm btn-info w-100 mt-1" onclick="window.gpsSystem.analyticsEngine.exportAnalyticsData()">
                        📊 Export Analytics
                    </button>
                    <button class="btn btn-sm btn-success w-100 mt-1" onclick="window.gpsSystem.reportGenerator.generateDailyReport()">
                        📈 Generate Report
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', debugHtml);
        
        setInterval(() => {
            const statusElement = document.getElementById('debugFirebaseStatus');
            const unitsElement = document.getElementById('debugUnitsCount');
            const scoreElement = document.getElementById('debugAvgScore');
            const violationsElement = document.getElementById('debugViolations');
            const chatUnitsElement = document.getElementById('debugChatUnits');
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
            
            if (scoreElement) {
                scoreElement.textContent = this.avgPerformanceScore;
            }
            
            if (violationsElement) {
                violationsElement.textContent = this.totalViolations;
            }
            
            if (chatUnitsElement) {
                chatUnitsElement.textContent = this.monitorChatRefs.size;
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
            analytics: {
                averageScore: this.avgPerformanceScore,
                totalDistance: this.totalDistance,
                totalFuel: this.totalFuelConsumption,
                totalViolations: this.totalViolations
            },
            routes: {}
        };

        this.units.forEach((unit, unitName) => {
            exportData.routes[unitName] = {
                driver: unit.driver,
                totalDistance: unit.distance,
                routePoints: this.unitHistory.get(unitName)?.length || 0,
                performanceScore: unit.analytics.performanceScore,
                violations: unit.analytics.violations?.length || 0,
                history: this.unitHistory.get(unitName) || []
            };
        });

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `advanced-routes-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.logData('Advanced route data exported', 'success');
    }

    // ===== DATA LOGGER METHODS =====
    setupDataLogger() {
        this.loadLogs();
        this.renderLogger();
        
        this.logData('Advanced GPS Analytics System initialized', 'system', {
            timestamp: new Date().toISOString(),
            version: '5.0',
            features: [
                'Real-time Analytics',
                'Performance Scoring', 
                'Violation Detection',
                'Fuel Monitoring',
                'Geofencing',
                'Maintenance Prediction',
                'Heatmap Visualization',
                'Advanced Reporting'
            ]
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
            const savedLogs = localStorage.getItem('sagm_advanced_logs');
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
            localStorage.setItem('sagm_advanced_logs', JSON.stringify(this.dataLogger.logs));
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
                    <h6 class="mb-0">📊 Advanced Data Logger System</h6>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-light" onclick="window.gpsSystem.clearAllLogs()">
                            🗑️ Clear
                        </button>
                        <button class="btn btn-outline-light" onclick="window.gpsSystem.exportLogData()">
                            📥 Export
                        </button>
                        <button class="btn btn-outline-light" onclick="window.gpsSystem.exportAnalyticsReport()">
                            📈 Analytics Report
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
            'system': '<span class="badge bg-secondary">SYSTEM</span>',
            'analytics': '<span class="badge bg-info">ANALYTICS</span>',
            'violation': '<span class="badge bg-danger">VIOLATION</span>',
            'maintenance': '<span class="badge bg-warning">MAINTENANCE</span>'
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
            system: 'Advanced SAGM GPS Analytics System',
            logs: this.dataLogger.logs
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sagm-advanced-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.logData('Advanced logs exported successfully', 'success', {
            file: link.download,
            totalLogs: this.dataLogger.logs.length
        });
    }

    exportAnalyticsReport() {
        this.reportGenerator.exportDailyReport();
    }

    // ===== CHAT SYSTEM METHODS =====
    setupMonitorChatSystem() {
        console.log('💬 Initializing enhanced monitor chat system with analytics...');
        
        database.ref('/chat').on('child_added', (snapshot) => {
            const unitName = snapshot.key;
            console.log(`💬 New chat unit detected: ${unitName}`);
            this.setupUnitChatListener(unitName);
        });

        database.ref('/chat').on('child_removed', (snapshot) => {
            const unitName = snapshot.key;
            this.cleanupUnitChatListener(unitName);
        });

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
        
        console.log('💬 Enhanced monitor chat system with analytics activated');
        this.logData('Sistem chat monitor dengan analytics diaktifkan', 'system');
    }

    setupUnitChatListener(unitName) {
        if (this.monitorChatRefs.has(unitName)) return;
        
        console.log(`💬 Setting up chat listener for unit: ${unitName}`);
        
        const chatRef = database.ref('/chat/' + unitName);
        this.monitorChatRefs.set(unitName, chatRef);
        this.monitorChatMessages.set(unitName, []);
        this.monitorUnreadCounts.set(unitName, 0);
        
        chatRef.off();
        
        chatRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            this.handleMonitorChatMessage(unitName, message);
        });
        
        const typingRef = database.ref('/typing/' + unitName);
        typingRef.on('value', (snapshot) => {
            const typingData = snapshot.val();
            this.handleMonitorTypingIndicator(unitName, typingData);
        });

        this.updateMonitorChatUnitSelect();
        console.log(`💬 Now actively listening to chat for unit: ${unitName}`);
    }

    handleMonitorChatMessage(unitName, message) {
        if (!message || message.type === 'monitor') return;
        
        if (!this.monitorChatMessages.has(unitName)) {
            this.monitorChatMessages.set(unitName, []);
        }
        
        const messages = this.monitorChatMessages.get(unitName);
        
        const messageExists = messages.some(msg => 
            msg.id === message.id || 
            (msg.timestamp === message.timestamp && msg.sender === message.sender)
        );
        
        if (messageExists) return;
        
        messages.push(message);
        
        if (this.activeChatUnit !== unitName) {
            const currentCount = this.monitorUnreadCounts.get(unitName) || 0;
            this.monitorUnreadCounts.set(unitName, currentCount + 1);
        }
        
        this.updateMonitorChatUI();
        this.updateMonitorChatUnitSelect();
        
        if (this.activeChatUnit !== unitName) {
            this.showMonitorChatNotification(unitName, message);
        }
        
        console.log(`💬 New message from ${unitName}:`, message);
    }

    toggleMonitorChat() {
        this.isMonitorChatOpen = !this.isMonitorChatOpen;
        const chatWindow = document.getElementById('monitorChatWindow');
        const chatToggle = document.getElementById('monitorChatToggle');
        
        if (chatWindow) {
            if (this.isMonitorChatOpen) {
                chatWindow.style.display = 'flex';
                void chatWindow.offsetWidth;
                chatWindow.style.animation = 'slideInUp 0.3s ease-out forwards';
                
                this.updateMonitorChatUnitSelect();
                this.updateMonitorChatUI();
                
                if (this.activeChatUnit) {
                    setTimeout(() => {
                        const chatInput = document.getElementById('monitorChatInput');
                        if (chatInput) {
                            chatInput.focus();
                            chatInput.select();
                        }
                    }, 350);
                }
                
                if (chatToggle) {
                    chatToggle.innerHTML = '💬 Tutup Chat <span id="monitorUnreadBadge" class="badge bg-danger" style="display: none;"></span>';
                    chatToggle.classList.add('btn-secondary');
                    chatToggle.classList.remove('btn-primary');
                }
                
            } else {
                chatWindow.style.animation = 'slideOutDown 0.25s ease-in forwards';
                this.stopMonitorTyping();
                
                if (chatToggle) {
                    chatToggle.innerHTML = '💬 Chat dengan Driver <span id="monitorUnreadBadge" class="badge bg-danger" style="display: none;"></span>';
                    chatToggle.classList.add('btn-primary');
                    chatToggle.classList.remove('btn-secondary');
                }
                
                setTimeout(() => {
                    if (!this.isMonitorChatOpen) {
                        chatWindow.style.display = 'none';
                        chatWindow.style.animation = '';
                    }
                }, 250);
            }
        }
    }

    setupChatWindowBehavior() {
        const chatWindow = document.getElementById('monitorChatWindow');
        const chatToggle = document.getElementById('monitorChatToggle');
        
        if (chatWindow && chatToggle) {
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
            
            chatWindow.addEventListener('click', this.chatWindowClickHandler);
            document.addEventListener('click', this.documentClickHandler);
            document.addEventListener('keydown', this.escapeKeyHandler);
        }
    }

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
            
            if (!this.monitorChatMessages.has(this.activeChatUnit)) {
                this.monitorChatMessages.set(this.activeChatUnit, []);
            }
            this.monitorChatMessages.get(this.activeChatUnit).push(messageData);
            
            this.updateMonitorChatUI();
            this.logData(`💬 Pesan ke ${this.activeChatUnit}: "${messageText}"`, 'info');
            
            if (messageInput) messageInput.value = '';
            this.stopMonitorTyping();
            
        } catch (error) {
            console.error('Failed to send monitor message:', error);
            this.logData('❌ Gagal mengirim pesan ke driver', 'error');
        }
    }

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

    updateMonitorChatUI() {
        const messageList = document.getElementById('monitorChatMessages');
        const unreadBadge = document.getElementById('monitorUnreadBadge');
        const chatInput = document.getElementById('monitorChatInput');
        const sendBtn = document.getElementById('monitorSendBtn');
        const unitSelect = document.getElementById('monitorChatUnitSelect');
        
        if (!messageList) return;
        
        let totalUnread = 0;
        this.monitorUnreadCounts.forEach(count => totalUnread += count);
        
        if (unreadBadge) {
            unreadBadge.textContent = totalUnread > 0 ? totalUnread : '';
            unreadBadge.style.display = totalUnread > 0 ? 'inline' : 'none';
        }
        
        const hasActiveUnit = !!this.activeChatUnit;
        
        if (chatInput) chatInput.disabled = !hasActiveUnit;
        if (sendBtn) sendBtn.disabled = !hasActiveUnit;
        if (unitSelect) unitSelect.value = this.activeChatUnit || '';
        
        if (messageList && !hasActiveUnit) {
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
        
        messageList.innerHTML = '';
        
        const groupedMessages = this.groupMonitorMessagesByDate(activeMessages);
        
        Object.keys(groupedMessages).forEach(date => {
            if (Object.keys(groupedMessages).length > 1) {
                const dateElement = document.createElement('div');
                dateElement.className = 'chat-date-separator';
                dateElement.innerHTML = `<span>${date}</span>`;
                messageList.appendChild(dateElement);
            }
            
            groupedMessages[date].forEach(message => {
                const messageElement = this.createMonitorMessageElement(message);
                messageList.appendChild(messageElement);
            });
        });
        
        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'monitorTypingIndicator';
        typingIndicator.style.display = 'none';
        messageList.appendChild(typingIndicator);
        
        setTimeout(() => {
            messageList.scrollTo({
                top: messageList.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
    }

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
        
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });
        
        return grouped;
    }

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

    setupChatEventHandlers() {
        const chatInput = document.getElementById('monitorChatInput');
        const unitSelect = document.getElementById('monitorChatUnitSelect');
        
        let typingTimer;
        
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
        
        if (unitSelect) {
            unitSelect.addEventListener('change', (e) => {
                this.selectChatUnit(e.target.value);
            });
        }
    }

    selectChatUnit(unitName) {
        if (unitName === this.activeChatUnit) return;
        
        this.stopMonitorTyping();
        this.activeChatUnit = unitName;
        
        if (unitName && this.monitorUnreadCounts.has(unitName)) {
            this.monitorUnreadCounts.set(unitName, 0);
        }
        
        this.updateMonitorChatUI();
        this.updateMonitorChatUnitSelect();
        
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

    updateMonitorChatUnitSelect() {
        const unitSelect = document.getElementById('monitorChatUnitSelect');
        if (!unitSelect) return;
        
        const currentValue = unitSelect.value;
        
        unitSelect.innerHTML = '<option value="">Pilih Unit...</option>';
        
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
        
        if (currentValue && allUnits.has(currentValue)) {
            unitSelect.value = currentValue;
        } else if (this.activeChatUnit && allUnits.has(this.activeChatUnit)) {
            unitSelect.value = this.activeChatUnit;
        }
    }

    handleMonitorChatInput(event) {
        if (event.key === 'Enter') {
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

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== ENHANCED CLEANUP WITH ANALYTICS SUPPORT =====
    cleanup() {
        console.log('🧹 Comprehensive system cleanup with analytics support...');
        
        // Cleanup analytics systems
        this.analyticsEngine.cleanup();
        this.geofencingManager.cleanup();
        this.violationDetector.cleanup();
        this.fuelMonitor.cleanup();
        this.performanceManager.cleanup();
        this.heatmapManager.cleanup();
        this.maintenancePredictor.cleanup();
        this.notificationSystem.cleanup();
        
        // Existing cleanup
        this.cleanupChatEventListeners();
        this.cleanupFirebaseListeners();
        
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();
        
        if (this.updateDebounce) {
            clearTimeout(this.updateDebounce);
        }
        
        this.monitorChatRefs.forEach(ref => ref.off());
        this.monitorChatRefs.clear();
        
        database.ref('/chat').off('child_added');
        database.ref('/chat').off('child_removed');
        
        this.clearAllData();
        
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        
        console.log('✅ Advanced system cleanup completed');
    }
}

// ==== ANALYTICS ENGINE ====
class AnalyticsEngine {
    constructor(mainSystem) {
        this.main = mainSystem;
        this.unitAnalytics = new Map();
        this.charts = new Map();
        this.dashboardData = {
            averageScore: 0,
            bestUnit: '',
            systemEfficiency: 0,
            totalViolations: 0,
            fuelEfficiency: 0
        };
    }

    initialize() {
        console.log('📊 Analytics Engine initialized');
        this.setupCharts();
        this.startAnalyticsProcessing();
    }

    setupCharts() {
        this.setupPerformanceChart();
        this.setupViolationsChart();
        this.setupFuelChart();
        this.setupMaintenanceChart();
        this.setupZonesChart();
    }

    setupPerformanceChart() {
        const ctx = document.getElementById('performanceChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.set('performance', new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: 10}, (_, i) => `${i * 5}m lalu`),
                datasets: [{
                    label: 'Skor Performa Rata-rata',
                    data: Array(10).fill(75),
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        }));
    }

    setupViolationsChart() {
        const ctx = document.getElementById('violationsChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.set('violations', new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Kecepatan', 'Idle Time', 'Bahan Bakar', 'Zona'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4d96ff']
                }]
            }
        }));
    }

    setupFuelChart() {
        const ctx = document.getElementById('fuelChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.set('fuel', new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Konsumsi Bahan Bakar (L)',
                    data: [],
                    backgroundColor: '#17a2b8'
                }]
            }
        }));
    }

    setupMaintenanceChart() {
        const ctx = document.getElementById('maintenanceChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.set('maintenance', new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Oil Change', 'Tire Rotation', 'Brake Service', 'Major Service'],
                datasets: [{
                    label: 'KM Tersisa',
                    data: [5000, 10000, 15000, 20000],
                    backgroundColor: ['#28a745', '#20c997', '#ffc107', '#fd7e14']
                }]
            }
        }));
    }

    setupZonesChart() {
        const ctx = document.getElementById('zonesChart')?.getContext('2d');
        if (!ctx) return;

        this.charts.set('zones', new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['PKS', 'Kantor', 'Afdeling I', 'Afdeling II', 'Afdeling III'],
                datasets: [{
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: ['#6f42c1', '#e83e8c', '#28a745', '#20c997', '#ffc107']
                }]
            }
        }));
    }

    processUnitData(unit) {
        const analytics = this.calculateUnitAnalytics(unit);
        this.unitAnalytics.set(unit.name, analytics);
        unit.analytics = { ...unit.analytics, ...analytics };
        
        this.updateUnitScore(unit);
    }

    calculateUnitAnalytics(unit) {
        const speedEfficiency = this.calculateSpeedEfficiency(unit.speed);
        const distanceEfficiency = this.calculateDistanceEfficiency(unit.distance);
        const fuelEfficiency = this.calculateFuelEfficiency(unit);
        const violationPenalty = this.calculateViolationPenalty(unit);
        
        const baseScore = (speedEfficiency + distanceEfficiency + fuelEfficiency) / 3;
        const finalScore = Math.max(0, Math.min(100, baseScore - violationPenalty));
        
        return {
            performanceScore: Math.round(finalScore),
            efficiency: Math.round((speedEfficiency + fuelEfficiency) / 2),
            speedEfficiency: Math.round(speedEfficiency),
            distanceEfficiency: Math.round(distanceEfficiency),
            fuelEfficiency: Math.round(fuelEfficiency),
            lastUpdate: Date.now()
        };
    }

    calculateSpeedEfficiency(speed) {
        const optimalSpeed = this.main.vehicleConfig.optimalSpeed;
        const maxSpeed = this.main.vehicleConfig.maxSpeed;
        
        if (speed <= 0) return 0;
        if (speed <= optimalSpeed) return (speed / optimalSpeed) * 100;
        
        // Penalty for speeding
        const overspeed = speed - optimalSpeed;
        const maxOverspeed = maxSpeed - optimalSpeed;
        const penalty = (overspeed / maxOverspeed) * 50; // Max 50% penalty
        
        return Math.max(0, 100 - penalty);
    }

    calculateDistanceEfficiency(distance) {
        const target = this.main.vehicleConfig.dailyDistanceTarget;
        return Math.min(100, (distance / target) * 100);
    }

    calculateFuelEfficiency(unit) {
        if (!unit.fuelUsed || unit.fuelUsed <= 0) return 100;
        
        const expectedFuel = unit.distance * this.main.vehicleConfig.movingFuelConsumption;
        const efficiency = (expectedFuel / unit.fuelUsed) * 100;
        return Math.min(100, efficiency);
    }

    calculateViolationPenalty(unit) {
        const violations = unit.analytics.violations || [];
        return violations.length * 10; // 10 points penalty per violation
    }

    updateUnitScore(unit) {
        const analytics = this.unitAnalytics.get(unit.name);
        if (analytics) {
            unit.analytics.performanceScore = analytics.performanceScore;
            unit.analytics.efficiency = analytics.efficiency;
        }
    }

    initializeUnit(unit) {
        this.unitAnalytics.set(unit.name, {
            performanceScore: 75,
            efficiency: 0,
            speedEfficiency: 0,
            distanceEfficiency: 0,
            fuelEfficiency: 0,
            lastUpdate: Date.now()
        });
    }

    updateDashboard() {
        let totalScore = 0;
        let unitCount = 0;
        let bestUnit = '';
        let bestScore = 0;

        this.main.units.forEach(unit => {
            if (unit.isOnline) {
                const score = unit.analytics.performanceScore || 0;
                totalScore += score;
                unitCount++;
                
                if (score > bestScore) {
                    bestScore = score;
                    bestUnit = unit.name;
                }
            }
        });

        this.dashboardData.averageScore = unitCount > 0 ? Math.round(totalScore / unitCount) : 0;
        this.dashboardData.bestUnit = bestUnit;
        this.dashboardData.systemEfficiency = this.dashboardData.averageScore;

        this.updateDashboardDisplay();
    }

    updateDashboardDisplay() {
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        updateElement('averageScore', this.dashboardData.averageScore);
        updateElement('bestUnit', this.dashboardData.bestUnit);
        updateElement('systemEfficiency', this.dashboardData.systemEfficiency + '%');
        
        // Update progress bar
        const efficiencyBar = document.querySelector('.efficiency-bar .progress-bar');
        if (efficiencyBar) {
            efficiencyBar.style.width = this.dashboardData.systemEfficiency + '%';
            efficiencyBar.className = `progress-bar bg-${this.main.getScoreClass(this.dashboardData.systemEfficiency).replace('score-', '')}`;
        }
    }

    showUnitAnalytics(unitName) {
        const unit = this.main.units.get(unitName);
        if (!unit) return;

        const analytics = this.unitAnalytics.get(unitName) || {};
        
        const modalBody = `
            <div class="row">
                <div class="col-md-6">
                    <h5>📊 Analytics Detail - ${unitName}</h5>
                    <div class="card mb-3">
                        <div class="card-body">
                            <div class="row text-center">
                                <div class="col-6">
                                    <div class="h2 text-${this.main.getScoreClass(analytics.performanceScore)}">
                                        ${analytics.performanceScore || 0}
                                    </div>
                                    <small>Overall Score</small>
                                </div>
                                <div class="col-6">
                                    <div class="h4 text-success">${analytics.efficiency || 0}%</div>
                                    <small>Efficiency</small>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <h6>📈 Metrik Detail</h6>
                    <div class="list-group">
                        <div class="list-group-item d-flex justify-content-between">
                            <span>Kecepatan:</span>
                            <span>${unit.speed} km/h</span>
                        </div>
                        <div class="list-group-item d-flex justify-content-between">
                            <span>Efisiensi Kecepatan:</span>
                            <span>${analytics.speedEfficiency || 0}%</span>
                        </div>
                        <div class="list-group-item d-flex justify-content-between">
                            <span>Jarak Tempuh:</span>
                            <span>${unit.distance.toFixed(1)} km</span>
                        </div>
                        <div class="list-group-item d-flex justify-content-between">
                            <span>Efisiensi Bahan Bakar:</span>
                            <span>${analytics.fuelEfficiency || 0}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <h6>⚠️ Pelanggaran</h6>
                    <div id="unitViolationsList">
                        ${this.renderUnitViolations(unit)}
                    </div>
                    
                    <h6 class="mt-3">💡 Rekomendasi</h6>
                    <div id="unitRecommendations">
                        ${this.generateRecommendations(unit)}
                    </div>

                    <h6 class="mt-3">🔧 Maintenance</h6>
                    <div id="unitMaintenance">
                        ${this.renderUnitMaintenance(unit)}
                    </div>
                </div>
            </div>
        `;

        document.getElementById('analyticsModalTitle').textContent = `Analytics - ${unitName}`;
        document.getElementById('analyticsModalBody').innerHTML = modalBody;
        
        const modal = new bootstrap.Modal(document.getElementById('analyticsModal'));
        modal.show();
    }

    renderUnitViolations(unit) {
        const violations = unit.analytics.violations || [];
        if (violations.length === 0) {
            return '<div class="alert alert-success">✅ Tidak ada pelanggaran</div>';
        }

        return violations.map(violation => `
            <div class="alert alert-warning violation-alert">
                <strong>${violation.type}</strong><br>
                <small>${violation.message}</small>
                <br>
                <small class="text-muted">${new Date(violation.timestamp).toLocaleTimeString('id-ID')}</small>
            </div>
        `).join('');
    }

    renderUnitMaintenance(unit) {
        const maintenance = this.main.maintenancePredictor.getUnitMaintenance(unit.name);
        if (!maintenance) {
            return '<div class="alert alert-info">🔧 Data maintenance sedang dimuat...</div>';
        }

        let alerts = [];
        Object.entries(maintenance).forEach(([service, data]) => {
            if (data.remaining < 1000) {
                alerts.push(`
                    <div class="alert alert-warning">
                        <strong>${service}</strong><br>
                        <small>Tersisa: ${data.remaining} km</small>
                    </div>
                `);
            }
        });

        if (alerts.length === 0) {
            return '<div class="alert alert-success">✅ Semua maintenance dalam kondisi baik</div>';
        }

        return alerts.join('');
    }

    generateRecommendations(unit) {
        const recommendations = [];
        const analytics = this.unitAnalytics.get(unit.name) || {};

        if (analytics.speedEfficiency < 70) {
            recommendations.push('🚗 Pertahankan kecepatan optimal (40 km/h)');
        }

        if (analytics.fuelEfficiency < 80) {
            recommendations.push('⛽ Monitor konsumsi bahan bakar lebih ketat');
        }

        if (unit.analytics.violations?.length > 0) {
            recommendations.push('⚠️ Kurangi pelanggaran untuk meningkatkan skor');
        }

        if (recommendations.length === 0) {
            return '<div class="alert alert-success">✅ Performa sudah optimal</div>';
        }

        return recommendations.map(rec => `
            <div class="alert alert-info">
                <small>${rec}</small>
            </div>
        `).join('');
    }

    updateAllCharts() {
        this.updatePerformanceChart();
        this.updateViolationsChart();
        this.updateFuelChart();
    }

    updatePerformanceChart() {
        const chart = this.charts.get('performance');
        if (!chart) return;

        // Simulate real-time data updates
        const newData = chart.data.datasets[0].data.slice(1);
        newData.push(this.dashboardData.averageScore);
        chart.data.datasets[0].data = newData;
        chart.update('none');
    }

    updateViolationsChart() {
        const chart = this.charts.get('violations');
        if (!chart) return;

        let speeding = 0, idle = 0, fuel = 0, zone = 0;

        this.main.units.forEach(unit => {
            unit.analytics.violations?.forEach(violation => {
                switch(violation.type) {
                    case 'SPEEDING': speeding++; break;
                    case 'EXCESSIVE_IDLE': idle++; break;
                    case 'FUEL_ANOMALY': fuel++; break;
                    case 'ZONE_VIOLATION': zone++; break;
                }
            });
        });

        chart.data.datasets[0].data = [speeding, idle, fuel, zone];
        chart.update();
    }

    updateFuelChart() {
        const chart = this.charts.get('fuel');
        if (!chart) return;

        const units = Array.from(this.main.units.values()).slice(0, 5);
        chart.data.labels = units.map(u => u.name);
        chart.data.datasets[0].data = units.map(u => u.fuelUsed || 0);
        chart.update();
    }

    exportAnalyticsData() {
        const exportData = {
            exportedAt: new Date().toISOString(),
            analytics: this.dashboardData,
            unitAnalytics: Object.fromEntries(this.unitAnalytics),
            charts: {
                performance: this.charts.get('performance')?.data,
                violations: this.charts.get('violations')?.data,
                fuel: this.charts.get('fuel')?.data
            }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `analytics-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.main.logData('Analytics data exported', 'success');
    }

    cleanupUnit(unitName) {
        this.unitAnalytics.delete(unitName);
    }

    clearAll() {
        this.unitAnalytics.clear();
        this.charts.forEach(chart => chart.destroy());
        this.charts.clear();
    }

    cleanup() {
        this.clearAll();
    }
}

// ==== GEOFENCING MANAGER ====
class GeofencingManager {
    constructor(mainSystem) {
        this.main = mainSystem;
        this.zones = new Map();
        this.zoneMarkers = new Map();
        this.zoneListeners = new Map();
        this.zoneViolations = new Map();
    }

    initialize() {
        console.log('📍 Geofencing Manager initialized');
        this.setupDefaultZones();
        this.setupZoneMonitoring();
    }

    setupDefaultZones() {
        // Add operational zones
        this.addZone('PKS_SAGM', this.main.importantLocations.PKS_SAGM);
        this.addZone('KANTOR_KEBUN', this.main.importantLocations.KANTOR_KEBUN);
        
        // Add afdeling zones
        this.addAfdelingZones();
    }

    addAfdelingZones() {
        const afdelingZones = {
            'AFD_I': { lat: -0.4000, lng: 102.9400, radius: 2000, name: 'Afdeling I', type: 'afdeling' },
            'AFD_II': { lat: -0.4200, lng: 102.9200, radius: 2000, name: 'Afdeling II', type: 'afdeling' },
            'AFD_III': { lat: -0.3800, lng: 102.9300, radius: 2000, name: 'Afdeling III', type: 'afdeling' },
            'AFD_IV': { lat: -0.4100, lng: 102.9500, radius: 2000, name: 'Afdeling IV', type: 'afdeling' },
            'AFD_V': { lat: -0.3900, lng: 102.9600, radius: 2000, name: 'Afdeling V', type: 'afdeling' },
            'KKPA': { lat: -0.4300, lng: 102.9400, radius: 1500, name: 'KKPA', type: 'afdeling' }
        };

        Object.entries(afdelingZones).forEach(([id, zone]) => {
            this.addZone(id, zone);
        });
    }

    addZone(zoneId, zoneConfig) {
        this.zones.set(zoneId, {
            id: zoneId,
            ...zoneConfig,
            unitsInside: new Set(),
            entryLog: [],
            exitLog: []
        });

        this.createZoneMarker(zoneId, zoneConfig);
    }

    createZoneMarker(zoneId, zoneConfig) {
        if (!this.main.map) return;

        const zone = this.zones.get(zoneId);
        const circle = L.circle([zoneConfig.lat, zoneConfig.lng], {
            color: this.getZoneColor(zoneConfig.type),
            fillColor: this.getZoneColor(zoneConfig.type),
            fillOpacity: 0.1,
            radius: zoneConfig.radius
        }).addTo(this.main.map);

        circle.bindPopup(this.createZonePopup(zone));
        this.zoneMarkers.set(zoneId, circle);
    }

    getZoneColor(zoneType) {
        const colors = {
            'pks': '#6f42c1',
            'office': '#e83e8c',
            'afdeling': '#28a745',
            'restricted': '#dc3545'
        };
        return colors[zoneType] || '#6c757d';
    }

    createZonePopup(zone) {
        return `
            <div class="zone-popup">
                <h6>📍 ${zone.name}</h6>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Tipe:</span>
                        <span class="info-value">${zone.type.toUpperCase()}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Radius:</span>
                        <span class="info-value">${zone.radius}m</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Unit di dalam:</span>
                        <span class="info-value">${zone.unitsInside.size}</span>
                    </div>
                </div>
            </div>
        `;
    }

    setupZoneMonitoring() {
        // Monitor unit movements for zone entries/exits
        setInterval(() => {
            this.checkZoneTransitions();
        }, 5000);
    }

    checkUnitZones(unit) {
        this.zones.forEach((zone, zoneId) => {
            const isInside = this.isUnitInZone(unit, zone);
            const wasInside = zone.unitsInside.has(unit.name);

            if (isInside && !wasInside) {
                this.handleZoneEntry(unit, zone);
            } else if (!isInside && wasInside) {
                this.handleZoneExit(unit, zone);
            }
        });
    }

    checkZoneTransitions() {
        this.main.units.forEach(unit => {
            this.checkUnitZones(unit);
        });
    }

    isUnitInZone(unit, zone) {
        const distance = this.calculateDistance(
            unit.latitude, unit.longitude,
            zone.lat, zone.lng
        );
        return distance <= (zone.radius / 1000); // Convert to km
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    handleZoneEntry(unit, zone) {
        zone.unitsInside.add(unit.name);
        zone.entryLog.push({
            unit: unit.name,
            timestamp: new Date().toISOString(),
            driver: unit.driver
        });

        this.main.logData(`Unit ${unit.name} masuk zona ${zone.name}`, 'analytics', {
            unit: unit.name,
            zone: zone.name,
            driver: unit.driver
        });

        this.main.notificationSystem.showZoneNotification(unit, zone, 'entry');
    }

    handleZoneExit(unit, zone) {
        zone.unitsInside.delete(unit.name);
        zone.exitLog.push({
            unit: unit.name,
            timestamp: new Date().toISOString(),
            driver: unit.driver
        });

        this.main.logData(`Unit ${unit.name} keluar zona ${zone.name}`, 'analytics', {
            unit: unit.name,
            zone: zone.name,
            driver: unit.driver
        });
    }

    toggleZones() {
        this.zoneMarkers.forEach((marker, zoneId) => {
            if (this.main.map.hasLayer(marker)) {
                this.main.map.removeLayer(marker);
            } else {
                marker.addTo(this.main.map);
            }
        });
    }

    showZoneManager() {
        const modalBody = `
            <div class="row">
                <div class="col-md-6">
                    <h6>📍 Zona Terkonfigurasi</h6>
                    <div class="list-group">
                        ${Array.from(this.zones.values()).map(zone => `
                            <div class="list-group-item">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>${zone.name}</strong>
                                        <br>
                                        <small class="text-muted">${zone.type} - ${zone.radius}m</small>
                                    </div>
                                    <span class="badge bg-primary">${zone.unitsInside.size} unit</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="col-md-6">
                    <h6>📊 Aktivitas Zona</h6>
                    <div id="zoneActivity">
                        ${this.renderZoneActivity()}
                    </div>
                </div>
            </div>
        `;

        document.getElementById('zoneManagerBody').innerHTML = modalBody;
        const modal = new bootstrap.Modal(document.getElementById('zoneManagerModal'));
        modal.show();
    }

    renderZoneActivity() {
        let activity = [];
        
        this.zones.forEach(zone => {
            if (zone.entryLog.length > 0) {
                const lastEntry = zone.entryLog[zone.entryLog.length - 1];
                activity.push({
                    zone: zone.name,
                    unit: lastEntry.unit,
                    time: lastEntry.timestamp,
                    type: 'entry'
                });
            }
        });

        if (activity.length === 0) {
            return '<div class="alert alert-info">Tidak ada aktivitas zona terkini</div>';
        }

        return activity.map(act => `
            <div class="alert alert-success mb-2">
                <small>
                    <strong>${act.unit}</strong> masuk ${act.zone}<br>
                    ${new Date(act.time).toLocaleTimeString('id-ID')}
                </small>
            </div>
        `).join('');
    }

    clearAll() {
        this.zoneMarkers.forEach(marker => {
            if (this.main.map) {
                this.main.map.removeLayer(marker);
            }
        });
        this.zoneMarkers.clear();
        this.zones.clear();
    }

    cleanup() {
        this.clearAll();
    }
}

// ==== VIOLATION DETECTOR ====
class ViolationDetector {
    constructor(mainSystem) {
        this.main = mainSystem;
        this.violations = new Map();
        this.violationTypes = {
            SPEEDING: {
                threshold: 80,
                message: 'Kecepatan berlebihan',
                penalty: 15
            },
            EXCESSIVE_IDLE: {
                threshold: 30, // minutes
                message: 'Idle terlalu lama',
                penalty: 10
            },
            FUEL_ANOMALY: {
                threshold: 1.2, // 20% more than expected
                message: 'Konsumsi bahan bakar tidak normal',
                penalty: 20
            },
            ZONE_VIOLATION: {
                message: 'Pelanggaran zona operasional',
                penalty: 25
            }
        };
    }

    initialize() {
        console.log('⚠️ Violation Detector initialized');
        this.startViolationMonitoring();
    }

    checkViolations(unit) {
        const violations = [];
        
        // Check speeding
        if (unit.speed > this.violationTypes.SPEEDING.threshold) {
            violations.push(this.createViolation('SPEEDING', unit));
        }
        
        // Check excessive idle time
        if (this.calculateIdleTime(unit) > this.violationTypes.EXCESSIVE_IDLE.threshold) {
            violations.push(this.createViolation('EXCESSIVE_IDLE', unit));
        }
        
        // Check fuel anomalies
        if (this.detectFuelAnomaly(unit)) {
            violations.push(this.createViolation('FUEL_ANOMALY', unit));
        }
        
        // Update unit violations
        if (violations.length > 0) {
            unit.analytics.violations = violations;
            this.violations.set(unit.name, violations);
            this.logViolations(unit, violations);
        }
    }

    createViolation(type, unit) {
        const violationConfig = this.violationTypes[type];
        return {
            type: type,
            message: violationConfig.message,
            penalty: violationConfig.penalty,
            timestamp: new Date().toISOString(),
            details: this.getViolationDetails(type, unit)
        };
    }

    getViolationDetails(type, unit) {
        switch(type) {
            case 'SPEEDING':
                return `Kecepatan: ${unit.speed} km/h (Maks: ${this.violationTypes.SPEEDING.threshold} km/h)`;
            case 'EXCESSIVE_IDLE':
                return `Idle time: ${this.calculateIdleTime(unit)} menit`;
            case 'FUEL_ANOMALY':
                return `Konsumsi bahan bakar di atas normal`;
            default:
                return 'Pelanggaran terdeteksi';
        }
    }

    calculateIdleTime(unit) {
        // Simple idle time calculation - in real implementation, track movement history
        return unit.speed === 0 ? 5 : 0; // Placeholder
    }

    detectFuelAnomaly(unit) {
        if (!unit.fuelUsed || unit.fuelUsed <= 0) return false;
        
        const expectedFuel = unit.distance * this.main.vehicleConfig.movingFuelConsumption;
        const ratio = unit.fuelUsed / expectedFuel;
        
        return ratio > this.violationTypes.FUEL_ANOMALY.threshold;
    }

    logViolations(unit, violations) {
        violations.forEach(violation => {
            this.main.logData(`Violation: ${violation.message} - ${unit.name}`, 'violation', {
                unit: unit.name,
                driver: unit.driver,
                violation: violation
            });
        });
    }

    updateViolationsDisplay() {
        const violationsList = document.getElementById('violationsList');
        if (!violationsList) return;

        let activeViolations = [];
        
        this.main.units.forEach(unit => {
            const unitViolations = unit.analytics.violations || [];
            activeViolations.push(...unitViolations.map(v => ({
                ...v,
                unit: unit.name,
                driver: unit.driver
            })));
        });

        if (activeViolations.length === 0) {
            violationsList.innerHTML = '<div class="alert alert-success">✅ Tidak ada pelanggaran aktif</div>';
            return;
        }

        // Show latest 5 violations
        const recentViolations = activeViolations
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        violationsList.innerHTML = recentViolations.map(violation => `
            <div class="alert alert-warning violation-alert">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${violation.unit}</strong> - ${violation.driver}
                        <br>
                        <small>${violation.message}</small>
                        <br>
                        <small class="text-muted">${new Date(violation.timestamp).toLocaleTimeString('id-ID')}</small>
                    </div>
                    <span class="badge bg-danger">-${violation.penalty}</span>
                </div>
            </div>
        `).join('');
    }

    startViolationMonitoring() {
        setInterval(() => {
            this.main.units.forEach(unit => {
                this.checkViolations(unit);
            });
        }, 30000); // Check every 30 seconds
    }

    cleanupUnit(unitName) {
        this.violations.delete(unitName);
    }

    clearAll() {
        this.violations.clear();
    }

    cleanup() {
        this.clearAll();
    }
}

// ==== FUEL MONITOR ====
class FuelMonitor {
    constructor(mainSystem) {
        this.main = mainSystem;
        this.fuelData = new Map();
        this.anomalies = new Map();
    }

    initialize() {
        console.log('⛽ Fuel Monitor initialized');
        this.startFuelMonitoring();
    }

    monitorFuelUsage(unit) {
        const expectedConsumption = this.calculateExpectedFuel(unit.distance, unit.status);
        const actualConsumption = unit.fuelUsed;
        
        if (actualConsumption > expectedConsumption * 1.2) {
            this.detectFuelTheft(unit, expectedConsumption, actualConsumption);
        }
        
        this.updateFuelEfficiency(unit);
    }

    calculateExpectedFuel(distance, status) {
        let rate;
        switch(status) {
            case 'moving': rate = this.main.vehicleConfig.movingFuelConsumption; break;
            case 'active': rate = this.main.vehicleConfig.baseFuelConsumption; break;
            default: rate = this.main.vehicleConfig.baseFuelConsumption * 0.5;
        }
        return distance * rate;
    }

    detectFuelTheft(unit, expected, actual) {
        const discrepancy = actual - expected;
        const anomaly = {
            type: 'FUEL_THEFT_SUSPICION',
            unit: unit.name,
            expected: expected,
            actual: actual,
            discrepancy: discrepancy,
            percentage: ((actual - expected) / expected) * 100,
            timestamp: new Date().toISOString()
        };
        
        this.anomalies.set(unit.name, anomaly);
        
        this.main.logData(`Fuel anomaly detected: ${unit.name}`, 'analytics', anomaly);
        this.main.notificationSystem.showFuelAnomalyAlert(anomaly);
    }

    updateFuelEfficiency(unit) {
        if (!unit.fuelUsed || unit.fuelUsed <= 0) return;
        
        const expected = this.calculateExpectedFuel(unit.distance, unit.status);
        const efficiency = (expected / unit.fuelUsed) * 100;
        unit.analytics.fuelEfficiency = Math.min(100, efficiency);
    }

    updateFuelDisplay() {
        const fuelAnomalies = document.getElementById('fuelAnomalies');
        if (!fuelAnomalies) return;

        if (this.anomalies.size === 0) {
            fuelAnomalies.innerHTML = '<div class="alert alert-success">✅ Tidak ada anomali bahan bakar</div>';
            return;
        }

        const recentAnomalies = Array.from(this.anomalies.values())
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 3);

        fuelAnomalies.innerHTML = recentAnomalies.map(anomaly => `
            <div class="alert alert-warning">
                <strong>${anomaly.unit}</strong><br>
                <small>Konsumsi: ${anomaly.actual.toFixed(1)}L (Expected: ${anomaly.expected.toFixed(1)}L)</small><br>
                <small>Selisih: <span class="text-danger">+${anomaly.discrepancy.toFixed(1)}L</span></small>
            </div>
        `).join('');

        // Update recommendations
        const recommendations = document.getElementById('fuelRecommendations');
        if (recommendations) {
            recommendations.innerHTML = `
                <div class="alert alert-info">
                    <strong>💡 Rekomendasi:</strong><br>
                    <small>• Monitor konsumsi bahan bakar real-time</small><br>
                    <small>• Investigasi anomali yang terdeteksi</small><br>
                    <small>• Optimalkan rute untuk efisiensi</small>
                </div>
            `;
        }
    }

    startFuelMonitoring() {
        setInterval(() => {
            this.main.units.forEach(unit => {
                this.monitorFuelUsage(unit);
            });
        }, 60000); // Check every minute
    }

    cleanupUnit(unitName) {
        this.fuelData.delete(unitName);
        this.anomalies.delete(unitName);
    }

    clearAll() {
        this.fuelData.clear();
        this.anomalies.clear();
    }

    cleanup() {
        this.clearAll();
    }
}

// ==== PERFORMANCE MANAGER ====
class PerformanceManager {
    constructor(mainSystem) {
        this.main = mainSystem;
        this.rankings = new Map();
        this.dailyScores = new Map();
    }

    initialize() {
        console.log('🏆 Performance Manager initialized');
        this.startRankingUpdates();
    }

    updateRankings() {
        const unitsArray = Array.from(this.main.units.values())
            .filter(unit => unit.isOnline)
            .sort((a, b) => (b.analytics.performanceScore || 0) - (a.analytics.performanceScore || 0));

        this.rankings.clear();
        unitsArray.forEach((unit, index) => {
            this.rankings.set(unit.name, {
                rank: index + 1,
                score: unit.analytics.performanceScore || 0,
                unit: unit
            });
        });

        this.updateRankingsDisplay();
    }

    getBestUnit() {
        const topRanking = Array.from(this.rankings.values())[0];
        return topRanking ? topRanking.unit.name : null;
    }

    updateRankingsDisplay() {
        const rankingList = document.getElementById('driverRanking');
        if (!rankingList) return;

        const topRankings = Array.from(this.rankings.values())
            .slice(0, 5); // Top 5 only

        if (topRankings.length === 0) {
            rankingList.innerHTML = '<div class="list-group-item text-center text-muted py-3"><small>Tidak ada data ranking</small></div>';
            return;
        }

        rankingList.innerHTML = topRankings.map(ranking => `
            <div class="list-group-item ranking-item ranking-${ranking.rank}">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="badge bg-${this.getRankColor(ranking.rank)} me-2">#${ranking.rank}</span>
                        <strong>${ranking.unit.name}</strong>
                        <br>
                        <small class="text-muted">${ranking.unit.driver}</small>
                    </div>
                    <div class="text-end">
                        <div class="text-success">⭐ ${ranking.score}</div>
                        <small class="text-muted">${ranking.unit.afdeling}</small>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getRankColor(rank) {
        switch(rank) {
            case 1: return 'warning';
            case 2: return 'secondary';
            case 3: return 'danger';
            default: return 'light';
        }
    }

    startRankingUpdates() {
        setInterval(() => {
            this.updateRankings();
        }, 30000); // Update every 30 seconds
    }

    cleanupUnit(unitName) {
        this.rankings.delete(unitName);
        this.dailyScores.delete(unitName);
    }

    clearAll() {
        this.rankings.clear();
        this.dailyScores.clear();
    }

    cleanup() {
        this.clearAll();
    }
}

// ==== HEATMAP MANAGER ====
class HeatmapManager {
    constructor(mainSystem) {
        this.main = mainSystem;
        this.heatmapLayer = null;
        this.heatmapData = [];
        this.isHeatmapActive = false;
    }

    initialize() {
        console.log('🔥 Heatmap Manager initialized');
        this.setupHeatmapControls();
    }

    setupHeatmapControls() {
        const toggle = document.getElementById('heatmapToggle');
        if (toggle) {
            toggle.addEventListener('change', (e) => {
                this.toggleHeatmap();
            });
        }
    }

    toggleHeatmap() {
        if (this.isHeatmapActive) {
            this.hideHeatmap();
        } else {
            this.showHeatmap();
        }
    }

    showHeatmap() {
        if (!this.main.map) return;
        
        this.collectHeatmapData();
        
        if (this.heatmapLayer) {
            this.main.map.removeLayer(this.heatmapLayer);
        }

        // Simple heatmap implementation using circle markers
        this.heatmapLayer = L.layerGroup();
        
        this.heatmapData.forEach(point => {
            const intensity = Math.min(point.intensity, 1);
            const radius = 20 + (intensity * 50);
            const opacity = 0.3 + (intensity * 0.4);
            
            const circle = L.circle([point.lat, point.lng], {
                radius: radius,
                color: this.getHeatmapColor(intensity),
                fillColor: this.getHeatmapColor(intensity),
                fillOpacity: opacity,
                weight: 0
            });
            
            this.heatmapLayer.addLayer(circle);
        });

        this.heatmapLayer.addTo(this.main.map);
        this.isHeatmapActive = true;
        
        // Show controls
        const controls = document.getElementById('heatmapControls');
        if (controls) {
            controls.style.display = 'block';
        }
    }

    hideHeatmap() {
        if (this.heatmapLayer && this.main.map) {
            this.main.map.removeLayer(this.heatmapLayer);
        }
        this.isHeatmapActive = false;
        
        // Hide controls
        const controls = document.getElementById('heatmapControls');
        if (controls) {
            controls.style.display = 'none';
        }
    }

    collectHeatmapData() {
        this.heatmapData = [];
        
        this.main.units.forEach(unit => {
            if (unit.isOnline) {
                // Add current position
                this.heatmapData.push({
                    lat: unit.latitude,
                    lng: unit.longitude,
                    intensity: 0.8
                });
                
                // Add historical points
                const history = this.main.unitHistory.get(unit.name) || [];
                history.forEach(point => {
                    this.heatmapData.push({
                        lat: point.latitude,
                        lng: point.longitude,
                        intensity: 0.3
                    });
                });
            }
        });
    }

    getHeatmapColor(intensity) {
        // Green to red gradient based on intensity
        if (intensity < 0.3) return '#00ff00';
        if (intensity < 0.6) return '#ffff00';
        return '#ff0000';
    }

    clearAll() {
        this.hideHeatmap();
        this.heatmapData = [];
    }

    cleanup() {
        this.clearAll();
    }
}

// ==== MAINTENANCE PREDICTOR ====
class MaintenancePredictor {
    constructor(mainSystem) {
        this.main = mainSystem;
        this.maintenanceSchedule = new Map();
    }

    initialize() {
        console.log('🔧 Maintenance Predictor initialized');
        this.setupMaintenanceSchedule();
    }

    initializeUnit(unit) {
        this.maintenanceSchedule.set(unit.name, {
            oilChange: this.calculateNextMaintenance(unit.distance, this.main.vehicleConfig.maintenanceIntervals.oilChange),
            tireRotation: this.calculateNextMaintenance(unit.distance, this.main.vehicleConfig.maintenanceIntervals.tireRotation),
            brakeService: this.calculateNextMaintenance(unit.distance, this.main.vehicleConfig.maintenanceIntervals.brakeService),
            majorService: this.calculateNextMaintenance(unit.distance, this.main.vehicleConfig.maintenanceIntervals.majorService)
        });
    }

    calculateNextMaintenance(currentDistance, interval) {
        const nextService = Math.ceil(currentDistance / interval) * interval;
        const remaining = nextService - currentDistance;
        
        return {
            nextService: nextService,
            remaining: Math.max(0, remaining),
            dueSoon: remaining < 500,
            urgent: remaining < 100,
            status: remaining < 100 ? 'urgent' : remaining < 500 ? 'warning' : 'good'
        };
    }

    getUnitMaintenance(unitName) {
        return this.maintenanceSchedule.get(unitName);
    }

    updateMaintenancePredictions() {
        this.main.units.forEach(unit => {
            const schedule = this.maintenanceSchedule.get(unit.name);
            if (schedule) {
                // Update predictions based on current distance
                Object.keys(schedule).forEach(service => {
                    const interval = this.getServiceInterval(service);
                    schedule[service] = this.calculateNextMaintenance(unit.distance, interval);
                });
            }
        });
    }

    getServiceInterval(service) {
        return this.main.vehicleConfig.maintenanceIntervals[service] || 10000;
    }

    updateMaintenanceDisplay() {
        const maintenanceSchedule = document.getElementById('maintenanceSchedule');
        if (!maintenanceSchedule) return;

        let urgentMaintenance = [];

        this.main.units.forEach(unit => {
            const maintenance = this.maintenanceSchedule.get(unit.name);
            if (maintenance) {
                Object.entries(maintenance).forEach(([service, data]) => {
                    if (data.urgent || data.dueSoon) {
                        urgentMaintenance.push({
                            unit: unit.name,
                            service: service,
                            remaining: data.remaining,
                            status: data.status
                        });
                    }
                });
            }
        });

        if (urgentMaintenance.length === 0) {
            maintenanceSchedule.innerHTML = '<div class="alert alert-success">✅ Tidak ada maintenance mendesak</div>';
            return;
        }

        maintenanceSchedule.innerHTML = urgentMaintenance.map(maint => `
            <div class="alert alert-${maint.status === 'urgent' ? 'danger' : 'warning'}">
                <strong>${maint.unit}</strong> - ${maint.service.replace(/([A-Z])/g, ' $1')}
                <br>
                <small>Tersisa: ${maint.remaining} km</small>
            </div>
        `).join('');
    }

    cleanupUnit(unitName) {
        this.maintenanceSchedule.delete(unitName);
    }

    clearAll() {
        this.maintenanceSchedule.clear();
    }

    cleanup() {
        this.clearAll();
    }
}

// ==== NOTIFICATION SYSTEM ====
class NotificationSystem {
    constructor(mainSystem) {
        this.main = mainSystem;
        this.notifications = new Map();
    }

    initialize() {
        console.log('🔔 Notification System initialized');
    }

    showZoneNotification(unit, zone, type) {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type === 'entry' ? 'info' : 'warning'} notification-item`;
        notification.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>📍 ${type === 'entry' ? 'Masuk' : 'Keluar'} Zona</strong>
                    <div class="small">${unit.name} - ${zone.name}</div>
                    <div class="small text-muted">${unit.driver}</div>
                </div>
                <button type="button" class="btn-close btn-sm" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;

        this.addNotificationToPanel(notification);
    }

    showFuelAnomalyAlert(anomaly) {
        const notification = document.createElement('div');
        notification.className = 'alert alert-danger notification-item';
        notification.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>⛽ Anomali Bahan Bakar</strong>
                    <div class="small">${anomaly.unit} - ${anomaly.percentage.toFixed(1)}% di atas normal</div>
                    <div class="small text-muted">Selisih: ${anomaly.discrepancy.toFixed(2)}L</div>
                </div>
                <button type="button" class="btn-close btn-sm" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;

        this.addNotificationToPanel(notification);
    }

    addNotificationToPanel(notification) {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.appendChild(notification);
            
            // Auto-remove after 10 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 10000);
        }
    }

    clearAll() {
        this.notifications.clear();
    }

    cleanup() {
        this.clearAll();
    }
}

// ==== REPORT GENERATOR ====
class ReportGenerator {
    constructor(mainSystem) {
        this.main = mainSystem;
    }

    generateDailyReport() {
        const report = {
            date: new Date().toISOString().split('T')[0],
            summary: {
                totalUnits: this.main.units.size,
                activeUnits: this.main.activeUnits,
                totalDistance: this.main.totalDistance,
                totalFuel: this.main.totalFuelConsumption,
                averageScore: this.main.avgPerformanceScore,
                totalViolations: this.main.totalViolations
            },
            unitDetails: [],
            recommendations: this.generateRecommendations()
        };

        this.main.units.forEach(unit => {
            report.unitDetails.push({
                name: unit.name,
                driver: unit.driver,
                afdeling: unit.afdeling,
                distance: unit.distance,
                fuelUsed: unit.fuelUsed,
                performanceScore: unit.analytics.performanceScore,
                violations: unit.analytics.violations?.length || 0,
                efficiency: unit.analytics.efficiency || 0
            });
        });

        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.main.avgPerformanceScore < 70) {
            recommendations.push('Tingkatkan efisiensi operasional unit');
        }
        
        if (this.main.totalViolations > 5) {
            recommendations.push('Perketat monitoring pelanggaran');
        }
        
        if (this.main.totalFuelConsumption / this.main.totalDistance > 0.3) {
            recommendations.push('Optimalkan konsumsi bahan bakar');
        }

        return recommendations;
    }

    exportDailyReport() {
        const report = this.generateDailyReport();
        const dataStr = JSON.stringify(report, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `laporan-harian-${report.date}.json`;
        link.click();
        
        this.main.logData('Laporan harian diexport', 'success');
    }
}

// Initialize the advanced system
let gpsSystem;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded - Starting Advanced GPS Analytics System');
    
    if (window.gpsSystem) {
        console.log('🧹 Cleaning up existing GPS System instance');
        window.gpsSystem.cleanup();
    }
    
    try {
        gpsSystem = new AdvancedSAGMGpsTracking();
        window.gpsSystem = gpsSystem;
        console.log('✅ Advanced GPS Analytics System initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize GPS System:', error);
        const notification = document.createElement('div');
        notification.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            <strong>System Error:</strong> Gagal memulai sistem GPS Analytics. Silakan refresh halaman.
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.body.appendChild(notification);
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.gpsSystem) {
        console.log('🧹 Cleaning up GPS System before page unload');
        window.gpsSystem.cleanup();
    }
});

// Global functions for HTML onclick handlers
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
    const body = document.body;
    
    if (sidebar) {
        sidebar.classList.toggle('show');
        body.classList.toggle('sidebar-open');
    }
}

function toggleHeatmap() {
    if (window.gpsSystem && window.gpsSystem.heatmapManager) {
        window.gpsSystem.heatmapManager.toggleHeatmap();
    }
}

function toggleGeofencing() {
    if (window.gpsSystem && window.gpsSystem.geofencingManager) {
        window.gpsSystem.geofencingManager.toggleZones();
    }
}

function showZoneManager() {
    if (window.gpsSystem && window.gpsSystem.geofencingManager) {
        window.gpsSystem.geofencingManager.showZoneManager();
    }
}

function showUnitAnalytics(unitName) {
    if (window.gpsSystem && window.gpsSystem.analyticsEngine) {
        window.gpsSystem.analyticsEngine.showUnitAnalytics(unitName);
    }
}

// Chat functions
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
