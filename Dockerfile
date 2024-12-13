FROM python:3.12.1

# Update system and install ffmpeg first
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /code

# Install Python dependencies
ADD ./requirements.txt /code/requirements.txt
RUN pip install -r requirements.txt

# Install whisper
RUN pip install git+https://github.com/openai/whisper.git

# Add the rest of the code
ADD . /code

# Run the server
CMD ["python", "server.py"]