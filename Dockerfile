FROM python:3.12.1

# does this work
RUN apt update
RUN apt-get install -y ffmpeg

# docker will not re-pip install if requirements.txt doesn't change
WORKDIR /code
ADD ./requirements.txt /code/requirements.txt
RUN pip install -r requirements.txt

ADD ./download_model.py /code/download_model.py
RUN python download_model.py

ADD . /code

CMD ["python", "server.py"]