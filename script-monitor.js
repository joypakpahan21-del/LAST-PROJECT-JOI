// ==== ENHANCED FIREBASE CONFIG dengan Security ====
// NOTE: Untuk production, pindahkan ini ke environment variables
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBMiER_5b51IEEoxivkCliRC0WID1f-yzk",
    authDomain: "joi-gps-tracker.firebaseapp.com",
    databaseURL: "https://joi-gps-tracker-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "joi-gps-tracker",
    storageBucket: "joi-gps-tracker.firebasestorage.app",
    messagingSenderId: "216572191895",
    appId: "1:216572191895:web:a4fef1794daf200a2775d2"
};

// Initialize Firebase dengan error handling
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(FIREBASE_CONFIG);
    }
} catch (error) {
    console.error('Firebase initialization failed:', error);
}

const database = firebase.database();

// ENHANCED SAGM GPS Tracking System dengan semua improvement
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
        
        // Enhanced Route visualization
        this.unitPolylines = {};
        this.showRoutes = true;
        this.routeColors = {};
        this.routeControls = null;
        
        // Event listeners cleanup tracking
        this.eventListeners = [];
        
        // Performance optimization
        this.updateBatch = [];
        this.batchTimeout = null;
        
        // Constants untuk maintainability
        this.CONSTANTS = {
            MIN_MOVEMENT_DISTANCE: 0.01, // 10 meters
            MAX_HISTORY_POINTS: 200, // Reduced from 500 untuk performance
            BATCH_UPDATE_DELAY: 100, // ms untuk batch processing
            STORAGE_QUOTA: 4.5 * 1024 * 1024, // 4.5MB max
            AUTO_REFRESH_INTERVAL: 30000 // 30 seconds
        };

        // Enhanced vehicle configuration
        this.vehicleConfig = {
            fuelEfficiency: 4,
            maxSpeed: 80,
            idleFuelConsumption: 1.5,
            fuelTankCapacity: 100,
            baseFuel: 80 // Fuel level awal
        };

        // Important locations dengan enhanced data
        this.importantLocations = {
            PKS_SAGM: { 
                lat: -0.43452332690449164, 
                lng: 102.96741072417917, 
                name: "PKS SAGM",
                type: "pks",
                capacity: "45 Ton TBS/Jam"
            },
            KANTOR_KEBUN: { 
                lat: -0.3575865859028525, 
                lng: 102.95047687287101, 
                name: "Kantor Kebun PT SAGM",
                type: "office",
                workingHours: "07:00 - 16:00"
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

    // ==== HIGH PRIORITY FIXES ====

    // FIXED: Enhanced security - Validate data dari Firebase
    validateFirebaseData(unitData) {
        if (!unitData) return false;
        
        // Basic validation
        const required = ['lat', 'lng'];
        return required.every(field => 
            unitData[field] !== undefined && 
            unitData[field] !== null
        );
    }

    // FIXED: Correct distance calculation logic
    updateUnitFromFirebase(unit, firebaseData) {
        if (!this.validateFirebaseData(firebaseData)) {
            console.warn('Invalid Firebase data for unit:', unit.name);
            return;
        }

        try {
            // FIXED: Correct distance accumulation logic
            if (unit.lastLat && unit.lastLng && firebaseData.lat && firebaseData.lng) {
                const distance = this.calculateDistance(
                    unit.lastLat, unit.lastLng, 
                    firebaseData.lat, firebaseData.lng
                );
                
                // FIXED: Only add significant movement (>10m) dan reasonable distance (<1km)
                if (distance > this.CONSTANTS.MIN_MOVEMENT_DISTANCE && distance < 1.0) {
                    unit.distance += distance;
                    unit.fuelUsed += distance / this.vehicleConfig.fuelEfficiency;
                    this.addLog(`${unit.name} moved ${distance.toFixed(3)} km`, 'info');
                }
            }

            // Update unit data
            unit.latitude = firebaseData.lat;
            unit.longitude = firebaseData.lng;
            unit.speed = firebaseData.speed || 0;
            unit.status = this.getStatusFromJourneyStatus(firebaseData.journeyStatus) || unit.status;
            unit.lastUpdate = firebaseData.lastUpdate || new Date().toLocaleTimeString('id-ID');
            unit.driver = firebaseData.driver || 'Unknown';
            unit.accuracy = firebaseData.accuracy || 0;
            unit.batteryLevel = firebaseData.batteryLevel || null;
            
            // FIXED: More accurate fuel calculation
            unit.fuelLevel = this.calculateFuelLevel(unit.distance);
            
            unit.lastLat = firebaseData.lat;
            unit.lastLng = firebaseData.lng;

            // Update history untuk route tracking
            this.updateUnitHistory(unit);

        } catch (error) {
            console.error('Error updating unit:', unit.name, error);
            this.showError(`Gagal update data ${unit.name}`);
        }
    }

    // FIXED: More accurate fuel level calculation
    calculateFuelLevel(distance) {
        const fuelUsed = distance / this.vehicleConfig.fuelEfficiency;
        const fuelRemaining = this.vehicleConfig.baseFuel - fuelUsed;
        const fuelPercentage = (fuelRemaining / this.vehicleConfig.fuelTankCapacity) * 100;
        
        return Math.max(0, Math.min(100, fuelPercentage));
    }

    // ==== MEDIUM PRIORITY ENHANCEMENTS ====

    // ENHANCED: Performance optimization dengan batch updates
    handleRealTimeUpdate(firebaseData) {
        if (!firebaseData) {
            console.log('📭 Tidak ada data real-time dari Firebase');
            this.units = [];
            this.scheduleBatchUpdate();
            return;
        }

        console.log('🔄 Update real-time dari Firebase:', Object.keys(firebaseData).length + ' units');
        
        Object.entries(firebaseData).forEach(([unitName, unitData]) => {
            if (!this.validateFirebaseData(unitData)) {
                console.warn('Skipping invalid data for:', unitName);
                return;
            }

            const existingUnitIndex = this.units.findIndex(u => u.name === unitName);
            
            if (existingUnitIndex !== -1) {
                this.updateUnitFromFirebase(this.units[existingUnitIndex], unitData);
            } else {
                const newUnit = this.createUnitFromFirebase(unitName, unitData);
                this.units.push(newUnit);
            }
        });

        this.scheduleBatchUpdate();
    }

    // ENHANCED: Batch processing untuk performance
    scheduleBatchUpdate() {
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
        }
        
        this.batchTimeout = setTimeout(() => {
            this.executeBatchUpdate();
        }, this.CONSTANTS.BATCH_UPDATE_DELAY);
    }

    executeBatchUpdate() {
        this.updateStatistics();
        this.renderUnitList();
        this.updateMapMarkers();
        this.addLog(`Batch update: ${this.units.length} units`, 'success');
        this.batchTimeout = null;
    }

    // ENHANCED: Event listeners dengan proper management
    setupEventListeners() {
        this.cleanupEventListeners(); // Cleanup existing listeners
        
        const searchInput = document.getElementById('searchUnit');
        if (searchInput) {
            // ENHANCED: Debounced search
            let searchTimeout;
            const searchHandler = (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filterUnits();
                }, 300);
            };
            
            searchInput.addEventListener('input', searchHandler);
            this.eventListeners.push({ element: searchInput, type: 'input', handler: searchHandler });
        }

        const filters = ['filterAfdeling', 'filterStatus', 'filterFuel'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                const filterHandler = () => this.filterUnits();
                filter.addEventListener('change', filterHandler);
                this.eventListeners.push({ element: filter, type: 'change', handler: filterHandler });
            }
        });

        // Firebase connection monitoring
        database.ref('.info/connected').on('value', (snapshot) => {
            this.updateFirebaseStatus(snapshot.val());
        });
    }

    // ENHANCED: Proper event listener cleanup
    cleanupEventListeners() {
        this.eventListeners.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        this.eventListeners = [];
    }

    // ENHANCED: Better localStorage management dengan quota control
    saveHistoryToStorage() {
        try {
            const dataStr = JSON.stringify(this.unitHistory);
            
            // Check storage quota
            if (dataStr.length > this.CONSTANTS.STORAGE_QUOTA) {
                console.warn('Storage quota exceeded, cleaning up...');
                this.cleanupOldHistoryData();
                return this.saveHistoryToStorage(); // Retry dengan data yang sudah dibersihkan
            }
            
            localStorage.setItem('sagm_unit_history', dataStr);
        } catch (error) {
            console.error('Error saving history:', error);
            if (error.name === 'QuotaExceededError') {
                this.cleanupOldHistoryData();
            }
        }
    }

    // ENHANCED: Auto-cleanup old history data
    cleanupOldHistoryData() {
        Object.keys(this.unitHistory).forEach(unitName => {
            if (this.unitHistory[unitName].length > this.CONSTANTS.MAX_HISTORY_POINTS) {
                this.unitHistory[unitName] = this.unitHistory[unitName].slice(-this.CONSTANTS.MAX_HISTORY_POINTS);
            }
        });
        this.saveHistoryToStorage();
    }

    // ==== LOW PRIORITY ENHANCEMENTS ====

    // NEW: Advanced geofencing system
    setupGeofences() {
        this.geofences = [
            {
                name: "Area PKS SAGM",
                coordinates: this.createGeofenceCircle(this.importantLocations.PKS_SAGM.lat, this.importantLocations.PKS_SAGM.lng, 0.5), // 500m radius
                type: "restricted",
                alert: "🚨 Masuk area PKS - Hati-hati!"
            },
            {
                name: "Area Kantor Kebun", 
                coordinates: this.createGeofenceCircle(this.importantLocations.KANTOR_KEBUN.lat, this.importantLocations.KANTOR_KEBUN.lng, 0.3), // 300m radius
                type: "speed_limit",
                alert: "📏 Area kantor - Kecepatan maks 20 km/h"
            }
        ];
    }

    createGeofenceCircle(lat, lng, radiusKm) {
        const points = [];
        for (let i = 0; i < 360; i += 10) {
            const angle = i * Math.PI / 180;
            const pointLat = lat + (radiusKm / 111.32) * Math.cos(angle);
            const pointLng = lng + (radiusKm / (111.32 * Math.cos(lat * Math.PI / 180))) * Math.sin(angle);
            points.push([pointLat, pointLng]);
        }
        return points;
    }

    // NEW: Alert system untuk kondisi khusus
    checkAlerts(unit) {
        const alerts = [];
        
        // Speed alert
        if (unit.speed > this.vehicleConfig.maxSpeed) {
            alerts.push({
                type: 'speed',
                message: `🚨 ${unit.name} melebihi batas kecepatan: ${unit.speed} km/h`,
                priority: 'high'
            });
        }
        
        // Fuel alert
        if (unit.fuelLevel < 15) {
            alerts.push({
                type: 'fuel', 
                message: `⛽ ${unit.name} bahan bakar rendah: ${unit.fuelLevel}%`,
                priority: unit.fuelLevel < 5 ? 'critical' : 'medium'
            });
        }
        
        // Battery alert
        if (unit.batteryLevel && unit.batteryLevel < 20) {
            alerts.push({
                type: 'battery',
                message: `🔋 ${unit.name} baterai rendah: ${unit.batteryLevel}%`,
                priority: 'medium'
            });
        }
        
        return alerts;
    }

    // ENHANCED: Better notification system dengan alerts
    showNotification(message, type = 'info', duration = 5000) {
        console.log(`[NOTIFICATION ${type}] ${message}`);
        
        // Remove existing notifications dengan type yang sama
        const existingNotifications = document.querySelectorAll('.custom-notification');
        existingNotifications.forEach(notification => {
            if (notification.textContent.includes(message.substring(0, 50))) {
                notification.remove();
            }
        });
        
        const notification = document.createElement('div');
        notification.className = `custom-notification alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px; 
            right: 20px; 
            z-index: 9999; 
            min-width: 300px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'danger' ? '🚨' : 'ℹ️';
        notification.innerHTML = `
            <div class="d-flex align-items-center">
                <span class="me-2">${icon}</span>
                <span class="flex-grow-1">${message}</span>
                <button type="button" class="btn-close btn-close-sm" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }

    // ENHANCED: Better initialization dengan comprehensive error handling
    init() {
        try {
            this.showLoading(true, 'Menginisialisasi sistem...');
            
            // Sequential initialization
            setTimeout(() => {
                this.initializeMap();
                this.setupEventListeners();
                this.initializeFirebaseListener();
                this.initializeHistoryStorage();
                this.setupGeofences(); // NEW: Geofencing setup
                this.loadUnitData();
                this.startAutoRefresh();
                
                this.showLoading(false);
                this.showNotification('Sistem monitoring GPS aktif 🚀', 'success');
                
            }, 100);
            
        } catch (error) {
            console.error('Error initializing GPS system:', error);
            this.showLoading(false);
            this.showError('Gagal menginisialisasi sistem GPS: ' + error.message);
        }
    }

    // ENHANCED: Comprehensive cleanup untuk memory leak prevention
    destroy() {
        console.log('🧹 Cleaning up GPS system...');
        
        // Cleanup Firebase
        if (this.firebaseListener) {
            database.ref('/units').off('value', this.firebaseListener);
            this.firebaseListener = null;
        }
        
        // Cleanup intervals
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
        
        // Cleanup batch timeout
        if (this.batchTimeout) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }
        
        // Cleanup map layers
        Object.values(this.markers).forEach(marker => {
            if (marker && this.map) {
                this.map.removeLayer(marker);
            }
        });
        
        Object.values(this.unitPolylines).forEach(polyline => {
            if (polyline && this.map) {
                this.map.removeLayer(polyline);
            }
        });
        
        this.importantMarkers.forEach(marker => {
            if (marker && this.map) {
                this.map.removeLayer(marker);
            }
        });
        
        // Cleanup event listeners
        this.cleanupEventListeners();
        
        // Cleanup map
        if (this.map) {
            this.map.remove();
            this.map = null;
        }
        
        console.log('✅ GPS system cleaned up successfully');
    }

    // ==== EXISTING FUNCTIONS dengan minor enhancements ====

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

    initializeFirebaseListener() {
        try {
            this.firebaseListener = database.ref('/units').on('value', (snapshot) => {
                this.handleRealTimeUpdate(snapshot.val());
            }, (error) => {
                console.error('Firebase listener error:', error);
                this.showError('Koneksi real-time terputus', 'warning');
                // Attempt reconnection
                setTimeout(() => this.initializeFirebaseListener(), 5000);
            });
            
            console.log('✅ Firebase real-time listener aktif');
        } catch (error) {
            console.error('Error initializing Firebase listener:', error);
            this.showError('Gagal menghubungkan ke Firebase');
        }
    }

    createUnitFromFirebase(unitName, firebaseData) {
        if (!this.validateFirebaseData(firebaseData)) {
            console.warn('Creating unit with invalid data:', unitName);
        }

        return {
            id: this.generateUnitId(unitName),
            name: unitName,
            afdeling: this.getAfdelingFromUnit(unitName),
            status: this.getStatusFromJourneyStatus(firebaseData.journeyStatus),
            latitude: firebaseData.lat,
            longitude: firebaseData.lng,
            speed: firebaseData.speed || 0,
            lastUpdate: firebaseData.lastUpdate || new Date().toLocaleTimeString('id-ID'),
            distance: firebaseData.distance || 0,
            fuelLevel: this.calculateFuelLevel(firebaseData.distance || 0),
            fuelUsed: firebaseData.distance ? firebaseData.distance / this.vehicleConfig.fuelEfficiency : 0,
            driver: firebaseData.driver || 'Unknown',
            accuracy: firebaseData.accuracy || 0,
            batteryLevel: firebaseData.batteryLevel || null,
            lastLat: firebaseData.lat,
            lastLng: firebaseData.lng,
            alerts: [] // NEW: Untuk menyimpan alerts
        };
    }

    updateUnitHistory(unit) {
        if (!this.unitHistory[unit.name]) {
            this.unitHistory[unit.name] = [];
        }

        const lastPoint = this.unitHistory[unit.name][this.unitHistory[unit.name].length - 1];
        if (lastPoint) {
            const distance = this.calculateDistance(
                lastPoint.latitude, lastPoint.longitude,
                unit.latitude, unit.longitude
            );
            if (distance < this.CONSTANTS.MIN_MOVEMENT_DISTANCE && this.unitHistory[unit.name].length > 0) {
                return; // Skip small movements
            }
        }

        this.unitHistory[unit.name].push({
            timestamp: new Date().toISOString(),
            latitude: unit.latitude,
            longitude: unit.longitude,
            speed: unit.speed,
            distance: unit.distance,
            status: unit.status
        });

        // Keep only last points untuk prevent memory issues
        if (this.unitHistory[unit.name].length > this.CONSTANTS.MAX_HISTORY_POINTS) {
            this.unitHistory[unit.name].shift();
        }

        // Update route polyline
        this.updateUnitRoute(unit);
        this.saveHistoryToStorage();
    }

    // ENHANCED: Better loading states
    showLoading(show, message = 'Memuat data...') {
        const spinner = document.getElementById('loadingSpinner');
        const messageEl = document.getElementById('loadingMessage');
        
        if (spinner) {
            spinner.style.display = show ? 'block' : 'none';
        }
        if (messageEl) {
            messageEl.textContent = message;
        }
    }

    // ENHANCED: Better statistics dengan alerts check
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

        // Check alerts untuk semua units
        this.units.forEach(unit => {
            unit.alerts = this.checkAlerts(unit);
            unit.alerts.forEach(alert => {
                if (alert.priority === 'critical' || alert.priority === 'high') {
                    this.showNotification(alert.message, 'danger', 10000);
                }
            });
        });

        // Update UI elements
        const elements = {
            'activeUnits': `${activeUnits}/23`,
            'totalDistance': `${totalDistance.toFixed(1)} km`,
            'avgSpeed': `${avgSpeed.toFixed(1)} km/h`,
            'totalFuel': `${totalFuel.toFixed(1)} L`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }

    // ... (methods lainnya seperti initializeMap, addImportantLocations, dll tetap sama)
    // Tetap pertahankan semua method yang existing...

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

        } catch (error) {
            console.error('Error initializing map:', error);
            throw new Error('Gagal menginisialisasi peta');
        }
    }

    // ... (semua method lainnya yang tidak disebutkan di atas tetap sama)

}

