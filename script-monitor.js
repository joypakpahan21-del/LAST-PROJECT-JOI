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

// ==== GPS MONITORING SYSTEM ====
class GPSMonitoringSystem {
    constructor() {
        console.log('🚀 Initializing GPS Monitoring System...');
        
        this.units = new Map();
        this.markers = new Map();
        this.map = null;
        this.isInitialized = false;
        this.currentMapType = 'street';
        this.dataUpdateInterval = null;
        
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
            center: [-0.396055, 102.958944],
            zoom: 13
        };

        // Chat system
        this.chatRef = null;
        this.typingRef = null;
        this.currentChatUnit = null;
        this.currentChatDriver = null;
        this.chatMessages = new Map();
        this.unreadCounts = new Map();
        this.isChatMinimized = false;
        
        // Filter states
        this.filters = {
            search: '',
            afdeling: '',
            status: '',
            fuel: ''
        };
    }

    // ===== MAIN INITIALIZATION =====
    initialize() {
        try {
            console.log('🔧 Starting system initialization...');
            this.showLoading(true);
            
            // Step 1: Initialize Firebase
            this.initializeFirebase();
            
            // Step 2: Setup Map dengan satellite option
            this.setupMap();
            
            // Step 3: Setup UI components
            this.setupUI();
            
            // Step 4: Connect to Firebase
            this.connectToFirebase();
            
            // Step 5: Setup Chat System
            this.setupChatSystem();
            
            this.isInitialized = true;
            console.log('✅ System initialized successfully');
            
        } catch (error) {
            console.error('❌ System initialization failed:', error);
            this.showError('Gagal memulai sistem: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    // ===== FIREBASE INITIALIZATION =====
    initializeFirebase() {
        try {
            if (firebase.apps.length === 0) {
                firebase.initializeApp(FIREBASE_CONFIG);
                console.log('✅ Firebase initialized');
            } else {
                firebase.app(); // Use existing app
                console.log('✅ Firebase already initialized');
            }
        } catch (error) {
            throw new Error('Firebase initialization failed: ' + error.message);
        }
    }

    // ===== MAP SETUP DENGAN SATELLITE =====
    setupMap() {
        try {
            console.log('🗺️ Setting up map...');
            
            const mapContainer = document.getElementById('map');
            if (!mapContainer) {
                throw new Error('Map container tidak ditemukan');
            }

            // Create map instance
            this.map = L.map('map').setView(this.config.center, this.config.zoom);
            console.log('✅ Map instance created');

            // Street View
            this.streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            });

            // Satellite View
            this.satelliteLayer = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
                maxZoom: 20,
                subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
                attribution: '© Google Satellite'
            });

            // Default layer
            this.streetLayer.addTo(this.map);

            // Add map type control
            this.addMapControls();
            console.log('✅ Map layers and controls added');

            // Add important locations
            this.addLocationMarkers();
            console.log('✅ Location markers added');

        } catch (error) {
            console.error('❌ Map setup failed:', error);
            this.showMapError(error.message);
            throw error;
        }
    }

    addMapControls() {
        // Map type control
        const mapTypeControl = L.control({ position: 'topright' });
        mapTypeControl.onAdd = () => {
            const div = L.DomUtil.create('div', 'map-type-control');
            div.innerHTML = `
                <div class="btn-group-vertical">
                    <button class="btn btn-sm btn-light ${this.currentMapType === 'street' ? 'active' : ''}" 
                            onclick="window.gpsSystem.switchMapType('street')">
                        🗺️ Street
                    </button>
                    <button class="btn btn-sm btn-light ${this.currentMapType === 'satellite' ? 'active' : ''}" 
                            onclick="window.gpsSystem.switchMapType('satellite')">
                        🛰️ Satellite
                    </button>
                </div>
            `;
            return div;
        };
        mapTypeControl.addTo(this.map);

        // Add scale control
        L.control.scale({ imperial: false }).addTo(this.map);
        
        // Add zoom control
        L.control.zoom({ position: 'topright' }).addTo(this.map);
    }

    switchMapType(type) {
        if (this.currentMapType === type) return;
        
        this.currentMapType = type;
        
        // Remove current layer
        this.map.removeLayer(this.streetLayer);
        this.map.removeLayer(this.satelliteLayer);
        
        // Add new layer
        if (type === 'street') {
            this.streetLayer.addTo(this.map);
        } else {
            this.satelliteLayer.addTo(this.map);
        }
        
        // Update button states
        document.querySelectorAll('.map-type-control .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Find and activate the correct button
        const buttons = document.querySelectorAll('.map-type-control .btn');
        if (type === 'street') {
            buttons[0].classList.add('active');
        } else {
            buttons[1].classList.add('active');
        }
        
        console.log(`🗺️ Switched to ${type} view`);
    }

    showMapError(message) {
        const mapContainer = document.getElementById('map');
        if (mapContainer) {
            mapContainer.innerHTML = `
                <div class="alert alert-danger m-3">
                    <h5>❌ Gagal Memuat Peta</h5>
                    <p>${message}</p>
                    <button class="btn btn-warning btn-sm" onclick="window.gpsSystem.setupMap()">
                        🔄 Coba Lagi
                    </button>
                </div>
            `;
        }
    }

    addLocationMarkers() {
        try {
            // PKS Marker
            const pksIcon = L.divIcon({
                className: 'custom-marker',
                html: '<div class="marker-icon pks">🏭</div>',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const pksMarker = L.marker([this.importantLocations.PKS_SAGM.lat, this.importantLocations.PKS_SAGM.lng], { 
                icon: pksIcon 
            })
            .bindPopup(`
                <div class="unit-popup">
                    <div class="popup-header">
                        <h6 class="mb-0">🏭 ${this.importantLocations.PKS_SAGM.name}</h6>
                    </div>
                    <div class="p-2">
                        <strong>Pabrik Kelapa Sawit</strong><br>
                        <small>Lokasi: Kebun Tempuling</small><br>
                        <small>Status: Operational</small>
                    </div>
                </div>
            `)
            .addTo(this.map);

            // Office Marker
            const officeIcon = L.divIcon({
                className: 'custom-marker',
                html: '<div class="marker-icon office">🏢</div>',
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });

            const officeMarker = L.marker([this.importantLocations.KANTOR_KEBUN.lat, this.importantLocations.KANTOR_KEBUN.lng], { 
                icon: officeIcon 
            })
            .bindPopup(`
                <div class="unit-popup">
                    <div class="popup-header">
                        <h6 class="mb-0">🏢 ${this.importantLocations.KANTOR_KEBUN.name}</h6>
                    </div>
                    <div class="p-2">
                        <strong>Kantor Operasional</strong><br>
                        <small>Lokasi: Kebun Tempuling</small><br>
                        <small>Status: Operational</small>
                    </div>
                </div>
            `)
            .addTo(this.map);

            console.log('📍 Added location markers:', {
                pks: this.importantLocations.PKS_SAGM,
                office: this.importantLocations.KANTOR_KEBUN
            });

        } catch (error) {
            console.error('Failed to add location markers:', error);
        }
    }

    // ===== UI SETUP =====
    setupUI() {
        this.setupEventListeners();
        this.setupFilters();
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('searchUnit');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            });
        }

        // Filter selects
        const filterAfdeling = document.getElementById('filterAfdeling');
        const filterStatus = document.getElementById('filterStatus');
        const filterFuel = document.getElementById('filterFuel');

        if (filterAfdeling) {
            filterAfdeling.addEventListener('change', (e) => {
                this.filters.afdeling = e.target.value;
                this.applyFilters();
            });
        }

        if (filterStatus) {
            filterStatus.addEventListener('change', (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            });
        }

        if (filterFuel) {
            filterFuel.addEventListener('change', (e) => {
                this.filters.fuel = e.target.value;
                this.applyFilters();
            });
        }

        // Chat input handler
        const chatInput = document.getElementById('chatInputMonitor');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendChatMessage();
                }
            });
        }
    }

    setupFilters() {
        console.log('🔧 Setting up filters...');
        // Filters already setup in event listeners
    }

    applyFilters() {
        this.renderUnitList();
    }

    // ===== FIREBASE CONNECTION =====
    connectToFirebase() {
        try {
            console.log('🔥 Connecting to Firebase...');
            
            const database = firebase.database();

            // Connection status listener
            database.ref('.info/connected').on('value', (snapshot) => {
                const connected = snapshot.val();
                this.updateConnectionStatus(connected);
                console.log('📡 Firebase connection:', connected ? 'CONNECTED' : 'DISCONNECTED');
            });

            // Units data listener - REAL-TIME UPDATES
            database.ref('/units').on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    this.processRealTimeData(data);
                } else {
                    console.log('ℹ️ No data received from Firebase');
                    this.clearAllUnits();
                }
            }, (error) => {
                console.error('❌ Firebase listener error:', error);
                this.updateConnectionStatus(false);
                this.showError('Koneksi Firebase terputus: ' + error.message);
            });

            console.log('✅ Firebase listeners attached');

        } catch (error) {
            console.error('❌ Firebase connection failed:', error);
            this.showError('Gagal menyambung ke Firebase: ' + error.message);
            setTimeout(() => this.connectToFirebase(), 5000);
        }
    }

    // ===== DATA PROCESSING =====
    processRealTimeData(firebaseData) {
        const unitCount = Object.keys(firebaseData || {}).length;
        console.log(`🔄 Processing ${unitCount} units from Firebase`);

        const activeUnits = new Set();
        const now = Date.now();

        Object.entries(firebaseData).forEach(([unitName, unitData]) => {
            // ✅ PERBEDAAN LOGOUT vs NO NETWORK
            if (unitData.status === "LOGGED_OUT") {
                console.log(`🚪 ${unitName} sudah logout - menghapus data`);
                firebase.database().ref('/units/' + unitName).remove();
                return;
            }

            // Check jika data stale (lebih dari 10 menit)
            if (unitData.lastUpdate) {
                const updateTime = new Date(unitData.lastUpdate).getTime();
                const timeDiff = now - updateTime;
                
                if (timeDiff > 600000 && unitData.isOnline !== false) {
                    console.log(`🕒 ${unitName} data stale - marking as offline`);
                    unitData.isOnline = false;
                }
            }

            if (this.validateUnitData(unitName, unitData)) {
                activeUnits.add(unitName);
                this.updateOrCreateUnit(unitName, unitData);
            } else {
                console.warn(`⚠️ Invalid data for unit ${unitName}:`, unitData);
            }
        });

        // Cleanup inactive units
        this.cleanupInactiveUnits(activeUnits);
        
        // Update statistics
        this.updateStatistics();
        
        // Update GPS accuracy info
        this.updateGPSAccuracyInfo();
    }

    validateUnitData(unitName, unitData) {
        if (!unitData) {
            console.warn(`Unit ${unitName}: No data`);
            return false;
        }
        
        if (unitData.lat === undefined || unitData.lng === undefined) {
            console.warn(`Unit ${unitName}: Missing coordinates`);
            return false;
        }
        
        const lat = parseFloat(unitData.lat);
        const lng = parseFloat(unitData.lng);
        
        if (isNaN(lat) || isNaN(lng)) {
            console.warn(`Unit ${unitName}: Invalid coordinates`, { lat: unitData.lat, lng: unitData.lng });
            return false;
        }
        
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.warn(`Unit ${unitName}: Coordinates out of range`, { lat, lng });
            return false;
        }
        
        return true;
    }

    updateOrCreateUnit(unitName, unitData) {
        try {
            const unit = {
                name: unitName,
                lat: parseFloat(unitData.lat),
                lng: parseFloat(unitData.lng),
                speed: parseFloat(unitData.speed) || 0,
                driver: unitData.driver || 'Tidak diketahui',
                afdeling: this.determineAfdeling(unitName),
                status: this.determineStatus(unitData.journeyStatus, unitData.isOnline),
                lastUpdate: unitData.lastUpdate || new Date().toLocaleTimeString('id-ID'),
                distance: parseFloat(unitData.distance) || 0,
                fuelLevel: this.computeFuelLevel(100, unitData.distance, unitData.journeyStatus),
                isOnline: unitData.isOnline !== false,
                batteryLevel: unitData.batteryLevel || 100,
                accuracy: unitData.accuracy || 0,
                bearing: unitData.bearing || 0,
                timestamp: unitData.timestamp || new Date().toISOString()
            };

            if (this.markers.has(unitName)) {
                // Update existing marker
                const marker = this.markers.get(unitName);
                marker.setLatLng([unit.lat, unit.lng]);
                marker.setPopupContent(this.createUnitPopup(unit));
                
                // Update marker icon based on status
                const icon = this.createUnitIcon(unit);
                marker.setIcon(icon);

            } else {
                // Create new marker
                this.createUnitMarker(unit);
                console.log(`📍 Created new marker for ${unitName}`);
            }

            this.units.set(unitName, unit);

        } catch (error) {
            console.error(`Error updating unit ${unitName}:`, error);
        }
    }

    createUnitIcon(unit) {
        let html = '';
        let className = '';
        
        if (!unit.isOnline) {
            html = '<div class="marker-icon offline">🔴</div>';
            className = 'offline';
        } else if (unit.status === 'moving') {
            html = '<div class="marker-icon moving">🟡</div>';
            className = 'moving';
        } else if (unit.status === 'active') {
            html = '<div class="marker-icon active">🟢</div>';
            className = 'active';
        } else {
            html = '<div class="marker-icon inactive">⚫</div>';
            className = 'inactive';
        }

        return L.divIcon({
            className: `custom-marker ${className}`,
            html: html,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
    }

    createUnitMarker(unit) {
        try {
            const icon = this.createUnitIcon(unit);

            const marker = L.marker([unit.lat, unit.lng], { 
                icon: icon,
                title: `${unit.name} - ${unit.driver}`
            })
            .bindPopup(this.createUnitPopup(unit))
            .addTo(this.map);
            
            // Add click event to center map on marker
            marker.on('click', () => {
                this.map.setView([unit.lat, unit.lng], 15);
            });
        
            this.markers.set(unit.name, marker);
            
        } catch (error) {
            console.error(`Error creating marker for ${unit.name}:`, error);
        }
    }

    createUnitPopup(unit) {
        const statusInfo = !unit.isOnline ? 
            '🔴 OFFLINE (No Network)' : 
            unit.status === 'active' ? '🟢 AKTIF' : 
            unit.status === 'moving' ? '🟡 DALAM PERJALANAN' : '⚫ NON-AKTIF';

        const unreadCount = this.unreadCounts.get(unit.name) || 0;
        const chatBadge = unreadCount > 0 ? `<span class="badge bg-danger">${unreadCount}</span>` : '';

        return `
            <div class="unit-popup" style="min-width: 280px;">
                <div class="popup-header" style="background: ${unit.isOnline ? '#28a745' : '#dc3545'}; color: white; padding: 12px; margin: -12px -12px 10px -12px; border-radius: 8px 8px 0 0;">
                    <h6 class="mb-0">🚛 ${unit.name} ${unit.isOnline ? '🟢' : '🔴'}</h6>
                </div>
                <div style="padding: 12px;">
                    <div class="row">
                        <div class="col-6"><strong>Driver:</strong></div>
                        <div class="col-6">${unit.driver}</div>
                    </div>
                    <div class="row">
                        <div class="col-6"><strong>Afdeling:</strong></div>
                        <div class="col-6">${unit.afdeling}</div>
                    </div>
                    <div class="row">
                        <div class="col-6"><strong>Status:</strong></div>
                        <div class="col-6">${statusInfo}</div>
                    </div>
                    <div class="row">
                        <div class="col-6"><strong>Kecepatan:</strong></div>
                        <div class="col-6">${unit.speed.toFixed(1)} km/h</div>
                    </div>
                    <div class="row">
                        <div class="col-6"><strong>Jarak:</strong></div>
                        <div class="col-6">${unit.distance.toFixed(2)} km</div>
                    </div>
                    <div class="row">
                        <div class="col-6"><strong>Bahan Bakar:</strong></div>
                        <div class="col-6">${unit.fuelLevel.toFixed(1)}%</div>
                    </div>
                    <div class="row">
                        <div class="col-6"><strong>Baterai:</strong></div>
                        <div class="col-6">${unit.batteryLevel}%</div>
                    </div>
                    <div class="row">
                        <div class="col-6"><strong>Akurasi GPS:</strong></div>
                        <div class="col-6">${unit.accuracy.toFixed(1)} m</div>
                    </div>
                    <div class="row">
                        <div class="col-6"><strong>Arah:</strong></div>
                        <div class="col-6">${unit.bearing ? unit.bearing.toFixed(0) + '°' : '-'}</div>
                    </div>
                    <div class="row">
                        <div class="col-6"><strong>Update:</strong></div>
                        <div class="col-6">${unit.lastUpdate}</div>
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-sm btn-primary w-100" onclick="window.gpsSystem.openChat('${unit.name}', '${unit.driver}')">
                            💬 Chat dengan ${unit.driver} ${chatBadge}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    determineAfdeling(unitName) {
        const afdelingMap = {
            'DT-06': 'AFD I', 'DT-07': 'AFD I', 
            'DT-12': 'AFD II', 'DT-13': 'AFD II', 'DT-28': 'AFD II', 'DT-36': 'AFD II',
            'DT-15': 'AFD III', 'DT-16': 'AFD III', 'DT-29': 'AFD III', 'DT-37': 'AFD III',
            'DT-17': 'AFD IV', 'DT-18': 'AFD IV', 'DT-33': 'AFD IV', 'DT-39': 'AFD IV',
            'DT-23': 'AFD V', 'DT-24': 'AFD V', 'DT-34': 'AFD V',
            'DT-25': 'KKPA', 'DT-26': 'KKPA', 'DT-27': 'KKPA', 'DT-35': 'KKPA',
            'DT-32': 'AFD I', 'DT-38': 'AFD I'
        };
        return afdelingMap[unitName] || 'AFD I';
    }

    determineStatus(journeyStatus, isOnline) {
        if (isOnline === false) return 'offline';
        
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

    computeFuelLevel(initialFuel, distance, status) {
        if (!distance) return initialFuel;
        
        let consumptionRate;
        switch(status) {
            case 'moving': consumptionRate = 0.22; break;
            case 'active': consumptionRate = 0.25; break;
            default: consumptionRate = 0.12;
        }
        
        const fuelUsed = distance * consumptionRate;
        const fuelRemaining = Math.max(0, initialFuel - fuelUsed);
        return Math.max(5, Math.min(100, fuelRemaining));
    }

    // ===== CLEANUP METHODS =====
    cleanupInactiveUnits(activeUnits) {
        const removedUnits = [];
        
        this.units.forEach((unit, unitName) => {
            if (!activeUnits.has(unitName)) {
                unit.isOnline = false;
                
                // Update marker to show offline status
                const marker = this.markers.get(unitName);
                if (marker) {
                    const icon = this.createUnitIcon(unit);
                    marker.setIcon(icon);
                }
                
                removedUnits.push(unitName);
            }
        });
        
        if (removedUnits.length > 0) {
            console.log(`🗑️ Marked as offline: ${removedUnits.join(', ')}`);
        }
    }

    clearAllUnits() {
        console.log('🧹 Clearing all units from map...');
        
        this.markers.forEach((marker, unitName) => {
            if (this.map) {
                this.map.removeLayer(marker);
            }
        });
        
        this.markers.clear();
        this.units.clear();
        this.renderUnitList();
        
        console.log('✅ All units cleared');
    }

    // ===== CHAT SYSTEM =====
    setupChatSystem() {
        console.log('💬 Setting up chat system...');
        
        this.chatRef = firebase.database().ref('/chat');
        this.typingRef = firebase.database().ref('/typing');
        
        // Listen untuk semua chat messages
        this.chatRef.on('child_added', (snapshot) => {
            const unitId = snapshot.key;
            snapshot.forEach((messageSnapshot) => {
                const message = messageSnapshot.val();
                this.handleChatMessage(unitId, message);
            });
        });

        // Listen untuk typing indicators
        this.typingRef.on('child_added', (snapshot) => {
            const unitId = snapshot.key;
            const typingData = snapshot.val();
            this.handleTypingIndicator(unitId, typingData);
        });
        
        console.log('✅ Chat system initialized');
    }

    handleChatMessage(unitId, message) {
        if (!message || !message.id) return;
        
        if (!this.chatMessages.has(unitId)) {
            this.chatMessages.set(unitId, []);
        }
        
        const messages = this.chatMessages.get(unitId);
        
        // Prevent duplicates
        const messageExists = messages.some(msg => msg.id === message.id);
        if (messageExists) return;
        
        messages.push(message);
        
        // Keep only last 100 messages per unit
        if (messages.length > 100) {
            messages.shift();
        }
        
        // Update unread count jika chat tidak terbuka
        if (!this.isChatOpen(unitId)) {
            const currentCount = this.unreadCounts.get(unitId) || 0;
            this.unreadCounts.set(unitId, currentCount + 1);
            this.updateChatBadge(unitId);
        }
        
        // Update chat UI jika terbuka
        if (this.isChatOpen(unitId)) {
            this.renderChatMessages(unitId);
        }
        
        // Show notification
        if (message.sender !== 'Monitor') {
            this.showChatNotification(unitId, message);
        }
        
        console.log(`💬 New message from ${unitId}: ${message.text.substring(0, 50)}...`);
    }

    handleTypingIndicator(unitId, typingData) {
        if (!typingData) return;
        
        const driverTyping = typingData.driver;
        if (driverTyping && driverTyping.isTyping && this.isChatOpen(unitId)) {
            this.showTypingIndicator(unitId, driverTyping.name);
        } else {
            this.hideTypingIndicator(unitId);
        }
    }

    openChat(unitId, driverName) {
        this.currentChatUnit = unitId;
        this.currentChatDriver = driverName;
        
        // Show chat container
        document.getElementById('monitorChatContainer').style.display = 'block';
        document.getElementById('chatWithUser').textContent = `💬 Chat dengan ${driverName} (${unitId})`;
        
        // Reset unread count
        this.unreadCounts.set(unitId, 0);
        this.updateChatBadge(unitId);
        
        // Render messages
        this.renderChatMessages(unitId);
        
        // Focus input
        setTimeout(() => {
            const chatInput = document.getElementById('chatInputMonitor');
            if (chatInput) {
                chatInput.focus();
            }
        }, 100);
        
        console.log(`💬 Opened chat with ${unitId} (${driverName})`);
    }

    closeChat() {
        document.getElementById('monitorChatContainer').style.display = 'none';
        this.currentChatUnit = null;
        this.currentChatDriver = null;
        this.isChatMinimized = false;
        
        console.log('💬 Chat closed');
    }

    minimizeChat() {
        const chatWindow = document.querySelector('.chat-window-monitor');
        const messages = document.getElementById('chatMessagesMonitor');
        const input = document.querySelector('.chat-input-container');
        
        if (this.isChatMinimized) {
            // Restore
            messages.style.display = 'block';
            input.style.display = 'block';
            chatWindow.style.height = '500px';
            this.isChatMinimized = false;
        } else {
            // Minimize
            messages.style.display = 'none';
            input.style.display = 'none';
            chatWindow.style.height = '60px';
            this.isChatMinimized = true;
        }
        
        console.log(`💬 Chat ${this.isChatMinimized ? 'minimized' : 'restored'}`);
    }

    isChatOpen(unitId) {
        return this.currentChatUnit === unitId;
    }

    renderChatMessages(unitId) {
        const messagesContainer = document.getElementById('chatMessagesMonitor');
        const messages = this.chatMessages.get(unitId) || [];
        
        if (!messagesContainer) return;
        
        messagesContainer.innerHTML = '';
        
        if (messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="text-center text-muted py-4">
                    <small>Mulai percakapan dengan driver...</small>
                </div>
            `;
            return;
        }
        
        // Group messages by date
        const groupedMessages = this.groupMessagesByDate(messages);
        
        Object.keys(groupedMessages).forEach(date => {
            // Add date separator untuk hari yang berbeda
            if (Object.keys(groupedMessages).length > 1) {
                const dateElement = document.createElement('div');
                dateElement.className = 'chat-date-separator';
                dateElement.innerHTML = `<span>${date}</span>`;
                messagesContainer.appendChild(dateElement);
            }
            
            // Add messages for this date
            groupedMessages[date].forEach(message => {
                const messageElement = this.createMessageElement(message);
                messagesContainer.appendChild(messageElement);
            });
        });
        
        // Auto scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
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
        
        // Sort messages within each date by timestamp
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });
        
        return grouped;
    }

    createMessageElement(message) {
        const messageElement = document.createElement('div');
        const isSentByMonitor = message.sender === 'Monitor';
        
        messageElement.className = `chat-message ${isSentByMonitor ? 'message-sent' : 'message-received'}`;
        messageElement.innerHTML = `
            <div class="message-content">
                ${!isSentByMonitor ? `<div class="message-sender">${this.escapeHtml(message.sender)}</div>` : ''}
                <div class="message-text">${this.escapeHtml(message.text)}</div>
                <div class="message-footer">
                    <span class="message-time">${message.timeDisplay}</span>
                </div>
            </div>
        `;
        
        return messageElement;
    }

    async sendChatMessage() {
        if (!this.currentChatUnit || !this.currentChatDriver) {
            alert('Pilih unit terlebih dahulu untuk mengirim pesan');
            return;
        }
        
        const input = document.getElementById('chatInputMonitor');
        const messageText = input.value.trim();
        
        if (!messageText) return;
        
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const messageData = {
            id: messageId,
            text: messageText,
            sender: 'Monitor',
            unit: this.currentChatUnit,
            timestamp: new Date().toISOString(),
            timeDisplay: new Date().toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            type: 'monitor'
        };
        
        try {
            await this.chatRef.child(this.currentChatUnit).push(messageData);
            input.value = '';
            
            // Add to local messages
            if (!this.chatMessages.has(this.currentChatUnit)) {
                this.chatMessages.set(this.currentChatUnit, []);
            }
            this.chatMessages.get(this.currentChatUnit).push(messageData);
            this.renderChatMessages(this.currentChatUnit);
            
            console.log(`💬 Sent message to ${this.currentChatUnit}: ${messageText}`);
            
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Gagal mengirim pesan: ' + error.message);
        }
    }

    showTypingIndicator(unitId, driverName) {
        if (this.isChatOpen(unitId)) {
            const indicator = document.getElementById('typingIndicatorMonitor');
            const typingText = document.getElementById('typingText');
            
            if (indicator && typingText) {
                typingText.textContent = `${driverName} sedang mengetik...`;
                indicator.style.display = 'block';
            }
        }
    }

    hideTypingIndicator(unitId) {
        if (this.isChatOpen(unitId)) {
            const indicator = document.getElementById('typingIndicatorMonitor');
            if (indicator) {
                indicator.style.display = 'none';
            }
        }
    }

    updateChatBadge(unitId) {
        const unreadCount = this.unreadCounts.get(unitId) || 0;
        this.renderUnitList();
    }

    showChatNotification(unitId, message) {
        if (!this.isChatOpen(unitId)) {
            // Create notification
            const notification = document.createElement('div');
            notification.className = 'alert alert-info chat-notification';
            notification.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>💬 Pesan dari ${message.sender}</strong>
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
                animation: slideInRight 0.3s ease-out;
            `;
            
            document.body.appendChild(notification);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 5000);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== UI UPDATE METHODS =====
    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('firebaseStatus');
        if (statusElement) {
            if (connected) {
                statusElement.innerHTML = '🟢 TERHUBUNG KE FIREBASE';
                statusElement.className = 'connection-status text-success';
            } else {
                statusElement.innerHTML = '🔴 FIREBASE OFFLINE';
                statusElement.className = 'connection-status text-danger';
            }
        }
    }

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
                totalFuel += (100 - unit.fuelLevel) || 0;
            }
        });

        const avgSpeed = unitCount > 0 ? totalSpeed / unitCount : 0;

        // Update DOM elements
        this.updateElement('activeUnits', `${activeUnits}/${this.units.size}`);
        this.updateElement('totalDistance', `${totalDistance.toFixed(1)} km`);
        this.updateElement('avgSpeed', `${avgSpeed.toFixed(1)} km/h`);
        this.updateElement('totalFuel', `${totalFuel.toFixed(1)} L`);
        this.updateElement('dataCount', unitCount.toString());
        
        this.updateElement('activeUnitsDetail', `${unitCount} units terdeteksi`);
        this.updateElement('distanceDetail', `${this.units.size} units`);

        // Update unit list
        this.renderUnitList();
    }

    updateGPSAccuracyInfo() {
        let totalAccuracy = 0;
        let accuracyCount = 0;

        this.units.forEach(unit => {
            if (unit.isOnline && unit.accuracy > 0) {
                totalAccuracy += unit.accuracy;
                accuracyCount++;
            }
        });

        const avgAccuracy = accuracyCount > 0 ? totalAccuracy / accuracyCount : 0;
        const accuracyElement = document.getElementById('gpsAccuracyInfo');
        
        if (accuracyElement) {
            if (accuracyCount > 0) {
                accuracyElement.textContent = `Rata-rata akurasi: ${avgAccuracy.toFixed(1)} m (${accuracyCount} units)`;
            } else {
                accuracyElement.textContent = 'Menunggu data GPS...';
            }
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
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

        let filteredUnits = Array.from(this.units.values());
        
        // Apply filters
        if (this.filters.search) {
            const searchTerm = this.filters.search.toLowerCase();
            filteredUnits = filteredUnits.filter(unit => 
                unit.name.toLowerCase().includes(searchTerm) ||
                unit.driver.toLowerCase().includes(searchTerm)
            );
        }
        
        if (this.filters.afdeling) {
            filteredUnits = filteredUnits.filter(unit => unit.afdeling === this.filters.afdeling);
        }
        
        if (this.filters.status) {
            filteredUnits = filteredUnits.filter(unit => {
                if (this.filters.status === 'online') return unit.isOnline;
                if (this.filters.status === 'offline') return !unit.isOnline;
                if (this.filters.status === 'moving') return unit.status === 'moving';
                return true;
            });
        }
        
        if (this.filters.fuel) {
            filteredUnits = filteredUnits.filter(unit => {
                if (this.filters.fuel === 'high') return unit.fuelLevel > 70;
                if (this.filters.fuel === 'medium') return unit.fuelLevel >= 30 && unit.fuelLevel <= 70;
                if (this.filters.fuel === 'low') return unit.fuelLevel < 30;
                return true;
            });
        }

        unitList.innerHTML = '';
        
        filteredUnits.forEach(unit => {
            const unitElement = document.createElement('div');
            unitElement.className = `unit-item ${unit.status} ${unit.isOnline ? 'active' : 'inactive'}`;
            
            const unreadCount = this.unreadCounts.get(unit.name) || 0;
            const chatBadge = unreadCount > 0 ? `<span class="badge bg-danger ms-1">${unreadCount}</span>` : '';
            
            unitElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${unit.name} ${unit.isOnline ? '🟢' : '🔴'}</h6>
                        <small class="text-muted">${unit.afdeling} - ${unit.driver} ${chatBadge}</small>
                    </div>
                    <span class="badge ${unit.status === 'active' ? 'bg-success' : unit.status === 'moving' ? 'bg-warning' : 'bg-danger'}">
                        ${unit.status === 'active' ? 'Aktif' : unit.status === 'moving' ? 'Berjalan' : 'Non-Aktif'}
                    </span>
                </div>
                <div class="mt-2">
                    <small class="text-muted">
                        Kecepatan: ${unit.speed.toFixed(1)} km/h<br>
                        Jarak: ${unit.distance.toFixed(2)} km<br>
                        Bahan Bakar: ${unit.fuelLevel.toFixed(1)}%<br>
                        Update: ${unit.lastUpdate}
                    </small>
                </div>
                <div class="mt-2">
                    <button class="btn btn-sm btn-outline-primary w-100" onclick="window.gpsSystem.openChat('${unit.name}', '${unit.driver}')">
                        💬 Chat ${unreadCount > 0 ? `(${unreadCount})` : ''}
                    </button>
                </div>
            `;
            
            // Add click event to center map on unit
            unitElement.addEventListener('click', () => {
                this.map.setView([unit.lat, unit.lng], 15);
                const marker = this.markers.get(unit.name);
                if (marker) {
                    marker.openPopup();
                }
            });
            
            unitList.appendChild(unitElement);
        });
    }

    // ===== UTILITY METHODS =====
    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
            spinner.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        console.error('System Error:', message);
        
        const notification = document.createElement('div');
        notification.className = 'alert alert-danger alert-dismissible fade show position-fixed';
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            <strong>❌ System Error</strong><br>
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

    // ===== PUBLIC METHODS =====
    refreshData() {
        console.log('🔄 Manual refresh initiated');
        this.clearAllUnits();
        this.connectToFirebase();
        
        // Show loading state
        const refreshBtn = document.getElementById('refreshBtn');
        const refreshIcon = document.getElementById('refreshIcon');
        
        if (refreshBtn && refreshIcon) {
            refreshBtn.disabled = true;
            refreshIcon.innerHTML = '⏳';
            
            setTimeout(() => {
                refreshBtn.disabled = false;
                refreshIcon.innerHTML = '🔄';
            }, 2000);
        }
    }

    exportData() {
        const exportData = {
            timestamp: new Date().toISOString(),
            totalUnits: this.units.size,
            units: Array.from(this.units.values()),
            statistics: {
                activeUnits: document.getElementById('activeUnits').textContent,
                totalDistance: document.getElementById('totalDistance').textContent,
                avgSpeed: document.getElementById('avgSpeed').textContent,
                totalFuel: document.getElementById('totalFuel').textContent
            }
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gps-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('📊 Data exported successfully');
        this.showNotification('Data berhasil diexport', 'success');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            <strong>${type === 'success' ? '✅' : 'ℹ️'} ${message}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // Cleanup
    cleanup() {
        console.log('🧹 Cleaning up system...');
        
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        
        this.markers.clear();
        this.units.clear();
        
        if (this.chatRef) {
            this.chatRef.off();
        }
        
        if (this.typingRef) {
            this.typingRef.off();
        }
        
        if (this.dataUpdateInterval) {
            clearInterval(this.dataUpdateInterval);
        }
        
        console.log('✅ System cleanup completed');
    }
}

// Global functions
function refreshData() {
    if (window.gpsSystem) {
        window.gpsSystem.refreshData();
    }
}

function exportData() {
    if (window.gpsSystem) {
        window.gpsSystem.exportData();
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('show');
    }
}

// Handle Enter key in chat
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && document.getElementById('chatInputMonitor') === document.activeElement) {
        window.gpsSystem.sendChatMessage();
    }
});

// Real-time clock
function updateClock() {
    const now = new Date();
    document.getElementById('currentTime').textContent = now.toLocaleTimeString('id-ID');
}
setInterval(updateClock, 1000);
updateClock();

// Initialize system when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Starting GPS Tracking System...');
    
    // Test dependencies
    console.log('📋 Dependencies check:');
    console.log('- Leaflet:', typeof L);
    console.log('- Firebase:', typeof firebase);
    console.log('- Map container:', document.getElementById('map'));
    
    // Initialize system after short delay
    setTimeout(() => {
        if (typeof L !== 'undefined' && typeof firebase !== 'undefined') {
            window.gpsSystem = new GPSMonitoringSystem();
            window.gpsSystem.initialize();
        } else {
            console.error('❌ Dependencies not loaded properly');
            alert('Sistem gagal dimuat. Periksa koneksi internet dan refresh halaman.');
        }
    }, 1000);
});

// Handle page unload
window.addEventListener('beforeunload', function() {
    if (window.gpsSystem) {
        window.gpsSystem.cleanup();
    }
});
