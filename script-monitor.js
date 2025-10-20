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
console.log('🚀 Initializing Fixed GPS Tracking System...');

// ✅ FIXED: Firebase Initialization yang benar
if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
    console.log('✅ Firebase initialized successfully');
} else {
    console.log('ℹ️ Firebase already initialized');
}

const database = firebase.database();

class FixedGPSMonitor {
    constructor() {
        console.log('🚀 Starting Fixed GPS Monitor with Real-time Fix...');
        
        // Core data structures
        this.units = new Map();
        this.markers = new Map();
        this.accuracyCircles = new Map();
        this.intervals = new Set();
        
        // System state
        this.map = null;
        this.firebaseListener = null;
        this.isConnected = false;
        this.connectionRef = null;
        
        // UI elements cache
        this.uiElements = {};
        
        // GPS Accuracy Configuration
        this.gpsAccuracyLevels = {
            EXCELLENT: { max: 5, color: '#28a745', label: 'Excellent', icon: '🎯' },
            GOOD: { max: 15, color: '#17a2b8', label: 'Good', icon: '✅' },
            FAIR: { max: 30, color: '#ffc107', label: 'Fair', icon: '⚠️' },
            POOR: { max: 50, color: '#dc3545', label: 'Poor', icon: '🔻' },
            VERY_POOR: { max: Infinity, color: '#343a40', label: 'Very Poor', icon: '❌' }
        };

        this.initializeSystem();
    }

    // ✅ PERBAIKAN: Initialization Sequence yang benar
    async initializeSystem() {
        try {
            console.log('🔧 Initializing Fixed GPS Monitor System...');
            
            // 1. Cache UI elements dulu
            this.cacheUIElements();
            
            // 2. Setup map SEBELUM yang lain
            await this.setupMap();
            
            // 3. Setup UI handlers
            this.setupUIEventHandlers();
            
            // 4. Test Firebase connection
            await this.testFirebaseConnection();
            
            // 5. Setup Firebase listeners
            this.setupFirebaseListeners();
            
            // 6. Start periodic tasks
            this.startPeriodicTasks();
            
            console.log('✅ Fixed GPS Monitor System initialized successfully');
            this.showNotification('System initialized successfully', 'success');
            
        } catch (error) {
            console.error('❌ System initialization failed:', error);
            this.showError('System initialization failed: ' + error.message);
        }
    }

    cacheUIElements() {
        // Cache frequently used UI elements
        this.uiElements = {
            activeUnits: document.getElementById('activeUnits'),
            totalDistance: document.getElementById('totalDistance'),
            avgSpeed: document.getElementById('avgSpeed'),
            totalFuel: document.getElementById('totalFuel'),
            currentTime: document.getElementById('currentTime'),
            firebaseStatus: document.getElementById('firebaseStatus'),
            unitList: document.getElementById('unitList'),
            loadingSpinner: document.getElementById('loadingSpinner'),
            activeUnitsDetail: document.getElementById('activeUnitsDetail'),
            dataCount: document.getElementById('dataCount')
        };
    }

    // ✅ PERBAIKAN: Setup Map yang lebih robust dengan error handling
    async setupMap() {
        try {
            console.log('🗺️ Setting up Map...');
            
            // TUNGGU sampai DOM benar-benar ready
            await this.waitForElement('#map');
            
            const mapElement = document.getElementById('map');
            if (!mapElement) {
                console.error('❌ Map element not found after waiting');
                return;
            }

            // FORCE styling dan pastikan visible
            mapElement.style.cssText = `
                height: 500px !important;
                width: 100% !important;
                min-height: 400px;
                border-radius: 8px;
                background: #f8f9fa;
                position: relative;
            `;

            // Pastikan parent container juga punya height
            const mapContainer = mapElement.closest('.card-body');
            if (mapContainer) {
                mapContainer.style.minHeight = '500px';
            }

            console.log('📍 Map element ready, initializing Leaflet...');

            // Initialize map dengan error handling
            this.map = L.map('map', {
                center: [-0.396056, 102.958944],
                zoom: 13,
                zoomControl: true,
                attributionControl: true
            });

            // Add base layer dengan fallback
            const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            });

            osmLayer.addTo(this.map);
            
