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

class EnhancedGPSLogger {
    constructor() {
        this.driverData = null;
        this.watchId = null;
        this.isTracking = false;
        this.sendInterval = null;
        this.sessionStartTime = null;
        this.totalDistance = 0;
        this.lastPosition = null;
        this.dataPoints = 0;
        this.isOnline = false;
        this.journeyStatus = 'ready';
        this.firebaseRef = null;
        
        // Enhanced distance calculation
        this.lastUpdateTime = null;
        this.currentSpeed = 0;
        this.movingStartTime = null;
        this.isCurrentlyMoving = false;
        
        // Complete history tracking
        this.offlineHistory = [];
        this.maxOfflinePoints = 2000;
        this.isCollectingOfflineData = false;
        this.completeHistory = this.loadCompleteHistory();
        
        // Enhanced waypoint management
        this.waypoints = [];
        this.maxWaypoints = 3600 * 17; // 3600 seconds × 17 hours
        this.waypointInterval = null;
        this.lastWaypointTime = null;
        
        // ✅ ENHANCED CHAT SYSTEM PROPERTIES - WHATSAPP STYLE
        this.chatRef = null;
        this.typingRef = null;
        this.chatMessages = [];
        this.unreadCount = 0;
        this.isChatOpen = false;
        this.chatInitialized = false;
        this.lastMessageId = null;
        this.isTyping = false;
        this.typingTimeout = null;
        this.chatInputHandler = null;
        
        // Enhanced data logger
        this.dataLogger = new EnhancedDataLogger();
        
        this.offlineQueue = new OfflineQueueManager();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTime();
        this.checkNetworkStatus();
        setInterval(() => this.updateTime(), 1000);
        setInterval(() => this.checkNetworkStatus(), 5000);
        
        // Load existing waypoints
        this.loadWaypoints();
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    async handleLogin() {
        const driverName = document.getElementById('driverName').value;
        const unitNumber = document.getElementById('unitNumber').value;

        if (driverName && unitNumber) {
            this.driverData = {
                name: driverName,
                unit: unitNumber,
                year: this.getVehicleYear(unitNumber),
                sessionId: this.generateSessionId(),
                loginTime: new Date().toISOString()
            };

            this.firebaseRef = database.ref('/units/' + unitNumber);
            
            // Enhanced data format
            const cleanData = {
                driver: driverName,
                unit: unitNumber,
                sessionId: this.driverData.sessionId,
                journeyStatus: 'ready',
                lastUpdate: new Date().toLocaleTimeString('id-ID'),
                lat: 0,
                lng: 0,
                speed: 0,
                distance: 0,
                fuel: 100,
                accuracy: 0,
                timestamp: new Date().toISOString(),
                isOnline: true,
                loginTime: this.driverData.loginTime
            };

            try {
                await this.firebaseRef.set(cleanData);
                this.showDriverApp();
                this.startGPSTracking();
                this.startDataTransmission();
                this.startWaypointCollection();
                
                setTimeout(() => {
                    this.startJourney();
                }, 3000);
            } catch (error) {
                console.error('Login failed:', error);
                alert('Gagal login. Periksa koneksi internet.');
            }
        } else {
            alert('Harap isi semua field!');
        }
    }

    getVehicleYear(unit) {
        const yearMap = {
            'DT-06': '2018', 'DT-07': '2018',
            'DT-12': '2020', 'DT-13': '2020', 'DT-15': '2020', 'DT-16': '2020', 
            'DT-17': '2020', 'DT-18': '2020', 'DT-36': '2020', 'DT-37': '2020',
            'DT-38': '2020', 'DT-39': '2020',
            'DT-23': '2021', 'DT-24': '2021',
            'DT-25': '2022', 'DT-26': '2022', 'DT-27': '2022', 'DT-28': '2022', 'DT-29': '2022',
            'DT-32': '2024',
            'DT-33': '2025', 'DT-34': '2025', 'DT-35': '2025'
        };
        return yearMap[unit] || 'Unknown';
    }

    generateSessionId() {
        return 'SESS_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    showDriverApp() {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('driverApp').style.display = 'block';
        
        document.getElementById('vehicleName').textContent = this.driverData.unit;
        document.getElementById('driverDisplayName').textContent = this.driverData.name;
        
        this.sessionStartTime = new Date();
        this.lastUpdateTime = new Date();
        this.lastWaypointTime = new Date();
        this.updateSessionDuration();
        
        // ✅ SETUP ENHANCED CHAT SYSTEM
        this.setupChatSystem();
        this.dataLogger.startLogging();
        
        this.addLog('Sistem enhanced GPS logger diaktifkan', 'success');
    }

    // Enhanced Waypoint Management
    startWaypointCollection() {
        this.waypointInterval = setInterval(() => {
            if (this.lastPosition && this.journeyStatus === 'started') {
                this.collectWaypoint();
            }
        }, 1000); // Collect every second
    }

    collectWaypoint() {
        const now = new Date();
        const waypoint = {
            lat: this.lastPosition.lat,
            lng: this.lastPosition.lng,
            speed: this.lastPosition.speed,
            accuracy: this.lastPosition.accuracy,
            bearing: this.lastPosition.bearing,
            timestamp: now.toISOString(),
            sessionId: this.driverData.sessionId,
            unit: this.driverData.unit,
            driver: this.driverData.name,
            distance: this.totalDistance
        };

        this.waypoints.push(waypoint);
        
        // Maintain size limit
        if (this.waypoints.length > this.maxWaypoints) {
            this.waypoints.shift(); // Remove oldest waypoint
        }

        this.lastWaypointTime = now;
        this.saveWaypoints();
        
        // Log waypoint collection periodically
        if (this.waypoints.length % 60 === 0) { // Every minute
            this.addLog(`📍 Waypoint collected: ${this.waypoints.length} points`, 'info');
        }
    }

    saveWaypoints() {
        try {
            const waypointData = {
                waypoints: this.waypoints,
                metadata: {
                    totalPoints: this.waypoints.length,
                    lastUpdate: new Date().toISOString(),
                    sessionId: this.driverData.sessionId,
                    maxWaypoints: this.maxWaypoints
                }
            };
            localStorage.setItem('gps_waypoints_' + this.driverData.unit, JSON.stringify(waypointData));
        } catch (error) {
            console.error('Error saving waypoints:', error);
        }
    }

    loadWaypoints() {
        try {
            const saved = localStorage.getItem('gps_waypoints_' + (this.driverData?.unit || 'default'));
            if (saved) {
                const data = JSON.parse(saved);
                this.waypoints = data.waypoints || [];
                console.log(`📂 Loaded ${this.waypoints.length} waypoints`);
            }
        } catch (error) {
            console.error('Error loading waypoints:', error);
            this.waypoints = [];
        }
    }

    exportWaypointData() {
        if (this.waypoints.length === 0) {
            alert('Tidak ada waypoint data untuk diexport');
            return;
        }

        const exportData = {
            exportedAt: new Date().toISOString(),
            sessionId: this.driverData.sessionId,
            unit: this.driverData.unit,
            driver: this.driverData.name,
            totalWaypoints: this.waypoints.length,
            totalDistance: this.totalDistance,
            waypoints: this.waypoints
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `waypoints-${this.driverData.unit}-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        this.addLog(`📤 Waypoint data exported: ${this.waypoints.length} points`, 'success');
    }

    // ✅ ENHANCED CHAT SYSTEM - WHATSAPP STYLE
    setupChatSystem() {
        if (!this.driverData) return;
        
        console.log('💬 Setting up enhanced WhatsApp-style chat system for unit:', this.driverData.unit);
        
        this.chatRef = database.ref('/chat/' + this.driverData.unit);
        this.typingRef = database.ref('/typing/' + this.driverData.unit);
        
        // Clear previous listeners
        this.chatRef.off();
        this.typingRef.off();
        
        // Listen for new messages
        this.chatRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            if (message && message.id !== this.lastMessageId) {
                this.handleNewMessage(message);
            }
        });
        
        // Listen for typing indicators
        this.typingRef.on('value', (snapshot) => {
            const typingData = snapshot.val();
            this.handleTypingIndicator(typingData);
        });
        
        this.chatInitialized = true;
        this.setupChatInputHandlers();
        console.log('💬 Enhanced WhatsApp-style chat system activated');
        this.addLog('Sistem chat WhatsApp-style enhanced aktif', 'success');
    }

    // ✅ HANDLE NEW MESSAGE
    handleNewMessage(message) {
        if (!message || message.sender === this.driverData.name || message.type === 'driver') return;
        
        // Prevent duplicates
        const messageExists = this.chatMessages.some(msg => 
            msg.id === message.id || 
            (msg.timestamp === message.timestamp && msg.sender === message.sender)
        );
        
        if (messageExists) return;
        
        this.chatMessages.push(message);
        
        // Update unread count if chat is closed
        if (!this.isChatOpen) {
            this.unreadCount++;
        }
        
        this.updateChatUI();
        
        // Show notification if chat is closed
        if (!this.isChatOpen) {
            this.showChatNotification(message);
        }
        
        // Play notification sound
        this.playNotificationSound();
        
        // Log chat activity
        this.dataLogger.logChatActivity('message_received', {
            from: message.sender,
            message: message.text,
            timestamp: message.timestamp
        });
        
        console.log('💬 New message received:', message);
    }

    // ✅ SEND MESSAGE
    async sendMessage(messageText) {
        if (!messageText.trim() || !this.chatRef || !this.driverData) return;
        
        const messageId = 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const messageData = {
            id: messageId,
            text: messageText.trim(),
            sender: this.driverData.name,
            unit: this.driverData.unit,
            timestamp: new Date().toISOString(),
            timeDisplay: new Date().toLocaleTimeString('id-ID', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            type: 'driver',
            status: 'sent'
        };
        
        try {
            await this.chatRef.push(messageData);
            this.lastMessageId = messageId;
            
            // Add to local messages for instant feedback
            this.chatMessages.push(messageData);
            this.updateChatUI();
            
            this.addLog(`💬 Pesan terkirim: "${messageText}"`, 'info');
            
            // Log chat activity
            this.dataLogger.logChatActivity('message_sent', {
                to: 'monitor',
                message: messageText,
                timestamp: messageData.timestamp
            });
            
            // Clear typing indicator
            this.stopTyping();
            
        } catch (error) {
            console.error('Failed to send message:', error);
            this.addLog('❌ Gagal mengirim pesan', 'error');
            
            // Mark message as failed
            messageData.status = 'failed';
            this.chatMessages.push(messageData);
            this.updateChatUI();
        }
    }

    // ✅ TYPING INDICATOR METHODS
    startTyping() {
        if (!this.driverData || this.isTyping) return;
        
        this.typingRef.child('driver').set({
            isTyping: true,
            name: this.driverData.name,
            timestamp: Date.now()
        });
        
        this.isTyping = true;
    }

    stopTyping() {
        if (!this.driverData || !this.isTyping) return;
        
        this.typingRef.child('driver').set({
            isTyping: false,
            name: this.driverData.name,
            timestamp: Date.now()
        });
        
        this.isTyping = false;
    }

    handleTypingIndicator(typingData) {
        if (!typingData) return;
        
        const monitorTyping = typingData.monitor;
        const typingIndicator = document.getElementById('typingIndicator');
        
        if (typingIndicator && monitorTyping && monitorTyping.isTyping) {
            typingIndicator.style.display = 'block';
            typingIndicator.innerHTML = `
                <div class="typing-indicator">
                    <span>Monitor sedang mengetik</span>
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

    // ✅ UPDATE CHAT UI - WHATSAPP STYLE
    updateChatUI() {
        const messageList = document.getElementById('chatMessages');
        const unreadBadge = document.getElementById('unreadBadge');
        const chatToggle = document.getElementById('chatToggle');
        
        if (!messageList) return;
        
        // Update unread badge
        if (unreadBadge) {
            unreadBadge.textContent = this.unreadCount > 0 ? this.unreadCount : '';
            unreadBadge.style.display = this.unreadCount > 0 ? 'inline' : 'none';
        }
        
        // Update chat toggle button
        if (chatToggle) {
            chatToggle.innerHTML = this.unreadCount > 0 ? 
                `💬 Chat <span class="badge bg-danger">${this.unreadCount}</span>` : 
                '💬 Chat';
        }
        
        // Render messages
        messageList.innerHTML = '';
        
        if (this.chatMessages.length === 0) {
            messageList.innerHTML = `
                <div class="chat-placeholder text-center text-muted py-4">
                    <small>Mulai percakapan dengan monitor...</small>
                </div>
            `;
            return;
        }
        
        // Group messages by date
        const groupedMessages = this.groupMessagesByDate(this.chatMessages);
        
        Object.keys(groupedMessages).forEach(date => {
            // Add date separator
            if (Object.keys(groupedMessages).length > 1) {
                const dateElement = document.createElement('div');
                dateElement.className = 'chat-date-separator';
                dateElement.innerHTML = `<span>${date}</span>`;
                messageList.appendChild(dateElement);
            }
            
            // Add messages for this date
            groupedMessages[date].forEach(message => {
                const messageElement = this.createMessageElement(message);
                messageList.appendChild(messageElement);
            });
        });
        
        // Add typing indicator
        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'typingIndicator';
        typingIndicator.style.display = 'none';
        messageList.appendChild(typingIndicator);
        
        // Auto scroll to bottom with smooth behavior
        setTimeout(() => {
            messageList.scrollTo({
                top: messageList.scrollHeight,
                behavior: 'smooth'
            });
        }, 100);
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
        
        // Sort messages within each date
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        });
        
        return grouped;
    }

    createMessageElement(message) {
        const messageElement = document.createElement('div');
        const isSentMessage = message.sender === this.driverData.name;
        
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

    // ✅ CHAT INPUT HANDLERS
    setupChatInputHandlers() {
        const chatInput = document.getElementById('chatInput');
        if (!chatInput) return;
        
        let typingTimer;
        
        // Store the handler for cleanup
        this.chatInputHandler = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.sendMessage(chatInput.value);
                chatInput.value = '';
                this.stopTyping();
            } else {
                // Start typing indicator on input
                this.startTyping();
                
                // Clear previous timer
                clearTimeout(typingTimer);
                
                // Set timer to stop typing indicator after 2 seconds of inactivity
                typingTimer = setTimeout(() => {
                    this.stopTyping();
                }, 2000);
            }
        };
        
        chatInput.addEventListener('keypress', this.chatInputHandler);
        chatInput.addEventListener('blur', () => this.stopTyping());
    }

