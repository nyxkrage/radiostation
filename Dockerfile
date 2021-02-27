FROM python:3.8-buster

WORKDIR /app
COPY requirements.txt requirements.txt

RUN apt-get update && apt-get -y install ffmpeg
RUN pip3 install -r requirements.txt
COPY radio.py radio.py
COPY secrets.py secrets.py

# Run the command on container startup
CMD python radio.py
