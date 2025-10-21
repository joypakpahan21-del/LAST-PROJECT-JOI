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
console.log('🚀 Initializing Comprehensive GPS Monitoring System...');

if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
    console.log('✅ Firebase initialized successfully');
} else {
    console.log('ℹ️ Firebase already initialized');
}

const database = firebase.database();

class ComprehensiveGPSMonitor {
    constructor() {
        console.log('🚀 Starting Comprehensive GPS Monitoring System...');
        
        // Core data structures
        this.units = new Map();
        this.markers = new Map();
        this.accuracyCircles = new Map();
        this.waypointHistory = new Map();
        this.intervals = new Set();
        this.routePolylines = new Map();
        
        // Maps configuration
        this.leafletMap = null;
        this.googleMap = null;
        this.infoWindow = null;
        this.currentMapType = 'google'; // 'google' or 'leaflet'
        
        // System state
        this.firebaseListener = null;
        this.isConnected = false;
        this.connectionRef = null;
        
        // Enhanced systems
        this.chatRefs = new Map();
        this.typingRefs = new Map();
        this.chatMessages = new Map();
        this.unreadCounts = new Map();
        this.selectedChatUnit = null;
        
        // Waypoint management
        this.showWaypoints = true;
        this.waypointMarkers = new Map();
        
        // GPS Accuracy Configuration
        this.gpsAccuracyLevels = {
            EXCELLENT: { max: 5, color: '#28a745', label: 'Excellent', icon: '🎯' },
            GOOD: { max: 15, color: '#17a2b8', label: 'Good', icon: '✅' },
            FAIR: { max: 30, color: '#ffc107', label: 'Fair', icon: '⚠️' },
            POOR: { max: 50, color: '#dc3545', label: 'Poor', icon: '🔻' },
            VERY_POOR: { max: Infinity, color: '#343a40', label: 'Very Poor', icon: '❌' }
        };

        // UI elements cache
        this.uiElements = {};
        
        this.initializeSystem();
    }

    async initializeSystem() {
        try {
            console.log('🔧 Initializing Comprehensive GPS Monitoring System...');
            
            // 1. Cache UI elements
            this.cacheUIElements();
            
            // 2. Setup maps based on availability
            await this.setupMaps();
            
            // 3. Setup UI handlers
            this.setupUIEventHandlers();
            
            // 4. Test Firebase connection
            await this.testFirebaseConnection();
            
            // 5. Setup Firebase listeners
            this.setupFirebaseListeners();
            
            // 6. Start periodic tasks
            this.startPeriodicTasks();
            
            // 7. Setup enhanced chat system
            this.setupEnhancedChatSystem();
            
            console.log('✅ Comprehensive GPS Monitoring System initialized successfully');
            this.showNotification('System comprehensive dengan dual maps diaktifkan', 'success');
            
        } catch (error) {
            console.error('❌ System initialization failed:', error);
            this.showError('System initialization failed: ' + error.message);
        }
    }

    cacheUIElements() {
        this.uiElements = {
            activeUnits: document.getElementById('activeUnits'),
            totalDistance: document.getElementById('totalDistance'),
            avgSpeed: document.getElementById('avgSpeed'),
            totalFuel: document.getElementById('totalFuel'),
            currentTime: document.getElementById('currentTime'),
            firebaseStatus: document.getElementById('firebaseStatus'),
            unitList: document.getElementById('unitList'),
            totalWaypoints: document.getElementById('totalWaypoints'),
            dataPeriod: document.getElementById('dataPeriod'),
            storageUsed: document.getElementById('storageUsed'),
            enhancedDataLogs: document.getElementById('enhancedDataLogs'),
            activeUnitsDetail: document.getElementById('activeUnitsDetail'),
            dataCount: document.getElementById('dataCount'),
            loadingSpinner: document.getElementById('loadingSpinner')
        };
    }

    async setupMaps() {
        try {
            console.log('🗺️ Setting up dual mapping system...');
            
            // Setup Google Maps if available
            if (typeof google !== 'undefined') {
                await this.setupGoogleMaps();
                this.currentMapType = 'google';
                console.log('✅ Google Maps initialized');
            } else {
                console.log('⚠️ Google Maps not available, falling back to Leaflet');
                await this.setupLeafletMap();
                this.currentMapType = 'leaflet';
            }
            
            // Add map controls
            this.addMapControls();
            
        } catch (error) {
            console.error('❌ Maps setup failed:', error);
            // Fallback to Leaflet
            await this.setupLeafletMap();
            this.currentMapType = 'leaflet';
        }
    }

    setupGoogleMaps() {
        return new Promise((resolve, reject) => {
            try {
                const defaultCenter = { lat: -0.396056, lng: 102.958944 };
                
                const mapOptions = {
                    center: defaultCenter,
                    zoom: 13,
                    mapTypeId: google.maps.MapTypeId.HYBRID,
                    styles: [
                        {
                            featureType: "poi",
                            elementType: "labels",
                            stylers: [{ visibility: "on" }]
                        }
                    ]
                };
                
                this.googleMap = new google.maps.Map(document.getElementById('googleMap'), mapOptions);
                this.infoWindow = new google.maps.InfoWindow();
                
                // Hide Leaflet map container
                const leafletMap = document.getElementById('map');
                if (leafletMap) leafletMap.style.display = 'none';
                
                resolve();
                
            } catch (error) {
                reject(error);
            }
        });
    }

