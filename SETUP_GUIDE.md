# 🚀 Quick Setup Guide - Jarvis AI

## What You Have

A complete **Jarvis AI Assistant** with:
- ✅ Bengali speech recognition and text-to-speech
- ✅ Mobile-responsive design
- ✅ PWA (Progressive Web App) support
- ✅ Google Gemini AI integration
- ✅ Beautiful modern UI

## 🎯 Quick Start (3 Steps)

### 1. Install Dependencies
```bash
# Option A: Use the installer script
./install.sh

# Option B: Manual installation
pip install -r requirements.txt
```

### 2. Get Your API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key

### 3. Configure & Run
```bash
# Edit .env file and add your API key
nano .env

# Run Jarvis AI
python run.py
```

## 📱 Mobile Access

1. **Find your computer's IP address:**
   ```bash
   # On Linux/Mac
   ifconfig | grep "inet "
   
   # On Windows
   ipconfig
   ```

2. **On your mobile device:**
   - Open browser
   - Go to: `http://YOUR_IP:5000`
   - Tap "Add to Home Screen" for app-like experience

## 🎤 Voice Commands

### English Examples:
- "What's the weather like?"
- "Tell me a joke"
- "What time is it?"

### Bengali Examples:
- "আজকের আবহাওয়া কেমন?"
- "আমাকে একটা জোক বলুন"
- "এখন কটা বাজে?"

## 🔧 Troubleshooting

### Common Issues:

1. **"API key not found"**
   - Make sure you added your Gemini API key to `.env` file

2. **"Speech recognition not working"**
   - Allow microphone access in your browser
   - Use Chrome or Safari for best compatibility

3. **"Can't access from mobile"**
   - Check firewall settings
   - Make sure you're using the correct IP address
   - Try `python run.py --host=0.0.0.0`

4. **"Dependencies not found"**
   - Run: `pip install -r requirements.txt`
   - Make sure you have Python 3.8+

## 🌟 Features at a Glance

- **🤖 AI Chat**: Intelligent conversations with Gemini AI
- **🗣️ Voice Input**: Speak in English or Bengali
- **🔊 Voice Output**: Jarvis speaks back to you
- **📱 Mobile App**: Install as PWA on your phone
- **🌍 Bilingual**: Switch between English and Bengali
- **🎨 Modern UI**: Beautiful, responsive design
- **⚡ Real-time**: Instant responses with loading indicators

## 📞 Need Help?

1. Check the browser console for errors
2. Verify your API key is correct
3. Ensure microphone permissions are granted
4. Check network connectivity

---

**Your Jarvis AI is ready! Enjoy your personal AI assistant! 🎉**