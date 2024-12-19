import json
import os

class mailbox:
    def __init__(self, filename='messages.json', size_limit=10):
        self.filename = filename
        self.size_limit = size_limit
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        # Create the file if it doesn't exist
        if not os.path.exists(filename):
            with open(filename, 'w') as f:
                json.dump([], f)
    
    def add_message(self, message):
        try:
            # Try to read existing messages, if file is empty/invalid start with empty list
            try:
                if os.path.exists(self.filename) and os.path.getsize(self.filename) > 0:
                    with open(self.filename, 'r') as f:
                        messages = json.load(f)
                else:
                    messages = []
            except json.JSONDecodeError:
                messages = []
            
            # Add new message
            messages.append(message)
            
            # Save all messages
            with open(self.filename, 'w') as f:
                json.dump(messages[-self.size_limit:], f)
                
        except Exception as e:
            print(f"Error saving message: {e}")
            print(f"Current working directory: {os.getcwd()}")
            print(f"Full path to messages file: {os.path.abspath(self.filename)}")
            
    def get_messages(self):
        try:
            print(f"Reading messages from {self.filename}")
            with open(self.filename, 'r') as f:
                messages = json.load(f)
            print("Retrieved messages:", messages)
            return messages
        except Exception as e:
            print(f"Error reading messages: {e}")
            return []
        
        