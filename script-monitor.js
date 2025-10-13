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

// SAGM GPS Tracking System for Kebun Tempuling dengan FIREBASE REAL-TIME
class SAGMGpsTracking {
    constructor() {
        this.map = null;
        this.units = [];
        this.markers = {};
        this.importantMarkers = [];
        this.unitHistory = {};
        this.activeUnits = 0;
        this.totalDistance = 0;
        this.avgSpeed = 0;
        this.totalFuelConsumption = 0;
        this.lastUpdate = new Date();
        this.autoRefreshInterval = null;
        this.firebaseListener = null;
        
        // ENHANCED: Route visualization dengan perbaikan
        this.unitPolylines = {}; // Store polylines for each unit
        this.showRoutes = true; // Toggle untuk menampilkan rute
        this.routeColors = {}; // Color untuk setiap unit
        this.routeControls = null; // Controls untuk rute
        this.maxRoutePoints = 200; // Batasi jumlah titik untuk performa
        
        // NEW: Tracking driver online status
        this.driverOnlineStatus = {}; // Track jika driver masih online
        this.lastDataTimestamps = {}; // Track last update time per unit
        
        this.vehicleConfig = {
            fuelEfficiency: 4, // 4 km per liter
            maxSpeed: 80,
            idleFuelConsumption: 1.5, // liter per jam saat idle
            fuelTankCapacity: 100 // liter
        };

        // Koordinat penting - DIPASTIKAN ADA
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

        this.init();
    }

    // NEW: Generate unique color untuk setiap unit
    generateUnitColor(unitName) {
        if (!this.routeColors[unitName]) {
            const colors = [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
                '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
                '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
                '#F9E79F', '#ABEBC6', '#E8DAEF', '#FAD7A0', '#AED6F1',
                '#A3E4D7', '#F5B7B1', '#D2B4DE', '#FDEBD0', '#A9DFBF'
            ];
            this.routeColors[unitName] = colors[Object.keys(this.routeColors).length % colors.length];
        }
        return this.routeColors[unitName];
    }

    init() {
        try {
            console.log('🚀 Initializing GPS Tracking System...');
            this.initializeMap();
            this.setupEventListeners();
            this.initializeFirebaseListener();
            this.loadUnitData();
            this.startAutoRefresh();
            this.initializeHistoryStorage();
            this.startOnlineStatusChecker();
            
            // Test Firebase connection setelah 3 detik
            setTimeout(() => {
                this.testFirebaseConnection();
            }, 3000);
            
        } catch (error) {
            console.error('Error initializing GPS system:', error);
            this.showError('Gagal menginisialisasi sistem GPS');
        }
    }

    // NEW: Test Firebase connection
    testFirebaseConnection() {
        console.log('🧪 Testing Firebase connection...');
        
        // Test read data
        database.ref('/units').once('value')
            .then((snapshot) => {
                const data = snapshot.val();
                console.log('📊 Current Firebase data:', data);
                
                if (data && Object.keys(data).length > 0) {
                    console.log('✅ Firebase data found:', Object.keys(data));
                    this.showNotification('Firebase connected - Data ditemukan', 'success');
                } else {
                    console.log('📭 No data in Firebase');
                    this.showNotification('Firebase connected - Tidak ada data', 'warning');
                }
            })
            .catch((error) => {
                console.error('❌ Firebase test failed:', error);
                this.showNotification('Firebase test failed: ' + error.message, 'danger');
            });
    }

    // NEW: Check online status of drivers
    startOnlineStatusChecker() {
        setInterval(() => {
            const now = Date.now();
            Object.keys(this.lastDataTimestamps).forEach(unitName => {
                const lastUpdate = this.lastDataTimestamps[unitName];
                const timeDiff = now - lastUpdate;
                
                // Jika tidak ada update dalam 30 detik, anggap driver offline
                if (timeDiff > 30000) {
                    this.handleDriverOffline(unitName);
                }
            });
        }, 10000); // Check every 10 seconds
    }