    // ✅ TOGGLE CHAT WINDOW
    toggleChat() {
        this.isChatOpen = !this.isChatOpen;
        const chatWindow = document.getElementById('chatWindow');
        const chatToggle = document.getElementById('chatToggle');
        
        if (chatWindow) {
            if (this.isChatOpen) {
                chatWindow.style.display = 'block';
                this.unreadCount = 0;
                this.updateChatUI();
                
                // Focus input field with smooth transition
                setTimeout(() => {
                    const chatInput = document.getElementById('chatInput');
                    if (chatInput) chatInput.focus();
                }, 300);
                
                // Update toggle button
                if (chatToggle) {
                    chatToggle.innerHTML = '💬 Tutup Chat';
                }
            } else {
                chatWindow.style.display = 'none';
                this.stopTyping();
                
                // Update toggle button
                if (chatToggle) {
                    chatToggle.innerHTML = '💬 Chat';
                }
            }
        }
    }

    // ✅ NOTIFICATION SYSTEM
    showChatNotification(message) {
        if (!message || !message.sender) return;
        
        const notification = document.createElement('div');
        notification.className = 'alert alert-info chat-notification';
        notification.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>💬 Pesan Baru dari ${this.escapeHtml(message.sender)}</strong>
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
            // Create a simple notification sound using Web Audio API
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

    // GPS TRACKING METHODS
    startGPSTracking() {
        if (!navigator.geolocation) {
            this.addLog('GPS tidak didukung di browser ini', 'error');
            return;
        }

        this.isTracking = true;
        
        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        this.watchId = navigator.geolocation.watchPosition(
            (position) => this.handlePositionUpdate(position),
            (error) => this.handleGPSError(error),
            options
        );

        this.addLog('GPS tracking aktif - real-time ke Firebase', 'success');
        this.dataLogger.logSystemActivity('gps_tracking_started');
    }

    startDataTransmission() {
        this.sendInterval = setInterval(() => {
            if (this.lastPosition) {
                this.sendToFirebase();
            }
        }, 2000);
    }

    // Save all points to localStorage with 2000 points capacity
    saveToCompleteHistory(positionData) {
        if (!this.driverData) return;
        
        const historyPoint = {
            ...positionData,
            sessionId: this.driverData.sessionId,
            unit: this.driverData.unit,
            driver: this.driverData.name,
            saveTimestamp: new Date().toISOString()
        };
        
        let history = this.loadCompleteHistory();
        history.push(historyPoint);
        
        // Maintain size limit - increased to 2000 points
        if (history.length > this.maxOfflinePoints) {
            history = history.slice(-this.maxOfflinePoints);
        }
        
        localStorage.setItem('gps_complete_history', JSON.stringify(history));
        this.completeHistory = history;
    }

    loadCompleteHistory() {
        try {
            const saved = localStorage.getItem('gps_complete_history');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            return [];
        }
    }

    handlePositionUpdate(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const speed = position.coords.speed !== null ? position.coords.speed * 3.6 : 0;
        const accuracy = position.coords.accuracy;
        const bearing = position.coords.heading;
        const timestamp = new Date();
        
        // Validate coordinates
        if (!this.isValidCoordinate(lat, lng)) {
            console.warn('Invalid GPS coordinates received:', { lat, lng });
            return;
        }

        // Save to complete history
        this.saveToCompleteHistory({
            lat: lat,
            lng: lng,
            speed: speed,
            accuracy: accuracy,
            bearing: bearing,
            timestamp: timestamp.toISOString(),
            isOnline: this.isOnline
        });

        // Update UI
        document.getElementById('currentLat').textContent = lat.toFixed(6);
        document.getElementById('currentLng').textContent = lng.toFixed(6);
        document.getElementById('currentSpeed').textContent = speed.toFixed(1);
        document.getElementById('gpsAccuracy').textContent = accuracy.toFixed(1) + ' m';
        document.getElementById('gpsBearing').textContent = bearing ? bearing.toFixed(0) + '°' : '-';

        // Calculate distance
        this.calculateDistanceWithSpeed(speed, timestamp);

        // Save latest position
        this.lastPosition = { 
            lat, 
            lng, 
            speed, 
            accuracy, 
            bearing, 
            timestamp,
            distance: this.totalDistance
        };

        this.dataPoints++;
        document.getElementById('dataPoints').textContent = this.dataPoints;
        this.updateAverageSpeed();

        // Log GPS data
        this.dataLogger.logGPSData({
            lat, lng, speed, accuracy, bearing,
            distance: this.totalDistance,
            timestamp: timestamp.toISOString()
        });
    }

    isValidCoordinate(lat, lng) {
        // Check for reasonable coordinates (Kebun Tempuling area)
        if (lat < -1 || lat > 1 || lng < 102.5 || lng > 103.5) {
            return false;
        }
        
        if (isNaN(lat) || isNaN(lng)) {
            return false;
        }
        
        return true;
    }

    calculateDistanceWithSpeed(currentSpeed, currentTime) {
        if (!this.lastUpdateTime) {
            this.lastUpdateTime = currentTime;
            return;
        }

        const timeDiff = (currentTime - this.lastUpdateTime) / 1000 / 3600;
        
        if (currentSpeed > 2 && this.journeyStatus === 'started') {
            const distanceIncrement = currentSpeed * timeDiff;
            
            if (distanceIncrement > 0 && distanceIncrement < 1) {
                this.totalDistance += distanceIncrement;
                document.getElementById('todayDistance').textContent = this.totalDistance.toFixed(3);
                
                this.addLog(`📏 +${(distanceIncrement * 1000).toFixed(1)}m (${currentSpeed.toFixed(1)} km/h)`, 'info');
            }
            
            this.isCurrentlyMoving = true;
            this.movingStartTime = this.movingStartTime || currentTime;
        } else {
            this.isCurrentlyMoving = false;
            this.movingStartTime = null;
        }

        this.lastUpdateTime = currentTime;
        this.currentSpeed = currentSpeed;
    }

    updateAverageSpeed() {
        if (this.dataPoints > 0 && this.sessionStartTime) {
            const duration = (new Date() - this.sessionStartTime) / 3600000;
            const avgSpeed = duration > 0 ? this.totalDistance / duration : 0;
            document.getElementById('avgSpeed').textContent = avgSpeed.toFixed(1);
        }
    }

    async sendToFirebase() {
        if (!this.firebaseRef || !this.lastPosition) return;

        try {
            const gpsData = {
                driver: this.driverData.name,
                unit: this.driverData.unit,
                lat: parseFloat(this.lastPosition.lat.toFixed(6)),
                lng: parseFloat(this.lastPosition.lng.toFixed(6)),
                speed: parseFloat(this.lastPosition.speed.toFixed(1)),
                accuracy: parseFloat(this.lastPosition.accuracy.toFixed(1)),
                bearing: this.lastPosition.bearing ? parseFloat(this.lastPosition.bearing.toFixed(0)) : null,
                timestamp: new Date().toISOString(),
                lastUpdate: new Date().toLocaleTimeString('id-ID'),
                distance: parseFloat(this.totalDistance.toFixed(3)),
                journeyStatus: this.journeyStatus,
                batteryLevel: this.getBatteryLevel(),
                sessionId: this.driverData.sessionId,
                isOfflineData: false,
                fuel: this.calculateFuelLevel(),
                waypointsCount: this.waypoints.length
            };

            if (!this.isValidCoordinate(gpsData.lat, gpsData.lng)) {
                console.warn('Invalid coordinates, skipping Firebase update');
                return;
            }

            if (this.isOnline) {
                await this.firebaseRef.set(gpsData);
                this.addLog(`📡 Data terkirim: ${this.lastPosition.speed.toFixed(1)} km/h | ${this.totalDistance.toFixed(3)} km`, 'success');
                this.updateConnectionStatus(true);
                
                if (this.offlineQueue.getQueueSize() > 0) {
                    this.offlineQueue.processQueue();
                }
            } else {
                this.offlineQueue.addToQueue(gpsData);
                this.addLog(`💾 Data disimpan offline (${this.offlineQueue.getQueueSize()} dalam antrian)`, 'warning');
                this.updateConnectionStatus(false);
            }
            
        } catch (error) {
            console.error('Error sending to Firebase:', error);
            this.addLog(`❌ Gagal kirim data ke Firebase`, 'error');
            this.updateConnectionStatus(false);
        }
    }

    calculateFuelLevel() {
        const baseFuel = 100;
        const fuelConsumptionRate = 0.25;
        const fuelUsed = this.totalDistance * fuelConsumptionRate;
        const remainingFuel = Math.max(0, baseFuel - fuelUsed);
        return Math.min(100, Math.max(0, Math.round(remainingFuel)));
    }

    getBatteryLevel() {
        return Math.max(20, Math.floor(Math.random() * 100));
    }

    checkNetworkStatus() {
        const wasOnline = this.isOnline;
        this.isOnline = navigator.onLine;
        
        if (wasOnline !== this.isOnline) {
            if (this.isOnline) {
                this.addLog('📱 Koneksi pulih - sync semua data', 'success');
                this.updateConnectionStatus(true);
                this.offlineQueue.processQueue();
                
                setTimeout(() => {
                    this.syncCompleteHistory();
                    this.syncWaypointsToFirebase();
                }, 3000);
                
            } else {
                this.addLog('📱 Koneksi terputus - menyimpan data lokal', 'warning');
                this.updateConnectionStatus(false);
            }
        }
        
        this.updateConnectionStatus(this.isOnline);
    }

    updateConnectionStatus(connected) {
        const dot = document.getElementById('connectionDot');
        const status = document.getElementById('connectionStatus');
        
        if (connected) {
            dot.className = 'connection-status connected';
            status.textContent = 'TERHUBUNG';
            status.className = 'text-success';
        } else {
            dot.className = 'connection-status disconnected';
            status.textContent = 'OFFLINE';
            status.className = 'text-danger';
            
            const queueSize = this.offlineQueue.getQueueSize();
            if (queueSize > 0) {
                status.textContent = `OFFLINE (${queueSize} data antrian)`;
            }
        }
    }

    handleGPSError(error) {
        let message = 'GPS Error: ';
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message += 'Izin GPS ditolak';
                break;
            case error.POSITION_UNAVAILABLE:
                message += 'Posisi tidak tersedia';
                break;
            case error.TIMEOUT:
                message += 'Timeout';
                break;
            default:
                message += 'Error tidak diketahui';
                break;
        }
        this.addLog(message, 'error');
        this.dataLogger.logSystemActivity('gps_error', { error: message });
    }

