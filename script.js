
'use strict'

const WAVEFORMS = [
  'sine',
  'square',
  'sawtooth',
  'triangle'
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

const unisonWidth = 2;
const oscBank = new Array(3);
let actx, masterGain;
let osc;
let waveform = 0;
let tuning = 1;
let volume = 0.7;
let pressed = false;
const synthEl = document.querySelector('.synth');
const startButton = document.querySelector('.start');

function audioSetup(){
  actx = new (AudioContext || webkitAudioContext());
  if (!actx) {
    alert ('Not supported');
  }
    synthEl.classList.remove('hidden');
    startButton.classList.add('hidden');

  masterGain = actx.createGain();
  masterGain.connect(actx.destination);
  
}

function octaveSelect(octaveValue, octaveId){
  tuning = octaveValue;
  octaveId.classList.add('active');
}

function volumeChange(volumeValue){
    volume = volumeValue;
}

function waveformSelect(waveFormValue, waveFormId){
  waveform = waveFormValue;
}

document.querySelectorAll('button[data-note]').forEach((button)=>{
  button.addEventListener('mousedown', () =>{
   noteOn(button.dataset.note)

  });

  button.addEventListener('mouseup', () =>{
    osc.stop();
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
    osc.stop();
    pressed = false;
  
  });
  
});

function noteOn (note){
  const freq = NOTES[note];
  oscBank[0] = start(freq, 0);
};


// ADSR BLOCK


// FILTER BLOCK


const start = (freq, detune) =>{
osc = actx.createOscillator();
osc.type = WAVEFORMS[waveform];
osc.frequency.value = freq * tuning;
osc.detune.value = detune;
masterGain.gain.value= volume;
osc.connect(masterGain);  
osc.start();
return osc; 
 }


