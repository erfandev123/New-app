class JarvisApp {
    constructor() {
        this.currentLanguage = 'en';
        this.isListening = false;
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.initializeElements();
        this.initializeSpeechRecognition();
        this.bindEvents();
        this.setWelcomeTime();
        this.updateWelcomeMessage();
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chatMessages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.voiceBtn = document.getElementById('voiceBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.voiceStatus = document.getElementById('voiceStatus');
        this.loadingIndicator = document.getElementById('loadingIndicator');
        this.langButtons = document.querySelectorAll('.lang-btn');
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
            
            this.recognition.onstart = () => {
                this.isListening = true;
                this.voiceBtn.classList.add('recording');
                this.showVoiceStatus();
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.messageInput.value = transcript;
                this.hideVoiceStatus();
                this.voiceBtn.classList.remove('recording');
                this.isListening = false;
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.hideVoiceStatus();
                this.voiceBtn.classList.remove('recording');
                this.isListening = false;
                this.showNotification('Speech recognition error. Please try again.', 'error');
            };

            this.recognition.onend = () => {
                this.hideVoiceStatus();
                this.voiceBtn.classList.remove('recording');
                this.isListening = false;
            };
        } else {
            this.voiceBtn.style.display = 'none';
            this.showNotification('Speech recognition not supported in this browser.', 'warning');
        }
    }

    bindEvents() {
        // Send button click
        this.sendBtn.addEventListener('click', () => this.sendMessage());

        // Enter key press
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Voice button click
        this.voiceBtn.addEventListener('click', () => this.toggleVoiceInput());

        // Clear button click
        this.clearBtn.addEventListener('click', () => this.clearChat());

        // Language button clicks
        this.langButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const lang = btn.dataset.lang;
                this.switchLanguage(lang);
            });
        });

        // Auto-resize input
        this.messageInput.addEventListener('input', () => {
            this.messageInput.style.height = 'auto';
            this.messageInput.style.height = this.messageInput.scrollHeight + 'px';
        });
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message) return;

        // Add user message to chat
        this.addMessage(message, 'user');
        this.messageInput.value = '';
        this.messageInput.style.height = 'auto';

        // Show loading
        this.showLoading();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    language: this.currentLanguage
                })
            });

            const data = await response.json();
            
            // Hide loading
            this.hideLoading();

            // Add Jarvis response to chat
            this.addMessage(data.response, 'jarvis');

            // Speak the response
            this.speak(data.response, this.currentLanguage);

        } catch (error) {
            console.error('Error sending message:', error);
            this.hideLoading();
            this.showNotification('Error connecting to Jarvis. Please try again.', 'error');
        }
    }

    addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        if (sender === 'user') {
            avatar.innerHTML = '<i class="fas fa-user"></i>';
        } else {
            avatar.innerHTML = '<i class="fas fa-robot"></i>';
        }

        const content = document.createElement('div');
        content.className = 'message-content';

        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = text;
        messageText.lang = this.currentLanguage;

        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = this.getCurrentTime();

        content.appendChild(messageText);
        content.appendChild(messageTime);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    toggleVoiceInput() {
        if (!this.recognition) {
            this.showNotification('Speech recognition not available.', 'warning');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
        } else {
            // Set language for speech recognition
            this.recognition.lang = this.currentLanguage === 'bn' ? 'bn-IN' : 'en-US';
            this.recognition.start();
        }
    }

    showVoiceStatus() {
        this.voiceStatus.style.display = 'block';
        const voiceText = this.voiceStatus.querySelector('.voice-text');
        voiceText.textContent = this.currentLanguage === 'bn' ? 'শুনছি...' : 'Listening...';
    }

    hideVoiceStatus() {
        this.voiceStatus.style.display = 'none';
    }

    showLoading() {
        this.loadingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideLoading() {
        this.loadingIndicator.style.display = 'none';
    }

    speak(text, language) {
        if (this.synthesis && this.synthesis.speaking) {
            this.synthesis.cancel();
        }

        if (this.synthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language === 'bn' ? 'bn-IN' : 'en-US';
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 0.8;
            this.synthesis.speak(utterance);
        }
    }

    switchLanguage(lang) {
        this.currentLanguage = lang;
        
        // Update language buttons
        this.langButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            }
        });

        // Update welcome message
        this.updateWelcomeMessage();

        // Update input placeholder
        this.messageInput.placeholder = lang === 'bn' ? 'আপনার বার্তা লিখুন...' : 'Type your message...';

        // Update loading text
        const loadingText = this.loadingIndicator.querySelector('.loading-text');
        loadingText.textContent = lang === 'bn' ? 'জার্ভিস চিন্তা করছে...' : 'Jarvis is thinking...';

        // Update voice status text
        const voiceText = this.voiceStatus.querySelector('.voice-text');
        voiceText.textContent = lang === 'bn' ? 'শুনছি...' : 'Listening...';
    }

    updateWelcomeMessage() {
        const welcomeEn = document.querySelector('.welcome-en');
        const welcomeBn = document.querySelector('.welcome-bn');
        
        if (this.currentLanguage === 'bn') {
            welcomeEn.style.display = 'none';
            welcomeBn.style.display = 'inline';
        } else {
            welcomeEn.style.display = 'inline';
            welcomeBn.style.display = 'none';
        }
    }

    clearChat() {
        const messages = this.chatMessages.querySelectorAll('.message');
        messages.forEach((msg, index) => {
            if (index > 0) { // Keep the welcome message
                msg.remove();
            }
        });
        this.showNotification('Chat cleared!', 'success');
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    setWelcomeTime() {
        const welcomeTime = document.getElementById('welcomeTime');
        if (welcomeTime) {
            welcomeTime.textContent = this.getCurrentTime();
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
            max-width: 300px;
        `;

        // Set background color based on type
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new JarvisApp();
});

// Add service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}