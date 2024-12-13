class mailbox:
    def __init__(self, size_limit = 3):
        self.messages = []
        self.size_limit = size_limit
    def add_message(self, message):
        self.messages.append(message)
        if len(self.messages) > self.size_limit:
            self.messages = self.messages[-self.size_limit:]
