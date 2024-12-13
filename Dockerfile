FROM python:3.12.1

# docker will not re-pip install if requirements.txt doesn't change
WORKDIR /code
ADD ./requirements.txt /code/requirements.txt
RUN pip install -r requirements.txt

RUN pip install "git+https://github.com/openai/whisper.git" 
RUN apt-get install -y ffmpeg

ADD . /code

CMD ["python", "server.py"]