            // Test Google Satellite sebagai alternatif
            try {
                const googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    subdomains: ['mt0','mt1','mt2','mt3'],
                    attribution: '© Google'
                });
                
                // Add layer control
                const baseMaps = {
                    "OpenStreetMap": osmLayer,
                    "Google Satellite": googleSat
                };
                
                L.control.layers(baseMaps).addTo(this.map);
                
            } catch (googleError) {
                console.log('⚠️ Google Satellite failed, using OSM only');
            }

            // Force map refresh
            this.map.whenReady(() => {
                console.log('✅ Map initialized successfully');
                setTimeout(() => {
                    this.map.invalidateSize(true); // ❗FORCE REFRESH
                    console.log('🔄 Map size invalidated');
                }, 100);
            });

            // Add scale control
            L.control.scale({ imperial: false }).addTo(this.map);
            
            // Add accuracy legend
            this.addAccuracyLegend();
            
            // Add important locations
            this.addImportantLocations();
            
            console.log('🗺️ Map setup completed');

        } catch (error) {
            console.error('❌ Map setup failed:', error);
            this.showError(`Gagal memuat peta: ${error.message}`);
            
            // Fallback: coba buat map sederhana
            this.createFallbackMap();
        }
    }

    // Helper function untuk menunggu element
    waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations, obs) => {
                const element = document.querySelector(selector);
                if (element) {
                    obs.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    // Fallback map sederhana
    createFallbackMap() {
        try {
            console.log('🔄 Creating fallback map...');
            this.map = L.map('map').setView([-0.396056, 102.958944], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}/png').addTo(this.map);
            console.log('✅ Fallback map created');
        } catch (fallbackError) {
            console.error('❌ Fallback map also failed:', fallbackError);
        }
    }

    addAccuracyLegend() {
        try {
            const accuracyLegend = L.control({ position: 'bottomright' });
            
            accuracyLegend.onAdd = (map) => {
                const div = L.DomUtil.create('div', 'accuracy-legend');
                div.innerHTML = `
                    <h6>🎯 GPS Accuracy</h6>
                    <div class="accuracy-legend-item">
                        <div class="accuracy-color" style="background-color: #28a745"></div>
                        <span>±5m (Excellent)</span>
                    </div>
                    <div class="accuracy-legend-item">
                        <div class="accuracy-color" style="background-color: #17a2b8"></div>
                        <span>±15m (Good)</span>
                    </div>
                    <div class="accuracy-legend-item">
                        <div class="accuracy-color" style="background-color: #ffc107"></div>
                        <span>±30m (Fair)</span>
                    </div>
                    <div class="accuracy-legend-item">
                        <div class="accuracy-color" style="background-color: #dc3545"></div>
                        <span>±50m (Poor)</span>
                    </div>
                    <div class="accuracy-legend-item">
                        <div class="accuracy-color" style="background-color: #343a40"></div>
                        <span>>50m (Very Poor)</span>
                    </div>
                `;
                return div;
            };
            
            accuracyLegend.addTo(this.map);
        } catch (error) {
            console.log('⚠️ Accuracy legend failed:', error);
        }
    }

    addImportantLocations() {
        try {
            const importantLocations = {
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

            Object.values(importantLocations).forEach(location => {
                const icon = L.divIcon({
                    className: 'important-marker',
                    html: `<div class="marker-icon ${location.type}" title="${location.name}">${location.type === 'pks' ? '🏭' : '🏢'}</div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                L.marker([location.lat, location.lng], { icon: icon })
                    .bindPopup(`
                        <div class="location-popup">
                            <strong>${location.name}</strong><br>
                            Type: ${location.type === 'pks' ? 'Pabrik Kelapa Sawit' : 'Kantor Operasional'}<br>
                            Status: Operational
                        </div>
                    `)
                    .addTo(this.map);
            });
        } catch (error) {
            console.log('⚠️ Important locations failed:', error);
        }
    }

    setupUIEventHandlers() {
        try {
            // Search functionality
            const searchInput = document.getElementById('searchUnit');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
            }

            // Filter functionality
            const filters = ['filterAfdeling', 'filterStatus', 'filterFuel'];
            filters.forEach(filterId => {
                const filter = document.getElementById(filterId);
                if (filter) {
                    filter.addEventListener('change', () => this.applyFilters());
                }
            });

            // Update clock every second
            setInterval(() => {
                this.updateElement('currentTime', new Date().toLocaleTimeString('id-ID'));
            }, 1000);

            console.log('✅ UI event handlers setup completed');
        } catch (error) {
            console.log('⚠️ UI event handlers setup failed:', error);
        }
    }

    async testFirebaseConnection() {
        console.log('🔍 Testing Firebase connection...');
        
        this.showLoading(true);
        
        return new Promise((resolve, reject) => {
            this.connectionRef = database.ref('.info/connected');
            
            const connectionHandler = this.connectionRef.on('value', (snapshot) => {
                const connected = snapshot.val();
                console.log('📡 Firebase connection state:', connected);
                
                if (connected) {
                    console.log('✅ Firebase connected successfully');
                    this.isConnected = true;
                    this.updateConnectionStatus(true);
                    this.showLoading(false);
                    
                    // Test data access (READ ONLY - tidak membuat data test)
                    database.ref('/units').once('value')
                        .then((snapshot) => {
                            const data = snapshot.val();
                            const unitCount = data ? Object.keys(data).length : 0;
                            console.log(`📊 Initial units count: ${unitCount}`);
                            
                            // ✅ TIDAK membuat data test otomatis
                            console.log('ℹ️ No automatic test data creation - using real data only');
                            resolve(true);
                        })
                        .catch(error => {
                            console.error('❌ Data access test failed:', error);
                            reject(error);
                        });
                        
                } else {
                    console.log('❌ Firebase disconnected');
                    this.isConnected = false;
                    this.updateConnectionStatus(false);
                    this.showLoading(false);
                    reject(new Error('Firebase not connected'));
                }
            });

            // Timeout after 15 seconds
            setTimeout(() => {
                this.connectionRef.off('value', connectionHandler);
                this.showLoading(false);
                reject(new Error('Firebase connection timeout'));
            }, 15000);
        });
    }

    setupFirebaseListeners() {
        console.log('📡 Setting up Firebase REAL-TIME listeners...');
        
        // Cleanup previous listener
        this.cleanupFirebaseListeners();

        // ✅ FIXED: Enhanced listener dengan comprehensive error handling
        this.firebaseListener = database.ref('/units').on('value', 
            (snapshot) => {
                console.log('🎯 Firebase data change detected!');
                
                try {
                    const data = snapshot.val();
                    console.log('📦 Data snapshot received');
                    
                    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
                        console.log(`🔄 Processing ${Object.keys(data).length} active units`);
                        this.processRealTimeData(data);
                    } else {
                        console.log('ℹ️ No active units in Firebase database');
                        this.clearAllUnits();
                        this.showMessage('Tidak ada units aktif. Pastikan driver sudah login di aplikasi mobile.');
                    }
                } catch (error) {
                    console.error('❌ Error processing Firebase data:', error);
                    this.showError('Error processing real-time data: ' + error.message);
                }
            }, 
            (error) => {
                console.error('❌ Firebase listener error:', error);
                
                if (error.code === 'PERMISSION_DENIED') {
                    this.showError('❌ FIREBASE PERMISSION DENIED\n\nPeriksa Firebase Security Rules:\n- Pastikan path /units dapat diakses read\n- Pastikan rules mengizinkan operasi read');
                } else {
                    this.showError('Firebase connection error: ' + error.message);
                }
                
                // Auto-retry after 5 seconds
                console.log('🔄 Auto-retrying Firebase connection in 5 seconds...');
                setTimeout(() => {
                    this.setupFirebaseListeners();
                }, 5000);
            }
        );
        
        console.log('✅ Firebase real-time listener setup completed');
    }

    processRealTimeData(firebaseData) {
        if (!firebaseData) {
            console.log('⚠️ No valid data received from Firebase');
            return;
        }

        const unitCount = Object.keys(firebaseData).length;
        console.log(`🔄 Processing ${unitCount} units from Firebase`);
        
        const activeUnits = new Set();
        const currentTime = Date.now();
        
        // Process each unit
        Object.entries(firebaseData).forEach(([unitName, unitData]) => {
            console.log(`📝 Processing unit: ${unitName}`, unitData);
            
            if (this.validateUnitData(unitName, unitData)) {
                activeUnits.add(unitName);
                this.updateOrCreateUnit(unitName, unitData, currentTime);
            } else {
                console.log(`❌ Invalid data for ${unitName}, skipping`);
            }
        });

        // Cleanup units that are no longer in Firebase
        this.cleanupInactiveUnits(activeUnits);
        
        // Update UI
        this.updateDisplay();
        
        // Show success message for first load or significant changes
        if (this.units.size > 0) {
            this.showSuccess(`Real-time tracking active: ${this.units.size} units online`);
        }
    }

    // ===== ENHANCED DATA VALIDATION =====
    validateUnitData(unitName, unitData) {
        if (!unitData) {
            console.log(`❌ Invalid data for ${unitName}: null data`);
            return false;
        }
        
        // Required fields check
        const requiredFields = ['lat', 'lng', 'driver', 'unit'];
        const missingFields = requiredFields.filter(field => !unitData.hasOwnProperty(field));
        
        if (missingFields.length > 0) {
            console.log(`❌ Missing required fields for ${unitName}:`, missingFields);
            return false;
        }
        
        // Coordinate validation
        const lat = parseFloat(unitData.lat);
        const lng = parseFloat(unitData.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
            console.log(`❌ Invalid coordinates for ${unitName}`);
            return false;
        }
        
        // Coordinate range validation (Kebun Tempuling area)
        if (lat < -1 || lat > 1 || lng < 102.5 || lng > 103.5) {
            console.log(`❌ Coordinates out of range for ${unitName}: ${lat}, ${lng}`);
            return false;
        }
        
        // Timestamp validation
        if (unitData.lastUpdate && !this.validateTimestamp({ lastUpdate: unitData.lastUpdate })) {
            console.log(`❌ Invalid timestamp for ${unitName}: ${unitData.lastUpdate}`);
            return false;
        }
        
        return true;
    }

    updateOrCreateUnit(unitName, unitData, timestamp) {
        const existingUnit = this.units.get(unitName);
        
        if (existingUnit) {
            // Update existing unit
            this.refreshUnitData(existingUnit, unitData, timestamp);
        } else {
            // Create new unit
            const newUnit = this.createNewUnit(unitName, unitData, timestamp);
            if (newUnit) {
                this.units.set(unitName, newUnit);
                this.createUnitMarker(newUnit);
                this.createAccuracyCircle(newUnit);
                console.log(`✅ New unit created: ${unitName} - ${newUnit.driver}`);
            }
        }
    }

    createNewUnit(unitName, firebaseData, timestamp) {
        return {
            id: this.getUnitId(unitName),
            name: unitName,
            driver: firebaseData.driver || 'Unknown Driver',
            unit: firebaseData.unit || unitName,
            latitude: parseFloat(firebaseData.lat) || -0.396056,
            longitude: parseFloat(firebaseData.lng) || 102.958944,
            speed: parseFloat(firebaseData.speed) || 0,
            distance: parseFloat(firebaseData.distance) || 0,
            accuracy: parseFloat(firebaseData.accuracy) || 0,
            lastUpdate: firebaseData.lastUpdate || new Date().toLocaleTimeString('id-ID'),
            status: this.determineStatus(firebaseData.journeyStatus),
            fuelLevel: firebaseData.fuel || this.calculateFuelLevel(parseFloat(firebaseData.distance) || 0),
            isOnline: true,
            afdeling: this.determineAfdeling(unitName),
            sessionId: firebaseData.sessionId,
            lastUpdateTime: timestamp,
            batteryLevel: firebaseData.batteryLevel || null
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

    calculateFuelLevel(distance) {
        // Simple fuel calculation based on distance
        const baseFuel = 100;
        const fuelConsumptionRate = 0.25; // liters per km
        const fuelUsed = distance * fuelConsumptionRate;
        return Math.max(0, baseFuel - fuelUsed);
    }

    refreshUnitData(unit, firebaseData, timestamp) {
        unit.latitude = parseFloat(firebaseData.lat) || unit.latitude;
        unit.longitude = parseFloat(firebaseData.lng) || unit.longitude;
        unit.speed = parseFloat(firebaseData.speed) || 0;
        unit.distance = parseFloat(firebaseData.distance) || unit.distance;
        unit.accuracy = parseFloat(firebaseData.accuracy) || unit.accuracy;
        unit.lastUpdate = firebaseData.lastUpdate || new Date().toLocaleTimeString('id-ID');
        unit.driver = firebaseData.driver || unit.driver;
        unit.status = this.determineStatus(firebaseData.journeyStatus) || unit.status;
        unit.fuelLevel = firebaseData.fuel || this.calculateFuelLevel(unit.distance);
        unit.isOnline = true;
        unit.lastUpdateTime = timestamp;
        unit.batteryLevel = firebaseData.batteryLevel || unit.batteryLevel;

        // Update visual elements
        this.refreshUnitMarker(unit);
        this.refreshAccuracyCircle(unit);
    }

    updateDisplay() {
        // Update statistics
        this.updateStatistics();
        
        // Update unit list
        this.renderUnitList();
        
        // Update map markers
        this.updateMapMarkers();
    }

    updateStatistics() {
        const activeUnits = Array.from(this.units.values()).filter(unit => unit.isOnline).length;
        const totalUnits = this.units.size;
        
        let totalDistance = 0;
        let totalSpeed = 0;
        let totalFuel = 0;
        
        this.units.forEach(unit => {
            if (unit.isOnline) {
                totalDistance += unit.distance || 0;
                totalSpeed += unit.speed || 0;
                totalFuel += (100 - (unit.fuelLevel || 100)) || 0;
            }
        });
        
        const avgSpeed = totalUnits > 0 ? totalSpeed / totalUnits : 0;

        // Update UI elements
        this.updateElement('activeUnits', `${activeUnits}/${totalUnits}`);
        this.updateElement('totalDistance', `${totalDistance.toFixed(1)} km`);
        this.updateElement('avgSpeed', `${avgSpeed.toFixed(1)} km/h`);
        this.updateElement('totalFuel', `${totalFuel.toFixed(1)} L`);
        
        this.updateElement('activeUnitsDetail', `${totalUnits} units terdeteksi`);
        this.updateElement('dataCount', totalUnits.toString());
    }

    renderUnitList() {
        const unitList = this.uiElements.unitList;
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
        
        // Sort units: online first, then by status, then by name
        const sortedUnits = Array.from(this.units.values()).sort((a, b) => {
            if (a.isOnline !== b.isOnline) return b.isOnline - a.isOnline;
            if (a.status !== b.status) {
                const statusOrder = { 'moving': 3, 'active': 2, 'inactive': 1 };
                return (statusOrder[b.status] || 0) - (statusOrder[a.status] || 0);
            }
            return a.name.localeCompare(b.name);
        });

        sortedUnits.forEach(unit => {
            const accuracyBadge = this.createAccuracyBadge(unit.accuracy);
            const statusBadge = this.getStatusBadge(unit.status);
            
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
                        <small class="text-muted">${unit.afdeling} - ${unit.driver}</small>
                    </div>
                    ${statusBadge}
                </div>
                <div class="mt-2">
                    <small class="text-muted d-block">
                        📍 Lokasi: ${unit.latitude.toFixed(6)}, ${unit.longitude.toFixed(6)}
                    </small>
                    <small class="text-muted d-block">
                        🚀 Kecepatan: <strong>${unit.speed.toFixed(1)} km/h</strong>
                    </small>
                    <small class="text-muted d-block">
                        🎯 Akurasi: ${accuracyBadge}
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
                    ${unit.batteryLevel ? `
                    <small class="text-muted d-block">
                        🔋 Baterai: <strong>${unit.batteryLevel}%</strong>
                    </small>
                    ` : ''}
                </div>
                ${unit.accuracy > 30 ? `
                <div class="alert alert-warning py-1 mt-2">
                    <small>⚠️ Akurasi GPS rendah (±${unit.accuracy.toFixed(1)}m)</small>
                </div>
                ` : ''}
                <div class="mt-2">
                    <button class="btn btn-sm btn-outline-primary w-100" onclick="window.gpsMonitor.startChat('${unit.name}')">
                        💬 Chat dengan ${unit.driver}
                    </button>
                </div>
            `;
            unitList.appendChild(unitElement);
        });
    }

    getStatusBadge(status) {
        const badges = {
            'moving': '<span class="badge bg-warning">Berjalan</span>',
            'active': '<span class="badge bg-success">Aktif</span>',
            'inactive': '<span class="badge bg-secondary">Non-Aktif</span>'
        };
        return badges[status] || '<span class="badge bg-dark">Unknown</span>';
    }

    // GPS Accuracy Methods
    getAccuracyLevel(accuracy) {
        if (accuracy <= this.gpsAccuracyLevels.EXCELLENT.max) return 'EXCELLENT';
        if (accuracy <= this.gpsAccuracyLevels.GOOD.max) return 'GOOD';
        if (accuracy <= this.gpsAccuracyLevels.FAIR.max) return 'FAIR';
        if (accuracy <= this.gpsAccuracyLevels.POOR.max) return 'POOR';
        return 'VERY_POOR';
    }

    createAccuracyBadge(accuracy) {
        const level = this.getAccuracyLevel(accuracy);
        const config = this.gpsAccuracyLevels[level];
        
        return `<span class="badge accuracy-badge" style="background-color: ${config.color}; color: white;" 
                title="Akurasi ${config.label} (±${accuracy.toFixed(1)}m)">
                ${config.icon} ${accuracy.toFixed(1)}m
                </span>`;
    }

    createUnitMarker(unit) {
        const accuracyLevel = this.getAccuracyLevel(unit.accuracy);
        const config = this.gpsAccuracyLevels[accuracyLevel];
        
        const markerIcon = L.divIcon({
            className: `custom-marker accuracy-${accuracyLevel.toLowerCase()}`,
            html: `
                <div class="marker-container accuracy-${accuracyLevel.toLowerCase()}">
                    <div class="marker-icon" title="${unit.name} - ${unit.driver} - Akurasi: ±${unit.accuracy.toFixed(1)}m">
                        🚛
                    </div>
                    <div class="accuracy-indicator" style="border-color: ${config.color}"></div>
                    <div class="unit-name">${unit.name}</div>
                </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 36]
        });

        const marker = L.marker([unit.latitude, unit.longitude], { icon: markerIcon })
            .bindPopup(this.createUnitPopup(unit))
            .addTo(this.map);
        
        this.markers.set(unit.name, marker);
    }

    createAccuracyCircle(unit) {
        if (unit.accuracy && unit.accuracy > 0) {
            const level = this.getAccuracyLevel(unit.accuracy);
            const config = this.gpsAccuracyLevels[level];
            
            const circle = L.circle([unit.latitude, unit.longitude], {
                radius: unit.accuracy,
                color: config.color,
                fillColor: config.color,
                fillOpacity: 0.1,
                weight: 2,
                opacity: 0.7
            }).addTo(this.map);
            
            this.accuracyCircles.set(unit.name, circle);
        }
    }

    createUnitPopup(unit) {
        const accuracyBadge = this.createAccuracyBadge(unit.accuracy);
        
        return `
            <div class="unit-popup">
                <div class="popup-header">
                    <h6 class="mb-0">🚛 ${unit.name}</h6>
                    <small class="text-muted">${unit.afdeling}</small>
                </div>
                <div class="popup-content">
                    <div class="info-item">
                        <span class="info-label">Driver:</span>
                        <span class="info-value">${unit.driver}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status:</span>
                        <span class="info-value ${unit.status === 'moving' ? 'text-warning' : unit.status === 'active' ? 'text-success' : 'text-secondary'}">
                            ${unit.status === 'moving' ? 'Dalam Perjalanan' : unit.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Kecepatan:</span>
                        <span class="info-value">${unit.speed.toFixed(1)} km/h</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Akurasi GPS:</span>
                        <span class="info-value">${accuracyBadge}</span>
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
                        <span class="info-label">Update:</span>
                        <span class="info-value">${unit.lastUpdate}</span>
                    </div>
                </div>
                ${unit.accuracy > 30 ? `
                <div class="accuracy-warning mt-2 p-2 bg-warning text-dark rounded">
                    <small>⚠️ Akurasi GPS rendah (±${unit.accuracy.toFixed(1)}m). Posisi mungkin tidak tepat.</small>
                </div>
                ` : ''}
            </div>
        `;
    }

    refreshUnitMarker(unit) {
        const marker = this.markers.get(unit.name);
        if (marker) {
            marker.setLatLng([unit.latitude, unit.longitude]);
            marker.setPopupContent(this.createUnitPopup(unit));
            
            const accuracyLevel = this.getAccuracyLevel(unit.accuracy);
            const config = this.gpsAccuracyLevels[accuracyLevel];
            
            const markerIcon = L.divIcon({
                className: `custom-marker accuracy-${accuracyLevel.toLowerCase()}`,
                html: `
                    <div class="marker-container accuracy-${accuracyLevel.toLowerCase()}">
                        <div class="marker-icon" title="${unit.name} - ${unit.driver} - Akurasi: ±${unit.accuracy.toFixed(1)}m">
                            🚛
                        </div>
                        <div class="accuracy-indicator" style="border-color: ${config.color}"></div>
                        <div class="unit-name">${unit.name}</div>
                    </div>
                `,
                iconSize: [36, 36],
                iconAnchor: [18, 36]
            });
            marker.setIcon(markerIcon);
        }
    }

    refreshAccuracyCircle(unit) {
        const circle = this.accuracyCircles.get(unit.name);
        if (circle) {
            circle.setLatLng([unit.latitude, unit.longitude]);
            circle.setRadius(unit.accuracy);
            
            const level = this.getAccuracyLevel(unit.accuracy);
            const config = this.gpsAccuracyLevels[level];
            
            circle.setStyle({
                color: config.color,
                fillColor: config.color
            });
        } else {
            this.createAccuracyCircle(unit);
        }
    }

    updateMapMarkers() {
        // Cleanup orphaned markers
        this.markers.forEach((marker, unitName) => {
            if (!this.units.has(unitName)) {
                this.map.removeLayer(marker);
                this.markers.delete(unitName);
            }
        });

        // Cleanup orphaned accuracy circles
        this.accuracyCircles.forEach((circle, unitName) => {
            if (!this.units.has(unitName)) {
                this.map.removeLayer(circle);
                this.accuracyCircles.delete(unitName);
            }
        });
    }

    cleanupInactiveUnits(activeUnits) {
        this.units.forEach((unit, unitName) => {
            if (!activeUnits.has(unitName)) {
                this.removeUnit(unitName);
            }
        });
    }

    removeUnit(unitName) {
        console.log(`🗑️ Removing unit: ${unitName}`);
        
        // Remove marker
        const marker = this.markers.get(unitName);
        if (marker && this.map) {
            this.map.removeLayer(marker);
            this.markers.delete(unitName);
        }
        
        // Remove accuracy circle
        const accuracyCircle = this.accuracyCircles.get(unitName);
        if (accuracyCircle && this.map) {
            this.map.removeLayer(accuracyCircle);
            this.accuracyCircles.delete(unitName);
        }
        
        // Remove from units map
        this.units.delete(unitName);
    }

    // ===== ENHANCED CLEANUP SYSTEM =====
    cleanupStickyData() {
        console.log('🧹 Cleaning up sticky data...');
        
        const now = Date.now();
        const STALE_THRESHOLD = 30 * 60 * 1000; // 30 menit
        const stickyUnits = [];
        
        this.units.forEach((unit, unitName) => {
            // Timestamp validation
            if (!this.validateTimestamp(unit)) {
                console.log(`❌ Invalid timestamp for ${unitName}, marking for cleanup`);
                stickyUnits.push(unitName);
                return;
            }
            
            // Check jika data stale (lebih dari 30 menit)
            if (unit.lastUpdate) {
                const lastUpdateTime = new Date(unit.lastUpdate).getTime();
                if (isNaN(lastUpdateTime)) {
                    console.log(`❌ Invalid lastUpdate format for ${unitName}`);
                    stickyUnits.push(unitName);
                    return;
                }
                
                const timeDiff = now - lastUpdateTime;
                if (timeDiff > STALE_THRESHOLD) {
                    console.log(`🕒 Sticky data detected: ${unitName} (${Math.round(timeDiff/60000)} minutes old)`);
                    stickyUnits.push(unitName);
                }
            }
        });
        
        // Cleanup sticky units
        if (stickyUnits.length > 0) {
            console.log(`🧹 Removing ${stickyUnits.length} sticky units:`, stickyUnits);
            
            stickyUnits.forEach(unitName => {
                this.removeUnitCompletely(unitName);
            });
            
            this.logData(`Cleanup: ${stickyUnits.length} sticky units removed`, 'warning', {
                stickyUnits: stickyUnits,
                totalBefore: this.units.size + stickyUnits.length,
                totalAfter: this.units.size
            });
            
            return stickyUnits;
        }
        
        console.log('✅ No sticky data found');
        return [];
    }

    validateTimestamp(unit) {
        // Validasi basic timestamp
        if (!unit.lastUpdate) {
            console.log(`⚠️ No lastUpdate for ${unit.name}`);
            return false;
        }
        
        try {
            const timestamp = new Date(unit.lastUpdate);
            if (isNaN(timestamp.getTime())) {
                console.log(`❌ Invalid timestamp format for ${unit.name}: ${unit.lastUpdate}`);
                return false;
            }
            
            // Cek jika timestamp di masa depan (impossible)
            const now = new Date();
            if (timestamp > now) {
                console.log(`❌ Future timestamp for ${unit.name}: ${unit.lastUpdate}`);
                return false;
            }
            
            // Cek jika timestamp terlalu lama (lebih dari 7 hari)
            const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            if (timestamp < sevenDaysAgo) {
                console.log(`❌ Very old timestamp for ${unit.name}: ${unit.lastUpdate}`);
                return false;
            }
            
            return true;
        } catch (error) {
            console.log(`❌ Timestamp validation error for ${unit.name}:`, error);
            return false;
        }
    }

    // Cleanup specific unit
    cleanupSpecificUnit(unitName) {
        if (this.units.has(unitName)) {
            console.log(`🧹 Cleaning up specific unit: ${unitName}`);
            
            const unit = this.units.get(unitName);
            const cleanupReason = this.getCleanupReason(unit);
            
            this.removeUnitCompletely(unitName);
            
            this.logData(`Unit ${unitName} cleaned up: ${cleanupReason}`, 'warning', {
                unit: unitName,
                reason: cleanupReason,
                lastUpdate: unit.lastUpdate,
                driver: unit.driver
            });
            
            return true;
        } else {
            console.log(`❌ Unit ${unitName} not found for cleanup`);
            return false;
        }
    }

    getCleanupReason(unit) {
        if (!unit.lastUpdate) return "Missing timestamp";
        
        try {
            const lastUpdateTime = new Date(unit.lastUpdate).getTime();
            const now = Date.now();
            const timeDiff = now - lastUpdateTime;
            const minutesDiff = Math.round(timeDiff / 60000);
            
            if (isNaN(lastUpdateTime)) return "Invalid timestamp format";
            if (timeDiff > 30 * 60 * 1000) return `Stale data (${minutesDiff} minutes old)`;
            if (timeDiff < 0) return "Future timestamp";
            
            return "Manual cleanup";
        } catch (error) {
            return "Timestamp validation error";
        }
    }

    removeUnitCompletely(unitName) {
        this.removeUnit(unitName);
    }

    forceCleanupAllData() {
        console.log('🧹 Force cleaning all data...');
        this.clearAllUnits();
        this.showSuccess('Semua data berhasil dibersihkan');
    }

    logData(message, type, data) {
        console.log(`📝 ${type.toUpperCase()}: ${message}`, data || '');
    }

    clearAllUnits() {
        console.log('🧹 Clearing all units...');
        this.units.forEach((unit, unitName) => {
            this.removeUnit(unitName);
        });
    }

    // UI Helper Methods
    updateConnectionStatus(connected) {
        const statusElement = this.uiElements.firebaseStatus;
        if (statusElement) {
            if (connected) {
                statusElement.innerHTML = '🟢 FIREBASE TERHUBUNG';
                statusElement.className = 'text-success fw-bold';
            } else {
                statusElement.innerHTML = '🔴 FIREBASE OFFLINE';
                statusElement.className = 'text-danger fw-bold';
            }
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    showLoading(show) {
        const spinner = this.uiElements.loadingSpinner;
        if (spinner) {
            spinner.style.display = show ? 'block' : 'none';
        }
    }

    showNotification(message, type = 'info') {
        console.log(`💬 ${type.toUpperCase()}: ${message}`);
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px; 
            right: 20px; 
            z-index: 9999; 
            min-width: 300px;
            max-width: 400px;
        `;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    showMessage(message) {
        this.showNotification(message, 'info');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'danger');
    }

    // Search and Filter Methods
    handleSearch(searchTerm) {
        console.log(`🔍 Searching for: ${searchTerm}`);
        // Implementation for search functionality
    }

    applyFilters() {
        console.log('🎛️ Applying filters...');
        // Implementation for filter functionality
    }

    // Chat Methods
    startChat(unitName) {
        console.log(`💬 Starting chat with ${unitName}`);
        this.showMessage(`Fitur chat dengan ${unitName} akan segera tersedia`);
    }

    // ✅ FIXED: Missing Chat Methods
    toggleMonitorChat() {
        this.showMessage('Fitur chat monitor akan segera tersedia');
    }

    handleMonitorChatInput(event) {
        if (event.key === 'Enter') {
            this.sendMonitorMessage();
        }
    }

    sendMonitorMessage() {
        this.showMessage('Fitur pengiriman pesan akan segera tersedia');
    }

    selectChatUnit(unitName) {
        this.showMessage(`Memulai chat dengan ${unitName}`);
    }

    // ===== ENHANCED PERIODIC TASKS =====
    startPeriodicTasks() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();

        // Cleanup setiap 5 menit
        const cleanupInterval = setInterval(() => {
            console.log('🕒 Running periodic cleanup...');
            const stickyUnits = this.cleanupStickyData();
            
            if (stickyUnits.length > 0) {
                this.showNotification(`Auto-cleanup: ${stickyUnits.length} sticky units removed`, 'warning');
            }
        }, 5 * 60 * 1000); // 5 menit
        this.intervals.add(cleanupInterval);

        // Health check setiap 2 menit
        const healthInterval = setInterval(() => {
            this.logData('System health check', 'info', {
                activeUnits: this.units.size,
                markers: this.markers.size,
                stickyUnits: Array.from(this.units.values()).filter(unit => 
                    !this.validateTimestamp(unit)
                ).length
            });
        }, 2 * 60 * 1000);
        this.intervals.add(healthInterval);

        // Map refresh setiap 1 menit (fix rendering issues)
        const mapRefreshInterval = setInterval(() => {
            if (this.map) {
                this.map.invalidateSize();
                console.log('🗺️ Map refreshed');
            }
        }, 60 * 1000);
        this.intervals.add(mapRefreshInterval);

        console.log('✅ Enhanced periodic tasks started');
    }

    healthCheck() {
        const activeUnits = Array.from(this.units.values()).filter(unit => unit.isOnline).length;
        console.log(`❤️ Health check: ${activeUnits} active units, Firebase: ${this.isConnected ? 'Connected' : 'Disconnected'}`);
    }

    cleanupOrphanedElements() {
        console.log('🧹 Running cleanup of orphaned elements...');
        this.updateMapMarkers();
    }

    // Cleanup Methods
    cleanupFirebaseListeners() {
        if (this.firebaseListener) {
            database.ref('/units').off('value', this.firebaseListener);
            this.firebaseListener = null;
        }
        
        if (this.connectionRef) {
            database.ref('.info/connected').off('value');
            this.connectionRef = null;
        }
    }

    cleanup() {
        console.log('🧹 Comprehensive cleanup...');
        
        // Cleanup intervals
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();
        
        // Cleanup Firebase listeners
        this.cleanupFirebaseListeners();
        
        // Clear all units
        this.clearAllUnits();
        
        // Remove map
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        
        console.log('✅ Cleanup completed');
    }

    // Public Methods
    refreshData() {
        console.log('🔄 Manual refresh requested');
        this.showLoading(true);
        this.setupFirebaseListeners();
        setTimeout(() => this.showLoading(false), 2000);
    }

    forceCleanup() {
        if (confirm('Yakin ingin membersihkan semua data?')) {
            this.cleanup();
            this.showSuccess('Semua data telah dibersihkan');
        }
    }

    exportData() {
        const exportData = {
            exportedAt: new Date().toISOString(),
            totalUnits: this.units.size,
            units: Array.from(this.units.values())
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gps-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showSuccess('Data berhasil diexport');
    }
}

// ===== GLOBAL CLEANUP FUNCTIONS =====
function cleanupStickyData() {
    if (window.gpsMonitor) {
        const stickyUnits = window.gpsMonitor.cleanupStickyData();
        
        if (stickyUnits.length > 0) {
            alert(`🧹 Cleanup Berhasil!\n${stickyUnits.length} unit lengket dihapus:\n${stickyUnits.join(', ')}`);
        } else {
            alert('✅ Tidak ada data lengket ditemukan');
        }
    }
}

function cleanupSpecificUnitPrompt() {
    const unitName = prompt('Masukkan nama unit yang akan dibersihkan (contoh: DT-06):');
    
    if (unitName && window.gpsMonitor) {
        const success = window.gpsMonitor.cleanupSpecificUnit(unitName);
        
        if (success) {
            alert(`✅ Unit ${unitName} berhasil dibersihkan`);
        } else {
            alert(`❌ Unit ${unitName} tidak ditemukan`);
        }
    }
}

function forceCleanupAllData() {
    if (confirm('⚠️ HAPUS SEMUA DATA?\n\nIni akan menghapus SEMUA unit dari peta dan memory.\nLanjutkan?')) {
        if (window.gpsMonitor) {
            window.gpsMonitor.forceCleanupAllData();
            alert('✅ Semua data berhasil dibersihkan');
        }
    }
}

// ✅ FIXED: Global Functions yang benar
function refreshData() {
    if (window.gpsMonitor) {
        window.gpsMonitor.refreshData();
    }
}

function forceCleanup() {
    if (window.gpsMonitor) {
        window.gpsMonitor.forceCleanup();
    }
}

function exportData() {
    if (window.gpsMonitor) {
        window.gpsMonitor.exportData();
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('show');
    }
}

function toggleMonitorChat() {
    if (window.gpsMonitor) {  // ✅ BENAR: gpsMonitor bukan gpsSystem
        window.gpsMonitor.toggleMonitorChat();
    }
}

function handleMonitorChatInput(event) {
    if (window.gpsMonitor) {
        window.gpsMonitor.handleMonitorChatInput(event);
    }
}

function sendMonitorMessage() {
    if (window.gpsMonitor) {
        window.gpsMonitor.sendMonitorMessage();
    }
}

function selectChatUnit(unitName) {
    if (window.gpsMonitor) {
        window.gpsMonitor.selectChatUnit(unitName);
    }
}

// ===== DEBUGGING FUNCTIONS =====
function debugMap() {
    console.log('🔍 Debugging Map...');
    console.log('Map element:', document.getElementById('map'));
    console.log('L object:', typeof L);
    console.log('GPS Monitor:', window.gpsMonitor);
    
    if (window.gpsMonitor && window.gpsMonitor.map) {
        console.log('Map instance:', window.gpsMonitor.map);
        window.gpsMonitor.map.invalidateSize(true);
        console.log('✅ Map refreshed');
    } else {
        console.log('❌ Map not initialized');
    }
}

// Auto cleanup saat page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.gpsMonitor && confirm('Jalankan auto-cleanup data lengket?')) {
            window.gpsMonitor.cleanupStickyData();
        }
    }, 10000); // 10 detik setelah load
});

// Initialize System
let gpsMonitor;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded - initializing Fixed GPS Monitor System');
    
    // Cleanup previous instance if exists
    if (window.gpsMonitor) {
        window.gpsMonitor.cleanup();
    }
    
    // Initialize new instance
    gpsMonitor = new FixedGPSMonitor();
    window.gpsMonitor = gpsMonitor;
    
    // Make sure global functions are available
    window.refreshData = refreshData;
    window.forceCleanup = forceCleanup;
    window.exportData = exportData;
    window.toggleSidebar = toggleSidebar;
    window.toggleMonitorChat = toggleMonitorChat;
    window.handleMonitorChatInput = handleMonitorChatInput;
    window.sendMonitorMessage = sendMonitorMessage;
    window.selectChatUnit = selectChatUnit;
    window.cleanupStickyData = cleanupStickyData;
    window.cleanupSpecificUnitPrompt = cleanupSpecificUnitPrompt;
    window.forceCleanupAllData = forceCleanupAllData;
    window.debugMap = debugMap; // ✅ Debug function
});

window.addEventListener('beforeunload', function() {
    if (window.gpsMonitor) {
        window.gpsMonitor.cleanup();
    }
});

// Error boundary for unhandled errors
window.addEventListener('error', function(event) {
    console.error('🚨 Global error caught:', event.error);
    if (window.gpsMonitor) {
        window.gpsMonitor.showError('System error occurred: ' + event.error.message);
    }
});
