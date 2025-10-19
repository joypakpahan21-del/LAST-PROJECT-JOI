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

// ENHANCED SAGM GPS TRACKING SYSTEM WITH WHATSAPP-STYLE CHAT
class OptimizedSAGMGpsTracking {
    constructor() {
        console.log('🚀 Initializing Enhanced GPS Tracking System with WhatsApp-style Chat...');
        
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
        
        // ✅ ENHANCED CHAT SYSTEM WITH WHATSAPP-STYLE FEATURES
        this.monitorChatRefs = new Map();
        this.monitorTypingRefs = new Map();
        this.monitorChatMessages = new Map();
        this.monitorUnreadCounts = new Map();
        this.activeChatUnit = null;
        this.isMonitorChatOpen = false;
        this.monitorChatInitialized = false;
        this.isMonitorTyping = false;
        this.monitorTypingTimeout = null;
        this.chatInputHandler = null;
        
        // Chat event handlers for cleanup
        this.chatWindowClickHandler = null;
        this.documentClickHandler = null;
        this.escapeKeyHandler = null;
        
        // Route visualization - ENHANCED with 2000 points capacity
        this.showRoutes = true;
        this.routeColors = new Map();
        this.routeControls = null;
        this.maxRoutePoints = 2000; // Increased to 2000 points
        
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
            console.log('🚀 Starting Enhanced GPS Tracking System with WhatsApp-style Chat...');
            this.setupMap();
            this.setupEventHandlers();
            this.connectToFirebase();
            this.startPeriodicTasks();
            this.setupDataLogger();
            this.testFirebaseConnection();
            
            // ✅ SETUP ENHANCED CHAT SYSTEM
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

            // Test koneksi Firebase dulu
            this.testFirebaseConnection();

            const connectionListener = database.ref('.info/connected').on('value', (snapshot) => {
                const connected = snapshot.val();
                this.updateConnectionStatus(connected);
                
                if (connected) {
                    this.logData('Firebase connected successfully', 'success');
                    setTimeout(() => this.forceCleanupInactiveUnits(), 2000);
                    
                    // ✅ FIXED: Load initial data ketika terkoneksi
                    this.loadInitialData();
                } else {
                    this.logData('Firebase disconnected', 'warning');
                    this.markAllUnitsOffline();
                }
            });
            this.firebaseListeners.set('connection', connectionListener);

            // ✅ FIXED: Gunakan 'value' event untuk real-time updates
            const unitsListener = database.ref('/units').on('value', 
                (snapshot) => {
                    try {
                        const data = snapshot.val();
                        console.log('📡 Firebase data received:', data);
                        
                        if (data && Object.keys(data).length > 0) {
                            this.debouncedProcessRealTimeData(data);
                        } else {
                            console.log('⚠️ No active units in Firebase');
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
                    
                    // Retry connection
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
        
        // Reset inactive tracker untuk units yang aktif
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
            } else {
                const newUnit = this.createNewUnit(unitName, unitData);
                if (newUnit) {
                    this.units.set(unitName, newUnit);
                    this.unitSessions.set(unitName, {
                        sessionId: unitData.sessionId,
                        startTime: currentTime,
                        lastActivity: currentTime
                    });
                    
                    // ✅ FIXED: Setup chat untuk unit baru
                    if (!this.monitorChatRefs.has(unitName)) {
                        this.setupUnitChatListener(unitName);
                    }
                    
                    this.logData(`Unit baru terdeteksi: ${unitName}`, 'success', {
                        unit: unitName,
                        driver: unitData.driver,
                        location: { lat: unitData.lat, lng: unitData.lng }
                    });
                }
            }
        });

        this.gradualCleanupInactiveUnits(activeUnits);
        this.updateStatistics();
        this.scheduleRender();
        
        // ✅ FIXED: Update unit count display
        this.updateUnitCountDisplay();
    }

    // ✅ ENHANCED UNIT COUNT DISPLAY
    updateUnitCountDisplay() {
        const activeCount = Array.from(this.units.values()).filter(unit => unit.isOnline).length;
        const totalCount = this.units.size;
        
        // Update statistics cards
        const activeUnitsElement = document.getElementById('activeUnits');
        if (activeUnitsElement) {
            activeUnitsElement.textContent = `${activeCount}/${totalCount}`;
        }
        
        const activeUnitsDetail = document.getElementById('activeUnitsDetail');
        if (activeUnitsDetail) {
            activeUnitsDetail.textContent = `${totalCount} units terdeteksi, ${activeCount} online`;
        }
        
        // Update sidebar title
        const sidebarTitle = document.querySelector('.sidebar h4');
        if (sidebarTitle) {
            const smallText = sidebarTitle.querySelector('small');
            if (smallText) {
                smallText.textContent = `Real-time: ${activeCount} aktif, ${totalCount} total`;
            }
        }
        
        console.log(`📊 Unit Count: ${activeCount} aktif dari ${totalCount} total`);
    }

    // ✅ ENHANCED LOAD INITIAL DATA
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
                    if (this.validateUnitData(unitName, unitData)) {
                        const unit = this.createNewUnit(unitName, unitData);
                        if (unit) {
                            this.units.set(unitName, unit);
                            this.lastDataTimestamps.set(unitName, Date.now());
                            loadedCount++;
                            
                            // ✅ FIXED: Setup chat untuk unit ini
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
                
                // ✅ FIXED: Update display setelah load data
                this.scheduleRender();
                this.updateUnitCountDisplay();
                
            } else {
                this.logData('No initial data found in Firebase', 'warning');
                console.log('ℹ️ No units data in Firebase - waiting for mobile app connections');
            }
            
        } catch (error) {
            console.error('❌ Failed to load initial data:', error);
            this.logData('Failed to load initial data', 'error', { error: error.message });
        } finally {
            this.showLoadingIndicator(false);
        }
    }

