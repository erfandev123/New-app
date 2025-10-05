# Jarvis AI - Personal Assistant with Bengali Speech Support

A modern, mobile-responsive AI assistant built with Python Flask, featuring Bengali speech recognition and text-to-speech capabilities powered by Google's Gemini AI.

## 🌟 Features

- **🤖 AI-Powered Conversations**: Powered by Google Gemini AI for intelligent responses
- **🗣️ Speech Recognition**: Voice input support in both English and Bengali
- **🔊 Text-to-Speech**: Audio responses with natural voice synthesis
- **📱 Mobile-First Design**: Fully responsive interface optimized for mobile devices
- **🌐 PWA Support**: Install as a mobile app with offline capabilities
- **🎨 Modern UI**: Beautiful gradient design with smooth animations
- **🌍 Bilingual Support**: Seamless switching between English and Bengali
- **⚡ Real-time Chat**: Instant messaging with loading indicators
- **🎯 Voice Commands**: Hands-free interaction with voice buttons

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- Google Gemini API key
- Microphone access (for voice features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jarvis-ai
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up your Gemini API key**
   - Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Replace `YOUR_GEMINI_API_KEY_HERE` in `app.py` with your actual API key

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access Jarvis**
   - Open your browser and go to `http://localhost:5000`
   - For mobile access, use your computer's IP address: `http://YOUR_IP:5000`

## 📱 Mobile Usage

### Install as PWA
1. Open the app in Chrome/Safari on your mobile device
2. Tap the "Add to Home Screen" option
3. Jarvis will now work like a native app

### Voice Commands
- Tap the microphone button to start voice input
- Speak in English or Bengali
- Jarvis will respond with both text and voice

## 🛠️ Configuration

### Environment Variables
Create a `.env` file for better security:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
FLASK_ENV=development
```

### Customization
- **Voice Settings**: Modify speech rate and volume in `app.py`
- **UI Colors**: Update CSS variables in `static/css/style.css`
- **Language Support**: Add more languages in the language selector

## 📁 Project Structure

```
jarvis-ai/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── README.md             # This file
├── templates/
│   └── index.html        # Main HTML template
├── static/
│   ├── css/
│   │   └── style.css     # Styles and animations
│   ├── js/
│   │   └── app.js        # Frontend JavaScript
│   ├── images/           # App icons and images
│   ├── manifest.json     # PWA manifest
│   └── sw.js            # Service worker
```

## 🔧 API Endpoints

- `GET /` - Main application interface
- `POST /api/chat` - Send message and get AI response
- `GET /api/history` - Get conversation history
- `GET /api/status` - Get application status

## 🌐 Browser Support

- **Chrome/Edge**: Full support (speech recognition, PWA)
- **Safari**: Full support (speech recognition, PWA)
- **Firefox**: Full support (speech recognition)
- **Mobile Browsers**: Optimized for all mobile browsers

## 🎯 Usage Examples

### English Commands
- "What's the weather like today?"
- "Tell me a joke"
- "Set a reminder for tomorrow"
- "What's the latest news?"

### Bengali Commands
- "আজকের আবহাওয়া কেমন?"
- "আমাকে একটা জোক বলুন"
- "কালকের জন্য একটা রিমাইন্ডার সেট করুন"
- "সর্বশেষ খবর কী?"

## 🔒 Security Notes

- Keep your API key secure and never commit it to version control
- Use HTTPS in production for secure voice transmission
- Consider rate limiting for production deployments

## 🚀 Deployment

### Local Network Access
```bash
python app.py --host=0.0.0.0 --port=5000
```

### Production Deployment
1. Use a production WSGI server like Gunicorn
2. Set up HTTPS with SSL certificates
3. Configure environment variables
4. Use a reverse proxy like Nginx

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Google Gemini AI for intelligent responses
- Web Speech API for voice recognition
- Flask framework for the backend
- Font Awesome for icons

## 📞 Support

If you encounter any issues or have questions:
1. Check the browser console for errors
2. Ensure your API key is correctly set
3. Verify microphone permissions are granted
4. Check network connectivity

---

**Made with ❤️ for the Bengali-speaking community**