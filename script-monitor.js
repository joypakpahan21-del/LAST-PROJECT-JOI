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

// SAGM GPS Tracking System for Kebun Tempuling
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
        
        // ✅ TAMBAHKAN: Chat System Properties untuk Monitor
        this.monitorChatRefs = {};
        this.monitorChatMessages = {};
        this.monitorUnreadCounts = {};
        this.activeChatUnit = null;
        this.isMonitorChatOpen = false;
        this.monitorChatInitialized = false;
        
        // Route visualization
        this.unitPolylines = {};
        this.showRoutes = true;
        this.routeColors = {};
        this.routeControls = null;
        this.maxRoutePoints = 200;
        
        // Enhanced tracking
        this.driverOnlineStatus = {};
        this.lastDataTimestamps = {};
        this.unitSessions = {};
        
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
        
        // Vehicle configuration dengan perhitungan akurat
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
                (this.importantLocations.PKS_SAGM.lat + this.importantLocations.KANTOR_KEBUN.lng) / 2,
                (this.importantLocations.PKS_SAGM.lng + this.importantLocations.KANTOR_KEBUN.lng) / 2
            ],
            zoom: 13
        };

        this.initializeSystem();
    }

    // ===== INITIALIZATION METHODS =====
    initializeSystem() {
        try {
            console.log('🚀 Starting GPS Tracking System...');
            this.setupMap();
            this.setupEventHandlers();
            this.connectToFirebase();
            this.loadInitialData();
            this.startPeriodicTasks();
            this.setupDataLogger();
            this.testFirebaseConnection();
            
            // ✅ TAMBAHKAN: Setup monitor chat system
            this.setupMonitorChatSystem();
            
        } catch (error) {
            console.error('System initialization failed:', error);
            this.displayError('Gagal memulai sistem GPS');
        }
    }

    // ✅ METHOD BARU: Setup chat system untuk monitor
    setupMonitorChatSystem() {
        // Listen untuk semua unit yang aktif
        database.ref('/chat').on('child_added', (snapshot) => {
            const unitName = snapshot.key;
            this.setupUnitChatListener(unitName);
        });

        // Listen untuk unit yang dihapus (logout)
        database.ref('/chat').on('child_removed', (snapshot) => {
            const unitName = snapshot.key;
            this.cleanupUnitChatListener(unitName);
        });

        this.monitorChatInitialized = true;
        console.log('💬 Monitor chat system activated');
        this.logData('Sistem chat monitor aktif - bisa komunikasi dengan semua driver', 'system');
    }

    // ✅ METHOD BARU: Setup listener per unit
    setupUnitChatListener(unitName) {
        if (this.monitorChatRefs[unitName]) return; // Already listening
        
        this.monitorChatRefs[unitName] = database.ref('/chat/' + unitName);
        this.monitorChatMessages[unitName] = [];
        this.monitorUnreadCounts[unitName] = 0;
        
        this.monitorChatRefs[unitName].on('child_added', (snapshot) => {
            const message = snapshot.val();
            this.handleMonitorChatMessage(unitName, message);
        });

        // Update unit dropdown
        this.updateMonitorChatUnitSelect();
        
        console.log(`💬 Now listening to chat for unit: ${unitName}`);
    }

    // ✅ METHOD BARU: Cleanup listener saat unit logout
    cleanupUnitChatListener(unitName) {
        if (this.monitorChatRefs[unitName]) {
            this.monitorChatRefs[unitName].off();
            delete this.monitorChatRefs[unitName];
            delete this.monitorChatMessages[unitName];
            delete this.monitorUnreadCounts[unitName];
            
            // Update unit dropdown
            this.updateMonitorChatUnitSelect();
            
            // Jika unit yang aktif di-chat logout, reset chat
            if (this.activeChatUnit === unitName) {
                this.activeChatUnit = null;
                this.updateMonitorChatUI();
            }
            
            console.log(`💬 Stopped listening to chat for unit: ${unitName}`);
        }
    }

    // ✅ METHOD BARU: Handle pesan baru di monitor
    handleMonitorChatMessage(unitName, message) {
        if (!this.monitorChatMessages[unitName]) {
            this.monitorChatMessages[unitName] = [];
        }
        
        // Cek apakah message sudah ada (prevent duplicates)
        const messageExists = this.monitorChatMessages[unitName].some(msg => 
            msg.timestamp === message.timestamp && msg.sender === message.sender
        );
        
        if (!messageExists) {
            this.monitorChatMessages[unitName].push(message);
            
            // Tambah unread count jika bukan dari monitor dan chat tidak aktif
            if (message.type !== 'monitor' && this.activeChatUnit !== unitName) {
                this.monitorUnreadCounts[unitName] = (this.monitorUnreadCounts[unitName] || 0) + 1;
            }
            
            // Update UI
            this.updateMonitorChatUI();
            
            // Show notification jika bukan chat aktif
            if (this.activeChatUnit !== unitName && message.type !== 'monitor') {
                this.showMonitorChatNotification(unitName, message);
            }
            
            console.log(`💬 New message from ${unitName}:`, message);
        }
    }

    // ✅ METHOD BARU: Kirim pesan dari monitor
    async sendMonitorMessage() {
        const messageText = document.getElementById('monitorChatInput').value.trim();
        if (!messageText || !this.activeChatUnit || !this.monitorChatRefs[this.activeChatUnit]) return;
        
        const messageData = {
            text: messageText,
            sender: 'MONITOR',
            unit: this.activeChatUnit,
            timestamp: new Date().toISOString(),
            timeDisplay: new Date().toLocaleTimeString('id-ID'),
            type: 'monitor'
        };
        
        try {
            await this.monitorChatRefs[this.activeChatUnit].push(messageData);
            this.logData(`💬 Pesan ke ${this.activeChatUnit}: "${messageText}"`, 'info');
            
            // Clear input
            document.getElementById('monitorChatInput').value = '';
            
        } catch (error) {
            console.error('Failed to send monitor message:', error);
            this.logData('❌ Gagal mengirim pesan ke driver', 'error');
        }
    }

    // ✅ METHOD BARU: Update chat UI di monitor
    updateMonitorChatUI() {
        const messageList = document.getElementById('monitorChatMessages');
        const unreadBadge = document.getElementById('monitorUnreadBadge');
        const chatInput = document.getElementById('monitorChatInput');
        const sendBtn = document.getElementById('monitorSendBtn');
        const unitSelect = document.getElementById('monitorChatUnitSelect');
        
        if (!messageList) return;
        
        // Update total unread badge
        const totalUnread = Object.values(this.monitorUnreadCounts).reduce((sum, count) => sum + count, 0);
        if (unreadBadge) {
            unreadBadge.textContent = totalUnread > 0 ? totalUnread : '';
            unreadBadge.style.display = totalUnread > 0 ? 'block' : 'none';
        }
        
        // Enable/disable input based on active unit
        const hasActiveUnit = !!this.activeChatUnit;
        if (chatInput) chatInput.disabled = !hasActiveUnit;
        if (sendBtn) sendBtn.disabled = !hasActiveUnit;
        
        // Render messages untuk unit aktif
        messageList.innerHTML = '';
        
        if (!this.activeChatUnit) {
            messageList.innerHTML = `
                <div class="chat-placeholder text-center text-muted py-4">
                    <small>Pilih unit untuk memulai percakapan...</small>
                </div>
            `;
            return;
        }
        
        const activeMessages = this.monitorChatMessages[this.activeChatUnit] || [];
        
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
        
        // Auto scroll to bottom
        messageList.scrollTop = messageList.scrollHeight;
    }

    // ✅ METHOD BARU: Update unit dropdown
    updateMonitorChatUnitSelect() {
        const unitSelect = document.getElementById('monitorChatUnitSelect');
        if (!unitSelect) return;
        
        // Simpan selected value
        const currentValue = unitSelect.value;
        
        // Clear existing options (keep first option)
        unitSelect.innerHTML = '<option value="">Pilih Unit...</option>';
        
        // Add active units
        Object.keys(this.monitorChatRefs).forEach(unitName => {
            const unreadCount = this.monitorUnreadCounts[unitName] || 0;
            const option = document.createElement('option');
            option.value = unitName;
            option.textContent = unreadCount > 0 ? 
                `${unitName} (${unreadCount} pesan baru)` : unitName;
            unitSelect.appendChild(option);
        });
        
        // Restore selected value jika masih ada
        if (currentValue && this.monitorChatRefs[currentValue]) {
            unitSelect.value = currentValue;
        }
    }

    // ✅ METHOD BARU: Pilih unit untuk chat
    selectChatUnit(unitName) {
        this.activeChatUnit = unitName;
        
        // Reset unread count untuk unit ini
        if (unitName && this.monitorUnreadCounts[unitName]) {
            this.monitorUnreadCounts[unitName] = 0;
        }
        
        this.updateMonitorChatUI();
        this.updateMonitorChatUnitSelect();
        
        console.log(`💬 Now chatting with unit: ${unitName}`);
    }

    // ✅ METHOD BARU: Toggle chat window di monitor
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

    // ✅ METHOD BARU: Handle chat input di monitor
    handleMonitorChatInput(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.sendMonitorMessage();
        }
    }

    // ✅ METHOD BARU: Show notification di monitor
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
        
        // Auto remove setelah 5 detik
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // ✅ METHOD BARU: Escape HTML untuk keamanan
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setupMap() {
        try {
            this.map = L.map('map').setView(this.config.center, this.config.zoom);

            // Base maps
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

            // Map controls
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
            // Clear existing markers
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
                .bindPopup(this.createLocationInfo('PKS SAGM', 'pks'))
                .addTo(this.map);

            // Kantor Kebun Marker
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

    // ===== EVENT HANDLERS =====
    setupEventHandlers() {
        // Search input
        const searchInput = document.getElementById('searchUnit');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.applyFilters());
        }

        // Filter dropdowns
        const filters = ['filterAfdeling', 'filterStatus', 'filterFuel'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.applyFilters());
            }
        });

        // Firebase connection status
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

    // ===== FIREBASE METHODS =====
    connectToFirebase() {
        try {
            console.log('🟡 Connecting to Firebase...');
            
            // Connection status monitoring
            database.ref('.info/connected').on('value', (snapshot) => {
                const connected = snapshot.val();
                this.updateConnectionStatus(connected);
                
                if (connected) {
                    this.logData('Firebase connected', 'success');
                } else {
                    this.logData('Firebase disconnected', 'warning');
                }
            });

            // Real-time data listener
            this.firebaseListener = database.ref('/units').on('value', (snapshot) => {
                const data = snapshot.val();
                this.processRealTimeData(data);
            }, (error) => {
                console.error('Firebase listener error:', error);
                this.logData('Firebase connection error', 'error', { error: error.message });
            });
            
            // Handle data removal (logout)
            database.ref('/units').on('child_removed', (snapshot) => {
                this.handleDataRemoval(snapshot.key);
            });
            
            console.log('✅ Firebase listener active');
            this.logData('Firebase real-time listener active', 'system');
            
        } catch (error) {
            console.error('Firebase connection failed:', error);
            this.logData('Firebase connection failed', 'error', { error: error.message });
        }
    }

    testFirebaseConnection() {
        setTimeout(() => {
            database.ref('/units').once('value')
                .then((snapshot) => {
                    const data = snapshot.val();
                    if (data && Object.keys(data).length > 0) {
                        this.logData('Firebase test successful - data found', 'success', {
                            units: Object.keys(data)
                        });
                    } else {
                        this.logData('Firebase test successful - no data', 'warning');
                    }
                })
                .catch((error) => {
                    this.logData('Firebase test failed', 'error', { error: error.message });
                });
        }, 3000);
    }

    processRealTimeData(firebaseData) {
        if (!firebaseData) {
            this.logData('No real-time data from Firebase', 'warning');
            this.clearAllData();
            return;
        }

        const unitCount = Object.keys(firebaseData).length;
        this.logData(`Real-time update: ${unitCount} units`, 'info', {
            units: unitCount,
            timestamp: new Date().toISOString()
        });

        let updates = 0;
        const activeUnits = new Set();
        const currentTime = Date.now();
        
        Object.entries(firebaseData).forEach(([unitName, unitData]) => {
            // Session validation for one-session-per-DT
            if (unitData.sessionId && !this.validateSession(unitName, unitData.sessionId)) {
                this.logData(`Invalid session for ${unitName}`, 'warning', {
                    unit: unitName,
                    sessionId: unitData.sessionId
                });
                return;
            }
            
            activeUnits.add(unitName);
            this.lastDataTimestamps[unitName] = currentTime;
            this.driverOnlineStatus[unitName] = true;
            
            const existingUnit = this.units.find(u => u.name === unitName);
            
            if (existingUnit) {
                this.refreshUnitData(existingUnit, unitData);
                updates++;
                
                this.logData(`GPS update: ${unitName}`, 'gps', {
                    unit: unitName,
                    latitude: unitData.lat,
                    longitude: unitData.lng,
                    speed: unitData.speed,
                    driver: unitData.driver
                });
            } else {
                const newUnit = this.createNewUnit(unitName, unitData);
                if (newUnit) {
                    this.units.push(newUnit);
                    updates++;
                    
                    this.unitSessions[unitName] = {
                        sessionId: unitData.sessionId,
                        startTime: currentTime,
                        lastActivity: currentTime
                    };

                    this.logData(`New unit detected: ${unitName}`, 'success', {
                        unit: unitName,
                        driver: unitData.driver,
                        location: { lat: unitData.lat, lng: unitData.lng }
                    });
                }
            }
        });

        // Remove inactive units
        this.removeInactiveUnits(activeUnits);

        if (updates > 0) {
            this.refreshDisplay();
        }
    }

    validateSession(unitName, sessionId) {
        if (!this.unitSessions[unitName]) {
            return true; // New unit, accept data
        }
        return this.unitSessions[unitName].sessionId === sessionId;
    }

    handleDataRemoval(unitName) {
        this.logData(`Data removed for unit: ${unitName}`, 'info', {
            unit: unitName,
            action: 'logout'
        });
        
        this.removeUnitCompletely(unitName);
    }

    // ===== UNIT MANAGEMENT =====
    createNewUnit(unitName, firebaseData) {
        if (!firebaseData || !firebaseData.lat || !firebaseData.lng) {
            this.logData(`Invalid data for unit ${unitName}`, 'warning', {
                unit: unitName,
                data: firebaseData
            });
            return null;
        }

        const initialFuel = 100; // Full tank assumption
        
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
        const timeDiff = (now - unit.lastFuelUpdate) / 1000 / 60; // minutes
        
        // Calculate distance if significant movement
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

        // Calculate idle fuel consumption
        if (unit.status === 'active' && timeDiff > 1) {
            const idleConsumption = timeDiff * this.vehicleConfig.idleFuelConsumptionPerMin;
            unit.fuelUsed += idleConsumption;
        }

        // Update unit properties
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

    // ===== ROUTE HISTORY METHODS =====
    initializeUnitHistory(unit) {
        if (!this.unitHistory[unit.name]) {
            this.unitHistory[unit.name] = [];
        }
        this.addHistoryPoint(unit);
    }

    addHistoryPoint(unit) {
        if (!this.unitHistory[unit.name]) {
            this.unitHistory[unit.name] = [];
        }

        const history = this.unitHistory[unit.name];
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
            this.unitHistory[unit.name] = history.slice(-this.maxRoutePoints);
        }

        this.updateUnitRoute(unit);
        this.saveHistory();
    }

    updateUnitRoute(unit) {
        if (!this.unitHistory[unit.name] || this.unitHistory[unit.name].length < 1) {
            return;
        }

        const routePoints = this.unitHistory[unit.name].map(point => [
            point.latitude, point.longitude
        ]);

        const routeColor = this.getRouteColor(unit.name);

        if (this.unitPolylines[unit.name]) {
            try {
                this.unitPolylines[unit.name].setLatLngs(routePoints);
                const style = this.getRouteStyle(unit.status, routeColor);
                this.unitPolylines[unit.name].setStyle(style);
            } catch (error) {
                this.map.removeLayer(this.unitPolylines[unit.name]);
                delete this.unitPolylines[unit.name];
                this.createRoutePolyline(unit, routePoints, routeColor);
            }
        } else {
            this.createRoutePolyline(unit, routePoints, routeColor);
        }
    }

    getRouteColor(unitName) {
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

    createRoutePolyline(unit, routePoints, routeColor) {
        try {
            const style = this.getRouteStyle(unit.status, routeColor);
            this.unitPolylines[unit.name] = L.polyline(routePoints, style);
            
            if (this.showRoutes) {
                this.unitPolylines[unit.name].addTo(this.map);
            }

            this.unitPolylines[unit.name].bindPopup(this.createRoutePopup(unit));
            this.unitPolylines[unit.name].on('click', () => {
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

    createRoutePopup(unit) {
        const routePoints = this.unitHistory[unit.name]?.length || 0;
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

    // ===== DATA MANAGEMENT =====
    loadInitialData() {
        this.loadUnitData();
        this.loadHistoryData();
    }

    loadUnitData() {
        this.showLoadingIndicator(true);
        
        database.ref('/units').once('value')
            .then((snapshot) => {
                const firebaseData = snapshot.val();
                if (firebaseData && Object.keys(firebaseData).length > 0) {
                    Object.entries(firebaseData).forEach(([unitName, unitData]) => {
                        const unit = this.createNewUnit(unitName, unitData);
                        if (unit) {
                            this.units.push(unit);
                        }
                    });
                    this.logData('Initial data loaded successfully', 'success', {
                        units: this.units.length
                    });
                } else {
                    this.logData('No initial data found', 'warning');
                }
                
                this.refreshDisplay();
                this.showLoadingIndicator(false);
                
            })
            .catch((error) => {
                console.error('Failed to load initial data:', error);
                this.logData('Failed to load initial data', 'error', { error: error.message });
                this.showLoadingIndicator(false);
            });
    }

    loadHistoryData() {
        try {
            const savedHistory = localStorage.getItem('sagm_unit_history');
            if (savedHistory) {
                this.unitHistory = JSON.parse(savedHistory);
                this.logData('Route history loaded', 'system', {
                    units: Object.keys(this.unitHistory).length
                });
            }
        } catch (error) {
            console.error('Failed to load history:', error);
            this.unitHistory = {};
        }
    }

    saveHistory() {
        try {
            localStorage.setItem('sagm_unit_history', JSON.stringify(this.unitHistory));
        } catch (error) {
            console.error('Failed to save history:', error);
        }
    }

    // ===== DISPLAY METHODS =====
    refreshDisplay() {
        this.updateStatistics();
        this.renderUnitList();
        this.updateMapMarkers();
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

        // Update DOM elements
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        updateElement('activeUnits', `${activeUnits}/23`);
        updateElement('totalDistance', `${totalDistance.toFixed(1)} km`);
        updateElement('avgSpeed', `${avgSpeed.toFixed(1)} km/h`);
        updateElement('totalFuel', `${totalFuel.toFixed(1)} L`);

        // Update fuel efficiency
        const fuelEfficiency = totalDistance > 0 ? totalDistance / totalFuel : 0;
        updateElement('fuelEfficiency', `${fuelEfficiency.toFixed(1)} km/L`);
    }

    renderUnitList() {
        const unitList = document.getElementById('unitList');
        if (!unitList) return;

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
        // Remove markers for units that no longer exist
        Object.keys(this.markers).forEach(markerId => {
            const unitExists = this.units.some(unit => unit.id.toString() === markerId.toString());
            if (!unitExists && this.markers[markerId]) {
                this.map.removeLayer(this.markers[markerId]);
                delete this.markers[markerId];
            }
        });

        // Create or update markers
        this.units.forEach(unit => {
            if (!this.markers[unit.id]) {
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
        
        this.markers[unit.id] = marker;
    }

    refreshUnitMarker(unit) {
        if (this.markers[unit.id]) {
            this.markers[unit.id].setLatLng([unit.latitude, unit.longitude]);
            this.markers[unit.id].setPopupContent(this.createUnitPopup(unit));
            
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

    createUnitPopup(unit) {
        const routePoints = this.unitHistory[unit.name]?.length || 0;
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

    // ===== DATA LOGGER METHODS =====
    setupDataLogger() {
        this.loadLogs();
        this.renderLogger();
        this.startAutoExport();
        
        this.logData('GPS Monitoring System initialized', 'system', {
            timestamp: new Date().toISOString(),
            units: this.units.length,
            version: '2.0'
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

    // ===== UTILITY METHODS =====
    startPeriodicTasks() {
        this.autoRefreshInterval = setInterval(() => {
            this.logData('Auto-refresh cycle', 'info');
        }, 30000);

        // Online status checker
        setInterval(() => {
            const now = Date.now();
            Object.keys(this.lastDataTimestamps).forEach(unitName => {
                const lastUpdate = this.lastDataTimestamps[unitName];
                const timeDiff = now - lastUpdate;
                
                if (timeDiff > 15000) {
                    this.markUnitOffline(unitName);
                }
            });
        }, 5000);
    }

    markUnitOffline(unitName) {
        const unitIndex = this.units.findIndex(u => u.name === unitName);
        if (unitIndex !== -1) {
            const unit = this.units[unitIndex];
            
            this.logData(`Unit marked offline: ${unitName}`, 'warning', {
                unit: unitName,
                driver: unit.driver,
                lastLocation: { lat: unit.latitude, lng: unit.longitude }
            });
            
            this.removeUnitCompletely(unitName);
        }
    }

    removeUnitCompletely(unitName) {
        this.units = this.units.filter(unit => unit.name !== unitName);
        
        if (this.markers[unitName]) {
            this.map.removeLayer(this.markers[unitName]);
            delete this.markers[unitName];
        }
        
        if (this.unitPolylines[unitName]) {
            this.map.removeLayer(this.unitPolylines[unitName]);
            delete this.unitPolylines[unitName];
        }
        
        delete this.driverOnlineStatus[unitName];
        delete this.lastDataTimestamps[unitName];
        delete this.unitSessions[unitName];
        
        this.refreshDisplay();
    }

    removeInactiveUnits(activeUnits) {
        this.units.forEach(unit => {
            if (!activeUnits.has(unit.name)) {
                this.logData(`Unit inactive: ${unit.name}`, 'warning', { unit: unit.name });
                this.markUnitOffline(unit.name);
            }
        });
    }

    clearAllData() {
        this.units = [];
        this.refreshDisplay();
        this.clearAllMarkers();
    }

    clearAllMarkers() {
        Object.values(this.markers).forEach(marker => {
            if (marker && this.map) {
                this.map.removeLayer(marker);
            }
        });
        this.markers = {};
        this.logData('All markers cleared', 'system');
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
            unit = this.units.find(u => u.name === unitOrName);
        } else {
            unit = unitOrName;
        }

        if (unit && this.map) {
            this.map.setView([unit.latitude, unit.longitude], 15);
            if (this.markers[unit.name]) {
                this.markers[unit.name].openPopup();
            }
            this.logData(`Map centered on ${unit.name}`, 'info', {
                unit: unit.name,
                location: { lat: unit.latitude, lng: unit.longitude }
            });
        }
    }

    toggleRouteDisplay() {
        this.showRoutes = !this.showRoutes;
        
        Object.entries(this.unitPolylines).forEach(([unitName, polyline]) => {
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
        Object.values(this.unitPolylines).forEach(polyline => {
            this.map.removeLayer(polyline);
        });
        this.unitPolylines = {};
        this.unitHistory = {};
        this.saveHistory();
        this.logData('All routes removed', 'system');
    }

    downloadRouteData() {
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

    cleanup() {
        if (this.firebaseListener) {
            database.ref('/units').off('value', this.firebaseListener);
        }
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }
        if (this.dataLogger.exportInterval) {
            clearInterval(this.dataLogger.exportInterval);
        }
        
        // ✅ TAMBAHKAN: Cleanup chat system
        database.ref('/chat').off('child_added');
        database.ref('/chat').off('child_removed');
        Object.values(this.monitorChatRefs).forEach(ref => ref.off());
    }
}

// Initialize the system
let gpsSystem;

document.addEventListener('DOMContentLoaded', function() {
    gpsSystem = new SAGMGpsTracking();
    window.gpsSystem = gpsSystem;
});

// Global functions
function refreshData() {
    if (gpsSystem) {
        gpsSystem.loadUnitData();
    }
}

function exportData() {
    if (gpsSystem) {
        gpsSystem.downloadRouteData();
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('show');
}

function toggleRoutes() {
    if (gpsSystem) {
        gpsSystem.toggleRouteDisplay();
    }
}

function clearRoutes() {
    if (gpsSystem) {
        gpsSystem.removeAllRoutes();
    }
}

// ✅ TAMBAHKAN: Global functions untuk chat system
function toggleMonitorChat() {
    if (gpsSystem) {
        gpsSystem.toggleMonitorChat();
    }
}

function selectChatUnit(unitName) {
    if (gpsSystem) {
        gpsSystem.selectChatUnit(unitName);
    }
}

function sendMonitorMessage() {
    if (gpsSystem) {
        gpsSystem.sendMonitorMessage();
    }
}

function handleMonitorChatInput(event) {
    if (gpsSystem) {
        gpsSystem.handleMonitorChatInput(event);
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (gpsSystem) {
        gpsSystem.cleanup();
    }
});