// Initialize system dengan error handling
let gpsSystem;

document.addEventListener('DOMContentLoaded', function() {
    try {
        gpsSystem = new SAGMGpsTracking();
        window.gpsSystem = gpsSystem; // Expose ke global scope
    } catch (error) {
        console.error('Failed to initialize GPS System:', error);
        alert('Gagal memuat sistem monitoring GPS. Silakan refresh halaman.');
    }
});

// Enhanced global functions
function refreshData() {
    if (gpsSystem) {
        gpsSystem.showLoading(true, 'Memuat ulang data...');
        gpsSystem.loadUnitData();
    }
}

function exportData() {
    if (gpsSystem) {
        // Basic export functionality
        const exportData = {
            units: gpsSystem.units,
            statistics: {
                activeUnits: gpsSystem.activeUnits,
                totalDistance: gpsSystem.totalDistance,
                avgSpeed: gpsSystem.avgSpeed,
                totalFuel: gpsSystem.totalFuelConsumption
            },
            exportTime: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sagm-gps-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        gpsSystem.showNotification('Data berhasil diexport!', 'success');
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('show');
    }
}

// Route control functions
function toggleRoutes() {
    if (gpsSystem) {
        gpsSystem.toggleRoutes();
    }
}

function clearRoutes() {
    if (gpsSystem && confirm('Yakin ingin menghapus semua rute?')) {
        gpsSystem.clearAllRoutes();
    }
}

// Enhanced cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (gpsSystem) {
        gpsSystem.destroy();
    }
});

// Error boundary untuk unhandled errors
window.addEventListener('error', function(e) {
    console.error('Global error caught:', e.error);
    if (gpsSystem) {
        gpsSystem.showError('Terjadi kesalahan sistem. Silakan refresh halaman.');
    }
});
