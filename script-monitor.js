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
        this.currentChatUnit = null;
        this.currentChatDriver = null;
        this.chatMessages = new Map();
        this.unreadCounts = new Map();
    }

    // ===== MAIN INITIALIZATION =====
    initialize() {
        try {
            console.log('🔧 Starting system initialization...');
            this.showLoading(true);
            
            this.initializeFirebase();
            this.setupMap();
            this.connectToFirebase();
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

            this.map = L.map('map').setView(this.config.center, this.config.zoom);

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

            this.addMapControls();
            this.addLocationMarkers();

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

        L.control.scale({ imperial: false }).addTo(this.map);
    }

    switchMapType(type) {
        if (this.currentMapType === type) return;
        
        this.currentMapType = type;
        
        this.map.removeLayer(this.streetLayer);
        this.map.removeLayer(this.satelliteLayer);
        
        if (type === 'street') {
            this.streetLayer.addTo(this.map);
        } else {
            this.satelliteLayer.addTo(this.map);
        }
        
        document.querySelectorAll('.map-type-control .btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
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

            L.marker([this.importantLocations.PKS_SAGM.lat, this.importantLocations.PKS_SAGM.lng], { 
                icon: pksIcon 
            })
            .bindPopup(`
                <div class="unit-popup">
                    <div class="popup-header">
                        <h6 class="mb-0">🏭 ${this.importantLocations.PKS_SAGM.name}</h6>
                    </div>
                    <div class="p-2">
                        <strong>Pabrik Kelapa Sawit</strong><br>
                        <small>Lokasi: Kebun Tempuling</small>
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

            L.marker([this.importantLocations.KANTOR_KEBUN.lat, this.importantLocations.KANTOR_KEBUN.lng], { 
                icon: officeIcon 
            })
            .bindPopup(`
                <div class="unit-popup">
                    <div class="popup-header">
                        <h6 class="mb-0">🏢 ${this.importantLocations.KANTOR_KEBUN.name}</h6>
                    </div>
                    <div class="p-2">
                        <strong>Kantor Operasional</strong><br>
                        <small>Lokasi: Kebun Tempuling</small>
                    </div>
                </div>
            `)
            .addTo(this.map);

        } catch (error) {
            console.error('Failed to add location markers:', error);
        }
    }

    // ===== FIREBASE CONNECTION =====
    connectToFirebase() {
        try {
            console.log('🔥 Connecting to Firebase...');
            
            const database = firebase.database();

            database.ref('.info/connected').on('value', (snapshot) => {
                const connected = snapshot.val();
                this.updateConnectionStatus(connected);
            });

            database.ref('/units').on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    this.processRealTimeData(data);
                } else {
                    this.clearAllUnits();
                }
            }, (error) => {
                console.error('❌ Firebase listener error:', error);
                this.updateConnectionStatus(false);
            });

        } catch (error) {
            console.error('❌ Firebase connection failed:', error);
            setTimeout(() => this.connectToFirebase(), 5000);
        }
    }

    // ===== DATA PROCESSING =====
    processRealTimeData(firebaseData) {
        const unitCount = Object.keys(firebaseData).length;
        console.log(`🔄 Processing ${unitCount} units`);

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
            }
        });

        this.cleanupInactiveUnits(activeUnits);
        this.updateStatistics();
    }

    validateUnitData(unitName, unitData) {
        if (!unitData) return false;
        if (unitData.lat === undefined || unitData.lng === undefined) return false;
        
        const lat = parseFloat(unitData.lat);
        const lng = parseFloat(unitData.lng);
        
        return !isNaN(lat) && !isNaN(lng);
    }

    updateOrCreateUnit(unitName, unitData) {
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
            accuracy: unitData.accuracy || 0
        };

        if (this.markers.has(unitName)) {
            const marker = this.markers.get(unitName);
            marker.setLatLng([unit.lat, unit.lng]);
            marker.setPopupContent(this.createUnitPopup(unit));
            const icon = this.createUnitIcon(unit);
            marker.setIcon(icon);
        } else {
            this.createUnitMarker(unit);
        }

        this.units.set(unitName, unit);
    }

    createUnitIcon(unit) {
        let html = '';
        if (!unit.isOnline) {
            html = '<div class="marker-icon offline">🔴</div>';
        } else if (unit.status === 'moving') {
            html = '<div class="marker-icon moving">🟡</div>';
        } else if (unit.status === 'active') {
            html = '<div class="marker-icon active">🟢</div>';
        } else {
            html = '<div class="marker-icon inactive">⚫</div>';
        }

        return L.divIcon({
            className: 'custom-marker',
            html: html,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
    }

    createUnitMarker(unit) {
        const icon = this.createUnitIcon(unit);

        const marker = L.marker([unit.lat, unit.lng], { icon: icon })
            .bindPopup(this.createUnitPopup(unit))
            .addTo(this.map);
        
        this.markers.set(unit.name, marker);
    }

    createUnitPopup(unit) {
        const statusInfo = !unit.isOnline ? 
            '🔴 OFFLINE (No Network)' : 
            unit.status === 'active' ? '🟢 AKTIF' : 
            unit.status === 'moving' ? '🟡 DALAM PERJALANAN' : '⚫ NON-AKTIF';

        const unreadCount = this.unreadCounts.get(unit.name) || 0;
        const chatBadge = unreadCount > 0 ? `<span class="badge bg-danger">${unreadCount}</span>` : '';

        return `
            <div class="unit-popup" style="min-width: 250px;">
                <div class="popup-header" style="background: ${unit.isOnline ? '#28a745' : '#dc3545'}; color: white; padding: 10px; margin: -10px -10px 10px -10px; border-radius: 5px 5px 0 0;">
                    <h6 class="mb-0">🚛 ${unit.name} ${unit.isOnline ? '🟢' : '🔴'}</h6>
                </div>
                <div style="padding: 10px;">
                    <div><strong>Driver:</strong> ${unit.driver}</div>
                    <div><strong>Afdeling:</strong> ${unit.afdeling}</div>
                    <div><strong>Status:</strong> ${statusInfo}</div>
                    <div><strong>Kecepatan:</strong> ${unit.speed} km/h</div>
                    <div><strong>Jarak:</strong> ${unit.distance.toFixed(2)} km</div>
                    <div><strong>Bahan Bakar:</strong> ${unit.fuelLevel.toFixed(1)}%</div>
                    <div><strong>Baterai:</strong> ${unit.batteryLevel}%</div>
                    <div><strong>Akurasi GPS:</strong> ${unit.accuracy.toFixed(1)} m</div>
                    <div><strong>Update:</strong> ${unit.lastUpdate}</div>
                    <div class="mt-2">
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
            'DT-06': 'AFD I', 'DT-07': 'AFD I', 'DT-12': 'AFD II', 'DT-13': 'AFD II',
            'DT-15': 'AFD III', 'DT-16': 'AFD III', 'DT-17': 'AFD IV', 'DT-18': 'AFD IV',
            'DT-23': 'AFD V', 'DT-24': 'AFD V', 'DT-25': 'KKPA', 'DT-26': 'KKPA',
            'DT-27': 'KKPA', 'DT-28': 'AFD II', 'DT-29': 'AFD III', 'DT-32': 'AFD I',
            'DT-33': 'AFD IV', 'DT-34': 'AFD V', 'DT-35': 'KKPA', 'DT-36': 'AFD II',
            'DT-37': 'AFD III', 'DT-38': 'AFD I', 'DT-39': 'AFD IV'
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
        this.units.forEach((unit, unitName) => {
            if (!activeUnits.has(unitName)) {
                unit.isOnline = false;
                const marker = this.markers.get(unitName);
                if (marker) {
                    const icon = this.createUnitIcon(unit);
                    marker.setIcon(icon);
                }
            }
        });
    }

    clearAllUnits() {
        this.markers.forEach((marker, unitName) => {
            if (this.map) {
                this.map.removeLayer(marker);
            }
        });
        this.markers.clear();
        this.units.clear();
        this.renderUnitList();
    }

    // ===== CHAT SYSTEM =====
    setupChatSystem() {
        console.log('💬 Setting up chat system...');
        
        this.chatRef = firebase.database().ref('/chat');
        
        this.chatRef.on('child_added', (snapshot) => {
            const unitId = snapshot.key;
            snapshot.forEach((messageSnapshot) => {
                const message = messageSnapshot.val();
                this.handleChatMessage(unitId, message);
            });
        });

        const typingRef = firebase.database().ref('/typing');
        typingRef.on('child_added', (snapshot) => {
            const unitId = snapshot.key;
            const typingData = snapshot.val();
            this.handleTypingIndicator(unitId, typingData);
        });
    }

    handleChatMessage(unitId, message) {
        if (!this.chatMessages.has(unitId)) {
            this.chatMessages.set(unitId, []);
        }
        
        const messages = this.chatMessages.get(unitId);
        const messageExists = messages.some(msg => msg.id === message.id);
        if (messageExists) return;
        
        messages.push(message);
        
        if (!this.isChatOpen(unitId)) {
            const currentCount = this.unreadCounts.get(unitId) || 0;
            this.unreadCounts.set(unitId, currentCount + 1);
            this.updateChatBadge(unitId);
        }
        
        if (this.isChatOpen(unitId)) {
            this.renderChatMessages(unitId);
        }
        
        if (message.sender !== 'Monitor') {
            this.showChatNotification(unitId, message);
        }
    }

    handleTypingIndicator(unitId, typingData) {
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
        
        document.getElementById('monitorChatContainer').style.display = 'block';
        document.getElementById('chatWithUser').textContent = `💬 Chat dengan ${driverName} (${unitId})`;
        
        this.unreadCounts.set(unitId, 0);
        this.updateChatBadge(unitId);
        this.renderChatMessages(unitId);
        
        setTimeout(() => {
            document.getElementById('chatInputMonitor').focus();
        }, 100);
    }

    closeChat() {
        document.getElementById('monitorChatContainer').style.display = 'none';
        this.currentChatUnit = null;
        this.currentChatDriver = null;
    }

    minimizeChat() {
        const chatWindow = document.querySelector('.chat-window-monitor');
        const messages = document.getElementById('chatMessagesMonitor');
        const input = document.querySelector('.chat-input-container');
        
        if (messages.style.display === 'none') {
            messages.style.display = 'block';
            input.style.display = 'block';
        } else {
            messages.style.display = 'none';
            input.style.display = 'none';
        }
    }

    isChatOpen(unitId) {
        return this.currentChatUnit === unitId;
    }

    renderChatMessages(unitId) {
        const messagesContainer = document.getElementById('chatMessagesMonitor');
        const messages = this.chatMessages.get(unitId) || [];
        
        messagesContainer.innerHTML = '';
        
        if (messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="text-center text-muted py-4">
                    <small>Mulai percakapan dengan driver...</small>
                </div>
            `;
            return;
        }
        
        messages.forEach(message => {
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
            
            messagesContainer.appendChild(messageElement);
        });
        
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    async sendChatMessage() {
        if (!this.currentChatUnit || !this.currentChatDriver) return;
        
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
            
            if (!this.chatMessages.has(this.currentChatUnit)) {
                this.chatMessages.set(this.currentChatUnit, []);
            }
            this.chatMessages.get(this.currentChatUnit).push(messageData);
            this.renderChatMessages(this.currentChatUnit);
            
        } catch (error) {
            console.error('Failed to send message:', error);
            alert('Gagal mengirim pesan: ' + error.message);
        }
    }

    showTypingIndicator(unitId, driverName) {
        if (this.isChatOpen(unitId)) {
            const indicator = document.getElementById('typingIndicatorMonitor');
            const typingText = document.getElementById('typingText');
            
            typingText.textContent = `${driverName} sedang mengetik...`;
            indicator.style.display = 'block';
        }
    }

    hideTypingIndicator(unitId) {
        if (this.isChatOpen(unitId)) {
            document.getElementById('typingIndicatorMonitor').style.display = 'none';
        }
    }

    updateChatBadge(unitId) {
        const unreadCount = this.unreadCounts.get(unitId) || 0;
        this.renderUnitList();
    }

    showChatNotification(unitId, message) {
        if (!this.isChatOpen(unitId)) {
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
            `;
            
            document.body.appendChild(notification);
            
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

        this.updateElement('activeUnits', `${activeUnits}/${this.units.size}`);
        this.updateElement('totalDistance', `${totalDistance.toFixed(1)} km`);
        this.updateElement('avgSpeed', `${avgSpeed.toFixed(1)} km/h`);
        this.updateElement('totalFuel', `${totalFuel.toFixed(1)} L`);
        this.updateElement('dataCount', unitCount.toString());
        
        this.updateElement('activeUnitsDetail', `${unitCount} units terdeteksi`);
        this.updateElement('distanceDetail', `${this.units.size} units`);

        this.renderUnitList();
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

        unitList.innerHTML = '';
        this.units.forEach(unit => {
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
                        Kecepatan: ${unit.speed} km/h<br>
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
    }

    exportData() {
        const exportData = {
            timestamp: new Date().toISOString(),
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
        
        console.log('📊 Data exported successfully');
    }

    // Cleanup
    cleanup() {
        if (this.map) {
            this.map.remove();
        }
        this.markers.clear();
        this.units.clear();
        if (this.chatRef) {
            this.chatRef.off();
        }
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