    addLog(message, type = 'info') {
        const logContainer = document.getElementById('dataLogs');
        const alertClass = {
            'info': 'alert-info',
            'success': 'alert-success', 
            'error': 'alert-danger',
            'warning': 'alert-warning'
        }[type] || 'alert-info';

        const logEntry = document.createElement('div');
        logEntry.className = `alert ${alertClass} py-2 mb-2`;
        logEntry.innerHTML = `
            <small>${new Date().toLocaleTimeString('id-ID')}: ${message}</small>
        `;
        
        logContainer.insertBefore(logEntry, logContainer.firstChild);
        
        if (logContainer.children.length > 6) {
            logContainer.removeChild(logContainer.lastChild);
        }
    }

    updateTime() {
        document.getElementById('currentTime').textContent = 
            new Date().toLocaleTimeString('id-ID');
    }

    updateSessionDuration() {
        if (!this.sessionStartTime) return;
        
        const now = new Date();
        const diff = now - this.sessionStartTime;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        document.getElementById('sessionDuration').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        setTimeout(() => this.updateSessionDuration(), 1000);
    }

    startJourney() {
        this.journeyStatus = 'started';
        this.lastUpdateTime = new Date();
        document.getElementById('vehicleStatus').textContent = 'ON TRIP';
        document.getElementById('vehicleStatus').className = 'bg-success text-white rounded px-2 py-1';
        this.addLog('Perjalanan dimulai - GPS tracking aktif', 'success');
        this.dataLogger.logSystemActivity('journey_started');
        
        this.sendToFirebase();
    }

