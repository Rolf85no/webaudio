
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

const unisonWidth = 10;
const oscBank = new Array(3);

let osc;
let waveform = 0;
let tuning = 1;

function octaveSelect(octaveValue, octaveId){
  tuning = octaveValue;
  octaveId.classList.add('active');
}

function waveformSelect(waveFormValue, waveFormId){
  waveform = waveFormValue;
}

document.querySelectorAll('button[data-note]').forEach((button)=>{
  button.addEventListener('mousedown', () =>{
   noteOn(button.dataset.note)

  });

  button.addEventListener('mouseup', () =>{
    osc.stop()});
});

document.addEventListener('keypress', (event)=>{
  let keyName = event.key;
  if (keyName in KEYS){
    noteOn(KEYS[keyName]);
  }
  document.addEventListener('keyup',() =>{
    osc.stop();
  
  });
  
});


function start(freq, detune){
const actx = new (AudioContext || webkitAudioContext());
if (!actx) alert ('Not supported');
osc = actx.createOscillator();
osc.type = WAVEFORMS[waveform];
osc.frequency.value = freq * tuning;
osc.detune.value = detune;
osc.connect(actx.destination);  
osc.start();
 }

 function noteOn (note){
   const freq = NOTES[note];
   oscBank[0] = start(freq, 0);
 }

// function stop(){
//   osc.stop(actx.currentTime + 1);
//  }
