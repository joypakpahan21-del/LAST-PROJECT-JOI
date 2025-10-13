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
            this.initializeMap();
            this.setupEventListeners();
            this.initializeFirebaseListener();
            this.loadUnitData();
            this.startAutoRefresh();
            this.initializeHistoryStorage();
            this.startOnlineStatusChecker(); // NEW: Start online status monitoring
        } catch (error) {
            console.error('Error initializing GPS system:', error);
            this.showError('Gagal menginisialisasi sistem GPS');
        }
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

    // Initialize Firebase Real-time Listener dengan perbaikan
    initializeFirebaseListener() {
        try {
            this.firebaseListener = database.ref('/units').on('value', (snapshot) => {
                this.handleRealTimeUpdate(snapshot.val());
            }, (error) => {
                console.error('Firebase listener error:', error);
                this.showError('Koneksi real-time terputus');
            });
            
            // NEW: Listen for removed data (when driver logs out)
            database.ref('/units').on('child_removed', (snapshot) => {
                this.handleDriverLogout(snapshot.key);
            });
            
            console.log('✅ Firebase real-time listener aktif');
        } catch (error) {
            console.error('Error initializing Firebase listener:', error);
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

    // Handle real-time updates dari Firebase dengan perbaikan
    handleRealTimeUpdate(firebaseData) {
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
            currentUnitNames.add(unitName);
            
            // NEW: Track last update time
            this.lastDataTimestamps[unitName] = Date.now();
            this.driverOnlineStatus[unitName] = true;
            
            const existingUnitIndex = this.units.findIndex(u => u.name === unitName);
            
            if (existingUnitIndex !== -1) {
                this.updateUnitFromFirebase(this.units[existingUnitIndex], unitData);
                updatedCount++;
            } else {
                const newUnit = this.createUnitFromFirebase(unitName, unitData);
                this.units.push(newUnit);
                updatedCount++;
            }
        });

        // NEW: Handle units yang tidak lagi ada di Firebase
        this.units.forEach(unit => {
            if (!currentUnitNames.has(unit.name)) {
                this.handleDriverOffline(unit.name);
            }
        });

        if (updatedCount > 0) {
            this.updateStatistics();
            this.renderUnitList();
            this.updateMapMarkers();
            this.addLog(`Data real-time diperbarui: ${updatedCount} unit`, 'success');
        }
    }

    // Create unit object from Firebase data
    createUnitFromFirebase(unitName, firebaseData) {
        const newUnit = {
            id: this.generateUnitId(unitName),
            name: unitName,
            afdeling: this.getAfdelingFromUnit(unitName),
            status: this.getStatusFromJourneyStatus(firebaseData.journeyStatus),
            latitude: firebaseData.lat,
            longitude: firebaseData.lng,
            speed: firebaseData.speed || 0,
            lastUpdate: firebaseData.lastUpdate || new Date().toLocaleTimeString('id-ID'),
            distance: firebaseData.distance || 0,
            fuelLevel: this.calculateFuelLevel(firebaseData.distance),
            fuelUsed: firebaseData.distance ? firebaseData.distance / this.vehicleConfig.fuelEfficiency : 0,
            driver: firebaseData.driver || 'Unknown',
            accuracy: firebaseData.accuracy || 0,
            batteryLevel: firebaseData.batteryLevel || null,
            lastLat: firebaseData.lat,
            lastLng: firebaseData.lng,
            isOnline: true // NEW: Track online status
        };

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

    // ... (method lainnya seperti initializeMap, addImportantLocations, dll. tetap sama)

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

    // ... (method lainnya tetap sama)

    // PERBAIKAN: Update map markers dengan logika yang lebih baik
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

    // ... (method lainnya tetap sama)
}

// Initialize system
let gpsSystem;

document.addEventListener('DOMContentLoaded', function() {
    gpsSystem = new SAGMGpsTracking();
    window.gpsSystem = gpsSystem; // Make it globally available
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
