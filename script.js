
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

const ADSR = {attack:0, decay:0, sustain:1, release:0};
const STAGE_MAX_TIME = 2;

const echo={
  time:0,
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
let actx, vcaGain, masterGain, delayNode, delayGain, dlyLPFilter, lfo, lfoGain, tremolo, tremoloGain;
let osc, filter;
let filterValue = 15000;
let waveform = 2;
let tuning = 1;
let filterType = 0;
let qValue = 1;
let volume = 0.5;
let pressed = false;
const synthEl = document.querySelector('.synth');
const startButton = document.querySelector('.start');
const freqValueEl = document.getElementById('freqValue');
const qValueEl = document.getElementById('qValue');
const volumeFieldEl = document.getElementById('volumeValue');
const timeDlyEl = document.getElementById('timeValue');
const feedbackDlyEl = document.getElementById('feedbackValue');
const lfoDepthValueEl = document.getElementById('lfoDepthValue');
const lfoRateValueEl = document.getElementById('lfoRateValue');
volumeFieldEl.textContent = `${volume * 100}%`;
freqValueEl.textContent = filterValue + 'hz'; 
qValueEl.textContent = qValue;
timeDlyEl.textContent = `${echo.time * 1000} ms`;
feedbackDlyEl.textContent = `${echo.feedback * 100} %`;
lfoDepthValueEl.textContent = `0 %`;
lfoRateValueEl.textContent = `0 hz`;

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
  dlyLPFilter.type = FILTERS[0];
  dlyLPFilter.frequency.value = 3000;
  delayNode.delayTime.value= echo.time;
  delayGain.gain.value = echo.feedback;

delayNode.connect(delayGain);
delayGain.connect(dlyLPFilter);
dlyLPFilter.connect(delayNode);

lfo = actx.createOscillator();
  lfo.type = WAVEFORMS[0];
  lfo.frequency.value = 0;
  lfoGain = actx.createGain();
  lfoGain.gain.value= 0;
  lfo.connect(lfoGain);
  lfoGain.connect(delayNode.delayTime);
  lfo.start();

tremolo = actx.createOscillator();
tremolo.type = WAVEFORMS[1];
tremolo.frequency.value= 2;
tremoloGain = actx.createGain();
tremoloGain.gain.value = 0.5;
tremolo.connect(tremoloGain);
tremolo.start();
}

function display(element){
  if (element.classList.contains('hidden')){
    element.classList.remove('hidden');
  }
  else{
    element.classList.add('hidden');
  }
}

const synthControls = {
  octaveSelect:function(octaveValue){
    let octave = Number (octaveValue);
      if (octave < 0){
        if(octave === -1)
        tuning = 1 / 2;
        else{
          tuning = 1 / 4;
        }
      }
      else if (octave === 0){
        tuning = 1;
      }
      else if (octave === 1){
        tuning = 2;
      }
     
      else{
        tuning = 4;
      }
        
    },
  
  volumeChange:function(volumeValue){
      let muteButton = document.querySelector('.muteButton');
      if (volumeValue === 0){
        muteButton.src = 'images/mute.svg';
      }
      else{
        muteButton.src = 'images/volume.svg';
      }
      masterGain.gain.value = volumeValue;
      volume = volumeValue;
      let textVolume = Math.trunc(volumeValue * 100);
      volumeFieldEl.textContent = `${textVolume}%`;
  },

  unison:function(unisonValue){
      unisonWidth = unisonValue;
  },
  
  waveformSelect:function(waveFormValue){
    waveform = waveFormValue;
  },
  filterSelect:function(filterValue){
    filterType = filterValue;
  },
  
  filterFreq:function(value){
    var minp = 0;
    var maxp = 100;
  
    var minv = Math.log(20);
    var maxv = Math.log(15000);
  
    var scale = (maxv - minv) / (maxp - minp);
  
    value = Math.trunc(Math.exp(minv + scale * (value - minp)));
    filter.frequency.value = value;
    filterValue = value;
    freqValueEl.textContent= String(value) + 'hz';
  },
  
  filterQ:function(value){
    filter.Q.value = value;
    qValue = value;
    qValueEl.textContent = String(value);
  },
  
  changeDelay:function(value){
    delayNode.delayTime.value = Number(value / 1000);
    timeDlyEl.textContent = `${value} ms`;
  },
  feedback:function(value){
    delayGain.gain.value = value;
    feedbackDlyEl.textContent = `${value * 100} %`;
  },
  lfoDepth:function(value){
    lfoGain.gain.value = Number (value / 1000);
    lfoDepthValueEl.textContent = `${value * 10} %`;
  },
  lfoRate:function(value){
    lfo.frequency.value = Number (value / 1000);
    lfoRateValueEl.textContent = `${value / 1000} hz`;

  },
  changedlyType:function(value, name){
    let analogDly = document.getElementById('ad');
    let digitalDly = document.getElementById('dd');
    dlyLPFilter.frequency.value = value;
    if(name === analogDly.id && !analogDly.classList.contains('active')){
      digitalDly.classList.remove('active');
      analogDly.classList.add('active');
    }
    else if (name === digitalDly.id && !digitalDly.classList.contains('active')){
      digitalDly.classList.add('active');
      analogDly.classList.remove('active');
    }
    
  },
  
  changeADSR:function(value, envelope){
    switch(envelope){
      case 'attack':
        ADSR.attack = Number(value);
        break;
      case 'decay':
        ADSR.decay = Number(value);
        break;
      case 'release':
        ADSR.release = Number(value);
        break;
      case 'sustain':
        ADSR.sustain = Number(value);
        break;
    }
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

function noteOn(note){
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
  element.stop(relEndTime);

}

// OSCILLATOR
const start = (freq, detune) =>{
const osc = actx.createOscillator();
osc.type = WAVEFORMS[waveform];
osc.frequency.value = freq * tuning;
osc.detune.value = detune;
let currentGain = 0.5 / oscBank.length;
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
vcaGain.connect(filter);
//FILTER BLOCK
filter.type = FILTERS[filterType];
filter.frequency.value = filterValue;
filter.Q.value = qValue;
//Delay Node
filter.connect(masterGain);
filter.connect(dlyLPFilter);
dlyLPFilter.connect(masterGain); 

// Master volume
masterGain.gain.value = volume;
masterGain.connect(masterGain);
masterGain.connect(actx.destination);
osc.start(now);
return osc; 
 }


