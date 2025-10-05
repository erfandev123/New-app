from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import speech_recognition as sr
import pyttsx3
import threading
import time
import os
from datetime import datetime
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini API
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY', "YOUR_GEMINI_API_KEY_HERE")
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize Gemini model
model = genai.GenerativeModel('gemini-pro')

# Initialize speech recognition and text-to-speech
recognizer = sr.Recognizer()
engine = pyttsx3.init()

# Set Bengali voice if available
voices = engine.getProperty('voices')
for voice in voices:
    if 'bengali' in voice.name.lower() or 'bn' in voice.id.lower():
        engine.setProperty('voice', voice.id)
        break

# Set speech rate and volume
engine.setProperty('rate', 150)
engine.setProperty('volume', 0.9)

class JarvisAI:
    def __init__(self):
        self.is_listening = False
        self.conversation_history = []
        
    def speak(self, text, language='en'):
        """Convert text to speech"""
        try:
            if language == 'bn':
                # For Bengali, we'll use a different approach
                # You can integrate with Google Translate TTS or other Bengali TTS services
                print(f"Jarvis (Bengali): {text}")
            else:
                engine.say(text)
                engine.runAndWait()
        except Exception as e:
            print(f"Speech error: {e}")
    
    def listen(self):
        """Listen for voice input"""
        try:
            with sr.Microphone() as source:
                print("Listening...")
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=10)
                
            # Try Bengali first, then English
            try:
                text = recognizer.recognize_google(audio, language='bn-IN')
                print(f"You said (Bengali): {text}")
                return text, 'bn'
            except:
                text = recognizer.recognize_google(audio, language='en-US')
                print(f"You said (English): {text}")
                return text, 'en'
                
        except sr.WaitTimeoutError:
            return "No speech detected", 'en'
        except sr.UnknownValueError:
            return "Could not understand audio", 'en'
        except Exception as e:
            print(f"Listening error: {e}")
            return "Error in listening", 'en'
    
    def get_ai_response(self, user_input, language='en'):
        """Get response from Gemini AI"""
        try:
            # Add context for Bengali responses
            if language == 'bn':
                prompt = f"""You are Jarvis, an AI assistant. The user is speaking in Bengali. 
                Please respond in Bengali. User input: {user_input}
                
                Provide a helpful, friendly response in Bengali. Keep it concise and natural."""
            else:
                prompt = f"""You are Jarvis, an AI assistant. The user said: {user_input}
                
                Provide a helpful, friendly response. Keep it concise and natural."""
            
            response = model.generate_content(prompt)
            return response.text
            
        except Exception as e:
            print(f"AI response error: {e}")
            if language == 'bn':
                return "দুঃখিত, আমি এখন উত্তর দিতে পারছি না। আবার চেষ্টা করুন।"
            else:
                return "Sorry, I cannot respond right now. Please try again."

jarvis = JarvisAI()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/sw.js')
def service_worker():
    return app.send_static_file('sw.js')

@app.route('/manifest.json')
def manifest():
    return app.send_static_file('manifest.json')

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_input = data.get('message', '')
    language = data.get('language', 'en')
    
    # Get AI response
    response = jarvis.get_ai_response(user_input, language)
    
    # Add to conversation history
    jarvis.conversation_history.append({
        'user': user_input,
        'jarvis': response,
        'timestamp': datetime.now().isoformat(),
        'language': language
    })
    
    return jsonify({
        'response': response,
        'language': language,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/speech', methods=['POST'])
def speech_to_text():
    """Convert speech to text"""
    try:
        # This would need to be implemented with proper audio handling
        # For now, we'll return a placeholder
        return jsonify({
            'text': 'Speech recognition endpoint - implement with proper audio handling',
            'language': 'en'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/history')
def get_history():
    """Get conversation history"""
    return jsonify(jarvis.conversation_history)

@app.route('/api/status')
def status():
    """Get Jarvis status"""
    return jsonify({
        'status': 'active',
        'is_listening': jarvis.is_listening,
        'conversation_count': len(jarvis.conversation_history)
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)