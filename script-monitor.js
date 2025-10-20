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
console.log('🚀 Initializing Enhanced GPS Tracking System...');
try {
    firebase.initializeApp(FIREBASE_CONFIG);
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    console.log('ℹ️ Firebase already initialized');
}
const database = firebase.database();

class EnhancedSAGMGpsTracking {
    constructor() {
        console.log('🚀 Starting Enhanced GPS Tracking System with ALL features...');
        
        // 🔄 COMPLETE MEMORY MANAGEMENT
        this.units = new Map();
        this.markers = new Map();
        this.unitPolylines = new Map();
        this.unitHistory = new Map();
        this.unitSessions = new Map();
        this.driverOnlineStatus = new Map();
        this.lastDataTimestamps = new Map();
        
        // 🧹 COMPLETE CLEANUP SYSTEM
        this.cleanupCallbacks = [];
        this.intervals = new Set();
        this.firebaseListeners = new Map();
        this.inactiveUnitTracker = new Map();
        
        // ⚡ PERFORMANCE OPTIMIZATION
        this.updateDebounce = null;
        this.lastRenderTime = 0;
        this.renderThrottleMs = 500;
        
        // System state - KEEP ALL STATISTICS
        this.map = null;
        this.importantMarkers = [];
        this.activeUnits = 0;
        this.totalDistance = 0;
        this.avgSpeed = 0;
        this.totalFuelConsumption = 0;
        this.lastUpdate = new Date();
        
        // ✅ COMPLETE CHAT SYSTEM
        this.monitorChatRefs = new Map();
        this.monitorTypingRefs = new Map();
        this.monitorChatMessages = new Map();
        this.monitorUnreadCounts = new Map();
        this.activeChatUnit = null;
        this.isMonitorChatOpen = false;
        this.monitorChatInitialized = false;
        this.isMonitorTyping = false;
        
        // Route visualization - KEEP 2000 POINTS
        this.showRoutes = true;
        this.routeColors = new Map();
        this.maxRoutePoints = 2000;
        
        // Data Logger System - KEEP ALL LOGGING
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
            }
        };

        // Vehicle configuration - KEEP ALL SETTINGS
        this.vehicleConfig = {
            fuelEfficiency: 4.5,
            maxSpeed: 80,
            fuelTankCapacity: 100,
            baseFuelConsumption: 0.25,
            movingFuelConsumption: 0.22,
            idleFuelConsumptionPerMin: 0.013
        };

        // Important locations - KEEP ALL LOCATIONS
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

        this.initializeSystem();
    }

    // ===== INITIALIZATION METHODS =====
    initializeSystem() {
        try {
            console.log('🚀 Starting Enhanced GPS Tracking System with ALL features...');
            this.setupMap();
            this.setupEventHandlers();
            this.connectToFirebase();
            this.startPeriodicTasks();
            this.setupDataLogger();
            
            // ✅ SETUP COMPLETE CHAT SYSTEM
            this.setupMonitorChatSystem();
            
            this.testFirebaseConnection();
            
        } catch (error) {
            console.error('System initialization failed:', error);
            this.displayError('Gagal memulai sistem GPS');
        }
    }

    // ===== IMPROVED FIREBASE CONNECTION =====
    connectToFirebase() {
        try {
            console.log('🟡 Connecting to Firebase with improved setup...');
            
            this.cleanupFirebaseListeners();

            // Test connection first
            this.testFirebaseConnection();

            // Connection status listener
            const connectionListener = database.ref('.info/connected').on('value', (snapshot) => {
                const connected = snapshot.val();
                this.updateConnectionStatus(connected);
                
                if (connected) {
                    this.logData('Firebase connected successfully', 'success');
                    setTimeout(() => {
                        this.loadInitialData();
                    }, 1000);
                } else {
                    this.logData('Firebase disconnected', 'warning');
                }
            });
            this.firebaseListeners.set('connection', connectionListener);

            // MAIN DATA LISTENER - IMPROVED ERROR HANDLING
            const unitsListener = database.ref('/units').on('value', 
                (snapshot) => {
                    try {
                        const data = snapshot.val();
                        console.log('📡 Firebase data received:', data ? Object.keys(data).length + ' units' : 'no data');
                        
                        if (data && Object.keys(data).length > 0) {
                            this.processRealTimeData(data);
                        } else {
                            console.log('⚠️ No active units in Firebase');
                            this.clearAllUnits();
                        }
                    } catch (processError) {
                        console.error('❌ Error processing data:', processError);
                        this.logData('Data processing error', 'error');
                    }
                }, 
                (error) => {
                    console.error('❌ Firebase listener error:', error);
                    this.logData('Firebase listener error', 'error');
                    
                    // Auto-retry connection
                    setTimeout(() => {
                        console.log('🔄 Retrying Firebase connection...');
                        this.connectToFirebase();
                    }, 5000);
                }
            );
            this.firebaseListeners.set('units', unitsListener);

            console.log('✅ Firebase listeners setup completed');
            
        } catch (error) {
            console.error('🔥 Critical Firebase error:', error);
            setTimeout(() => this.connectToFirebase(), 5000);
        }
    }

    // ===== IMPROVED DATA PROCESSING =====
    processRealTimeData(firebaseData) {
        if (!firebaseData) {
            this.logData('No real-time data from Firebase', 'warning');
            return;
        }

        const unitCount = Object.keys(firebaseData).length;
        console.log(`🔄 Processing ${unitCount} units from Firebase`);

        const activeUnits = new Set();
        const currentTime = Date.now();
        
        Object.entries(firebaseData).forEach(([unitName, unitData]) => {
            // ✅ VALIDASI SESUAI RULES: harus ada lat, lng, driver, unit
            if (this.validateUnitDataWithRules(unitName, unitData)) {
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
                            startTime: currentTime
                        });
                        
                        // Setup chat untuk unit baru
                        if (!this.monitorChatRefs.has(unitName)) {
                            this.setupUnitChatListener(unitName);
                        }
                        
                        this.logData(`Unit baru terdeteksi: ${unitName}`, 'success');
                    }
                }
            } else {
                console.log(`❌ Data ${unitName} tidak sesuai rules Firebase`);
            }
        });

        this.gradualCleanupInactiveUnits(activeUnits);
        this.updateStatistics();
        this.scheduleRender();
        this.updateUnitCountDisplay();
    }

    // ===== VALIDATION SESUAI FIREBASE RULES =====
    validateUnitDataWithRules(unitName, unitData) {
        if (!unitData) {
            console.log(`❌ Invalid data for ${unitName}: null data`);
            return false;
        }
        
        // ✅ CHECK REQUIRED FIELDS SESUAI RULES FIREBASE
        const requiredFields = ['lat', 'lng', 'driver', 'unit'];
        const missingFields = requiredFields.filter(field => !unitData.hasOwnProperty(field));
        
        if (missingFields.length > 0) {
            console.log(`❌ Missing required fields for ${unitName}:`, missingFields);
            return false;
        }
        
        // Validate coordinate types
        const lat = parseFloat(unitData.lat);
        const lng = parseFloat(unitData.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
            console.log(`❌ Invalid coordinates for ${unitName}`);
            return false;
        }
        
        // Validate field types
        if (typeof unitData.driver !== 'string' || typeof unitData.unit !== 'string') {
            console.log(`❌ Invalid field types for ${unitName}`);
            return false;
        }
        
        return true;
    }

    // ===== CREATE UNIT SESUAI STRUCTURE =====
    createNewUnit(unitName, firebaseData) {
        // ✅ PASTIKAN DATA SESUAI DENGAN RULES
        return {
            id: this.getUnitId(unitName),
            name: unitName,
            afdeling: this.determineAfdeling(unitName),
            status: this.determineStatus(firebaseData.journeyStatus),
            latitude: parseFloat(firebaseData.lat),      // ✅ dari rules
            longitude: parseFloat(firebaseData.lng),     // ✅ dari rules
            speed: parseFloat(firebaseData.speed) || 0,
            lastUpdate: firebaseData.lastUpdate || new Date().toLocaleTimeString('id-ID'),
            distance: parseFloat(firebaseData.distance) || 0,
            fuelLevel: this.computeFuelLevel(100, firebaseData.distance, firebaseData.journeyStatus),
            fuelUsed: this.computeFuelUsage(firebaseData.distance, firebaseData.journeyStatus),
            driver: firebaseData.driver,                 // ✅ dari rules
            unit: firebaseData.unit,                     // ✅ dari rules
            accuracy: parseFloat(firebaseData.accuracy) || 0,
            batteryLevel: firebaseData.batteryLevel || null,
            lastLat: parseFloat(firebaseData.lat),       // ✅ dari rules
            lastLng: parseFloat(firebaseData.lng),       // ✅ dari rules
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
        
        unit.latitude = firebaseData.lat ? parseFloat(firebaseData.lat) : unit.latitude;
        unit.longitude = firebaseData.lng ? parseFloat(firebaseData.lng) : unit.longitude;
        unit.speed = firebaseData.speed ? parseFloat(firebaseData.speed) : unit.speed;
        unit.status = this.determineStatus(firebaseData.journeyStatus) || unit.status;
        unit.lastUpdate = firebaseData.lastUpdate || unit.lastUpdate;
        unit.driver = firebaseData.driver || unit.driver;
        unit.accuracy = firebaseData.accuracy ? parseFloat(firebaseData.accuracy) : unit.accuracy;
        unit.batteryLevel = firebaseData.batteryLevel || unit.batteryLevel;
        unit.fuelLevel = this.computeFuelLevel(100, unit.distance, unit.status);
        unit.lastLat = firebaseData.lat ? parseFloat(firebaseData.lat) : unit.lastLat;
        unit.lastLng = firebaseData.lng ? parseFloat(firebaseData.lng) : unit.lastLng;
        unit.isOnline = true;
        unit.lastFuelUpdate = now;

        this.addHistoryPoint(unit);
    }

    // ===== COMPLETE STATISTICS SYSTEM =====
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

        // Update ALL statistics elements
        this.updateElement('activeUnits', `${activeUnits}/${this.units.size}`);
        this.updateElement('totalDistance', `${totalDistance.toFixed(1)} km`);
        this.updateElement('avgSpeed', `${avgSpeed.toFixed(1)} km/h`);
        this.updateElement('totalFuel', `${totalFuel.toFixed(1)} L`);
        
        this.updateElement('activeUnitsDetail', `${unitCount} units terdeteksi`);
        this.updateElement('distanceDetail', `${this.units.size} units`);
        this.updateElement('speedDetail', `Live update`);
        this.updateElement('fuelDetail', `Berdasar jarak`);
        this.updateElement('dataCount', this.unitHistory.size);
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    // ===== COMPLETE UNIT LIST RENDER =====
    renderUnitList() {
        const unitList = document.getElementById('unitList');
        if (!unitList) return;

        if (this.units.size === 0) {
            unitList.innerHTML = `
                <div class="text-center text-muted py-4">
                    <div class="mb-2">📭</div>
                    <small>Tidak ada unit aktif</small>
                    <br>
                    <small class="text-muted">Menunggu koneksi dari driver mobile...</small>
                    <br>
                    <small class="text-muted">Pastikan driver sudah login di aplikasi mobile</small>
                </div>
            `;
            return;
        }

        unitList.innerHTML = '';
        
        const sortedUnits = Array.from(this.units.values()).sort((a, b) => {
            if (a.isOnline !== b.isOnline) return b.isOnline - a.isOnline;
            if (a.status !== b.status) {
                const statusOrder = { 'moving': 3, 'active': 2, 'inactive': 1 };
                return statusOrder[b.status] - statusOrder[a.status];
            }
            return a.name.localeCompare(b.name);
        });

        sortedUnits.forEach(unit => {
            const unitElement = document.createElement('div');
            unitElement.className = `unit-item ${unit.status} ${unit.isOnline ? 'online' : 'offline'}`;
            unitElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">
                            ${unit.name} 
                            ${unit.isOnline ? '🟢' : '🔴'}
                            ${unit.status === 'moving' ? '🚗' : ''}
                        </h6>
                        <small class="text-muted">${unit.afdeling} - ${unit.driver || 'No Driver'}</small>
                    </div>
                    <span class="badge ${unit.status === 'active' ? 'bg-success' : unit.status === 'moving' ? 'bg-warning' : 'bg-danger'}">
                        ${unit.status === 'active' ? 'Aktif' : unit.status === 'moving' ? 'Berjalan' : 'Non-Aktif'}
                    </span>
                </div>
                <div class="mt-2">
                    <small class="text-muted d-block">
                        📍 Lokasi: ${unit.latitude.toFixed(4)}, ${unit.longitude.toFixed(4)}
                    </small>
                    <small class="text-muted d-block">
                        🚀 Kecepatan: <strong>${unit.speed.toFixed(1)} km/h</strong>
                    </small>
                    <small class="text-muted d-block">
                        📏 Jarak: <strong>${unit.distance.toFixed(2)} km</strong>
                    </small>
                    <small class="text-muted d-block">
                        ⛽ Bahan Bakar: <strong>${unit.fuelLevel.toFixed(1)}%</strong>
                    </small>
                    <small class="text-muted d-block">
                        ⏰ Update: <strong>${unit.lastUpdate}</strong>
                    </small>
                </div>
                <div class="mt-2">
                    <button class="btn btn-sm btn-outline-primary w-100" onclick="selectChatUnit('${unit.name}')">
                        💬 Chat dengan ${unit.driver || 'Driver'}
                    </button>
                </div>
            `;
            unitList.appendChild(unitElement);
        });
        
        this.updateUnitCountDisplay();
    }

    updateUnitCountDisplay() {
        const activeCount = Array.from(this.units.values()).filter(unit => unit.isOnline).length;
        const totalCount = this.units.size;
        
        const activeUnitsElement = document.getElementById('activeUnits');
        if (activeUnitsElement) {
            activeUnitsElement.textContent = `${activeCount}/${totalCount}`;
        }
        
        const activeUnitsDetail = document.getElementById('activeUnitsDetail');
        if (activeUnitsDetail) {
            activeUnitsDetail.textContent = `${totalCount} units terdeteksi, ${activeCount} online`;
        }
        
        console.log(`📊 Unit Count: ${activeCount} aktif dari ${totalCount} total`);
    }

    // ===== COMPLETE MAP SYSTEM =====
    setupMap() {
        try {
            console.log('🗺️ Setting up Google Maps with Leaflet...');
            
            this.config = {
                center: [-0.396056, 102.958944],
                zoom: 13
            };

            this.map = L.map('map').setView(this.config.center, this.config.zoom);

            const googleSatellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: '© Google Satellite'
            });

            const googleRoads = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: '© Google Maps'
            });

            const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            });

            googleSatellite.addTo(this.map);

            const baseMaps = {
                "Google Satellite": googleSatellite,
                "Google Roads": googleRoads,
                "OpenStreetMap": osmLayer
            };
            
            L.control.layers(baseMaps).addTo(this.map);
            L.control.scale({ imperial: false }).addTo(this.map);

            console.log('✅ Map setup completed');
            
            this.map.whenReady(() => {
                console.log('🗺️ Map is ready and loaded');
                this.logData('Peta Google Satellite berhasil dimuat', 'success');
            });

            this.addLocationMarkers();

        } catch (error) {
            console.error('❌ Map setup failed:', error);
            this.displayError('Gagal menyiapkan peta: ' + error.message);
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

    // ===== COMPLETE MAP MARKERS SYSTEM =====
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

    // ===== COMPLETE CHAT SYSTEM =====
    setupMonitorChatSystem() {
        console.log('💬 Initializing WhatsApp-style monitor chat system...');
        
        database.ref('/chat').on('child_added', (snapshot) => {
            const unitName = snapshot.key;
            console.log(`💬 New chat unit detected: ${unitName}`);
            if (!this.monitorChatRefs.has(unitName)) {
                this.setupUnitChatListener(unitName);
            }
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
        
        console.log('💬 WhatsApp-style monitor chat system activated');
    }

    setupUnitChatListener(unitName) {
        if (this.monitorChatRefs.has(unitName)) {
            this.cleanupUnitChatListener(unitName);
        }
        
        console.log(`💬 Setting up chat listener for unit: ${unitName}`);
        
        try {
            const chatRef = database.ref('/chat/' + unitName);
            const typingRef = database.ref('/typing/' + unitName);
            
            this.monitorChatRefs.set(unitName, chatRef);
            this.monitorTypingRefs.set(unitName, typingRef);
            this.monitorChatMessages.set(unitName, []);
            this.monitorUnreadCounts.set(unitName, 0);
            
            const messageHandler = chatRef.on('child_added', (snapshot) => {
                const message = snapshot.val();
                if (message && message.type !== 'monitor') {
                    this.handleMonitorChatMessage(unitName, message);
                }
            });
            
            this.firebaseListeners.set(`chat_${unitName}`, messageHandler);
            
            const typingHandler = typingRef.on('value', (snapshot) => {
                const typingData = snapshot.val();
                this.handleMonitorTypingIndicator(unitName, typingData);
            });
            
            this.firebaseListeners.set(`typing_${unitName}`, typingHandler);

            this.updateMonitorChatUnitSelect();
            console.log(`💬 Now actively listening to chat for unit: ${unitName}`);
            
        } catch (error) {
            console.error(`❌ Failed to setup chat listener for ${unitName}:`, error);
        }
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
        
        if (this.activeChatUnit !== unitName || !this.isMonitorChatOpen) {
            const currentCount = this.monitorUnreadCounts.get(unitName) || 0;
            this.monitorUnreadCounts.set(unitName, currentCount + 1);
        }
        
        this.updateMonitorChatUI();
        this.updateMonitorChatUnitSelect();
        
        if (this.activeChatUnit !== unitName || !this.isMonitorChatOpen) {
            this.showMonitorChatNotification(unitName, message);
        }
        
        this.playMonitorNotificationSound();
        
        console.log(`💬 New message from ${unitName}:`, message);
    }

    // ... (Lanjutkan dengan semua method chat system yang ada sebelumnya)

    // ===== COMPLETE DATA LOGGER =====
    setupDataLogger() {
        this.loadLogs();
        this.renderLogger();
        
        this.logData('Enhanced GPS Monitoring System with WhatsApp-style Chat initialized', 'system', {
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

    // ===== IMPROVED FIREBASE TEST =====
    testFirebaseConnection() {
        console.log('🔍 Testing Firebase connection...');
        
        this.showLoadingIndicator(true);
        
        database.ref('.info/connected').once('value')
            .then((snapshot) => {
                const connected = snapshot.val();
                console.log('📡 Firebase Connected:', connected);
                
                if (connected) {
                    return database.ref('/units').once('value');
                } else {
                    throw new Error('Firebase not connected');
                }
            })
            .then((unitsSnapshot) => {
                const unitsData = unitsSnapshot.val();
                const unitCount = unitsData ? Object.keys(unitsData).length : 0;
                
                this.showNotification(`Firebase Connection: CONNECTED ✅\nUnits Available: ${unitCount}`, 'success');
                this.logData(`Firebase test: CONNECTED, ${unitCount} units`, 'success');
                
                if (unitCount > 0) {
                    this.loadInitialData();
                }
            })
            .catch((error) => {
                console.error('❌ Firebase connection test failed:', error);
                this.showNotification('Firebase Connection Test: FAILED ❌\n' + error.message, 'error');
                this.logData('Firebase connection test failed', 'error');
            })
            .finally(() => {
                this.showLoadingIndicator(false);
            });
    }

    async loadInitialData() {
        this.showLoadingIndicator(true);
        
        try {
            console.log('📥 Loading initial data from Firebase...');
            const snapshot = await database.ref('/units').once('value');
            const firebaseData = snapshot.val();
            
            this.clearAllData();
            
            if (firebaseData && Object.keys(firebaseData).length > 0) {
                let loadedCount = 0;
                
                Object.entries(firebaseData).forEach(([unitName, unitData]) => {
                    if (this.validateUnitDataWithRules(unitName, unitData)) {
                        const unit = this.createNewUnit(unitName, unitData);
                        if (unit) {
                            this.units.set(unitName, unit);
                            this.lastDataTimestamps.set(unitName, Date.now());
                            loadedCount++;
                            
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
                
                this.scheduleRender();
                this.updateUnitCountDisplay();
                
            } else {
                this.logData('No initial data found in Firebase', 'warning');
            }
            
        } catch (error) {
            console.error('❌ Failed to load initial data:', error);
            this.logData('Failed to load initial data', 'error');
        } finally {
            this.showLoadingIndicator(false);
        }
    }

    // ===== UTILITY METHODS =====
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

    showLoadingIndicator(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'block' : 'none';
        }
    }

    displayError(message) {
        this.logData(message, 'error');
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} position-fixed`;
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

    // ===== CLEANUP METHODS =====
    gradualCleanupInactiveUnits(activeUnits) {
        const now = Date.now();
        const inactiveThreshold = 30000;

        this.units.forEach((unit, unitName) => {
            if (!activeUnits.has(unitName)) {
                const currentCount = this.inactiveUnitTracker.get(unitName) || 0;
                this.inactiveUnitTracker.set(unitName, currentCount + 1);
                
                const timeSinceLastUpdate = now - (this.lastDataTimestamps.get(unitName) || 0);
                
                if (timeSinceLastUpdate > inactiveThreshold && unit.isOnline) {
                    unit.isOnline = false;
                    this.logData(`Unit marked offline: ${unitName}`, 'warning');
                }
            } else {
                this.inactiveUnitTracker.set(unitName, 0);
            }
        });
    }

    clearAllUnits() {
        this.units.forEach((unit, unitName) => {
            this.removeUnit(unitName);
        });
    }

    removeUnit(unitName) {
        const marker = this.markers.get(unitName);
        if (marker && this.map) {
            this.map.removeLayer(marker);
        }
        this.markers.delete(unitName);
        
        const polyline = this.unitPolylines.get(unitName);
        if (polyline && this.map) {
            this.map.removeLayer(polyline);
        }
        this.unitPolylines.delete(unitName);
        
        this.unitHistory.delete(unitName);
        this.unitSessions.delete(unitName);
        this.driverOnlineStatus.delete(unitName);
        this.lastDataTimestamps.delete(unitName);
        this.inactiveUnitTracker.delete(unitName);
    }

    clearAllData() {
        console.log('🧹 Clearing ALL system data...');
        this.clearAllUnits();
        this.importantMarkers = [];
        this.dataLogger.logs = [];
        
        this.activeUnits = 0;
        this.totalDistance = 0;
        this.avgSpeed = 0;
        this.totalFuelConsumption = 0;
        
        this.activeChatUnit = null;
        this.isMonitorChatOpen = false;
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
                } else if (key.startsWith('chat_')) {
                    const unitName = key.replace('chat_', '');
                    if (this.monitorChatRefs.has(unitName)) {
                        this.monitorChatRefs.get(unitName).off('child_added', listener);
                    }
                } else if (key.startsWith('typing_')) {
                    const unitName = key.replace('typing_', '');
                    if (this.monitorTypingRefs.has(unitName)) {
                        this.monitorTypingRefs.get(unitName).off('value', listener);
                    }
                }
            } catch (error) {
                console.warn(`Error cleaning up listener ${key}:`, error);
            }
        });
        this.firebaseListeners.clear();
    }

    // ===== PERIODIC TASKS =====
    startPeriodicTasks() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();

        const cleanupInterval = setInterval(() => {
            this.cleanupOrphanedMarkers();
        }, 30000);
        this.intervals.add(cleanupInterval);

        const healthInterval = setInterval(() => {
            this.logData('System health check', 'info', {
                activeUnits: this.units.size,
                markers: this.markers.size
            });
        }, 60000);
        this.intervals.add(healthInterval);
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

        // Update clock
        setInterval(() => {
            this.updateElement('currentTime', new Date().toLocaleTimeString('id-ID'));
        }, 1000);
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('firebaseStatus');
        if (statusElement) {
            if (connected) {
                statusElement.innerHTML = '🟢 FIREBASE TERHUBUNG';
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

    // ... (Tambahkan method-method lain yang diperlukan)

    refreshData() {
        console.log('🔄 Manual refresh with cleanup');
        this.logData('Manual refresh initiated', 'info');
        this.testFirebaseConnection();
    }

    forceCleanupAllData() {
        console.log('🧹 FORCE CLEANUP ALL: Removing ALL units and data');
        this.clearAllData();
        this.showNotification('All data cleaned up successfully', 'info');
    }

    // Route history methods
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
        if (!history || history.length < 2) return;

        const routePoints = history.map(point => [
            point.latitude, point.longitude
        ]);

        const routeColor = this.getRouteColor(unit.name);

        if (this.unitPolylines.has(unit.name)) {
            try {
                this.unitPolylines.get(unit.name).setLatLngs(routePoints);
            } catch (error) {
                console.error('Error updating polyline:', error);
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
            const polyline = L.polyline(routePoints, style);
            
            this.unitPolylines.set(unit.name, polyline);
            
            if (this.showRoutes) {
                polyline.addTo(this.map);
            }

        } catch (error) {
            this.logData(`Failed to create route for ${unit.name}`, 'error');
        }
    }

    getRouteStyle(status, color) {
        const baseStyle = {
            color: color,
            weight: 5,
            opacity: 0.8,
            lineCap: 'round',
            lineJoin: 'round'
        };

        switch(status) {
            case 'moving':
                return { ...baseStyle, opacity: 0.9, weight: 6 };
            case 'active':
                return { ...baseStyle, opacity: 0.7, weight: 5 };
            case 'inactive':
                return { ...baseStyle, opacity: 0.4, weight: 4 };
            default:
                return baseStyle;
        }
    }

    getRouteColor(unitName) {
        if (!this.routeColors.has(unitName)) {
            const colors = [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
                '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
            ];
            this.routeColors.set(unitName, colors[this.routeColors.size % colors.length]);
        }
        return this.routeColors.get(unitName);
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
        
        this.logData('Logs exported successfully', 'success');
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

    cleanup() {
        console.log('🧹 Comprehensive system cleanup...');
        this.cleanupFirebaseListeners();
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();
        this.clearAllData();
        
        if (this.map) {
            this.map.remove();
        }
    }
}

// Global functions
function refreshData() {
    if (window.gpsSystem) {
        window.gpsSystem.refreshData();
    }
}

function forceCleanup() {
    if (window.gpsSystem) {
        window.gpsSystem.forceCleanupAllData();
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

// Chat global functions
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

// Initialize system
let gpsSystem;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded - initializing Enhanced GPS system');
    
    if (window.gpsSystem) {
        window.gpsSystem.cleanup();
    }
    
    gpsSystem = new EnhancedSAGMGpsTracking();
    window.gpsSystem = gpsSystem;
});

window.addEventListener('beforeunload', function() {
    if (window.gpsSystem) {
        window.gpsSystem.cleanup();
    }
});
