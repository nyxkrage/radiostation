/** Implementation of the presentation of the audio player */
import lottieWeb from 'https://unpkg.com/lottie-web@5.2.0/build/player/lottie_light.min.js';

const playIconContainer = document.getElementById('play-icon');
const themeIconContainer = document.getElementById('theme-icon');
const audioPlayerContainer = document.getElementById('audio-player-container');
const seekSlider = document.getElementById('seek-slider');
const volumeSlider = document.getElementById('volume-slider');
const muteIconContainer = document.getElementById('mute-icon');
const listenersIconContainer = document.getElementById('listeners-icon');

let num_clients = document.getElementById('listener_count');

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const playAnimation = lottieWeb.loadAnimation({
  container: playIconContainer,
  path: 'https://maxst.icons8.com/vue-static/landings/animated-icons/icons/pause/pause.json',
  renderer: 'svg',
  loop: false,
  autoplay: false,
  name: "Play Animation",
});

const listenersAnimation = lottieWeb.loadAnimation({
  container: listenersIconContainer,
  path: 'https://maxst.icons8.com/vue-static/landings/animated-icons/icons/vox-player/vox-player.json',
  renderer: 'svg',
  loop: true,
  autoplay: true,
  name: "Listeners Animation",
});

const themeAnimation = lottieWeb.loadAnimation({
  container: themeIconContainer,
  path: 'https://maxst.icons8.com/vue-static/landings/animated-icons/icons/day-night-weather/day-night-weather.json',
  renderer: 'svg',
  loop: false,
  autoplay: false,
  name: "Theme Animation",
});


const muteAnimation = lottieWeb.loadAnimation({
    container: muteIconContainer,
    path: 'https://maxst.icons8.com/vue-static/landings/animated-icons/icons/mute/mute.json',
    renderer: 'svg',
    loop: false,
    autoplay: false,
    name: "Mute Animation",
});

let playState = 'pause';
let muteState = 'unmute';
let themeState = 'dark';

playIconContainer.addEventListener('click', () => {
	playpause()
});

muteIconContainer.addEventListener('click', () => {
	mute()
});

themeIconContainer.addEventListener('click', () => {
	theme()
});

const showRangeProgress = (rangeInput) => {
    audioPlayerContainer.style.setProperty('--volume-before-width', rangeInput.value / rangeInput.max * 100 + '%');
}

volumeSlider.addEventListener('input', (e) => {
    showRangeProgress(e.target);
});

/** Implementation of the functionality of the audio player */

const audio = document.querySelector('audio');
const durationContainer = document.getElementById('duration');
const currentTimeContainer = document.getElementById('current-time');
const outputContainer = document.getElementById('volume-output');
window.addEventListener('load', (event) => {
audio.src = "/raw"
playState == 'pause';
playAnimation.goToAndStop(14, true);
let v = getCookie("muteState");
if (v != null) {
	muteState = v;
}
audio.muted = muteState == 'mute' ? true : false;
muteAnimation.goToAndStop(muteState == 'mute' ? 15 : 0, true);
v = getCookie("themeState");
if (v != null) {
	themeState = v;
}
themeAnimation.goToAndStop(themeState == 'dark' ? 0 : 14, true);
document.body.className = themeState;
v = getCookie("volumeState");
if (v != null) {
	v = parseInt(v)
	outputContainer.textContent = v;
	audio.volume = v / 200;
	volumeSlider.value = v;
	audioPlayerContainer.style.setProperty('--volume-before-width', v + '%');
}
});
let raf = null;

const calculateTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    const returnedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;
    return `${minutes}:${returnedSeconds}`;
}

const whilePlaying = () => {
    raf = requestAnimationFrame(whilePlaying);
}

volumeSlider.addEventListener('input', (e) => {
    const value = e.target.value;

    outputContainer.textContent = value;
    audio.volume = value / 200;
});

const title = document.getElementById('title');
const recent = document.getElementById('recent');

const es = new EventSource('/status');
es.addEventListener("songs", function (event) {
	let data = JSON.parse(event.data)
	title.innerText = data[data.length-1].key;
	document.title = data[data.length-1].key;
	recent.innerHTML = "<span class='header'><b>Recent songs</b></span><br>" + data.reverse().map((kv, i) => {
		if (i == 0) {
			return '';
		}
		return `<span>${kv.key}</span>`;
	}).join('<br/>');
	
});
es.addEventListener("clients", function (event) {
	num_clients.innerText = event.data;
});

let firstTime = true;
function playpause() {
	    if(playState === 'pause' && firstTime) {
		audio.play();
		firstTime = false;
		playAnimation.playSegments([14, 27], true);
		requestAnimationFrame(whilePlaying);
		playState = 'play';
	    } else if (playState === 'pause') {
		playAnimation.playSegments([14, 27], true);
		requestAnimationFrame(whilePlaying);
		playState = 'play';
	    } else {
		playAnimation.playSegments([0, 14], true);
		cancelAnimationFrame(raf);
		playState = 'pause';
	    }
	let shouldMute = muteState == 'unmute' && playState == 'play'
	audio.muted = shouldMute ? false : true
}

function mute() {
	    if(muteState === 'unmute') {
		muteAnimation.playSegments([0, 15], true);
		muteState = 'mute';
	    } else {
		muteAnimation.playSegments([15, 25], true);
		muteState = 'unmute';
	    }
	let shouldMute = muteState == 'unmute' && playState == 'play'
	audio.muted = shouldMute ? false : true
}

function theme() {
if(themeState === 'dark') {
    themeAnimation.playSegments([0, 14], true);
    themeState = 'light';
} else {
    themeAnimation.playSegments([14, 27], true);
    themeState = 'dark';
}
document.body.className = themeState;
}

function volume(change) {
    let cur = parseInt(outputContainer.textContent);
    let nw = cur + change;
    if (nw > 100) nw = 100;
    if (nw < 0) nw = 0;
    outputContainer.textContent = nw;
    audio.volume = nw / 200;
    volumeSlider.value = nw;
    audioPlayerContainer.style.setProperty('--volume-before-width', nw + '%');
}


document.body.onkeyup = function(e){
	if(e.key == ' '){
		playpause()
	}
	if(e.key == 'm'){
		mute()
	}
	if(e.key == 't'){
		theme()
	}
}
document.body.onkeypress = function(e){
	if(e.key == 'ArrowLeft' || 
	e.key == 'ArrowDown' || 
	e.key == 'j' || 
	e.key == 'k') {
	volume(-5);
	}
	if(e.key == 'ArrowRight' || 
	e.key == 'ArrowUp' || 
	e.key == 'l' || 
	e.key == 'i') {
	volume(5);
	}
}

document.querySelectorAll("button").forEach( function(item) {
	    item.addEventListener('focus', function() {
		            this.blur();
		        })
})

function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  var expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

window.addEventListener('beforeunload', (event) => {
	setCookie("themeState", themeState, 30);
	setCookie("muteState", muteState, 30);
	setCookie("volumeState", volumeSlider.value, 30);
});