    // NEW: Handle ketika driver logout/offline
    handleDriverOffline(unitName) {
        const unitIndex = this.units.findIndex(u => u.name === unitName);
        if (unitIndex !== -1) {
            // Update status unit menjadi inactive
            this.units[unitIndex].status = 'inactive';
            this.units[unitIndex].lastUpdate = 'OFFLINE';
            this.units[unitIndex].isOnline = false;
            
            // Update marker
            this.updateUnitMarker(this.units[unitIndex]);
            
            // Update statistics dan UI
            this.updateStatistics();
            this.renderUnitList();
            
            console.log(`🚫 Driver ${unitName} offline`);
            this.addLog(`Driver ${unitName} offline - data dihapus dari peta`, 'warning');
        }
        
        // Hapus dari tracking
        delete this.driverOnlineStatus[unitName];
        delete this.lastDataTimestamps[unitName];
    }

    // Initialize Firebase Real-time Listener dengan PERBAIKAN BESAR
    initializeFirebaseListener() {
        try {
            console.log('🟡 Mencoba connect ke Firebase...');
            
            // Cek koneksi Firebase
            database.ref('.info/connected').on('value', (snapshot) => {
                const connected = snapshot.val();
                console.log('📡 Firebase connection status:', connected);
                this.updateFirebaseStatus(connected);
            });

            this.firebaseListener = database.ref('/units').on('value', (snapshot) => {
                const data = snapshot.val();
                console.log('📨 Data received from Firebase:', data);
                this.handleRealTimeUpdate(data);
            }, (error) => {
                console.error('❌ Firebase listener error:', error);
                this.showError('Koneksi real-time terputus: ' + error.message);
            });
            
            // NEW: Listen for removed data (when driver logs out)
            database.ref('/units').on('child_removed', (snapshot) => {
                console.log('🗑️ Data removed from Firebase:', snapshot.key);
                this.handleDriverLogout(snapshot.key);
            });
            
            console.log('✅ Firebase real-time listener aktif');
            
        } catch (error) {
            console.error('❌ Error initializing Firebase listener:', error);
            this.showError('Gagal menginisialisasi Firebase: ' + error.message);
        }
    }

    // NEW: Handle ketika driver logout dan data dihapus dari Firebase
    handleDriverLogout(unitName) {
        console.log(`🚫 Data dihapus dari Firebase untuk unit: ${unitName}`);
        
        // Hapus unit dari daftar
        this.units = this.units.filter(unit => unit.name !== unitName);
        
        // Hapus marker dari peta
        if (this.markers[unitName]) {
            this.map.removeLayer(this.markers[unitName]);
            delete this.markers[unitName];
        }
        
        // Hapus polyline rute
        if (this.unitPolylines[unitName]) {
            this.map.removeLayer(this.unitPolylines[unitName]);
            delete this.unitPolylines[unitName];
        }
        
        // Hapus dari tracking
        delete this.driverOnlineStatus[unitName];
        delete this.lastDataTimestamps[unitName];
        delete this.unitHistory[unitName];
        
        // Update UI
        this.updateStatistics();
        this.renderUnitList();
        
        this.addLog(`Driver ${unitName} logout - data dihapus dari sistem`, 'info');
    }

    // Handle real-time updates dari Firebase dengan PERBAIKAN BESAR
    handleRealTimeUpdate(firebaseData) {
        console.log('🔄 handleRealTimeUpdate called with:', firebaseData);
        
        if (!firebaseData) {
            console.log('📭 Tidak ada data real-time dari Firebase');
            // Tidak mengosongkan units sepenuhnya, biarkan data terakhir tetap
            this.updateStatistics();
            this.renderUnitList();
            return;
        }

        console.log('🔄 Update real-time dari Firebase:', Object.keys(firebaseData).length + ' units');
        
        let updatedCount = 0;
        const currentUnitNames = new Set();
        
        Object.entries(firebaseData).forEach(([unitName, unitData]) => {
            console.log(`📝 Processing unit ${unitName}:`, unitData);
            currentUnitNames.add(unitName);
            
            // NEW: Track last update time
            this.lastDataTimestamps[unitName] = Date.now();
            this.driverOnlineStatus[unitName] = true;
            
            const existingUnitIndex = this.units.findIndex(u => u.name === unitName);
            
            if (existingUnitIndex !== -1) {
                console.log(`🔄 Updating existing unit: ${unitName}`);
                this.updateUnitFromFirebase(this.units[existingUnitIndex], unitData);
                updatedCount++;
            } else {
                console.log(`🆕 Creating new unit: ${unitName}`);
                const newUnit = this.createUnitFromFirebase(unitName, unitData);
                if (newUnit) {
                    this.units.push(newUnit);
                    updatedCount++;
                }
            }
        });

        // NEW: Handle units yang tidak lagi ada di Firebase
        this.units.forEach(unit => {
            if (!currentUnitNames.has(unit.name)) {
                console.log(`🚫 Unit ${unit.name} tidak ada di Firebase, marking offline`);
                this.handleDriverOffline(unit.name);
            }
        });

        if (updatedCount > 0) {
            console.log(`✅ Updated ${updatedCount} units`);
            this.updateStatistics();
            this.renderUnitList();
            this.updateMapMarkers();
            this.addLog(`Data real-time diperbarui: ${updatedCount} unit`, 'success');
        } else {
            console.log('ℹ️ No units updated');
        }
    }