    pauseJourney() {
        this.journeyStatus = 'paused';
        document.getElementById('vehicleStatus').textContent = 'PAUSED';
        document.getElementById('vehicleStatus').className = 'bg-warning text-dark rounded px-2 py-1';
        this.addLog('Perjalanan dijeda', 'warning');
        this.dataLogger.logSystemActivity('journey_paused');
        
        this.sendToFirebase();
    }

    endJourney() {
        this.journeyStatus = 'ended';
        document.getElementById('vehicleStatus').textContent = 'COMPLETED';
        document.getElementById('vehicleStatus').className = 'bg-info text-white rounded px-2 py-1';
        this.addLog(`Perjalanan selesai - Total jarak: ${this.totalDistance.toFixed(3)} km`, 'info');
        this.dataLogger.logSystemActivity('journey_ended', { totalDistance: this.totalDistance });
        
        this.sendToFirebase();
        this.syncCompleteHistory();
        this.syncWaypointsToFirebase();
    }

    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }
        if (this.sendInterval) {
            clearInterval(this.sendInterval);
        }
        if (this.waypointInterval) {
            clearInterval(this.waypointInterval);
        }
        if (this.firebaseRef) {
            this.firebaseRef.remove();
        }
        
        this.isTracking = false;
        this.dataLogger.stopLogging();
    }

    logout() {
        // Cleanup chat listeners
        if (this.chatRef) {
            this.chatRef.off();
        }
        if (this.typingRef) {
            this.typingRef.off();
        }
        if (this.chatInputHandler) {
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.removeEventListener('keypress', this.chatInputHandler);
            }
        }
        
        // Stop typing indicator
        this.stopTyping();
        
        this.stopTracking();
        this.syncCompleteHistory();
        this.syncWaypointsToFirebase();
        
        const sessionSummary = {
            driver: this.driverData.name,
            unit: this.driverData.unit,
            duration: document.getElementById('sessionDuration').textContent,
            totalDistance: this.totalDistance.toFixed(3),
            dataPoints: this.dataPoints,
            waypoints: this.waypoints.length,
            avgSpeed: document.getElementById('avgSpeed').textContent,
            sessionId: this.driverData.sessionId
        };
        
        console.log('Session Summary:', sessionSummary);
        this.addLog(`Session ended - Total: ${this.totalDistance.toFixed(3)} km, Waypoints: ${this.waypoints.length}`, 'info');
        this.dataLogger.logSystemActivity('session_ended', sessionSummary);
        
        this.driverData = null;
        this.firebaseRef = null;
        this.chatRef = null;
        this.typingRef = null;
        this.chatMessages = [];
        this.unreadCount = 0;
        this.isChatOpen = false;
        this.chatInitialized = false;
        
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('driverApp').style.display = 'none';
        document.getElementById('loginForm').reset();
        
        // Reset all data
        this.totalDistance = 0;
        this.dataPoints = 0;
        this.waypoints = [];
        this.lastPosition = null;
        this.lastUpdateTime = null;
    }

    // Sync all history to Firebase
    async syncCompleteHistory() {
        if (!this.isOnline || !this.firebaseRef || !this.driverData) {
            console.log('❌ Cannot sync history: offline or no driver data');
            return;
        }
        
        const history = this.loadCompleteHistory();
        const sessionHistory = history.filter(point => 
            point.sessionId === this.driverData.sessionId
        );
        
        if (sessionHistory.length === 0) {
            console.log('ℹ️ No history to sync');
            return;
        }
        
        try {
            const historyRef = database.ref('/history/' + this.driverData.unit + '/' + this.driverData.sessionId);
            
            const historyObject = {};
            sessionHistory.forEach((point, index) => {
                historyObject['point_' + index] = {
                    lat: point.lat,
                    lng: point.lng,
                    speed: point.speed,
                    accuracy: point.accuracy,
                    bearing: point.bearing,
                    timestamp: point.timestamp,
                    isOnline: point.isOnline,
                    driver: point.driver,
                    unit: point.unit
                };
            });
            
            await historyRef.set(historyObject);
            
            console.log(`✅ History synced: ${sessionHistory.length} points`);
            this.addLog(`📡 Sync complete: ${sessionHistory.length} data points`, 'success');
            
        } catch (error) {
            console.error('History sync failed:', error);
            this.addLog(`❌ Gagal sync history: ${error.message}`, 'error');
        }
    }

    // Sync waypoints to Firebase
    async syncWaypointsToFirebase() {
        if (!this.isOnline || !this.driverData || this.waypoints.length === 0) {
            return;
        }

        try {
            const waypointsRef = database.ref('/waypoints/' + this.driverData.unit + '/' + this.driverData.sessionId);
            
            const waypointData = {
                waypoints: this.waypoints,
                metadata: {
                    totalPoints: this.waypoints.length,
                    totalDistance: this.totalDistance,
                    sessionId: this.driverData.sessionId,
                    unit: this.driverData.unit,
                    driver: this.driverData.name,
                    syncTime: new Date().toISOString()
                }
            };
            
            await waypointsRef.set(waypointData);
            this.addLog(`📡 Waypoints synced: ${this.waypoints.length} points`, 'success');
            
        } catch (error) {
            console.error('Waypoint sync failed:', error);
            this.addLog(`❌ Gagal sync waypoints: ${error.message}`, 'error');
        }
    }
}

