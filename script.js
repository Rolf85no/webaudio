
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

const ADSR = {attack:0, decay:0, sustain:0.2, release:0};
const STAGE_MAX_TIME = 2;

const echo={
  time:0.1,
  feedback: 0.1
};

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
let actx, vcaGain, masterGain, delayNode, delayGain, dlyLPFilter, dlyHPFilter;
let osc, filter;
let filterValue = 15000;
let waveform = 1;
let tuning = 1;
let filterType = 0;
let qValue = 0.5;
let volume = 0.5;
let pressed = false;
const synthEl = document.querySelector('.synth');
const startButton = document.querySelector('.start');
const freqValueEl = document.getElementById('freqValue');
const qValueEl = document.getElementById('qValue');
const volumeFieldEl = document.getElementById('volumeValue');
volumeFieldEl.textContent = `${volume * 100}%`;
freqValueEl.textContent = filterValue + 'hz'; 
qValueEl.textContent = qValue; 





function audioSetup(){
  actx = new (AudioContext || webkitAudioContext());
  if (!actx) {
    alert ('Not supported');
  }
    synthEl.classList.remove('hidden');
    startButton.classList.add('hidden');

  vcaGain = actx.createGain();
  masterGain = actx.createGain();
  filter = actx.createBiquadFilter();
  delayNode = actx.createDelay();
  delayGain = actx.createGain();
  dlyLPFilter = actx.createBiquadFilter();
  dlyHPFilter = actx.createBiquadFilter();
dlyLPFilter.frequency.value = 5000;
dlyHPFilter.type = FILTERS[1];
dlyHPFilter.frequency.value = 100;
delayNode.delayTime.value= echo.time;
delayGain.gain.value = echo.feedback;
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
    masterGain.gain.value = volumeValue;
    volumeFieldEl.textContent = `${volumeValue* 100}%`;
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
  filter.frequency.value = value;
  filterValue = value;
  freqValueEl.textContent= String(value) + 'hz';

}

function filterQ(value){
  filter.Q.value = value;
  qValue = value;
  qValueEl.textContent = String(value);
}

function  changeDelay(value){
  delayNode.delayTime.value = value;
}
function feedback(value){
  delayGain.gain.value = value;
}

function changeADSR(value, envelope){
  switch(envelope){
    case 'attack':
      ADSR.attack = value;
      break;
    case 'decay':
      ADSR.decay = value;
      break;
    case 'release':
      ADSR.release = value;
      break;
    case 'sustain':
      ADSR.sustain = value;
      break;
  }
}



// START NOTE MOUSE
document.querySelectorAll('button[data-note]').forEach((button)=>{
  button.addEventListener('mousedown', () =>{
  noteOn(button.dataset.note);
  });

  button.addEventListener('mouseup', () =>{
    noteOff();

  });
});

//START NOTE KEYS
document.addEventListener('keydown', (event)=>{
  let keyName = event.key;
  if (keyName in KEYS){
    if(!pressed){
      noteOn(KEYS[keyName]);
      pressed = true;
    } 
  }
  
  document.addEventListener('keyup',() =>{
    oscBank.forEach(element => noteOff(element));
    pressed = false;
  
  });
  
});

function noteOn (note){
  vcaGain.gain.cancelScheduledValues(actx.currentTime);
  const freq = NOTES[note];
  oscBank[0] = start(freq, 0);
  oscBank[1] = start(freq, unisonWidth);
  oscBank[2] = start(freq, -unisonWidth);
};

function noteOff(element){
  const now = actx.currentTime;
  vcaGain.gain.cancelScheduledValues(now);
  const relDuration = ADSR.release * STAGE_MAX_TIME;
  const relEndTime = now + relDuration;
  vcaGain.gain.setValueAtTime(vcaGain.gain.value, now);
  vcaGain.gain.linearRampToValueAtTime(0,relEndTime);
  element.stop(now);

}

// OSCILLATOR
const start = (freq, detune) =>{
const osc = actx.createOscillator();
osc.type = WAVEFORMS[waveform];
osc.frequency.value = freq * tuning;
// let lfo = actx.createOscillator();
//     lfo.type = 'square';
//     lfo.frequency.value = 50;
// let lfoGain = actx.createGain();
// lfoGain.gain.value = 0.5;
// lfo.connect(lfoGain);
// lfoGain.connect(osc.frequency);
// lfo.start();
osc.detune.value = detune;
let currentGain = 0.5;
vcaGain.gain.value= currentGain;
osc.connect(vcaGain);

//ATTACK DECAY
const now = actx.currentTime;
const atkDuration = ADSR.attack * STAGE_MAX_TIME;
const decayDuration = ADSR.decay * STAGE_MAX_TIME;
const atkEndTime = actx.currentTime + atkDuration;
vcaGain.gain.setValueAtTime(0, now);
vcaGain.gain.linearRampToValueAtTime(currentGain,atkEndTime);
vcaGain.gain.setTargetAtTime(ADSR.sustain * currentGain, atkEndTime, decayDuration);

//FILTER BLOCK
filter.type = FILTERS[filterType];
filter.frequency.value = filterValue;
filter.Q.value = qValue;
vcaGain.connect(filter);
//Delay Node

dlyLPFilter.connect(delayNode);
dlyHPFilter.connect(delayNode);
delayNode.connect(delayGain);
delayGain.connect(delayNode);
filter.connect(delayNode);
delayNode.connect(masterGain); 

// Master volume
masterGain.gain.value = volume;
masterGain.connect(actx.destination);
osc.start(now);
return osc; 
 }


