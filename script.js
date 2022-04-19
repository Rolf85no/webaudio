
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
const oscBank = new Array(4);
let actx, vcaGain, masterGain, delayNode, delayFeedbackGain, dlyLPFilter, lfoDelay, 
    lfoDelayGain, tremolo, chorusNode,chorusFeedback, lfoChorus, lfoChorusGain;
let osc, filter, osc2, osc2Gain, lfo, lfoGain;
let filterValue = 15000;
let waveform = 2;
let waveform2 = waveform;
let tuning = 1;
let filterType = 0;
let qValue = 1;
let volume = 0.5;
let osc2VolumeValue = 0; 
let pressed = false;
let lfoConnected = false;
let osc2Detune = 7;
let chorusBypass = true;
const synthEl = document.querySelector('.synth');
const startButton = document.querySelector('.start');
const freqValueEl = document.getElementById('freqValue');
const qValueEl = document.getElementById('qValue');
const volumeFieldEl = document.getElementById('volumeValue');
const timeDlyEl = document.getElementById('timeValue');
const feedbackDlyEl = document.getElementById('feedbackValue');
const lfoDepthValueEl = document.getElementById('lfoDepthValue');
const lfoRateValueEl = document.getElementById('lfoRateValue');
const osc2semiValueEl = document.getElementById('osc2SemiValue');
const osc2VolumeTextEl = document.getElementById('osc2VolumeText');
volumeFieldEl.textContent = `${volume * 100}%`;
freqValueEl.textContent = filterValue + 'hz'; 
qValueEl.textContent = qValue;
timeDlyEl.textContent = `${echo.time * 1000} ms`;
feedbackDlyEl.textContent = `${echo.feedback * 100} %`;
lfoDepthValueEl.textContent = `0 %`;
lfoRateValueEl.textContent = `0 hz`;
osc2semiValueEl.textContent = `7`;
osc2VolumeTextEl.textContent = `${osc2VolumeValue * 100} %`;

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
  osc2Gain = actx.createGain();

  /////// LFO /////////
  lfo = actx.createOscillator();
  lfo.type = WAVEFORMS[0];
  lfo.frequency.value = 1;
  lfoGain = actx.createGain();
  lfoGain.gain.value = 1000;
  lfo.connect(lfoGain);
  lfo.start();

  /////// DELAY /////////
  delayNode = actx.createDelay();
  delayFeedbackGain = actx.createGain();
  dlyLPFilter = actx.createBiquadFilter();
  dlyLPFilter.type = FILTERS[0];
  dlyLPFilter.frequency.value = 3000;
  delayNode.delayTime.value= echo.time;
  delayFeedbackGain.gain.value = echo.feedback;
  dlyLPFilter.connect(delayNode);
  delayNode.connect(delayFeedbackGain);
  delayFeedbackGain.connect(dlyLPFilter);

  ///////// LFO-DELAY ///////
  lfoDelay = actx.createOscillator();
  lfoDelay.type = WAVEFORMS[0];
  lfoDelay.frequency.value = 0;
  lfoDelayGain = actx.createGain();
  lfoDelayGain.gain.value= 0;
  lfoDelay.connect(lfoDelayGain);
  lfoDelayGain.connect(delayNode.delayTime);
  lfoDelay.start();

  ///////// CHORUS ///////////
  chorusNode = actx.createDelay();
  chorusFeedback = actx.createGain();
  chorusNode.delayTime.value = 0.001;
  chorusFeedback.gain.value = 0.2;
  chorusNode.connect(chorusFeedback);
  chorusFeedback.connect(chorusNode);
  lfoChorus = actx.createOscillator();
  lfoChorus.type = WAVEFORMS[0];
  lfoChorus.frequency.value= 0.1;
  lfoChorusGain = actx.createGain();
  lfoChorusGain.gain.value = 0.05;
  lfoChorus.connect(lfoChorusGain);
  lfoChorusGain.connect(chorusNode.delayTime);
  lfoChorus.start();
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

  osc2Values:function(changeValue, id){
    switch (id){
      case 'osc2Freq':
        osc2Detune = changeValue;
        osc2semiValueEl.textContent = `${changeValue}`;
        break;
      case 'waveformOsc2':
        waveform2 = changeValue;
        break;

      case 'osc2volume':
        osc2Gain.gain.value = changeValue;
        osc2VolumeValue = changeValue;
        osc2VolumeTextEl.textContent = `${changeValue * 100} %`;
        break;
    }
    
  },

  lfoConnection:function(type, name){
    let gainValue = lfoGain.gain.value;
    switch (type) {
      case 'filter':
        name.classList.add('active');
        lfoGain.connect(filter.detune);
        lfoConnected = true;
        break;

      case 'volume':
        name.classList.add('active');
        lfoGain.gain.value = gainValue / 2000;
        lfoGain.connect(vcaGain.gain);
        lfoConnected = true;
        break;
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
  
  changeDelay:function(value, parameter){
    switch(parameter){
      case 'time':
        delayNode.delayTime.value = Number(value / 1000);
        timeDlyEl.textContent = `${value} ms`;
        break;
      case 'feedback':
        delayFeedbackGain.gain.value = value;
        feedbackDlyEl.textContent = `${value * 100} %`;
        break;
      case 'lfoDepth':
        lfoDelayGain.gain.value = Number (value / 1000);
        lfoDepthValueEl.textContent = `${value * 10} %`;
        break;
      case 'lfoRate':
        lfoDelay.frequency.value = Number (value / 1000);
        lfoRateValueEl.textContent = `${value / 1000} hz`;
        break;
    }
    
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

  chorusOn:function(name){
    if(!chorusBypass){
      name.classList.remove('active');
      chorusBypass = true;
      filter.disconnect(chorusNode);
      chorusNode.disconnect(dlyLPFilter);
    }
    else{
      name.classList.add('active');
      chorusBypass = false;
    }
      
  },

  chorusChange:function(value, parameter){
    switch(parameter){
      case 'chorusTime':
        let dlyTime = Number(value / 1000);
        chorusNode.delayTime.value = dlyTime;
        break;
      
      case 'chorusFeedback':
        chorusFeedback.gain.value = value;
        break;
      
      case 'chorusDepth':
        lfoChorusGain.gain.value = Number (value / 1000);
        break;

      case 'chorusRate':
        lfoChorus.frequency.value = Number (value / 1000);
      break;
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

const transpose = (freq, steps) => freq * Math.pow(2, steps/12);

function noteOn(note){
  vcaGain.gain.cancelScheduledValues(actx.currentTime);
  const freq = NOTES[note];
  oscBank[0] = vco1(freq, 0);
  oscBank[1] = vco1(freq, unisonWidth);
  oscBank[2] = vco1(freq, -unisonWidth);
  oscBank[3] = vco2(freq);
};

function noteOff(element){
  const now = actx.currentTime;
  // vcaGain.gain.cancelScheduledValues(now);
  const relDuration = ADSR.release * STAGE_MAX_TIME;
  const relEndTime = now + relDuration;
  vcaGain.gain.setValueAtTime(vcaGain.gain.value, now);
  vcaGain.gain.linearRampToValueAtTime(0.001,relEndTime);
  element.stop(relEndTime);

}

// OSCILLATOR
const vco1 = (freq, detune) =>{
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
const atkEndTime = now + atkDuration;
vcaGain.gain.setValueAtTime(0, now);
vcaGain.gain.linearRampToValueAtTime(currentGain,atkEndTime);
vcaGain.gain.setTargetAtTime(ADSR.sustain * currentGain, atkEndTime, decayDuration);
vcaGain.connect(filter);
//FILTER BLOCK
filter.type = FILTERS[filterType];
filter.frequency.value = filterValue;
filter.Q.value = qValue;

if(!chorusBypass){
  filter.connect(chorusNode);
  filter.connect(dlyLPFilter);
  chorusNode.connect(dlyLPFilter);
  dlyLPFilter.connect(masterGain);
  
}
else{
  //Delay Node
filter.connect(masterGain);
filter.connect(dlyLPFilter);
dlyLPFilter.connect(masterGain); 
}

// Master volume
masterGain.gain.value = volume;
masterGain.connect(masterGain);
masterGain.connect(actx.destination);
osc.start(now);
return osc; 
 }

 const vco2 = (freq) => {
   osc2 = actx.createOscillator();
   osc2.type = WAVEFORMS[waveform2];
   osc2.frequency.value = transpose(freq, osc2Detune);
   osc2Gain.gain.value = osc2VolumeValue;

   osc2.connect(osc2Gain);
   osc2Gain.connect(vcaGain);
   osc2.start(actx.currentTime);
   return osc2;
  
 }