// Enhanced Data Logger Class
class EnhancedDataLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 1000;
        this.loggingInterval = null;
    }

    startLogging() {
        this.loggingInterval = setInterval(() => {
            this.cleanupOldLogs();
        }, 60000); // Cleanup every minute
    }

    stopLogging() {
        if (this.loggingInterval) {
            clearInterval(this.loggingInterval);
        }
    }

    logSystemActivity(type, data = {}) {
        const logEntry = {
            type: 'system',
            activity: type,
            timestamp: new Date().toISOString(),
            data: data
        };
        
        this.logs.push(logEntry);
        this.saveLogs();
    }

    logGPSData(gpsData) {
        const logEntry = {
            type: 'gps',
            timestamp: new Date().toISOString(),
            data: gpsData
        };
        
        this.logs.push(logEntry);
        
        // Save logs periodically to avoid performance issues
        if (this.logs.length % 10 === 0) {
            this.saveLogs();
        }
    }

    logChatActivity(activity, data = {}) {
        const logEntry = {
            type: 'chat',
            activity: activity,
            timestamp: new Date().toISOString(),
            data: data
        };
        
        this.logs.push(logEntry);
        this.saveLogs();
    }

    saveLogs() {
        try {
            // Maintain size limit
            if (this.logs.length > this.maxLogs) {
                this.logs = this.logs.slice(-this.maxLogs);
            }
            
            localStorage.setItem('enhanced_data_logs', JSON.stringify(this.logs));
        } catch (error) {
            console.error('Error saving enhanced logs:', error);
        }
    }

    cleanupOldLogs() {
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        this.logs = this.logs.filter(log => new Date(log.timestamp) > twentyFourHoursAgo);
        this.saveLogs();
    }

    exportLogs() {
        const exportData = {
            exportedAt: new Date().toISOString(),
            totalLogs: this.logs.length,
            logs: this.logs
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `enhanced-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }
}

// Offline Queue Manager
class OfflineQueueManager {
    constructor() {
        this.queue = [];
        this.isOnline = navigator.onLine;
        this.maxQueueSize = 1000;
        this.syncInterval = null;
        this.init();
    }

    init() {
        this.loadQueueFromStorage();
        this.setupOnlineOfflineListeners();
        this.startSyncMonitor();
    }

    setupOnlineOfflineListeners() {
        window.addEventListener('online', () => {
            console.log('📱 Koneksi online - sync data offline');
            this.isOnline = true;
            this.processQueue();
        });

        window.addEventListener('offline', () => {
            console.log('📱 Koneksi offline - menyimpan data lokal');
            this.isOnline = false;
        });
    }

    loadQueueFromStorage() {
        try {
            const saved = localStorage.getItem('gps_offline_queue');
            if (saved) {
                this.queue = JSON.parse(saved);
                console.log(`📂 Loaded ${this.queue.length} queued items`);
            }
        } catch (error) {
            console.error('Error loading queue:', error);
            this.queue = [];
        }
    }

    saveQueueToStorage() {
        try {
            localStorage.setItem('gps_offline_queue', JSON.stringify(this.queue));
        } catch (error) {
            console.error('Error saving queue:', error);
        }
    }

    addToQueue(gpsData) {
        if (this.queue.length >= this.maxQueueSize) {
            this.queue.shift();
        }
        
        this.queue.push({
            ...gpsData,
            queueTimestamp: new Date().toISOString(),
            offlineId: 'offline_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        });

        this.saveQueueToStorage();
        console.log(`💾 Saved to offline queue. Total: ${this.queue.length}`);
    }

    async processQueue() {
        if (this.queue.length === 0 || !this.isOnline) return;

        console.log(`🔄 Processing ${this.queue.length} queued items...`);
        
        const successItems = [];
        const failedItems = [];

        for (const item of this.queue) {
            try {
                await this.sendQueuedData(item);
                successItems.push(item);
            } catch (error) {
                console.error('Failed to send queued data:', error);
                failedItems.push(item);
            }
        }

        this.queue = failedItems;
        this.saveQueueToStorage();

        console.log(`✅ Sent ${successItems.length} items, ${failedItems.length} failed`);
        
        if (successItems.length > 0) {
            window.enhancedLogger?.addLog(`📡 Sync offline: ${successItems.length} data terkirim`, 'success');
        }
    }

    async sendQueuedData(queuedData) {
        if (!window.enhancedLogger?.firebaseRef) {
            throw new Error('No Firebase reference');
        }

        const { queueTimestamp, offlineId, ...cleanData } = queuedData;
        await window.enhancedLogger.firebaseRef.set(cleanData);
    }

    startSyncMonitor() {
        this.syncInterval = setInterval(() => {
            if (this.isOnline && this.queue.length > 0) {
                this.processQueue();
            }
        }, 10000);
    }

    getQueueSize() {
        return this.queue.length;
    }

    clearQueue() {
        this.queue = [];
        this.saveQueueToStorage();
    }
}

// ✅ GLOBAL FUNCTIONS UNTUK CHAT
function sendChatMessage() {
    if (window.enhancedLogger) {
        const input = document.getElementById('chatInput');
        if (input && input.value.trim()) {
            window.enhancedLogger.sendMessage(input.value);
            input.value = '';
        }
    }
}

function toggleChat() {
    if (window.enhancedLogger) {
        window.enhancedLogger.toggleChat();
    }
}

function handleChatInput(event) {
    if (window.enhancedLogger) {
        window.enhancedLogger.handleChatInput(event);
    }
}

// Global functions untuk button controls
function startJourney() {
    if (window.enhancedLogger) {
        window.enhancedLogger.startJourney();
    }
}

function pauseJourney() {
    if (window.enhancedLogger) {
        window.enhancedLogger.pauseJourney();
    }
}

function endJourney() {
    if (window.enhancedLogger) {
        window.enhancedLogger.endJourney();
    }
}

function reportIssue() {
    const issues = [
        'Mesin bermasalah',
        'Ban bocor', 
        'Bahan bakar habis',
        'Kecelakaan kecil',
        'Lainnya'
    ];
    
    const issue = prompt('Lapor masalah:\n' + issues.join('\n'));
    if (issue && window.enhancedLogger) {
        window.enhancedLogger.addLog(`Laporan: ${issue}`, 'warning');
    }
}

function logout() {
    if (window.enhancedLogger) {
        if (confirm('Yakin ingin logout?')) {
            window.enhancedLogger.logout();
        }
    }
}

function exportGPSData() {
    if (window.enhancedLogger) {
        window.enhancedLogger.exportWaypointData();
    }
}

function exportSystemLogs() {
    if (window.enhancedLogger && window.enhancedLogger.dataLogger) {
        window.enhancedLogger.dataLogger.exportLogs();
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    window.enhancedLogger = new EnhancedGPSLogger();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (window.enhancedLogger && window.enhancedLogger.driverData) {
        if (document.hidden) {
            window.enhancedLogger.addLog('Aplikasi di background', 'warning');
        } else {
            window.enhancedLogger.addLog('Aplikasi aktif kembali', 'success');
        }
    }
});
