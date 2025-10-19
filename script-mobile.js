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

class DTGPSLogger {
    constructor() {
        console.log('🚀 Initializing GPS Logger...');
        
        this.driverData = null;
        this.watchId = null;
        this.isTracking = false;
        this.sendInterval = null;
        this.sessionStartTime = null;
        this.totalDistance = 0;
        this.lastPosition = null;
        this.dataPoints = 0;
        this.isOnline = navigator.onLine;
        this.journeyStatus = 'ready';
        this.firebaseRef = null;
        this.lastFirebaseUpdate = 0;
        
        // Enhanced Chat System
        this.chatRef = null;
        this.chatMessages = [];
        this.unreadCount = 0;
        this.isChatOpen = false;
        this.chatInitialized = false;
        this.lastMessageId = null;
        this.isTyping = false;
        this.typingTimeout = null;
        
        this.offlineQueue = new OfflineQueueManager();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateTime();
        this.checkNetworkStatus();
        setInterval(() => this.updateTime(), 1000);
        setInterval(() => this.checkNetworkStatus(), 5000);
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });
    }

    handleLogin() {
        const driverName = document.getElementById('driverName').value;
        const unitNumber = document.getElementById('unitNumber').value;

        if (driverName && unitNumber) {
            this.driverData = {
                name: driverName,
                unit: unitNumber,
                year: this.getVehicleYear(unitNumber),
                sessionId: this.generateSessionId()
            };

            this.firebaseRef = database.ref('/units/' + unitNumber);
            
            // Set initial data dengan status online yang EXPLICIT
            this.firebaseRef.set({
                driver: driverName,
                unit: unitNumber,
                sessionId: this.driverData.sessionId,
                journeyStatus: 'ready',
                lastUpdate: new Date().toLocaleTimeString('id-ID'),
                isOnline: true, // ✅ BEDAIN LOGOUT vs NO NETWORK
                loginTime: new Date().toISOString()
            });

            this.showDriverApp();
            this.startGPSTracking();
            this.startDataTransmission();
            
            setTimeout(() => {
                this.startJourney();
            }, 3000);
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
        this.updateSessionDuration();
        
        this.setupChatSystem();
    }

    // ✅ WHATSAPP-STYLE CHAT SYSTEM
    setupChatSystem() {
        if (!this.driverData) return;
        
        this.chatRef = database.ref('/chat/' + this.driverData.unit);
        this.chatRef.off();
        
        this.chatRef.on('child_added', (snapshot) => {
            const message = snapshot.val();
            if (message && message.id !== this.lastMessageId) {
                this.handleNewMessage(message);
            }
        });

        this.typingRef = database.ref('/typing/' + this.driverData.unit + '/monitor');
        this.typingRef.on('value', (snapshot) => {
            const typingData = snapshot.val();
            this.handleTypingIndicator(typingData);
        });
        
        this.chatInitialized = true;
        this.addLog('Sistem chat aktif - bisa komunikasi real-time dengan monitor', 'success');
    }

    handleNewMessage(message) {
        if (!message || message.sender === this.driverData.name) return;
        
        const messageExists = this.chatMessages.some(msg => msg.id === message.id);
        if (messageExists) return;
        
        this.chatMessages.push(message);
        
        if (!this.isChatOpen) {
            this.unreadCount++;
        }
        
        this.updateChatUI();
        
        if (!this.isChatOpen) {
            this.showChatNotification(message);
        }
        
        this.playNotificationSound();
    }

    handleTypingIndicator(typingData) {
        const typingIndicator = document.getElementById('typingIndicator');
        
        if (typingData && typingData.isTyping) {
            if (!typingIndicator) {
                const indicator = document.createElement('div');
                indicator.id = 'typingIndicator';
                indicator.className = 'typing-indicator';
                indicator.innerHTML = `
                    <div class="typing-indicator">
                        <span>Monitor sedang mengetik</span>
                        <div class="typing-dots">
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                        </div>
                    </div>
                `;
                document.getElementById('chatMessages').appendChild(indicator);
                document.getElementById('chatMessages').scrollTop = document.getElementById('chatMessages').scrollHeight;
            }
        } else {
            if (typingIndicator) {
                typingIndicator.remove();
            }
        }
    }

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
            
            this.chatMessages.push(messageData);
            this.updateChatUI();
            
            this.addLog(`💬 Pesan terkirim: "${messageText}"`, 'info');
            
            this.stopTyping();
            
        } catch (error) {
            console.error('Failed to send message:', error);
            this.addLog('❌ Gagal mengirim pesan', 'error');
            
            messageData.status = 'failed';
            this.chatMessages.push(messageData);
            this.updateChatUI();
        }
    }

    startTyping() {
        if (!this.driverData) return;
        
        const typingRef = database.ref('/typing/' + this.driverData.unit + '/driver');
        typingRef.set({
            isTyping: true,
            name: this.driverData.name,
            timestamp: Date.now()
        });
        
        this.isTyping = true;
    }

    stopTyping() {
        if (!this.driverData || !this.isTyping) return;
        
        const typingRef = database.ref('/typing/' + this.driverData.unit + '/driver');
        typingRef.set({
            isTyping: false,
            name: this.driverData.name,
            timestamp: Date.now()
        });
        
        this.isTyping = false;
    }

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
        
        // Group messages by date (WhatsApp style)
        const groupedMessages = this.groupMessagesByDate(this.chatMessages);
        
        Object.keys(groupedMessages).forEach(date => {
            // Add date separator untuk hari yang berbeda
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
        
        // Auto scroll to bottom
        messageList.scrollTop = messageList.scrollHeight;
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

    toggleChat() {
        this.isChatOpen = !this.isChatOpen;
        const chatWindow = document.getElementById('chatWindow');
        
        if (chatWindow) {
            chatWindow.style.display = this.isChatOpen ? 'block' : 'none';
            
            if (this.isChatOpen) {
                this.unreadCount = 0;
                this.updateChatUI();
                setTimeout(() => {
                    const chatInput = document.getElementById('chatInput');
                    if (chatInput) {
                        chatInput.focus();
                        this.setupChatInputHandlers();
                    }
                }, 100);
            } else {
                this.stopTyping();
            }
        }
    }

    setupChatInputHandlers() {
        const chatInput = document.getElementById('chatInput');
        if (!chatInput) return;
        
        let typingTimer;
        
        chatInput.addEventListener('input', () => {
            this.startTyping();
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                this.stopTyping();
            }, 2000);
        });
        
        chatInput.addEventListener('blur', () => {
            this.stopTyping();
        });
    }

    handleChatInput(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            const input = document.getElementById('chatInput');
            if (input && input.value.trim()) {
                this.sendMessage(input.value);
                input.value = '';
            }
        }
    }

    showChatNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'chat-notification alert alert-info';
        notification.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <strong>💬 Pesan Baru dari ${message.sender}</strong>
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
    }

    startDataTransmission() {
        this.sendInterval = setInterval(() => {
            if (this.lastPosition) {
                this.sendToFirebase();
            }
        }, 2000);
    }

    handlePositionUpdate(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const speed = position.coords.speed !== null ? position.coords.speed * 3.6 : 0;
        const accuracy = position.coords.accuracy;
        const bearing = position.coords.heading;
        const timestamp = new Date().toISOString();

        document.getElementById('currentLat').textContent = lat.toFixed(6);
        document.getElementById('currentLng').textContent = lng.toFixed(6);
        document.getElementById('currentSpeed').textContent = speed.toFixed(1);
        document.getElementById('gpsAccuracy').textContent = accuracy.toFixed(1) + ' m';
        document.getElementById('gpsBearing').textContent = bearing ? bearing.toFixed(0) + '°' : '-';

        if (this.lastPosition && this.journeyStatus === 'started') {
            const distance = this.calculateDistance(
                this.lastPosition.lat, this.lastPosition.lng,
                lat, lng
            );
            if (distance > 0.01) {
                this.totalDistance += distance;
                document.getElementById('todayDistance').textContent = this.totalDistance.toFixed(2);
            }
        }

        this.lastPosition = { 
            lat, lng, speed, accuracy, bearing, timestamp,
            distance: this.totalDistance
        };

        this.dataPoints++;
        document.getElementById('dataPoints').textContent = this.dataPoints;

        this.updateAverageSpeed();
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

    updateAverageSpeed() {
        if (this.dataPoints > 0 && this.sessionStartTime) {
            const duration = (new Date() - this.sessionStartTime) / 3600000;
            const avgSpeed = duration > 0 ? this.totalDistance / duration : 0;
            document.getElementById('avgSpeed').textContent = avgSpeed.toFixed(1);
        }
    }

    async sendToFirebase() {
        if (!this.firebaseRef || !this.lastPosition) return;

        const gpsData = {
            driver: this.driverData.name,
            unit: this.driverData.unit,
            lat: this.lastPosition.lat,
            lng: this.lastPosition.lng,
            speed: this.lastPosition.speed,
            accuracy: this.lastPosition.accuracy,
            bearing: this.lastPosition.bearing,
            timestamp: new Date().toISOString(),
            lastUpdate: new Date().toLocaleTimeString('id-ID'),
            distance: this.totalDistance,
            journeyStatus: this.journeyStatus,
            batteryLevel: this.getBatteryLevel(),
            sessionId: this.driverData.sessionId,
            isOnline: this.isOnline // ✅ REAL NETWORK STATUS
        };

        try {
            if (this.isOnline) {
                await this.firebaseRef.set(gpsData);
                this.addLog(`📡 Data terkirim: ${this.lastPosition.speed.toFixed(1)} km/h`, 'success');
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
            
            if (this.isOnline) {
                this.offlineQueue.addToQueue(gpsData);
                this.addLog(`❌ Gagal kirim, disimpan offline`, 'error');
            } else {
                this.addLog(`❌ Offline - data dalam antrian`, 'warning');
            }
            this.updateConnectionStatus(false);
        }
    }

    getBatteryLevel() {
        return Math.max(20, Math.floor(Math.random() * 100));
    }

    checkNetworkStatus() {
        const wasOnline = this.isOnline;
        this.isOnline = navigator.onLine;
        
        if (wasOnline !== this.isOnline) {
            if (this.isOnline) {
                this.addLog('📱 Koneksi pulih - sync data offline', 'success');
                this.offlineQueue.processQueue();
                // Update status online ke Firebase
                if (this.firebaseRef) {
                    this.firebaseRef.update({ isOnline: true });
                }
            } else {
                this.addLog('📱 Koneksi terputus - menyimpan data lokal', 'warning');
                // Update status offline ke Firebase (jika masih bisa)
                if (this.firebaseRef && this.isOnline) {
                    this.firebaseRef.update({ isOnline: false });
                }
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
        document.getElementById('vehicleStatus').textContent = 'ON TRIP';
        document.getElementById('vehicleStatus').className = 'bg-success text-white rounded px-2 py-1';
        this.addLog('Perjalanan dimulai - GPS tracking aktif', 'success');
    }

    pauseJourney() {
        this.journeyStatus = 'paused';
        document.getElementById('vehicleStatus').textContent = 'PAUSED';
        document.getElementById('vehicleStatus').className = 'bg-warning text-dark rounded px-2 py-1';
        this.addLog('Perjalanan dijeda', 'warning');
    }

    endJourney() {
        this.journeyStatus = 'ended';
        document.getElementById('vehicleStatus').textContent = 'COMPLETED';
        document.getElementById('vehicleStatus').className = 'bg-info text-white rounded px-2 py-1';
        this.addLog('Perjalanan selesai', 'info');
        
        this.sendToFirebase();
    }

    // ✅ FIXED LOGOUT - BEDAIN LOGOUT vs NO NETWORK
    async logout() {
        if (confirm('Yakin ingin logout? Data akan dihapus dari sistem.')) {
            try {
                console.log('🚪 Starting secure logout...');
                
                // 1. Stop tracking
                this.stopTracking();
                
                // 2. Kirim status LOGOUT yang EXPLICIT
                if (this.firebaseRef && this.driverData) {
                    const logoutData = {
                        driver: this.driverData.name,
                        unit: this.driverData.unit,
                        status: "LOGGED_OUT", // ✅ INI BEDANYA!
                        lastUpdate: new Date().toLocaleTimeString('id-ID'),
                        logoutTime: new Date().toISOString(),
                        isOnline: false
                    };
                    
                    await this.firebaseRef.set(logoutData);
                    this.addLog('Status logout terkirim', 'info');
                    
                    // Tunggu sebentar lalu HAPUS data
                    setTimeout(async () => {
                        try {
                            await this.firebaseRef.remove();
                            console.log('✅ Data dihapus dari Firebase');
                            this.addLog('Data berhasil dihapus dari sistem', 'success');
                        } catch (error) {
                            console.error('Gagal hapus data:', error);
                        }
                    }, 1000);
                }
                
                // 3. Cleanup chat
                if (this.chatRef) {
                    this.chatRef.off();
                }
                if (this.typingRef) {
                    this.typingRef.off();
                }
                this.stopTyping();
                
                // 4. Reset state
                this.resetAppState();
                
                // 5. Kembali ke login
                document.getElementById('loginScreen').style.display = 'block';
                document.getElementById('driverApp').style.display = 'none';
                document.getElementById('loginForm').reset();
                
            } catch (error) {
                console.error('Error during logout:', error);
                this.addLog('Error saat logout: ' + error.message, 'error');
            }
        }
    }

    resetAppState() {
        this.driverData = null;
        this.firebaseRef = null;
        this.chatRef = null;
        this.typingRef = null;
        this.chatMessages = [];
        this.unreadCount = 0;
        this.isChatOpen = false;
        this.chatInitialized = false;
        this.totalDistance = 0;
        this.dataPoints = 0;
        this.lastPosition = null;
        this.sessionStartTime = null;
        this.journeyStatus = 'ready';
        this.isTracking = false;
        
        if (this.sendInterval) {
            clearInterval(this.sendInterval);
        }
        
        console.log('🔄 App state reset complete');
    }

    stopTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }
        if (this.sendInterval) {
            clearInterval(this.sendInterval);
        }
        this.isTracking = false;
    }
}

// ===== OFFLINE QUEUE SYSTEM =====
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
            window.dtLogger?.addLog(`📡 Sync offline: ${successItems.length} data terkirim`, 'success');
        }
    }

    async sendQueuedData(queuedData) {
        if (!window.dtLogger?.firebaseRef) {
            throw new Error('No Firebase reference');
        }

        const { queueTimestamp, offlineId, ...cleanData } = queuedData;
        await window.dtLogger.firebaseRef.set(cleanData);
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
    if (window.dtLogger) {
        const input = document.getElementById('chatInput');
        if (input && input.value.trim()) {
            window.dtLogger.sendMessage(input.value);
            input.value = '';
        }
    }
}

function toggleChat() {
    if (window.dtLogger) {
        window.dtLogger.toggleChat();
    }
}

function handleChatInput(event) {
    if (window.dtLogger) {
        window.dtLogger.handleChatInput(event);
    }
}

// Global functions untuk button controls
function startJourney() {
    if (window.dtLogger) {
        window.dtLogger.startJourney();
    }
}

function pauseJourney() {
    if (window.dtLogger) {
        window.dtLogger.pauseJourney();
    }
}

function endJourney() {
    if (window.dtLogger) {
        window.dtLogger.endJourney();
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
    if (issue && window.dtLogger) {
        window.dtLogger.addLog(`Laporan: ${issue}`, 'warning');
    }
}

function logout() {
    if (window.dtLogger) {
        window.dtLogger.logout();
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    window.dtLogger = new DTGPSLogger();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (window.dtLogger && window.dtLogger.driverData) {
        if (document.hidden) {
            window.dtLogger.addLog('Aplikasi di background', 'warning');
        } else {
            window.dtLogger.addLog('Aplikasi aktif kembali', 'success');
        }
    }
});
