import whisper as w


model = w.load_model("turbo")
result = model.transcribe("test_recording.m4a", fp16=False)
print(result["text"])