    // Create unit object from Firebase data dengan VALIDASI
    createUnitFromFirebase(unitName, firebaseData) {
        // Validasi data penting
        if (!firebaseData || !firebaseData.lat || !firebaseData.lng) {
            console.warn(`⚠️ Data tidak valid untuk unit ${unitName}:`, firebaseData);
            return null;
        }

        const newUnit = {
            id: this.generateUnitId(unitName),
            name: unitName,
            afdeling: this.getAfdelingFromUnit(unitName),
            status: this.getStatusFromJourneyStatus(firebaseData.journeyStatus),
            latitude: parseFloat(firebaseData.lat),
            longitude: parseFloat(firebaseData.lng),
            speed: parseFloat(firebaseData.speed) || 0,
            lastUpdate: firebaseData.lastUpdate || new Date().toLocaleTimeString('id-ID'),
            distance: parseFloat(firebaseData.distance) || 0,
            fuelLevel: this.calculateFuelLevel(firebaseData.distance),
            fuelUsed: firebaseData.distance ? parseFloat(firebaseData.distance) / this.vehicleConfig.fuelEfficiency : 0,
            driver: firebaseData.driver || 'Unknown',
            accuracy: parseFloat(firebaseData.accuracy) || 0,
            batteryLevel: firebaseData.batteryLevel || null,
            lastLat: parseFloat(firebaseData.lat),
            lastLng: parseFloat(firebaseData.lng),
            isOnline: true
        };

        console.log(`✅ Created unit: ${unitName}`, newUnit);
        
        // Initialize history untuk unit baru
        this.initializeUnitHistory(newUnit);
        return newUnit;
    }

    // NEW: Initialize history untuk unit baru
    initializeUnitHistory(unit) {
        if (!this.unitHistory[unit.name]) {
            this.unitHistory[unit.name] = [];
        }
        
        // Tambahkan titik pertama ke history
        this.addPointToHistory(unit);
    }

    // Update existing unit with Firebase data
    updateUnitFromFirebase(unit, firebaseData) {
        // Calculate distance hanya jika ada perpindahan signifikan
        if (unit.lastLat && unit.lastLng && firebaseData.lat && firebaseData.lng) {
            const distance = this.calculateDistance(
                unit.lastLat, unit.lastLng, 
                firebaseData.lat, firebaseData.lng
            );
            
            // Hanya tambahkan distance jika perpindahan > 10 meter
            if (distance > 0.01 && unit.status === 'moving') {
                unit.distance += distance;
                unit.fuelUsed += distance / this.vehicleConfig.fuelEfficiency;
            }
        }

        unit.latitude = firebaseData.lat || unit.latitude;
        unit.longitude = firebaseData.lng || unit.longitude;
        unit.speed = firebaseData.speed || unit.speed;
        unit.status = this.getStatusFromJourneyStatus(firebaseData.journeyStatus) || unit.status;
        unit.lastUpdate = firebaseData.lastUpdate || unit.lastUpdate;
        unit.driver = firebaseData.driver || unit.driver;
        unit.accuracy = firebaseData.accuracy || unit.accuracy;
        unit.batteryLevel = firebaseData.batteryLevel || unit.batteryLevel;
        unit.fuelLevel = this.calculateFuelLevel(unit.distance);
        unit.lastLat = firebaseData.lat;
        unit.lastLng = firebaseData.lng;
        unit.isOnline = true; // NEW: Set online status

        // Update history untuk route tracking - DIPERBAIKI
        this.addPointToHistory(unit);
    }

