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
        
        // NEW: Route visualization
        this.unitPolylines = {}; // Store polylines for each unit
        this.showRoutes = true; // Toggle untuk menampilkan rute
        this.routeColors = {}; // Color untuk setiap unit
        this.routeControls = null; // Controls untuk rute
        
        this.vehicleConfig = {
            fuelEfficiency: 4, // 4 km per liter
            maxSpeed: 80,
            idleFuelConsumption: 1.5, // liter per jam saat idle
            fuelTankCapacity: 100, // liter
            initialFuel: 80 // ✅ FIXED: Tambah initial fuel untuk perhitungan akurat
        };

        // Koordinat penting - TETAP SAMA
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

        // ✅ FIXED: Constants untuk maintainability
        this.constants = {
            MIN_MOVEMENT_DISTANCE: 0.01, // 10 meters
            MAX_VALID_MOVEMENT: 2.0, // 2 km (filter GPS spikes)
            MAX_HISTORY_POINTS: 500,
            STORAGE_QUOTA: 5 * 1024 * 1024 // 5MB
        };

        this.init();
    }

    // ✅ FIXED: Enhanced fuel calculation yang akurat
    calculateFuelLevel(distance) {
        const fuelUsed = distance / this.vehicleConfig.fuelEfficiency;
        const remainingFuel = this.vehicleConfig.initialFuel - fuelUsed;
        const fuelPercentage = (remainingFuel / this.vehicleConfig.fuelTankCapacity) * 100;
        return Math.max(0, Math.min(100, fuelPercentage));
    }

    // ✅ FIXED: Data validation untuk GPS real
    validateGPSData(unitData, unitName) {
        if (!unitData || !unitData.lat || !unitData.lng) {
            console.warn(`[${unitName}] Data GPS tidak lengkap`);
            return false;
        }

        // Validasi koordinat realistic
        if (Math.abs(unitData.lat) > 90 || Math.abs(unitData.lng) > 180) {
            console.warn(`[${unitName}] Koordinat tidak valid`);
            return false;
        }

        // Validasi kecepatan realistic
        if (unitData.speed > 120) { // Maks 120 km/h
            console.warn(`[${unitName}] Kecepatan tidak realistis: ${unitData.speed}km/h`);
            return false;
        }

        return true;
    }

    // ✅ FIXED: Update unit dengan logika yang benar
    updateUnitFromFirebase(unit, firebaseData) {
        // Validasi data GPS
        if (!this.validateGPSData(firebaseData, unit.name)) {
            return;
        }

        if (unit.lastLat && unit.lastLng && firebaseData.lat && firebaseData.lng) {
            const distance = this.calculateDistance(
                unit.lastLat, unit.lastLng, 
                firebaseData.lat, firebaseData.lng
            );
            
            // ✅ FIXED: Logika yang benar - hanya tambah jika pergerakan significant
            if (distance > this.constants.MIN_MOVEMENT_DISTANCE && 
                distance < this.constants.MAX_VALID_MOVEMENT) {
                unit.distance += distance;
                unit.fuelUsed = unit.distance / this.vehicleConfig.fuelEfficiency;
            }
        }

        unit.latitude = firebaseData.lat || unit.latitude;
        unit.longitude = firebaseData.lng || unit.longitude;
        unit.speed = firebaseData.speed || unit.speed;
        unit.status = this.getStatusFromJourneyStatus(firebaseData.journeyStatus) || unit.status;
        unit.lastUpdate = firebaseData.lastUpdate || new Date().toLocaleTimeString('id-ID');
        unit.driver = firebaseData.driver || unit.driver;
        unit.accuracy = firebaseData.accuracy || unit.accuracy;
        unit.batteryLevel = firebaseData.batteryLevel || unit.batteryLevel;
        
        // ✅ FIXED: Gunakan calculation yang sudah diperbaiki
        unit.fuelLevel = this.calculateFuelLevel(unit.distance);
        
        unit.lastLat = firebaseData.lat;
        unit.lastLng = firebaseData.lng;

        // Update history untuk route tracking
        this.updateUnitHistory(unit);
    }

    // ✅ FIXED: Enhanced history storage dengan quota management
    saveHistoryToStorage() {
        try {
            const dataStr = JSON.stringify(this.unitHistory);
            
            // Check storage quota
            if (dataStr.length > this.constants.STORAGE_QUOTA) {
                console.warn('Storage quota exceeded, cleaning up...');
                this.cleanupOldHistoryData();
            }
            
            localStorage.setItem('sagm_unit_history', dataStr);
        } catch (error) {
            console.error('Error saving history:', error);
            if (error.name === 'QuotaExceededError') {
                this.cleanupOldHistoryData();
            }
        }
    }

    // ✅ FIXED: Cleanup old history data
    cleanupOldHistoryData() {
        Object.keys(this.unitHistory).forEach(unitName => {
            if (this.unitHistory[unitName].length > this.constants.MAX_HISTORY_POINTS) {
                this.unitHistory[unitName] = this.unitHistory[unitName].slice(-this.constants.MAX_HISTORY_POINTS);
            }
        });
        this.saveHistoryToStorage();
    }

    // ✅ FIXED: Enhanced event listeners dengan debouncing
    setupEventListeners() {
        const searchInput = document.getElementById('searchUnit');
        if (searchInput) {
            // ✅ FIXED: Debounced search untuk performance
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.filterUnits();
                }, 300);
            });
        }

        const filters = ['filterAfdeling', 'filterStatus', 'filterFuel'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', () => this.filterUnits());
            }
        });

        database.ref('.info/connected').on('value', (snapshot) => {
            this.updateFirebaseStatus(snapshot.val());
        });
    }

    // ✅ FIXED: Comprehensive cleanup untuk memory leak prevention
    destroy() {
        // Cleanup Firebase
        if (this.firebaseListener) {
            database.ref('/units').off('value', this.firebaseListener);
        }
        
        // Cleanup intervals
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
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
    }

    // ✅ FIXED: Enhanced notification system
    showNotification(message, type = 'info') {
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

    // ✅ FIXED: Enhanced error handling
    showError(message) {
        console.error(`[ERROR] ${message}`);
        this.showNotification(message, 'danger');
    }

    // ✅ FIXED: Better loading states
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

    // ===== TANPA PERUBAHAN (tetap sama seperti original) =====
    
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
        } catch (error) {
            console.error('Error initializing GPS system:', error);
            this.showError('Gagal menginisialisasi sistem GPS');
        }
    }

    initializeFirebaseListener() {
        try {
            this.firebaseListener = database.ref('/units').on('value', (snapshot) => {
                this.handleRealTimeUpdate(snapshot.val());
            }, (error) => {
                console.error('Firebase listener error:', error);
                this.showError('Koneksi real-time terputus');
            });
            
            console.log('✅ Firebase real-time listener aktif');
        } catch (error) {
            console.error('Error initializing Firebase listener:', error);
        }
    }

    handleRealTimeUpdate(firebaseData) {
        if (!firebaseData) {
            console.log('📭 Tidak ada data real-time dari Firebase');
            this.units = [];
            this.updateStatistics();
            this.renderUnitList();
            this.updateMapMarkers();
            return;
        }

        console.log('🔄 Update real-time dari Firebase:', Object.keys(firebaseData).length + ' units');
        
        let updatedCount = 0;
        
        Object.entries(firebaseData).forEach(([unitName, unitData]) => {
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

        if (updatedCount > 0) {
            this.updateStatistics();
            this.renderUnitList();
            this.updateMapMarkers();
            this.addLog(`Data real-time diperbarui: ${updatedCount} unit`, 'success');
        }
    }

    createUnitFromFirebase(unitName, firebaseData) {
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
            fuelLevel: this.calculateFuelLevel(firebaseData.distance || 0), // ✅ FIXED: Gunakan calculation baru
            fuelUsed: firebaseData.distance ? firebaseData.distance / this.vehicleConfig.fuelEfficiency : 0,
            driver: firebaseData.driver || 'Unknown',
            accuracy: firebaseData.accuracy || 0,
            batteryLevel: firebaseData.batteryLevel || null,
            lastLat: firebaseData.lat,
            lastLng: firebaseData.lng
        };
    }

    // ... semua method lainnya TETAP SAMA seperti original ...
    // initializeMap, addImportantLocations, createLocationPopup, calculateDistance,
    // startAutoRefresh, loadUnitData, fetchUnitData, getAfdelingFromUnit, 
    // getStatusFromJourneyStatus, createUnitPopup, addLog, updateStatistics,
    // renderUnitList, updateMapMarkers, filterUnits, dll...

    // ✅ LOW PRIORITY: Simple alert system
    checkUnitAlerts(unit) {
        const alerts = [];
        
        if (unit.speed > this.vehicleConfig.maxSpeed) {
            alerts.push(`🚨 ${unit.name} melebihi batas kecepatan`);
        }
        
        if (unit.fuelLevel < 15) {
            alerts.push(`⛽ ${unit.name} bahan bakar rendah`);
        }
        
        if (unit.batteryLevel && unit.batteryLevel < 20) {
            alerts.push(`🔋 ${unit.name} baterai rendah`);
        }
        
        return alerts;
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

        // ✅ LOW PRIORITY: Check alerts
        this.units.forEach(unit => {
            const alerts = this.checkUnitAlerts(unit);
            if (alerts.length > 0) {
                alerts.forEach(alert => console.warn(alert));
            }
        });

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
}

// Initialize system
let gpsSystem;

document.addEventListener('DOMContentLoaded', function() {
    gpsSystem = new SAGMGpsTracking();
});

// Global functions - TETAP SAMA
function refreshData() {
    if (gpsSystem) {
        gpsSystem.loadUnitData();
    }
}

function exportData() {
    if (gpsSystem) {
        console.log('Exporting data...');
        gpsSystem.showNotification('Fitur export akan datang!', 'info');
    }
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('show');
}

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
