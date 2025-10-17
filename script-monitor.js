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
    }

    // ===== MAIN INITIALIZATION =====
    initialize() {
        try {
            console.log('🔧 Starting system initialization...');
            this.showLoading(true);
            
            // Step 1: Initialize Firebase
            this.initializeFirebase();
            
            // Step 2: Setup Map
            this.setupMap();
            
            // Step 3: Connect to Firebase
            this.connectToFirebase();
            
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
                console.log('✅ Firebase already initialized');
            }
        } catch (error) {
            throw new Error('Firebase initialization failed: ' + error.message);
        }
    }

    // ===== MAP SETUP =====
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

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(this.map);
            console.log('✅ Tile layer added');

            // Add controls
            L.control.scale({ imperial: false }).addTo(this.map);
            console.log('✅ Map controls added');

            // Add important locations
            this.addLocationMarkers();
            console.log('✅ Location markers added');

        } catch (error) {
            console.error('❌ Map setup failed:', error);
            this.showMapError(error.message);
            throw error;
        }
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

            // Connection status listener
            database.ref('.info/connected').on('value', (snapshot) => {
                const connected = snapshot.val();
                this.updateConnectionStatus(connected);
                console.log('📡 Firebase connection:', connected);
            });

            // Units data listener
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

        Object.entries(firebaseData).forEach(([unitName, unitData]) => {
            if (this.validateUnitData(unitName, unitData)) {
                activeUnits.add(unitName);
                this.updateOrCreateUnit(unitName, unitData);
            }
        });

        // Cleanup inactive units
        this.cleanupInactiveUnits(activeUnits);
        
        // Update statistics
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
            status: this.determineStatus(unitData.journeyStatus),
            lastUpdate: new Date().toLocaleTimeString('id-ID'),
            distance: parseFloat(unitData.distance) || 0,
            fuelLevel: this.computeFuelLevel(100, unitData.distance, unitData.journeyStatus),
            isOnline: true
        };

        if (this.markers.has(unitName)) {
            // Update existing marker
            const marker = this.markers.get(unitName);
            marker.setLatLng([unit.lat, unit.lng]);
            marker.setPopupContent(this.createUnitPopup(unit));
            
            // Update marker icon based on status
            const icon = L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-icon ${unit.status}">🚛</div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 16]
            });
            marker.setIcon(icon);

        } else {
            // Create new marker
            this.createUnitMarker(unit);
        }

        this.units.set(unitName, unit);
    }

    createUnitMarker(unit) {
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div class="marker-icon ${unit.status}">🚛</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });

        const marker = L.marker([unit.lat, unit.lng], { icon: icon })
            .bindPopup(this.createUnitPopup(unit))
            .addTo(this.map);
        
        this.markers.set(unit.name, marker);
    }

    createUnitPopup(unit) {
        return `
            <div class="unit-popup" style="min-width: 250px;">
                <div class="popup-header" style="background: #28a745; color: white; padding: 10px; margin: -10px -10px 10px -10px; border-radius: 5px 5px 0 0;">
                    <h6 class="mb-0">🚛 ${unit.name}</h6>
                </div>
                <div style="padding: 10px;">
                    <div><strong>Driver:</strong> ${unit.driver}</div>
                    <div><strong>Afdeling:</strong> ${unit.afdeling}</div>
                    <div><strong>Status:</strong> ${unit.status === 'moving' ? '🟡 Dalam Perjalanan' : unit.status === 'active' ? '🟢 Aktif' : '🔴 Non-Aktif'}</div>
                    <div><strong>Kecepatan:</strong> ${unit.speed} km/h</div>
                    <div><strong>Jarak:</strong> ${unit.distance.toFixed(2)} km</div>
                    <div><strong>Bahan Bakar:</strong> ${unit.fuelLevel.toFixed(1)}%</div>
                    <div><strong>Update:</strong> ${unit.lastUpdate}</div>
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
                
                // Update marker to show offline status
                const marker = this.markers.get(unitName);
                if (marker) {
                    const icon = L.divIcon({
                        className: 'custom-marker',
                        html: '<div class="marker-icon inactive">🚛</div>',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                    });
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
            unitElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h6 class="mb-1">${unit.name} ${unit.isOnline ? '🟢' : '🔴'}</h6>
                        <small class="text-muted">${unit.afdeling} - ${unit.driver}</small>
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
        
        // Create error notification
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
