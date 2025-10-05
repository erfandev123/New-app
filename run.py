#!/usr/bin/env python3
"""
Jarvis AI - Startup Script
A simple script to run the Jarvis AI application with proper configuration.
"""

import os
import sys
from app import app

def check_dependencies():
    """Check if all required dependencies are installed."""
    try:
        import flask
        import google.generativeai
        import speech_recognition
        import pyttsx3
        print("✅ All dependencies are installed!")
        return True
    except ImportError as e:
        print(f"❌ Missing dependency: {e}")
        print("Please run: pip install -r requirements.txt")
        return False

def check_api_key():
    """Check if Gemini API key is configured."""
    api_key = os.environ.get('GOOGLE_API_KEY') or "YOUR_GEMINI_API_KEY_HERE"
    if api_key == "YOUR_GEMINI_API_KEY_HERE":
        print("⚠️  Warning: Please set your Gemini API key!")
        print("1. Get your API key from: https://makersuite.google.com/app/apikey")
        print("2. Set it in app.py or as environment variable GOOGLE_API_KEY")
        return False
    return True

def main():
    """Main startup function."""
    print("🤖 Starting Jarvis AI...")
    print("=" * 50)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Check API key
    check_api_key()
    
    # Get configuration
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print(f"🌐 Server will be available at: http://{host}:{port}")
    print(f"📱 For mobile access, use your computer's IP address")
    print("=" * 50)
    
    try:
        app.run(
            host=host,
            port=port,
            debug=debug,
            threaded=True
        )
    except KeyboardInterrupt:
        print("\n👋 Jarvis AI stopped by user")
    except Exception as e:
        print(f"❌ Error starting Jarvis AI: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()