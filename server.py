from flask import Flask, request, send_from_directory
from flask_cors import CORS
from datetime import datetime
from messages import mailbox
import whisper as w
import os

model = w.load_model("tiny", download_root="/whisperdata")

app = Flask(__name__)
CORS(app)

my_mailbox = mailbox() #todo -- save text files to a .json file, and just serve up the last XX number of files 
max_len = int(10e4)


@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_files(path): #todo - update this to create a public directory for static files 
    return send_from_directory('.', path)

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

    message =  {"text": result["text"], "timestamp": timestamp}
    print('message received')
    my_mailbox.add_message(message)
    return "success!", 200

@app.route('/messages')
def list_recordings():
    return my_mailbox.messages

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=8080, debug=True)
