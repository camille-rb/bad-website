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
            print(f"Adding message to {self.filename}")
            with open(self.filename, 'r') as f:
                messages = json.load(f)
            print("Current messages:", messages)
            messages.append(message)
            print("Messages after append:", messages)
            with open(self.filename, 'w') as f:
                json.dump(messages[-self.size_limit:], f)
            print("Messages saved successfully")
        except Exception as e:
            print(f"Error saving message: {e}")
            
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