    async setupLeafletMap() {
        try {
            console.log('🍃 Setting up Leaflet Map...');
            
            await this.waitForElement('#map');
            
            const mapElement = document.getElementById('map');
            if (!mapElement) {
                throw new Error('Map element not found');
            }

            // Style map element
            mapElement.style.cssText = `
                height: 500px !important;
                width: 100% !important;
                min-height: 400px;
                border-radius: 8px;
                background: #f8f9fa;
                position: relative;
            `;

            // Hide Google Maps container
            const googleMap = document.getElementById('googleMap');
            if (googleMap) googleMap.style.display = 'none';

            // Initialize Leaflet map
            this.leafletMap = L.map('map', {
                center: [-0.396056, 102.958944],
                zoom: 13,
                zoomControl: true,
                attributionControl: true
            });

            // Add base layers
            const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(this.leafletMap);

            // Try to add Google Satellite
            try {
                const googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                    maxZoom: 20,
                    subdomains: ['mt0','mt1','mt2','mt3'],
                    attribution: '© Google'
                });
                
                L.control.layers({
                    "OpenStreetMap": osmLayer,
                    "Google Satellite": googleSat
                }).addTo(this.leafletMap);
                
            } catch (googleError) {
                console.log('⚠️ Google Satellite failed, using OSM only');
            }

            // Add controls
            L.control.scale({ imperial: false }).addTo(this.leafletMap);
            this.addLeafletAccuracyLegend();
            this.addImportantLocations();
            