    // Generate consistent ID from unit name
    generateUnitId(unitName) {
        const unitIdMap = {
            'DT-06': 1, 'DT-07': 2, 'DT-12': 3, 'DT-13': 4, 'DT-15': 5, 'DT-16': 6,
            'DT-17': 7, 'DT-18': 8, 'DT-23': 9, 'DT-24': 10, 'DT-25': 11, 'DT-26': 12,
            'DT-27': 13, 'DT-28': 14, 'DT-29': 15, 'DT-32': 16, 'DT-33': 17, 'DT-34': 18,
            'DT-35': 19, 'DT-36': 20, 'DT-37': 21, 'DT-38': 22, 'DT-39': 23
        };
        return unitIdMap[unitName] || Date.now();
    }

    initializeHistoryStorage() {
        try {
            const savedHistory = localStorage.getItem('sagm_unit_history');
            if (savedHistory) {
                this.unitHistory = JSON.parse(savedHistory);
                console.log('📂 Loaded history from storage:', Object.keys(this.unitHistory).length + ' units');
            }
        } catch (error) {
            console.error('Error loading history:', error);
            this.unitHistory = {};
        }
    }

    saveHistoryToStorage() {
        try {
            localStorage.setItem('sagm_unit_history', JSON.stringify(this.unitHistory));
        } catch (error) {
            console.error('Error saving history:', error);
        }
    }

    // PERBAIKAN BESAR: Method untuk menambah titik ke history
    addPointToHistory(unit) {
        if (!this.unitHistory[unit.name]) {
            this.unitHistory[unit.name] = [];
        }

        const history = this.unitHistory[unit.name];
        const now = new Date().toISOString();

        // Always add point untuk testing - nanti bisa di-filter
        const newPoint = {
            timestamp: now,
            latitude: unit.latitude,
            longitude: unit.longitude,
            speed: unit.speed,
            distance: unit.distance,
            status: unit.status
        };

        history.push(newPoint);

        // Keep only last points untuk prevent memory issues
        if (history.length > this.maxRoutePoints) {
            this.unitHistory[unit.name] = history.slice(-this.maxRoutePoints);
        }

        // Update route polyline - PASTIKAN DIPANGGIL
        this.updateUnitRoute(unit);
        this.saveHistoryToStorage();

        console.log(`📍 Added point to ${unit.name} history:`, {
            lat: unit.latitude,
            lng: unit.longitude,
            totalPoints: history.length
        });
    }

    // PERBAIKAN BESAR: Create or update route polyline untuk unit
    updateUnitRoute(unit) {
        if (!this.unitHistory[unit.name] || this.unitHistory[unit.name].length < 1) {
            console.log(`No history for ${unit.name}`);
            return;
        }

        const routePoints = this.unitHistory[unit.name].map(point => [
            point.latitude, point.longitude
        ]);

        console.log(`🔄 Updating route for ${unit.name}:`, {
            points: routePoints.length,
            currentPos: [unit.latitude, unit.longitude]
        });

        const unitColor = this.generateUnitColor(unit.name);

        if (this.unitPolylines[unit.name]) {
            // Update existing polyline
            try {
                this.unitPolylines[unit.name].setLatLngs(routePoints);
                
                // Update style based on status
                const style = this.getRouteStyle(unit.status, unitColor);
                this.unitPolylines[unit.name].setStyle(style);
                
                console.log(`✅ Updated existing polyline for ${unit.name}`);
            } catch (error) {
                console.error(`Error updating polyline for ${unit.name}:`, error);
                // Recreate polyline jika error
                this.map.removeLayer(this.unitPolylines[unit.name]);
                delete this.unitPolylines[unit.name];
                this.createNewPolyline(unit, routePoints, unitColor);
            }
        } else {
            // Create new polyline
            this.createNewPolyline(unit, routePoints, unitColor);
        }
    }

    // NEW: Method untuk membuat polyline baru
    createNewPolyline(unit, routePoints, unitColor) {
        try {
            const style = this.getRouteStyle(unit.status, unitColor);
            
            this.unitPolylines[unit.name] = L.polyline(routePoints, style);
            
            // Only add to map if showRoutes is true
            if (this.showRoutes) {
                this.unitPolylines[unit.name].addTo(this.map);
            }

            // Add interactive popup to polyline
            this.unitPolylines[unit.name].bindPopup(this.createRoutePopup(unit));
            
            // Add click event to focus on unit
            this.unitPolylines[unit.name].on('click', () => {
                this.focusOnUnit(unit);
            });

            console.log(`✅ Created new polyline for ${unit.name} with ${routePoints.length} points`);
        } catch (error) {
            console.error(`Error creating polyline for ${unit.name}:`, error);
        }
    }

