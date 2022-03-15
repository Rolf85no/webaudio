
'use strict'


const WAVEFORMS = [
  'sine',
  'square',
  'sawtooth',
  'triangle'
]

const FILTERS = [
  'lowpass',
  'highpass',
  'bandpass',
  'notch'
]

const NOTES = {
  'c-4':261.63,
  'c#4':277.18,
  'd-4':293.66,
  'd#4':311.13,
  'e-4':329.63,
  'f-4':349.23,
  'f#4':369.99,
  'g-4': 392.00,
  'g#4':415.30,
  'a-4':440.00,
  'a#4':466.16,
  'h-4': 493.88,
  'c-5': 523.25
}

const KEYS = {
  'a': 'c-4',
  'w': 'c#4',
  's': 'd-4',
  'e': 'd#4',
  'd': 'e-4',
  'f': 'f-4',
  't': 'f#4',
  'g': 'g-4',
  'y': 'g#4',
  'h': 'a-4',
  'u': 'a#4',
  'j': 'h-4',
  'k': 'c-5'
}


let unisonWidth = 2;
const oscBank = new Array(3);
let actx, masterGain;
let osc, filter;
let filterValue = 15000;
let waveform = 1;
let tuning = 1;
let filterType = 0;
let volume = 0.7;
let pressed = false;
const synthEl = document.querySelector('.synth');
const startButton = document.querySelector('.start');
const freqValueEl = document.getElementById('freqValue');
freqValueEl.textContent = filterValue + 'hz'; 


function audioSetup(){
  actx = new (AudioContext || webkitAudioContext());
  if (!actx) {
    alert ('Not supported');
  }
    synthEl.classList.remove('hidden');
    startButton.classList.add('hidden');

  masterGain = actx.createGain();
  filter = actx.createBiquadFilter();
  
}

function display(element){
  if (element.classList.contains('hidden')){
    element.classList.remove('hidden');
  }
  else{
    element.classList.add('hidden');
  }
}

function octaveSelect(octaveValue, octaveId){
  tuning = octaveValue;
  octaveId.classList.add('active');
}

function volumeChange(volumeValue){
    let muteButton = document.querySelector('.muteButton');
    if (volumeValue === 0){
      muteButton.src = 'images/mute.svg';
    }
    else{
      muteButton.src = 'images/volume.svg';
    }
    volume = volumeValue;
}
function unison(unisonValue){
    unisonWidth = unisonValue;
}

function waveformSelect(waveFormValue){
  waveform = waveFormValue;
}
function filterSelect(filterValue){
  filterType = filterValue;
}

function filterFreq(value){
  filterValue = value;
  freqValueEl.textContent= String(value) + 'hz';
}

document.querySelectorAll('button[data-note]').forEach((button)=>{
  button.addEventListener('mousedown', () =>{
  noteOn(button.dataset.note);
  });

  button.addEventListener('mouseup', () =>{
    oscBank.forEach(element => element.stop());

  });
});

document.addEventListener('keydown', (event)=>{
  let keyName = event.key;
  if (keyName in KEYS){
    if(!pressed){
      noteOn(KEYS[keyName]);
      pressed = true;
    } 
  }
  
  document.addEventListener('keyup',() =>{
    oscBank.forEach(element => element.stop());
    pressed = false;
  
  });
  
});

function noteOn (note){
  const freq = NOTES[note];
  oscBank[0] = start(freq, 0);
  oscBank[1] = start(freq, unisonWidth);
  oscBank[2] = start(freq, -unisonWidth);
};


// ADSR BLOCK


const start = (freq, detune) =>{
const osc = actx.createOscillator();
osc.type = WAVEFORMS[waveform];
osc.frequency.value = freq * tuning;
osc.detune.value = detune;
masterGain.gain.value= volume / oscBank.length;

// FILTER BLOCK
filter.type = FILTERS[filterType];
filter.frequency.value = filterValue;
filter.Q.value = 1;

osc.connect(masterGain);
masterGain.connect(filter);
filter.connect(actx.destination);  
osc.start();
return osc; 
 }


