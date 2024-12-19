from flask import Flask, request, send_from_directory, jsonify  # Add jsonify
from flask_cors import CORS
from datetime import datetime
from messages import mailbox
import whisper as w
import os

# Create a data directory for your JSON file
DATA_DIR = 'data'
if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

model = w.load_model("tiny", download_root="/whisperdata")
app = Flask(__name__)
CORS(app)
my_mailbox = mailbox(filename=os.path.join(DATA_DIR, 'messages.json'))
max_len = int(10e4)

@app.route('/')
def serve_index():
    return send_from_directory('public', 'index.html')

@app.route('/<path:path>')
def serve_files(path):
    return send_from_directory('public', path)

@app.route('/messages', methods=['POST'])
def new_message():
    file_size = request.content_length
    if file_size > 10 * 1024 * 1024: # 10MB limit
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
    return jsonify(my_mailbox.get_messages())  # Use jsonify

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080, debug=True)