from flask import Flask, request, send_from_directory, jsonify
from flask_cors import CORS
from datetime import datetime
from messages import mailbox
import whisper as w
import os
import sys
import json

# Create data directory for JSON file
DATA_DIR = '/messagedata'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

# Initialize Flask app
model = w.load_model("tiny", download_root="/whisperdata")
app = Flask(__name__)
CORS(app)
my_mailbox = mailbox(filename=os.path.join(DATA_DIR, 'messages.json'))

# Routes
@app.route('/')
def serve_index():
    return send_from_directory('public', 'index.html')

@app.route('/<path:path>')
def serve_files(path):
    return send_from_directory('public', path)

@app.route('/messages', methods=['POST'])
def new_message():
    
    file_size = request.content_length
    if file_size > 10 * 1024 * 1024:  # 10MB limit
        return "File too large", 400

    temp_file = "temp_message.mp3"

    request.files['audio'].save(temp_file)
    
    result = model.transcribe(temp_file, fp16=False)
    timestamp = datetime.now().strftime("%d %b %Y, %H:%M")
    os.remove(temp_file)
    
    message = {"text": result["text"], "timestamp": timestamp}
    
    my_mailbox.add_message(message)
    return "success!", 200

@app.route('/messages')
def list_recordings():
    messages = my_mailbox.get_messages()
    return jsonify(messages)

@app.route('/restore', methods=['POST'])
def restore_messages():
    if 'backup' not in request.files:
        return 'No file provided', 400
    file = request.files['backup']
    if file.filename == '':
        return 'No file selected', 400
    
    try:
        # Read the uploaded JSON
        backup_data = json.loads(file.read())
        # Save it to the volume path
        with open(os.path.join('/messagedata', 'messages.json'), 'w') as f:
            json.dump(backup_data, f)
        return 'Backup restored successfully', 200
    except Exception as e:
        print(f"Restore error: {str(e)}")  # Added for debugging
        return f'Error restoring backup: {str(e)}', 500

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080, debug=True)