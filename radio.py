from __future__ import print_function
import secrets
import requests
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import spotipy.util as util
import sys
import os
import errno

# Setup directories and files
try:
    os.mkdir('mp3')
except OSError as e:
    if e.errno != errno.EEXIST:
        raise
try:
    os.mkdir('mp4')
except OSError as e:
    if e.errno != errno.EEXIST:
        raise
try:
    open("downloader.status", "x")
except IOError:
    pass

# Helper functions
def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)

# Get playlist from Youtube/Spotify/Deezer
from apscheduler.schedulers.blocking import BlockingScheduler

def run():
    auth_manager = SpotifyClientCredentials(client_id=secrets.SPOTIFY_ID, client_secret=secrets.SPOTIFY_SECRET) 
    sp = spotipy.Spotify(auth_manager=auth_manager)

    playlist = sp.playlist('spotify:playlist:5OqMAGiG35NWP9suV4tal6')
    playlist = playlist['tracks']
    tracks = []
    while playlist['next']:
        for track in playlist['items']:
            track = track['track']
            tracks.append({
                "id": track['id'],
                "album": track['album']['name'],
                "artist": ', '.join([ artist['name'] for artist in track['artists'] ]),
                "track_number": track['track_number'],
                "title": track['name'],
                "year": track['album']['release_date'].split('-')[0]
            })
        playlist = sp.next(playlist)

    # Download with pytube
    from pytube import YouTube
    from youtube_search import YoutubeSearch
    import ffmpeg
    from mp3_tagger import MP3File, VERSION_2, VERSION_BOTH
    from fuzzywuzzy import process
    import string

    f = open("downloader.status", "r+")
    done = [line.rstrip('\n') for line in f]
    f.close()
    f = open("downloader.status", "a")

    for track in tracks:
        full_name = f"{track['title']} - {track['artist']}".replace('/', '')
        if track['id'] in done:
            print(f"Song already downloaded: {full_name}")
            continue
        results = YoutubeSearch(f"{track['title']} - {track['artist']}", max_results=10).to_dict()
        result = process.extractBests(track, results, processor = lambda x: x['title'], limit=1, score_cutoff = 85)
        if len(result) == 0:
            eprint(f"Error finding song: {full_name}")
            continue
        result = result[0][0]

        yt = YouTube(f"https://youtube.com{result['url_suffix']}")
        stream = yt.streams.filter(only_audio=True, file_extension='mp4').first()
        print(f"Downloading {full_name}...")
        stream.download("mp4/")
        # Convert to mp3 with ffmpeg/moviepy
        (
            ffmpeg
            .input(f"mp4/{stream.default_filename}")
            .output(f"mp3/{full_name}.mp3")
            .global_args('-loglevel', 'error')
            .run()
        )
        # Tag using data from Spotify
        mp3 = MP3File(f"mp3/{full_name}.mp3")
        mp3.artist = track['artist']
        mp3.album = track['album']
        mp3.song = track['title']
        mp3.track = str(track['track_number'])
        mp3.year = track['year']

        mp3.set_version(VERSION_2)
        mp3.save()

        f.write(f"{track['id']}\n")

    f.close()

scheduler = BlockingScheduler()
scheduler.add_job(run, 'interval', hours=1)
run()
scheduler.start()