    // NEW: Get route style based on unit status
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
                return {
                    ...baseStyle,
                    opacity: 0.9,
                    weight: 5,
                    dashArray: null // Solid line for moving
                };
            case 'active':
                return {
                    ...baseStyle,
                    opacity: 0.7,
                    weight: 4,
                    dashArray: '5, 10' // Dashed line for active but not moving
                };
            case 'inactive':
                return {
                    ...baseStyle,
                    opacity: 0.4,
                    weight: 3,
                    dashArray: '2, 8' // Dotted line for inactive
                };
            default:
                return baseStyle;
        }
    }

    // NEW: Create popup for route
    createRoutePopup(unit) {
        const routePoints = this.unitHistory[unit.name]?.length || 0;
        const totalDistance = unit.distance.toFixed(2);
        const routeColor = this.generateUnitColor(unit.name);

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
                        <span class="info-label">Points Rute:</span>
                        <span class="info-value">${routePoints}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Warna Rute:</span>
                        <span class="info-value">
                            <span style="color: ${routeColor}">■</span> ${routeColor}
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Status:</span>
                        <span class="info-value ${unit.status === 'moving' ? 'text-warning' : unit.status === 'active' ? 'text-success' : 'text-danger'}">
                            ${unit.status === 'moving' ? 'Dalam Perjalanan' : unit.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                        </span>
                    </div>
                </div>
                <div class="text-center mt-2">
                    <button class="btn btn-sm btn-outline-primary" onclick="window.gpsSystem.focusOnUnit('${unit.name}')">
                        🔍 Fokus ke Unit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="window.gpsSystem.clearUnitRoute('${unit.name}')">
                        🗑️ Hapus Rute
                    </button>
                </div>
            </div>
        `;
    }

    // NEW: Focus map on specific unit
    focusOnUnit(unitOrName) {
        let unit;
        if (typeof unitOrName === 'string') {
            unit = this.units.find(u => u.name === unitOrName);
        } else {
            unit = unitOrName;
        }

        if (unit && this.map) {
            this.map.setView([unit.latitude, unit.longitude], 15);
            
            // Open popup if marker exists
            if (this.markers[unit.name]) {
                this.markers[unit.name].openPopup();
            }
            
            this.showNotification(`Memfokuskan peta ke ${unit.name}`, 'info');
        }
    }

    // NEW: Clear route for specific unit
    clearUnitRoute(unitName) {
        if (this.unitPolylines[unitName]) {
            this.map.removeLayer(this.unitPolylines[unitName]);
            delete this.unitPolylines[unitName];
        }
        
        if (this.unitHistory[unitName]) {
            this.unitHistory[unitName] = [];
            this.saveHistoryToStorage();
        }
        
        this.showNotification(`Rute untuk ${unitName} dihapus`, 'info');
    }

    // NEW: Toggle route visibility
    toggleRoutes() {
        this.showRoutes = !this.showRoutes;
        
        Object.entries(this.unitPolylines).forEach(([unitName, polyline]) => {
            if (this.showRoutes) {
                this.map.addLayer(polyline);
            } else {
                this.map.removeLayer(polyline);
            }
        });

        this.showNotification(
            this.showRoutes ? '🟢 Rute ditampilkan' : '🔴 Rute disembunyikan',
            this.showRoutes ? 'success' : 'info'
        );
    }

    // NEW: Clear all routes
    clearAllRoutes() {
        Object.values(this.unitPolylines).forEach(polyline => {
            this.map.removeLayer(polyline);
        });
        this.unitPolylines = {};
        this.unitHistory = {};
        this.saveHistoryToStorage();
        this.showNotification('🗑️ Semua rute dihapus', 'info');
    }

    initializeMap() {
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

            this.addImportantLocations();
            this.addRouteControls();

            console.log('✅ Map initialized with route controls');

        } catch (error) {
            console.error('Error initializing map:', error);
            throw new Error('Gagal menginisialisasi peta');
        }
    }

    addImportantLocations() {
        try {
            // Clear existing important markers
            this.importantMarkers.forEach(marker => {
                if (marker && this.map) {
                    this.map.removeLayer(marker);
                }
            });
            this.importantMarkers = [];

            // PKS SAGM Marker
            const pksIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-icon pks" title="PKS SAGM">🏭</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const pksMarker = L.marker([this.importantLocations.PKS_SAGM.lat, this.importantLocations.PKS_SAGM.lng], { icon: pksIcon })
                .bindPopup(this.createLocationPopup('PKS SAGM', 'pks'))
                .addTo(this.map);

            // Kantor Kebun Marker
            const officeIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-icon office" title="Kantor Kebun">🏢</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const officeMarker = L.marker([this.importantLocations.KANTOR_KEBUN.lat, this.importantLocations.KANTOR_KEBUN.lng], { icon: officeIcon })
                .bindPopup(this.createLocationPopup('Kantor Kebun PT SAGM', 'office'))
                .addTo(this.map);

            this.importantMarkers.push(pksMarker, officeMarker);
            console.log('✅ Important locations added:', this.importantLocations);

        } catch (error) {
            console.error('Error adding important locations:', error);
        }
    }

    createLocationPopup(name, type) {
        const pksInfo = `
            <div class="info-item">
                <span class="info-label">Kapasitas:</span>
                <span class="info-value">45 Ton TBS/Jam</span>
            </div>
        `;

        const officeInfo = `
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
                    ${type === 'pks' ? pksInfo : officeInfo}
                </div>
            </div>
        `;
    }

    // ENHANCED: Add route controls to map
    addRouteControls() {
        const routeControl = L.control({ position: 'topright' });
        
        routeControl.onAdd = (map) => {
            const div = L.DomUtil.create('div', 'route-controls');
            div.innerHTML = `
                <div class="btn-group-vertical">
                    <button class="btn btn-sm btn-success" onclick="window.gpsSystem.toggleRoutes()" 
                            title="${this.showRoutes ? 'Sembunyikan Rute' : 'Tampilkan Rute'}">
                        ${this.showRoutes ? '🗺️' : '🚫'} Rute
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="window.gpsSystem.clearAllRoutes()" 
                            title="Hapus Semua Rute">
                        🗑️ Hapus
                    </button>
                    <button class="btn btn-sm btn-info" onclick="window.gpsSystem.exportRoutesData()" 
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

    // NEW: Export routes data
    exportRoutesData() {
        const exportData = {
            timestamp: new Date().toISOString(),
            totalUnits: this.units.length,
            routes: {}
        };

        this.units.forEach(unit => {
            exportData.routes[unit.name] = {
                driver: unit.driver,
                totalDistance: unit.distance,
                routePoints: this.unitHistory[unit.name]?.length || 0,
                history: this.unitHistory[unit.name] || []
            };
        });

        // Create downloadable file
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `routes-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.showNotification('Data rute berhasil diexport', 'success');
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchUnit');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterUnits());
        }

        const filters = ['filterAfdeling', 'filterStatus', 'filterFuel'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.filterUnits());
            }
        });

        // Firebase connection status sudah dipindah ke initializeFirebaseListener
    }

    updateFirebaseStatus(connected) {
        const statusElement = document.getElementById('firebaseStatus');
        if (statusElement) {
            if (connected) {
                statusElement.innerHTML = '🟢 TERHUBUNG KE FIREBASE';
                statusElement.className = 'text-success';
                console.log('✅ Firebase connected');
            } else {
                statusElement.innerHTML = '🔴 FIREBASE OFFLINE';
                statusElement.className = 'text-danger';
                console.log('❌ Firebase disconnected');
            }
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

    startAutoRefresh() {
        this.autoRefreshInterval = setInterval(() => {
            this.addLog('Auto-refresh data', 'info');
        }, 30000);
    }

    async loadUnitData() {
        try {
            this.showLoading(true);
            
            const data = await this.fetchUnitData();
            this.units = data;
            
            this.units.forEach(unit => {
                unit.lastLat = unit.latitude;
                unit.lastLng = unit.longitude;
                unit.distance = unit.distance || 0;
                unit.fuelUsed = unit.fuelUsed || 0;
                unit.isOnline = true;
            });
            
            this.updateStatistics();
            this.renderUnitList();
            this.updateMapMarkers();
            
            this.showLoading(false);
            this.showNotification('Sistem monitoring aktif - Menunggu data real-time', 'success');
            
        } catch (error) {
            console.error('Error loading unit data:', error);
            this.showLoading(false);
            this.showError('Gagal memuat data unit: ' + error.message);
        }
    }

    async fetchUnitData() {
        try {
            console.log('📡 Fetching initial data from Firebase...');
            const snapshot = await database.ref('/units').once('value');
            const firebaseData = snapshot.val();
            
            if (firebaseData && Object.keys(firebaseData).length > 0) {
                console.log('✅ Data real ditemukan di Firebase:', Object.keys(firebaseData).length + ' units');
                
                const realUnits = [];
                
                for (const [unitName, unitData] of Object.entries(firebaseData)) {
                    const unit = this.createUnitFromFirebase(unitName, unitData);
                    if (unit) {
                        realUnits.push(unit);
                    }
                }
                
                return realUnits;
            }
            
            console.log('📭 Tidak ada data real-time dari driver');
            return [];
            
        } catch (error) {
            console.error('Error mengambil data Firebase:', error);
            return [];
        }
    }

    getAfdelingFromUnit(unitName) {
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

    getStatusFromJourneyStatus(journeyStatus) {
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
        const baseFuel = 80;
        const fuelUsed = distance ? distance / this.vehicleConfig.fuelEfficiency : 0;
        return Math.max(10, baseFuel - (fuelUsed / this.vehicleConfig.fuelTankCapacity * 100));
    }

    // ENHANCED: Update unit marker dengan status online/offline
    updateUnitMarker(unit) {
        if (this.markers[unit.id]) {
            // Update existing marker position and popup
            this.markers[unit.id].setLatLng([unit.latitude, unit.longitude]);
            this.markers[unit.id].setPopupContent(this.createUnitPopup(unit));
            
            // Update marker icon based on online status
            const markerIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-icon ${unit.status} ${unit.isOnline ? '' : 'offline'}" 
                             title="${unit.name} ${unit.isOnline ? '' : '(OFFLINE)'}">🚛</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });
            this.markers[unit.id].setIcon(markerIcon);
        }
    }

    // ENHANCED: Create unit popup dengan info rute
    createUnitPopup(unit) {
        const routePoints = this.unitHistory[unit.name]?.length || 0;
        const routeInfo = routePoints > 0 ? `
            <div class="info-item">
                <span class="info-label">Points Rute:</span>
                <span class="info-value">${routePoints}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Warna Rute:</span>
                <span class="info-value" style="color: ${this.generateUnitColor(unit.name)}">■ ${this.generateUnitColor(unit.name)}</span>
            </div>
            <div class="text-center mt-2">
                <button class="btn btn-sm btn-outline-primary w-100" 
                        onclick="window.gpsSystem.focusOnUnit('${unit.name}')">
                    🔍 Fokus & Lihat Rute
                </button>
                <button class="btn btn-sm btn-outline-info w-100 mt-1" 
                        onclick="window.gpsSystem.toggleRoutes()">
                    🗺️ Toggle Semua Rute
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

    addLog(message, type = 'info') {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    showNotification(message, type = 'info') {
        console.log(`[NOTIFICATION ${type}] ${message}`);
        
        // Simple notification display
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
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

    showError(message) {
        console.error(`[ERROR] ${message}`);
        this.showNotification(message, 'danger');
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'block' : 'none';
        }
    }

    updateStatistics() {
        const activeUnits = this.units.filter(unit => unit.status === 'active' || unit.status === 'moving').length;
        const totalDistance = this.units.reduce((sum, unit) => sum + unit.distance, 0);
        const totalSpeed = this.units.reduce((sum, unit) => sum + unit.speed, 0);
        const avgSpeed = this.units.length > 0 ? totalSpeed / this.units.length : 0;
        const totalFuel = this.units.reduce((sum, unit) => sum + unit.fuelUsed, 0);

        this.activeUnits = activeUnits;
        this.totalDistance = totalDistance;
        this.avgSpeed = avgSpeed;
        this.totalFuelConsumption = totalFuel;

        if (document.getElementById('activeUnits')) {
            document.getElementById('activeUnits').textContent = `${activeUnits}/23`;
        }
        if (document.getElementById('totalDistance')) {
            document.getElementById('totalDistance').textContent = `${totalDistance.toFixed(1)} km`;
        }
        if (document.getElementById('avgSpeed')) {
            document.getElementById('avgSpeed').textContent = `${avgSpeed.toFixed(1)} km/h`;
        }
        if (document.getElementById('totalFuel')) {
            document.getElementById('totalFuel').textContent = `${totalFuel.toFixed(1)} L`;
        }
    }

    renderUnitList() {
        const unitList = document.getElementById('unitList');
        if (!unitList) return;

        unitList.innerHTML = '';

        if (this.units.length === 0) {
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
        // Hapus hanya marker yang tidak ada lagi di units
        Object.keys(this.markers).forEach(markerId => {
            const unitExists = this.units.some(unit => unit.id.toString() === markerId.toString());
            if (!unitExists && this.markers[markerId]) {
                this.map.removeLayer(this.markers[markerId]);
                delete this.markers[markerId];
            }
        });

        // Update atau buat marker baru
        this.units.forEach(unit => {
            if (!this.markers[unit.id]) {
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
                
                this.markers[unit.id] = marker;
                
                console.log(`✅ Created new marker for ${unit.name}`);
            } else {
                // Update existing marker
                this.updateUnitMarker(unit);
            }
        });
    }

    filterUnits() {
        const searchTerm = document.getElementById('searchUnit')?.value.toLowerCase() || '';
        const afdelingFilter = document.getElementById('filterAfdeling')?.value || '';
        const statusFilter = document.getElementById('filterStatus')?.value || '';
        const fuelFilter = document.getElementById('filterFuel')?.value || '';

        console.log('Filtering units...', { searchTerm, afdelingFilter, statusFilter, fuelFilter });
    }

    destroy() {
        if (this.firebaseListener) {
            database.ref('/units').off('value', this.firebaseListener);
            database.ref('/units').off('child_removed');
        }
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
    }
}

// Initialize system
let gpsSystem;

// Global functions untuk debug
function debugFirebase() {
    if (gpsSystem) {
        gpsSystem.testFirebaseConnection();
    }
}

function showCurrentData() {
    if (gpsSystem) {
        console.log('📊 Current units:', gpsSystem.units);
        console.log('📊 Current markers:', gpsSystem.markers);
        console.log('📊 Current polylines:', gpsSystem.unitPolylines);
        gpsSystem.showNotification('Data logged ke console', 'info');
    }
}

function forceRefresh() {
    if (gpsSystem) {
        gpsSystem.loadUnitData();
    }
}

// Tambahkan tombol debug di HTML
function addDebugButtons() {
    const debugDiv = document.createElement('div');
    debugDiv.className = 'position-fixed bottom-0 start-0 p-3';
    debugDiv.style.zIndex = '1000';
    debugDiv.innerHTML = `
        <div class="btn-group-vertical">
            <button class="btn btn-sm btn-warning mb-1" onclick="debugFirebase()" title="Test Firebase Connection">
                🐛 Test Firebase
            </button>
            <button class="btn btn-sm btn-info mb-1" onclick="showCurrentData()" title="Show Current Data">
                📊 Show Data
            </button>
            <button class="btn btn-sm btn-success" onclick="forceRefresh()" title="Force Refresh Data">
                🔄 Refresh
            </button>
        </div>
    `;
    document.body.appendChild(debugDiv);
}

document.addEventListener('DOMContentLoaded', function() {
    gpsSystem = new SAGMGpsTracking();
    window.gpsSystem = gpsSystem; // Make it globally available
    
    // Tambahkan tombol debug setelah 2 detik
    setTimeout(addDebugButtons, 2000);
});

// Global functions
function refreshData() {
    if (gpsSystem) {
        gpsSystem.loadUnitData();
    }
}

function exportData() {
    if (gpsSystem) {
        gpsSystem.exportRoutesData();
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('show');
}

// Global functions untuk route controls
function toggleRoutes() {
    if (gpsSystem) {
        gpsSystem.toggleRoutes();
    }
}

function clearRoutes() {
    if (gpsSystem) {
        gpsSystem.clearAllRoutes();
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (gpsSystem) {
        gpsSystem.destroy();
    }
});