    // ✅ ENHANCED RENDER UNIT LIST
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
        
        // ✅ FIXED: Urutkan units berdasarkan status dan nama
        const sortedUnits = Array.from(this.units.values()).sort((a, b) => {
            // Prioritaskan yang online dan moving
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
        
        // ✅ FIXED: Update counter setelah render
        this.updateUnitCountDisplay();
    }

    // ✅ ENHANCED TEST FIREBASE CONNECTION
    testFirebaseConnection() {
        console.log('🔍 Testing Firebase connection...');
        
        this.showLoadingIndicator(true);
        
        database.ref('.info/connected').once('value')
            .then((snapshot) => {
                const connected = snapshot.val();
                console.log('📡 Firebase Connected:', connected);
                
                if (connected) {
                    // Test baca data units
                    return database.ref('/units').once('value');
                } else {
                    throw new Error('Firebase not connected');
                }
            })
            .then((unitsSnapshot) => {
                const unitsData = unitsSnapshot.val();
                const unitCount = unitsData ? Object.keys(unitsData).length : 0;
                
                alert(`Firebase Connection: CONNECTED ✅\nUnits Available: ${unitCount}`);
                this.logData(`Firebase test: CONNECTED, ${unitCount} units`, 'success');
                
                if (unitCount > 0) {
                    this.loadInitialData();
                }
            })
            .catch((error) => {
                console.error('❌ Firebase connection test failed:', error);
                alert('Firebase Connection Test: FAILED ❌\n' + error.message);
                this.logData('Firebase connection test failed', 'error', { error: error.message });
            })
            .finally(() => {
                this.showLoadingIndicator(false);
            });
    }

    // ✅ ENHANCED MAP SETUP
    setupMap() {
        try {
            console.log('🗺️ Setting up Google Maps with Leaflet...');
            
            // Set center to Kebun Tempuling area
            this.config = {
                center: [-0.396056, 102.958944], // Center of Kebun Tempuling
                zoom: 13
            };

            this.map = L.map('map').setView(this.config.center, this.config.zoom);

            // ✅ FIXED: Google Maps Satellite Layer
            const googleSatellite = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: '© Google Satellite'
            });

            // ✅ FIXED: Google Maps Road Layer (backup)
            const googleRoads = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: '© Google Maps'
            });

            // ✅ FIXED: OpenStreetMap as fallback
            const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            });

            // Add default layer
            googleSatellite.addTo(this.map);

            // Add layer control
            const baseMaps = {
                "Google Satellite": googleSatellite,
                "Google Roads": googleRoads,
                "OpenStreetMap": osmLayer
            };
            
            L.control.layers(baseMaps).addTo(this.map);
            L.control.scale({ imperial: false }).addTo(this.map);

            console.log('✅ Map setup completed with Google Satellite');
            
            // Test jika peta berhasil load
            this.map.whenReady(() => {
                console.log('🗺️ Map is ready and loaded');
                this.logData('Peta Google Satellite berhasil dimuat', 'success');
            });

            this.addLocationMarkers();

        } catch (error) {
            console.error('❌ Map setup failed:', error);
            this.displayError('Gagal menyiapkan peta: ' + error.message);
            
            // Fallback ke OpenStreetMap
            try {
                this.map = L.map('map').setView(this.config.center, this.config.zoom);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
                console.log('✅ Fallback to OpenStreetMap successful');
            } catch (fallbackError) {
                console.error('❌ Fallback juga gagal:', fallbackError);
            }
        }
    }

    // ===== EXISTING METHODS (dengan improvement) =====
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

    // ===== CHAT SYSTEM METHODS (existing) =====
    setupMonitorChatSystem() {
        console.log('💬 Initializing WhatsApp-style monitor chat system...');
        
        // Clear existing listeners first
        database.ref('/chat').off();
        
        // Listen for new chat units
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
        
        console.log('💬 WhatsApp-style monitor chat system activated');
        this.logData('Sistem chat monitor dengan fitur WhatsApp diaktifkan', 'system');
    }

    setupUnitChatListener(unitName) {
        if (this.monitorChatRefs.has(unitName)) {
            // Cleanup existing listener first
            this.cleanupUnitChatListener(unitName);
        }
        
        console.log(`💬 Setting up enhanced chat listener for unit: ${unitName}`);
        
        try {
            const chatRef = database.ref('/chat/' + unitName);
            const typingRef = database.ref('/typing/' + unitName);
            
            // Store the references
            this.monitorChatRefs.set(unitName, chatRef);
            this.monitorTypingRefs.set(unitName, typingRef);
            this.monitorChatMessages.set(unitName, []);
            this.monitorUnreadCounts.set(unitName, 0);
            
            // Listen for new messages
            const messageHandler = chatRef.on('child_added', (snapshot) => {
                const message = snapshot.val();
                if (message && message.type !== 'monitor') {
                    this.handleMonitorChatMessage(unitName, message);
                }
            });
            
            // Store the handler for cleanup
            this.firebaseListeners.set(`chat_${unitName}`, messageHandler);
            
            // Setup typing indicator listener
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
        
        // Prevent duplicates
        const messageExists = messages.some(msg => 
            msg.id === message.id || 
            (msg.timestamp === message.timestamp && msg.sender === message.sender)
        );
        
        if (messageExists) return;
        
        messages.push(message);
        
        // Update unread count if not viewing this chat
        if (this.activeChatUnit !== unitName || !this.isMonitorChatOpen) {
            const currentCount = this.monitorUnreadCounts.get(unitName) || 0;
            this.monitorUnreadCounts.set(unitName, currentCount + 1);
        }
        
        this.updateMonitorChatUI();
        this.updateMonitorChatUnitSelect();
        
        // Show notification if not viewing this chat
        if (this.activeChatUnit !== unitName || !this.isMonitorChatOpen) {
            this.showMonitorChatNotification(unitName, message);
        }
        
        // Play notification sound
        this.playMonitorNotificationSound();
        
        console.log(`💬 New message from ${unitName}:`, message);
    }

    toggleMonitorChat() {
        this.isMonitorChatOpen = !this.isMonitorChatOpen;
        const chatWindow = document.getElementById('monitorChatWindow');
        const chatToggle = document.getElementById('monitorChatToggle');
        
        if (chatWindow) {
            if (this.isMonitorChatOpen) {
                // ✅ BUKA CHAT WINDOW DENGAN ANIMASI SMOOTH
                chatWindow.style.display = 'flex';
                chatWindow.style.opacity = '0';
                chatWindow.style.transform = 'translateY(20px) scale(0.95)';
                
                // Trigger reflow
                void chatWindow.offsetWidth;
                
                // Apply smooth animation
                chatWindow.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
                chatWindow.style.opacity = '1';
                chatWindow.style.transform = 'translateY(0) scale(1)';
                
                // Update UI components
                this.updateMonitorChatUnitSelect();
                this.updateMonitorChatUI();
                
                // Auto-focus dengan delay untuk smooth experience
                setTimeout(() => {
                    const chatInput = document.getElementById('monitorChatInput');
                    if (chatInput && this.activeChatUnit) {
                        chatInput.focus();
                        chatInput.select();
                    }
                }, 350);
                
                // Update toggle button state
                if (chatToggle) {
                    chatToggle.innerHTML = '💬 Tutup Chat';
                    chatToggle.classList.add('btn-secondary');
                    chatToggle.classList.remove('btn-primary');
                }
                
            } else {
                // ✅ TUTUP CHAT WINDOW DENGAN ANIMASI SMOOTH
                chatWindow.style.transition = 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
                chatWindow.style.opacity = '0';
                chatWindow.style.transform = 'translateY(20px) scale(0.95)';
                
                // Stop typing indicator immediately
                this.stopMonitorTyping();
                
                // Update toggle button state
                if (chatToggle) {
                    chatToggle.innerHTML = '💬 Chat dengan Driver';
                    chatToggle.classList.add('btn-primary');
                    chatToggle.classList.remove('btn-secondary');
                }
                
                // Hide after animation completes
                setTimeout(() => {
                    if (!this.isMonitorChatOpen) {
                        chatWindow.style.display = 'none';
                        // Reset transform for next open
                        chatWindow.style.transform = '';
                        chatWindow.style.transition = '';
                    }
                }, 250);
            }
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

    startMonitorTyping() {
        if (!this.activeChatUnit || this.isMonitorTyping) return;
        
        const typingRef = this.monitorTypingRefs.get(this.activeChatUnit);
        if (!typingRef) return;
        
        typingRef.child('monitor').set({
            isTyping: true,
            name: 'MONITOR',
            timestamp: Date.now()
        });
        
        this.isMonitorTyping = true;
    }

    stopMonitorTyping() {
        if (!this.activeChatUnit || !this.isMonitorTyping) return;
        
        const typingRef = this.monitorTypingRefs.get(this.activeChatUnit);
        if (!typingRef) return;
        
        typingRef.child('monitor').set({
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
        const sendBtn = document.getElementById('monitorSendBtn');
        
        let typingTimer;
        
        // Chat input handlers
        if (chatInput) {
            this.chatInputHandler = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.sendMonitorMessage();
                } else {
                    // Start typing indicator on input
                    if (this.activeChatUnit) {
                        this.startMonitorTyping();
                        
                        // Clear previous timer
                        clearTimeout(typingTimer);
                        
                        // Set timer to stop typing indicator after 2 seconds of inactivity
                        typingTimer = setTimeout(() => {
                            this.stopMonitorTyping();
                        }, 2000);
                    }
                }
            };
            
            chatInput.addEventListener('keypress', this.chatInputHandler);
            chatInput.addEventListener('blur', () => this.stopMonitorTyping());
        }
        
        // Send button handler
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                this.sendMonitorMessage();
            });
        }
        
        // Unit select handler
        if (unitSelect) {
            unitSelect.addEventListener('change', (e) => {
                this.selectChatUnit(e.target.value);
            });
        }
        
        // Setup chat window behavior
        this.setupChatWindowBehavior();
    }

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

    showMonitorChatNotification(unitName, message) {
        if (!message || !message.sender) return;
        
        const notification = document.createElement('div');
        notification.className = 'alert alert-warning chat-notification';
        notification.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>💬 Pesan Baru dari ${unitName}</strong>
                    <div class="small mt-1">${message.sender}: ${this.escapeHtml(message.text)}</div>
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

    playMonitorNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (error) {
            console.log('Notification sound not supported');
        }
    }

    cleanupUnitChatListener(unitName) {
        if (this.monitorChatRefs.has(unitName)) {
            const chatRef = this.monitorChatRefs.get(unitName);
            chatRef.off();
            
            this.monitorChatRefs.delete(unitName);
            this.monitorChatMessages.delete(unitName);
            this.monitorUnreadCounts.delete(unitName);
            
            // Cleanup typing ref
            if (this.monitorTypingRefs.has(unitName)) {
                const typingRef = this.monitorTypingRefs.get(unitName);
                typingRef.off();
                this.monitorTypingRefs.delete(unitName);
            }
            
            this.updateMonitorChatUnitSelect();
            
            if (this.activeChatUnit === unitName) {
                this.activeChatUnit = null;
                this.updateMonitorChatUI();
            }
            
            console.log(`💬 Stopped listening to chat for unit: ${unitName}`);
        }
    }

    cleanupChatEventListeners() {
        const chatWindow = document.getElementById('monitorChatWindow');
        const chatInput = document.getElementById('monitorChatInput');
        
        if (chatWindow && this.chatWindowClickHandler) {
            chatWindow.removeEventListener('click', this.chatWindowClickHandler);
        }
        
        if (this.documentClickHandler) {
            document.removeEventListener('click', this.documentClickHandler);
        }
        
        if (this.escapeKeyHandler) {
            document.removeEventListener('keydown', this.escapeKeyHandler);
        }
        
        if (chatInput && this.chatInputHandler) {
            chatInput.removeEventListener('keypress', this.chatInputHandler);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== EXISTING METHODS (lanjutan) =====
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

    // ===== SYSTEM METHODS =====
    refreshData() {
        console.log('🔄 Manual refresh with cleanup');
        this.logData('Manual refresh initiated', 'info');
        this.forceCleanupInactiveUnits();
        this.loadInitialData();
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
        this.monitorTypingRefs.clear();
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

    // ===== DATA LOGGER METHODS =====
    setupDataLogger() {
        this.loadLogs();
        this.renderLogger();
        this.startAutoExport();
        
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

    markAllUnitsOffline() {
        this.units.forEach(unit => {
            unit.isOnline = false;
        });
        this.scheduleRender();
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

    // ===== POLYLINE SYSTEM =====
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

        // Maintain 2000 points limit
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

    // ===== DEBUG PANEL =====
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
                        <strong>Last Update:</strong> 
                        <span id="debugLastUpdate">${new Date().toLocaleTimeString()}</span>
                    </div>
                    <button class="btn btn-sm btn-warning w-100" onclick="window.gpsSystem.testFirebaseConnection()">
                        Test Connection
                    </button>
                    <button class="btn btn-sm btn-danger w-100 mt-1" onclick="forceCleanup()">
                        🧹 Force Cleanup
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', debugHtml);
        
        setInterval(() => {
            const statusElement = document.getElementById('debugFirebaseStatus');
            const unitsElement = document.getElementById('debugUnitsCount');
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
            routes: {}
        };

        this.units.forEach((unit, unitName) => {
            exportData.routes[unitName] = {
                driver: unit.driver,
                totalDistance: unit.distance,
                routePoints: this.unitHistory.get(unitName)?.length || 0,
                history: this.unitHistory.get(unitName) || []
            };
        };

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
        this.monitorTypingRefs.forEach(ref => ref.off());
        this.monitorTypingRefs.clear();
        
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

// Initialize the system
let gpsSystem;

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

// Event listener dengan enhanced cleanup
document.addEventListener('DOMContentLoaded', function() {
    if (window.gpsSystem) {
        window.gpsSystem.cleanup();
    }
    
    gpsSystem = new OptimizedSAGMGpsTracking();
    window.gpsSystem = gpsSystem;
});

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