            this.leafletMap.whenReady(() => {
                console.log('✅ Leaflet map initialized successfully');
                setTimeout(() => {
                    this.leafletMap.invalidateSize(true);
                }, 100);
            });

        } catch (error) {
            console.error('❌ Leaflet map setup failed:', error);
            throw error;
        }
    }

    addMapControls() {
        if (this.currentMapType === 'google' && this.googleMap) {
            const waypointControl = document.createElement('div');
            waypointControl.className = 'map-control';
            waypointControl.innerHTML = `
                <button class="btn btn-sm btn-light" onclick="window.comprehensiveMonitor.toggleWaypoints()">
                    🎯 ${this.showWaypoints ? 'Hide' : 'Show'} Waypoints
                </button>
            `;
            
            this.googleMap.controls[google.maps.ControlPosition.TOP_RIGHT].push(waypointControl);
        }
    }

    addLeafletAccuracyLegend() {
        if (!this.leafletMap) return;
        
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
        
        accuracyLegend.addTo(this.leafletMap);
    }

    addImportantLocations() {
        if (!this.leafletMap) return;
        
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
                    .addTo(this.leafletMap);
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

            // Map switch handler
            const mapSwitch = document.getElementById('mapSwitch');
            if (mapSwitch) {
                mapSwitch.addEventListener('change', (e) => this.switchMapType(e.target.value));
            }

            console.log('✅ UI event handlers setup completed');
        } catch (error) {
            console.log('⚠️ UI event handlers setup failed:', error);
        }
    }

    switchMapType(mapType) {
        const leafletMap = document.getElementById('map');
        const googleMap = document.getElementById('googleMap');
        
        if (mapType === 'leaflet') {
            if (leafletMap) leafletMap.style.display = 'block';
            if (googleMap) googleMap.style.display = 'none';
            this.currentMapType = 'leaflet';
            
            if (this.leafletMap) {
                setTimeout(() => {
                    this.leafletMap.invalidateSize(true);
                }, 100);
            }
        } else {
            if (leafletMap) leafletMap.style.display = 'none';
            if (googleMap) googleMap.style.display = 'block';
            this.currentMapType = 'google';
        }
        
        this.refreshAllMarkers();
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
                    
                    database.ref('/units').once('value')
                        .then((snapshot) => {
                            const data = snapshot.val();
                            const unitCount = data ? Object.keys(data).length : 0;
                            console.log(`📊 Initial units count: ${unitCount}`);
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

            setTimeout(() => {
                this.connectionRef.off('value', connectionHandler);
                this.showLoading(false);
                reject(new Error('Firebase connection timeout'));
            }, 15000);
        });
    }

    setupFirebaseListeners() {
        console.log('📡 Setting up Firebase REAL-TIME listeners...');
        
        this.cleanupFirebaseListeners();

        // Units data listener
        this.firebaseListener = database.ref('/units').on('value', 
            (snapshot) => {
                console.log('🎯 Firebase units data change detected!');
                
                try {
                    const data = snapshot.val();
                    
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
                    this.showError('❌ FIREBASE PERMISSION DENIED\n\nPeriksa Firebase Security Rules');
                } else {
                    this.showError('Firebase connection error: ' + error.message);
                }
                
                setTimeout(() => {
                    this.setupFirebaseListeners();
                }, 5000);
            }
        );
        
        // Waypoints data listener
        this.waypointsListener = database.ref('/waypoints').on('value', 
            (snapshot) => {
                console.log('🎯 Firebase waypoints data change detected!');
                this.processWaypointsData(snapshot.val());
            }
        );
        
        console.log('✅ Firebase real-time listeners setup completed');
    }

    processRealTimeData(firebaseData) {
        if (!firebaseData) return;

        const unitCount = Object.keys(firebaseData).length;
        console.log(`🔄 Processing ${unitCount} units from Firebase`);
        
        const activeUnits = new Set();
        const currentTime = Date.now();
        
        Object.entries(firebaseData).forEach(([unitName, unitData]) => {
            if (this.validateUnitData(unitName, unitData)) {
                activeUnits.add(unitName);
                this.updateOrCreateUnit(unitName, unitData, currentTime);
            } else {
                console.log(`❌ Invalid data for ${unitName}, skipping`);
            }
        });

        this.cleanupInactiveUnits(activeUnits);
        this.updateDisplay();
        
        if (this.units.size > 0) {
            this.showSuccess(`Real-time tracking active: ${this.units.size} units online`);
        }
    }

    processWaypointsData(waypointsData) {
        if (!waypointsData) return;
        
        Object.entries(waypointsData).forEach(([unitName, sessions]) => {
            Object.entries(sessions).forEach(([sessionId, waypointData]) => {
                this.updateWaypointDisplay(unitName, waypointData);
            });
        });
    }

    validateUnitData(unitName, unitData) {
        if (!unitData) return false;
        
        const requiredFields = ['lat', 'lng', 'driver', 'unit'];
        const missingFields = requiredFields.filter(field => !unitData.hasOwnProperty(field));
        
        if (missingFields.length > 0) {
            console.log(`❌ Missing required fields for ${unitName}:`, missingFields);
            return false;
        }
        
        const lat = parseFloat(unitData.lat);
        const lng = parseFloat(unitData.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
            console.log(`❌ Invalid coordinates for ${unitName}`);
            return false;
        }
        
        if (lat < -1 || lat > 1 || lng < 102.5 || lng > 103.5) {
            console.log(`❌ Coordinates out of range for ${unitName}: ${lat}, ${lng}`);
            return false;
        }
        
        if (unitData.lastUpdate && !this.validateTimestamp({ lastUpdate: unitData.lastUpdate })) {
            console.log(`❌ Invalid timestamp for ${unitName}: ${unitData.lastUpdate}`);
            return false;
        }
        
        return true;
    }

    validateTimestamp(unit) {
        if (!unit.lastUpdate) return false;
        
        try {
            const timestamp = new Date(unit.lastUpdate);
            if (isNaN(timestamp.getTime())) return false;
            
            const now = new Date();
            if (timestamp > now) return false;
            
            const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
            if (timestamp < sevenDaysAgo) return false;
            
            return true;
        } catch (error) {
            return false;
        }
    }

    updateOrCreateUnit(unitName, unitData, timestamp) {
        const existingUnit = this.units.get(unitName);
        
        if (existingUnit) {
            this.refreshUnitData(existingUnit, unitData, timestamp);
        } else {
            const newUnit = this.createNewUnit(unitName, unitData, timestamp);
            if (newUnit) {
                this.units.set(unitName, newUnit);
                this.createUnitMarker(newUnit);
                this.createAccuracyCircle(newUnit);
                this.setupUnitChatSystem(unitName);
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
            batteryLevel: firebaseData.batteryLevel || null,
            waypointsCount: firebaseData.waypointsCount || 0
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
        const baseFuel = 100;
        const fuelConsumptionRate = 0.25;
        const fuelUsed = distance * fuelConsumptionRate;
        return Math.max(0, baseFuel - fuelUsed);
    }

    refreshUnitData(unit, firebaseData, timestamp) {
        const oldLat = unit.latitude;
        const oldLng = unit.longitude;
        
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
        unit.waypointsCount = firebaseData.waypointsCount || unit.waypointsCount;

        this.refreshUnitMarker(unit, oldLat, oldLng);
        this.refreshAccuracyCircle(unit);
    }

    createUnitMarker(unit) {
        if (this.currentMapType === 'google' && this.googleMap) {
            this.createGoogleUnitMarker(unit);
        } else if (this.leafletMap) {
            this.createLeafletUnitMarker(unit);
        }
    }

    createGoogleUnitMarker(unit) {
        const marker = new google.maps.Marker({
            position: { lat: unit.latitude, lng: unit.longitude },
            map: this.googleMap,
            title: `${unit.name} - ${unit.driver}`,
            icon: this.getGoogleMarkerIcon(unit),
            animation: unit.status === 'moving' ? google.maps.Animation.BOUNCE : null
        });

        marker.addListener('click', () => {
            this.infoWindow.setContent(this.createInfoWindowContent(unit));
            this.infoWindow.open(this.googleMap, marker);
        });

        this.markers.set(unit.name, marker);
    }

    createLeafletUnitMarker(unit) {
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
            .bindPopup(this.createLeafletPopup(unit))
            .addTo(this.leafletMap);
        
        this.markers.set(unit.name, marker);
    }

    getGoogleMarkerIcon(unit) {
        const baseUrl = 'https://maps.google.com/mapfiles/ms/icons/';
        const color = unit.status === 'moving' ? 'blue' : unit.status === 'active' ? 'green' : 'red';
        return {
            url: `${baseUrl}${color}-dot.png`,
            scaledSize: new google.maps.Size(32, 32)
        };
    }

    createInfoWindowContent(unit) {
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
                        <span class="info-label">Waypoints:</span>
                        <span class="info-value">${unit.waypointsCount || 0}</span>
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
                <div class="popup-actions mt-2">
                    <button class="btn btn-sm btn-primary w-100" onclick="window.comprehensiveMonitor.startChat('${unit.name}')">
                        💬 Chat dengan ${unit.driver}
                    </button>
                </div>
            </div>
        `;
    }

    createLeafletPopup(unit) {
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
                        <span class="info-label">Waypoints:</span>
                        <span class="info-value">${unit.waypointsCount || 0}</span>
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
                <div class="popup-actions mt-2">
                    <button class="btn btn-sm btn-primary w-100" onclick="window.comprehensiveMonitor.startChat('${unit.name}')">
                        💬 Chat dengan ${unit.driver}
                    </button>
                </div>
            </div>
        `;
    }

    refreshUnitMarker(unit, oldLat, oldLng) {
        const marker = this.markers.get(unit.name);
        if (!marker) return;

        if (this.currentMapType === 'google' && this.googleMap) {
            const newPosition = { lat: unit.latitude, lng: unit.longitude };
            marker.setPosition(newPosition);
            marker.setIcon(this.getGoogleMarkerIcon(unit));
            marker.setAnimation(unit.status === 'moving' ? google.maps.Animation.BOUNCE : null);
            
            if (this.infoWindow.getAnchor() === marker) {
                this.infoWindow.setContent(this.createInfoWindowContent(unit));
            }
        } else if (this.leafletMap) {
            marker.setLatLng([unit.latitude, unit.longitude]);
            marker.setPopupContent(this.createLeafletPopup(unit));
            
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

    createAccuracyCircle(unit) {
        if (!unit.accuracy || unit.accuracy <= 0) return;

        if (this.currentMapType === 'google' && this.googleMap) {
            const level = this.getAccuracyLevel(unit.accuracy);
            const config = this.gpsAccuracyLevels[level];
            
            const circle = new google.maps.Circle({
                strokeColor: config.color,
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: config.color,
                fillOpacity: 0.1,
                map: this.googleMap,
                center: { lat: unit.latitude, lng: unit.longitude },
                radius: unit.accuracy
            });
            
            this.accuracyCircles.set(unit.name, circle);
        } else if (this.leafletMap) {
            const level = this.getAccuracyLevel(unit.accuracy);
            const config = this.gpsAccuracyLevels[level];
            
            const circle = L.circle([unit.latitude, unit.longitude], {
                radius: unit.accuracy,
                color: config.color,
                fillColor: config.color,
                fillOpacity: 0.1,
                weight: 2,
                opacity: 0.7
            }).addTo(this.leafletMap);
            
            this.accuracyCircles.set(unit.name, circle);
        }
    }

    refreshAccuracyCircle(unit) {
        const circle = this.accuracyCircles.get(unit.name);
        if (circle) {
            if (this.currentMapType === 'google' && this.googleMap) {
                circle.setCenter({ lat: unit.latitude, lng: unit.longitude });
                circle.setRadius(unit.accuracy);
                
                const level = this.getAccuracyLevel(unit.accuracy);
                const config = this.gpsAccuracyLevels[level];
                
                circle.setOptions({
                    strokeColor: config.color,
                    fillColor: config.color
                });
            } else if (this.leafletMap) {
                circle.setLatLng([unit.latitude, unit.longitude]);
                circle.setRadius(unit.accuracy);
                
                const level = this.getAccuracyLevel(unit.accuracy);
                const config = this.gpsAccuracyLevels[level];
                
                circle.setStyle({
                    color: config.color,
                    fillColor: config.color
                });
            }
        } else {
            this.createAccuracyCircle(unit);
        }
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

    updateWaypointDisplay(unitName, waypointData) {
        if (!this.showWaypoints || !waypointData.waypoints) return;
        
        this.clearUnitWaypoints(unitName);
        
        const waypoints = waypointData.waypoints;
        const path = [];
        
        waypoints.forEach((waypoint, index) => {
            const position = { lat: waypoint.lat, lng: waypoint.lng };
            path.push(position);
            
            if (index % 10 === 0) {
                if (this.currentMapType === 'google' && this.googleMap) {
                    const marker = new google.maps.Marker({
                        position: position,
                        map: this.googleMap,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 3,
                            fillColor: '#ff6b6b',
                            fillOpacity: 0.7,
                            strokeColor: '#ffffff',
                            strokeWeight: 1
                        },
                        title: `Waypoint ${index + 1}`
                    });
                    
                    if (!this.waypointMarkers.has(unitName)) {
                        this.waypointMarkers.set(unitName, []);
                    }
                    this.waypointMarkers.get(unitName).push(marker);
                } else if (this.leafletMap) {
                    const marker = L.circleMarker([waypoint.lat, waypoint.lng], {
                        radius: 4,
                        fillColor: '#ff6b6b',
                        fillOpacity: 0.7,
                        color: '#ffffff',
                        weight: 1
                    }).addTo(this.leafletMap);
                    
                    if (!this.waypointMarkers.has(unitName)) {
                        this.waypointMarkers.set(unitName, []);
                    }
                    this.waypointMarkers.get(unitName).push(marker);
                }
            }
        });
        
        if (path.length > 1) {
            if (this.currentMapType === 'google' && this.googleMap) {
                const polyline = new google.maps.Polyline({
                    path: path,
                    geodesic: true,
                    strokeColor: '#007bff',
                    strokeOpacity: 0.7,
                    strokeWeight: 3
                });
                
                polyline.setMap(this.googleMap);
                this.routePolylines.set(unitName, polyline);
            } else if (this.leafletMap) {
                const polyline = L.polyline(path.map(p => [p.lat, p.lng]), {
                    color: '#007bff',
                    weight: 3,
                    opacity: 0.7
                }).addTo(this.leafletMap);
                
                this.routePolylines.set(unitName, polyline);
            }
        }
        
        this.updateWaypointStats();
    }

    clearUnitWaypoints(unitName) {
        if (this.waypointMarkers.has(unitName)) {
            this.waypointMarkers.get(unitName).forEach(marker => {
                if (this.currentMapType === 'google') {
                    marker.setMap(null);
                } else {
                    marker.remove();
                }
            });
            this.waypointMarkers.delete(unitName);
        }
        
        if (this.routePolylines.has(unitName)) {
            const polyline = this.routePolylines.get(unitName);
            if (this.currentMapType === 'google') {
                polyline.setMap(null);
            } else {
                polyline.remove();
            }
            this.routePolylines.delete(unitName);
        }
    }

    updateWaypointStats() {
        let totalWaypoints = 0;
        this.units.forEach(unit => {
            totalWaypoints += unit.waypointsCount || 0;
        });
        
        this.updateElement('totalWaypoints', totalWaypoints.toLocaleString());
        this.updateElement('dataPeriod', '17');
        this.updateElement('storageUsed', (totalWaypoints * 0.1).toFixed(1));
    }

    updateDisplay() {
        this.updateStatistics();
        this.renderUnitList();
        this.updateEnhancedLogs();
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
                        🎯 Waypoints: <strong>${unit.waypointsCount || 0}</strong>
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
                    <button class="btn btn-sm btn-outline-primary w-100" onclick="window.comprehensiveMonitor.startChat('${unit.name}')">
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

    // Enhanced Chat System
    setupEnhancedChatSystem() {
        console.log('💬 Setting up enhanced chat system for monitor...');
        
        this.units.forEach((unit, unitName) => {
            this.setupUnitChatSystem(unitName);
        });
        
        this.setupChatUIHandlers();
    }

    setupUnitChatSystem(unitName) {
        if (this.chatRefs.has(unitName)) return;
        
        const chatRef = database.ref('/chat/' + unitName);
        const typingRef = database.ref('/typing/' + unitName);
        
        chatRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            if (message && message.id !== this.getLastMessageId(unitName)) {
                this.handleNewChatMessage(unitName, message);
            }
        });
        
        typingRef.on('value', (snapshot) => {
            const typingData = snapshot.val();
            this.handleTypingIndicator(unitName, typingData);
        });
        
        this.chatRefs.set(unitName, chatRef);
        this.typingRefs.set(unitName, typingRef);
        this.chatMessages.set(unitName, []);
        this.unreadCounts.set(unitName, 0);
        
        this.updateChatUnitSelect();
    }

    handleNewChatMessage(unitName, message) {
        if (!message || message.type === 'monitor') return;
        
        const messages = this.chatMessages.get(unitName) || [];
        
        const messageExists = messages.some(msg => msg.id === message.id);
        if (messageExists) return;
        
        messages.push(message);
        this.chatMessages.set(unitName, messages);
        
        if (this.selectedChatUnit !== unitName) {
            const unreadCount = this.unreadCounts.get(unitName) || 0;
            this.unreadCounts.set(unitName, unreadCount + 1);
        }
        
        this.updateChatUI();
        
        if (this.selectedChatUnit !== unitName) {
            this.showChatNotification(unitName, message);
        }
        
        this.playNotificationSound();
    }

    async sendMonitorMessage() {
        if (!this.selectedChatUnit) return;
        
        const input = document.getElementById('monitorChatInput');
        const messageText = input.value.trim();
        
        if (!messageText) return;
        
        const chatRef = this.chatRefs.get(this.selectedChatUnit);
        if (!chatRef) return;
        
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const messageData = {
            id: messageId,
            text: messageText,
            sender: 'Monitor',
            unit: this.selectedChatUnit,
            timestamp: new Date().toISOString(),
            timeDisplay: new Date().toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            type: 'monitor',
            status: 'sent'
        };
        
        try {
            await chatRef.push(messageData);
            
            const messages = this.chatMessages.get(this.selectedChatUnit) || [];
            messages.push(messageData);
            this.chatMessages.set(this.selectedChatUnit, messages);
            
            this.updateChatUI();
            
            input.value = '';
            this.stopTyping(this.selectedChatUnit);
            
            this.addEnhancedLog(`💬 Pesan terkirim ke ${this.selectedChatUnit}: "${messageText}"`, 'info');
            
        } catch (error) {
            console.error('Failed to send message:', error);
            this.addEnhancedLog(`❌ Gagal mengirim pesan ke ${this.selectedChatUnit}`, 'error');
        }
    }

    startTyping(unitName) {
        const typingRef = this.typingRefs.get(unitName);
        if (!typingRef || this.isTyping) return;
        
        typingRef.child('monitor').set({
            isTyping: true,
            name: 'Monitor',
            timestamp: Date.now()
        });
        
        this.isTyping = true;
    }

    stopTyping(unitName) {
        const typingRef = this.typingRefs.get(unitName);
        if (!typingRef || !this.isTyping) return;
        
        typingRef.child('monitor').set({
            isTyping: false,
            name: 'Monitor',
            timestamp: Date.now()
        });
        
        this.isTyping = false;
    }

    handleTypingIndicator(unitName, typingData) {
        if (!typingData) return;
        
        const driverTyping = typingData.driver;
        const typingIndicator = document.getElementById('monitorTypingIndicator');
        
        if (typingIndicator && driverTyping && driverTyping.isTyping && this.selectedChatUnit === unitName) {
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

    setupChatUIHandlers() {
        const chatInput = document.getElementById('monitorChatInput');
        if (!chatInput) return;
        
        let typingTimer;
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMonitorMessage();
            } else if (this.selectedChatUnit) {
                this.startTyping(this.selectedChatUnit);
                
                clearTimeout(typingTimer);
                typingTimer = setTimeout(() => {
                    this.stopTyping(this.selectedChatUnit);
                }, 2000);
            }
        });
        
        chatInput.addEventListener('blur', () => {
            if (this.selectedChatUnit) {
                this.stopTyping(this.selectedChatUnit);
            }
        });
    }

    startChat(unitName) {
        this.selectedChatUnit = unitName;
        
        this.unreadCounts.set(unitName, 0);
        
        const input = document.getElementById('monitorChatInput');
        const sendBtn = document.getElementById('monitorSendBtn');
        if (input && sendBtn) {
            input.disabled = false;
            sendBtn.disabled = false;
            input.placeholder = `Ketik pesan untuk ${unitName}...`;
        }
        
        const unitSelect = document.getElementById('monitorChatUnitSelect');
        if (unitSelect) {
            unitSelect.value = unitName;
        }
        
        this.updateChatUI();
        this.toggleMonitorChat(true);
    }

    updateChatUI() {
        if (!this.selectedChatUnit) return;
        
        const messageList = document.getElementById('monitorChatMessages');
        const unreadBadge = document.getElementById('monitorUnreadBadge');
        
        if (!messageList) return;
        
        let totalUnread = 0;
        this.unreadCounts.forEach(count => totalUnread += count);
        
        if (unreadBadge) {
            unreadBadge.textContent = totalUnread > 0 ? totalUnread : '';
            unreadBadge.style.display = totalUnread > 0 ? 'inline' : 'none';
        }
        
        const messages = this.chatMessages.get(this.selectedChatUnit) || [];
        messageList.innerHTML = '';
        
        if (messages.length === 0) {
            messageList.innerHTML = `
                <div class="chat-placeholder text-center text-muted py-4">
                    <small>Mulai percakapan dengan driver...</small>
                </div>
            `;
            return;
        }
        
        const groupedMessages = this.groupMessagesByDate(messages);
        
        Object.keys(groupedMessages).forEach(date => {
            if (Object.keys(groupedMessages).length > 1) {
                const dateElement = document.createElement('div');
                dateElement.className = 'chat-date-separator';
                dateElement.innerHTML = `<span>${date}</span>`;
                messageList.appendChild(dateElement);
            }
            
            groupedMessages[date].forEach(message => {
                const messageElement = this.createChatMessageElement(message);
                messageList.appendChild(messageElement);
            });
        });
        
        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'monitorTypingIndicator';
        typingIndicator.style.display = 'none';
        messageList.appendChild(typingIndicator);
        
        setTimeout(() => {
            messageList.scrollTop = messageList.scrollHeight;
        }, 100);
    }

    createChatMessageElement(message) {
        const messageElement = document.createElement('div');
        const isSentMessage = message.sender === 'Monitor';
        
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

    groupMessagesByDate(messages) {
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

    updateChatUnitSelect() {
        const unitSelect = document.getElementById('monitorChatUnitSelect');
        if (!unitSelect) return;
        
        unitSelect.innerHTML = '<option value="">Pilih Unit...</option>';
        
        this.units.forEach((unit, unitName) => {
            const option = document.createElement('option');
            option.value = unitName;
            option.textContent = `${unitName} - ${unit.driver}`;
            unitSelect.appendChild(option);
        });
        
        unitSelect.addEventListener('change', (e) => {
            if (e.target.value) {
                this.startChat(e.target.value);
            }
        });
    }

    toggleMonitorChat(show) {
        const chatWindow = document.getElementById('monitorChatWindow');
        if (!chatWindow) return;
        
        if (show !== undefined) {
            chatWindow.style.display = show ? 'flex' : 'none';
        } else {
            chatWindow.style.display = chatWindow.style.display === 'none' ? 'flex' : 'none';
        }
        
        if (chatWindow.style.display === 'flex' && this.selectedChatUnit) {
            const input = document.getElementById('monitorChatInput');
            if (input) input.focus();
        }
    }

    showChatNotification(unitName, message) {
        const notification = document.createElement('div');
        notification.className = 'alert alert-info chat-notification';
        notification.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>💬 Pesan Baru dari ${unitName}</strong>
                    <div class="small mt-1">${this.escapeHtml(message.text)}</div>
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
            animation: slideInRight 0.3s ease-out;
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

    getLastMessageId(unitName) {
        const messages = this.chatMessages.get(unitName) || [];
        return messages.length > 0 ? messages[messages.length - 1].id : null;
    }

    // Utility Methods
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

    updateConnectionStatus(connected) {
        const statusElement = this.uiElements.firebaseStatus;
        if (statusElement) {
            if (connected) {
                statusElement.innerHTML = '🟢 FIREBASE TERHUBUNG';
                statusElement.className = 'text-success fw-bold';
            } else {
                statusElement.innerHTML = '🔴 FIREBASE TERPUTUS';
                statusElement.className = 'text-danger fw-bold';
            }
        }
    }

    updateElement(id, value) {
        const element = this.uiElements[id] || document.getElementById(id);
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
        const unitItems = document.querySelectorAll('.unit-item');
        const searchLower = searchTerm.toLowerCase();
        
        unitItems.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchLower) ? 'block' : 'none';
        });
    }

    applyFilters() {
        const afdelingFilter = document.getElementById('filterAfdeling').value;
        const statusFilter = document.getElementById('filterStatus').value;
        const fuelFilter = document.getElementById('filterFuel').value;
        
        const unitItems = document.querySelectorAll('.unit-item');
        
        unitItems.forEach(item => {
            let show = true;
            
            if (afdelingFilter && !item.textContent.includes(afdelingFilter)) {
                show = false;
            }
            
            if (statusFilter) {
                const statusClass = statusFilter === 'active' ? 'online' : 
                                 statusFilter === 'moving' ? 'moving' : 'offline';
                if (!item.classList.contains(statusClass)) {
                    show = false;
                }
            }
            
            if (fuelFilter && !item.textContent.includes(fuelFilter === 'high' ? '🟢' : 
                                                       fuelFilter === 'medium' ? '🟡' : '🔴')) {
                show = false;
            }
            
            item.style.display = show ? 'block' : 'none';
        });
    }

    // Enhanced Periodic Tasks
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
        }, 5 * 60 * 1000);
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

        // Map refresh setiap 1 menit
        const mapRefreshInterval = setInterval(() => {
            if (this.leafletMap) {
                this.leafletMap.invalidateSize();
            }
        }, 60 * 1000);
        this.intervals.add(mapRefreshInterval);

        // Auto-refresh data setiap 30 detik
        const dataRefreshInterval = setInterval(() => {
            if (this.units.size > 0) {
                this.updateDisplay();
            }
        }, 30000);
        this.intervals.add(dataRefreshInterval);

        console.log('✅ Enhanced periodic tasks started');
    }

    cleanupStickyData() {
        console.log('🧹 Cleaning up sticky data...');
        
        const now = Date.now();
        const STALE_THRESHOLD = 30 * 60 * 1000;
        const stickyUnits = [];
        
        this.units.forEach((unit, unitName) => {
            if (!this.validateTimestamp(unit)) {
                console.log(`❌ Invalid timestamp for ${unitName}, marking for cleanup`);
                stickyUnits.push(unitName);
                return;
            }
            
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

    removeUnitCompletely(unitName) {
        this.removeUnit(unitName);
    }

    cleanupInactiveUnits(activeUnits) {
        const unitsToRemove = [];
        
        this.units.forEach((unit, unitName) => {
            if (!activeUnits.has(unitName)) {
                unitsToRemove.push(unitName);
            }
        });
        
        unitsToRemove.forEach(unitName => {
            this.removeUnit(unitName);
        });
    }

    removeUnit(unitName) {
        console.log(`🗑️ Removing unit: ${unitName}`);
        
        // Remove marker
        const marker = this.markers.get(unitName);
        if (marker) {
            if (this.currentMapType === 'google') {
                marker.setMap(null);
            } else {
                marker.remove();
            }
            this.markers.delete(unitName);
        }
        
        // Remove accuracy circle
        const accuracyCircle = this.accuracyCircles.get(unitName);
        if (accuracyCircle) {
            if (this.currentMapType === 'google') {
                accuracyCircle.setMap(null);
            } else {
                accuracyCircle.remove();
            }
            this.accuracyCircles.delete(unitName);
        }
        
        // Remove waypoints
        this.clearUnitWaypoints(unitName);
        
        // Remove from units map
        this.units.delete(unitName);
        
        // Cleanup chat system
        const chatRef = this.chatRefs.get(unitName);
        if (chatRef) {
            chatRef.off();
            this.chatRefs.delete(unitName);
        }
        
        const typingRef = this.typingRefs.get(unitName);
        if (typingRef) {
            typingRef.off();
            this.typingRefs.delete(unitName);
        }
        
        this.chatMessages.delete(unitName);
        this.unreadCounts.delete(unitName);
    }

    clearAllUnits() {
        this.units.forEach((unit, unitName) => {
            this.removeUnit(unitName);
        });
        
        this.units.clear();
        this.updateDisplay();
    }

    refreshAllMarkers() {
        this.units.forEach(unit => {
            this.createUnitMarker(unit);
            this.createAccuracyCircle(unit);
        });
    }

    // Enhanced Logs
    updateEnhancedLogs() {
        const logContainer = this.uiElements.enhancedDataLogs;
        if (!logContainer) return;
        
        const activeUnits = Array.from(this.units.values()).filter(unit => unit.isOnline).length;
        const totalWaypoints = Array.from(this.units.values()).reduce((sum, unit) => sum + (unit.waypointsCount || 0), 0);
        
        const logs = [
            `🕒 ${new Date().toLocaleTimeString('id-ID')}`,
            `🚛 ${activeUnits} units aktif`,
            `🎯 ${totalWaypoints} waypoints terdeteksi`,
            `📡 ${this.isConnected ? 'TERHUBUNG' : 'TERPUTUS'} ke Firebase`,
            `🗺️ ${this.currentMapType === 'google' ? 'Google Maps' : 'Leaflet'} aktif`
        ];
        
        logContainer.innerHTML = logs.map(log => `
            <div class="alert alert-info py-1 mb-1">
                <small>${log}</small>
            </div>
        `).join('');
    }

    addEnhancedLog(message, type = 'info') {
        const logContainer = this.uiElements.enhancedDataLogs;
        if (!logContainer) return;
        
        const alertClass = {
            'info': 'alert-info',
            'success': 'alert-success', 
            'error': 'alert-danger',
            'warning': 'alert-warning'
        }[type] || 'alert-info';
        
        const logEntry = document.createElement('div');
        logEntry.className = `alert ${alertClass} py-1 mb-1`;
        logEntry.innerHTML = `
            <small>${new Date().toLocaleTimeString('id-ID')}: ${message}</small>
        `;
        
        logContainer.insertBefore(logEntry, logContainer.firstChild);
        
        if (logContainer.children.length > 10) {
            logContainer.removeChild(logContainer.lastChild);
        }
    }

    logData(message, type, data) {
        console.log(`📝 ${type.toUpperCase()}: ${message}`, data || '');
    }

    // Public Methods
    refreshData() {
        console.log('🔄 Manual refresh requested');
        this.showLoading(true);
        this.cleanupFirebaseListeners();
        this.setupFirebaseListeners();
        setTimeout(() => this.showLoading(false), 2000);
    }

    forceCleanup() {
        if (confirm('Yakin ingin membersihkan semua data?')) {
            this.cleanup();
            this.showSuccess('Semua data berhasil dibersihkan');
        }
    }

    exportData() {
        const exportData = {
            exportedAt: new Date().toISOString(),
            totalUnits: this.units.size,
            activeUnits: Array.from(this.units.values()).filter(unit => unit.isOnline).length,
            units: Array.from(this.units.values()).map(unit => ({
                name: unit.name,
                driver: unit.driver,
                afdeling: unit.afdeling,
                status: unit.status,
                distance: unit.distance,
                speed: unit.speed,
                fuelLevel: unit.fuelLevel,
                lastUpdate: unit.lastUpdate,
                waypointsCount: unit.waypointsCount,
                accuracy: unit.accuracy,
                batteryLevel: unit.batteryLevel
            }))
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gps-comprehensive-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.addEnhancedLog('📊 Data comprehensive berhasil di-export', 'success');
    }

    toggleWaypoints() {
        this.showWaypoints = !this.showWaypoints;
        
        this.waypointMarkers.forEach((markers, unitName) => {
            markers.forEach(marker => {
                if (this.currentMapType === 'google') {
                    marker.setMap(this.showWaypoints ? this.googleMap : null);
                } else {
                    this.showWaypoints ? this.leafletMap.addLayer(marker) : this.leafletMap.removeLayer(marker);
                }
            });
        });
        
        this.routePolylines.forEach((polyline, unitName) => {
            if (this.currentMapType === 'google') {
                polyline.setMap(this.showWaypoints ? this.googleMap : null);
            } else {
                this.showWaypoints ? this.leafletMap.addLayer(polyline) : this.leafletMap.removeLayer(polyline);
            }
        });
        
        this.addEnhancedLog(`Waypoints ${this.showWaypoints ? 'ditampilkan' : 'disembunyikan'}`, 'info');
    }

    exportWaypointData() {
        const waypointData = {
            exportedAt: new Date().toISOString(),
            units: Array.from(this.units.values()).map(unit => ({
                name: unit.name,
                driver: unit.driver,
                waypointsCount: unit.waypointsCount,
                distance: unit.distance,
                lastUpdate: unit.lastUpdate
            }))
        };

        const dataStr = JSON.stringify(waypointData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `waypoints-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.addEnhancedLog('🎯 Waypoint data berhasil di-export', 'success');
    }

    clearWaypointData() {
        if (confirm('Yakin ingin menghapus semua waypoint data?')) {
            this.waypointMarkers.forEach((markers, unitName) => {
                markers.forEach(marker => {
                    if (this.currentMapType === 'google') {
                        marker.setMap(null);
                    } else {
                        marker.remove();
                    }
                });
            });
            this.waypointMarkers.clear();
            
            this.routePolylines.forEach((polyline, unitName) => {
                if (this.currentMapType === 'google') {
                    polyline.setMap(null);
                } else {
                    polyline.remove();
                }
            });
            this.routePolylines.clear();
            
            this.addEnhancedLog('Waypoint data berhasil dihapus', 'success');
        }
    }

    // Cleanup Methods
    cleanupFirebaseListeners() {
        if (this.firebaseListener) {
            database.ref('/units').off('value', this.firebaseListener);
            this.firebaseListener = null;
        }
        
        if (this.waypointsListener) {
            database.ref('/waypoints').off('value', this.waypointsListener);
            this.waypointsListener = null;
        }
        
        if (this.connectionRef) {
            this.connectionRef.off();
            this.connectionRef = null;
        }
        
        this.chatRefs.forEach((chatRef, unitName) => {
            chatRef.off();
        });
        this.chatRefs.clear();
        
        this.typingRefs.forEach((typingRef, unitName) => {
            typingRef.off();
        });
        this.typingRefs.clear();
    }

    cleanup() {
        console.log('🧹 Comprehensive cleanup...');
        
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();
        
        this.cleanupFirebaseListeners();
        
        this.clearAllUnits();
        
        if (this.leafletMap) {
            this.leafletMap.remove();
            this.leafletMap = null;
        }
        
        console.log('✅ Comprehensive cleanup completed');
    }
}

// ===== GLOBAL FUNCTIONS =====
function refreshData() {
    if (window.comprehensiveMonitor) {
        window.comprehensiveMonitor.refreshData();
    }
}

function forceCleanup() {
    if (window.comprehensiveMonitor) {
        window.comprehensiveMonitor.forceCleanup();
    }
}

function exportData() {
    if (window.comprehensiveMonitor) {
        window.comprehensiveMonitor.exportData();
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('show');
    }
}

function toggleMonitorChat() {
    if (window.comprehensiveMonitor) {
        window.comprehensiveMonitor.toggleMonitorChat();
    }
}

function handleMonitorChatInput(event) {
    if (window.comprehensiveMonitor) {
        window.comprehensiveMonitor.handleMonitorChatInput(event);
    }
}

function sendMonitorMessage() {
    if (window.comprehensiveMonitor) {
        window.comprehensiveMonitor.sendMonitorMessage();
    }
}

function selectChatUnit(unitName) {
    if (window.comprehensiveMonitor) {
        window.comprehensiveMonitor.selectChatUnit(unitName);
    }
}

function toggleWaypoints() {
    if (window.comprehensiveMonitor) {
        window.comprehensiveMonitor.toggleWaypoints();
    }
}

function exportWaypointData() {
    if (window.comprehensiveMonitor) {
        window.comprehensiveMonitor.exportWaypointData();
    }
}

function clearWaypointData() {
    if (window.comprehensiveMonitor) {
        window.comprehensiveMonitor.clearWaypointData();
    }
}

function cleanupStickyData() {
    if (window.comprehensiveMonitor) {
        const stickyUnits = window.comprehensiveMonitor.cleanupStickyData();
        
        if (stickyUnits.length > 0) {
            alert(`🧹 Cleanup Berhasil!\n${stickyUnits.length} unit lengket dihapus:\n${stickyUnits.join(', ')}`);
        } else {
            alert('✅ Tidak ada data lengket ditemukan');
        }
    }
}

function cleanupSpecificUnitPrompt() {
    const unitName = prompt('Masukkan nama unit yang akan dibersihkan (contoh: DT-06):');
    
    if (unitName && window.comprehensiveMonitor) {
        const success = window.comprehensiveMonitor.cleanupSpecificUnit(unitName);
        
        if (success) {
            alert(`✅ Unit ${unitName} berhasil dibersihkan`);
        } else {
            alert(`❌ Unit ${unitName} tidak ditemukan`);
        }
    }
}

function forceCleanupAllData() {
    if (confirm('⚠️ HAPUS SEMUA DATA?\n\nIni akan menghapus SEMUA unit dari peta dan memory.\nLanjutkan?')) {
        if (window.comprehensiveMonitor) {
            window.comprehensiveMonitor.forceCleanupAllData();
            alert('✅ Semua data berhasil dibersihkan');
        }
    }
}

function debugMap() {
    console.log('🔍 Debugging Maps...');
    console.log('Current map type:', window.comprehensiveMonitor?.currentMapType);
    console.log('Google Maps:', typeof google);
    console.log('Leaflet Map:', window.comprehensiveMonitor?.leafletMap);
    
    if (window.comprehensiveMonitor?.leafletMap) {
        window.comprehensiveMonitor.leafletMap.invalidateSize(true);
        console.log('✅ Leaflet map refreshed');
    }
}

// Initialize System
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded - initializing Comprehensive GPS Monitoring System');
    
    if (window.comprehensiveMonitor) {
        window.comprehensiveMonitor.cleanup();
    }
    
    window.comprehensiveMonitor = new ComprehensiveGPSMonitor();
    
    // Set global functions
    window.refreshData = refreshData;
    window.forceCleanup = forceCleanup;
    window.exportData = exportData;
    window.toggleSidebar = toggleSidebar;
    window.toggleMonitorChat = toggleMonitorChat;
    window.handleMonitorChatInput = handleMonitorChatInput;
    window.sendMonitorMessage = sendMonitorMessage;
    window.selectChatUnit = selectChatUnit;
    window.toggleWaypoints = toggleWaypoints;
    window.exportWaypointData = exportWaypointData;
    window.clearWaypointData = clearWaypointData;
    window.cleanupStickyData = cleanupStickyData;
    window.cleanupSpecificUnitPrompt = cleanupSpecificUnitPrompt;
    window.forceCleanupAllData = forceCleanupAllData;
    window.debugMap = debugMap;
});

window.addEventListener('beforeunload', function() {
    if (window.comprehensiveMonitor) {
        window.comprehensiveMonitor.cleanup();
    }
});

window.addEventListener('error', function(event) {
    console.error('🚨 Global error caught:', event.error);
    if (window.comprehensiveMonitor) {
        window.comprehensiveMonitor.showError('System error occurred: ' + event.error.message);
    }
});

// Auto cleanup setelah page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.comprehensiveMonitor && confirm('Jalankan auto-cleanup data lengket?')) {
            window.comprehensiveMonitor.cleanupStickyData();
        }
    }, 10000);
});

console.log('🎯 Comprehensive GPS Monitoring System script loaded successfully');
