
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

let lfoConnections = [
  {"type":"filter","value":false},
  {"type":"volume","value":false},
  {"type":"pitch","value":false}
]


let unisonWidth = 0.5;
const oscBank = new Array(4);
let actx, vcaGain, masterGain, delayNode, delayFeedbackGain, dlyLPFilter, lfoDelay, 
    lfoDelayGain, tremolo, chorusNode,chorusFeedback, lfoChorus, lfoChorusGain;
let osc, filter, osc2, osc2Gain, lfo, lfoGain, pitchLfo, pitchLfoGain;
let filterValue = 15000;
let waveform = 2;
let waveform2 = waveform;
let tuning = 1;
let filterType = 0;
let qValue = 1;
let volume = 0.5;
let osc2VolumeValue = 0; 
let pressed = false;
let osc2Detune = 7;
let chorusBypass = true;

const synthEl = document.querySelector('.synth');
const startButton = document.querySelector('.start');
const freqValueEl = document.getElementById('freqValue');
const qValueEl = document.getElementById('qValue');
const volumeFieldEl = document.getElementById('volumeValue');
const unisonFieldEl = document.getElementById('unisonValue');

const timeDlyEl = document.getElementById('timeValue');
const feedbackDlyEl = document.getElementById('feedbackValue');
const dlyLfoDepthValueEl = document.getElementById('dlyLfoDepthValue');
const dlyLfoRateValueEl = document.getElementById('dlyLfoRateValue');

const chorusTimeEl = document.getElementById('chorusTimeValue');
const chorusFeedbackEl = document.getElementById('chorusFeedbackValue');
const chorusDepthEl = document.getElementById('chorusDepthValue');
const chorusRateEl = document.getElementById('chorusRateValue');

const lfoDepthValueEl = document.getElementById('lfoDepthValue');
const lfoRateValueEl = document.getElementById('lfoRateValue');
const osc2semiValueEl = document.getElementById('osc2SemiValue');
const osc2VolumeTextEl = document.getElementById('osc2VolumeText');

volumeFieldEl.textContent = `${volume * 100}%`;
unisonFieldEl.textContent = `${unisonWidth}`;
freqValueEl.textContent = filterValue + 'hz'; 
qValueEl.textContent = qValue;
timeDlyEl.textContent = `${echo.time * 1000} ms`;
feedbackDlyEl.textContent = `${echo.feedback * 100} %`;
dlyLfoDepthValueEl.textContent = `0 %`;
dlyLfoRateValueEl.textContent = `0 hz`;

chorusTimeEl.textContent = `off`;
chorusFeedbackEl.textContent = `off`;
chorusDepthEl.textContent = 'off';
chorusRateEl.textContent = 'off';

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
  lfo.type = WAVEFORMS[1];
  lfo.frequency.value = 1;
  lfoGain = actx.createGain();
  lfoGain.gain.value = 1000;
  lfo.connect(lfoGain);
  lfo.start();

  ///// PITCH LFO
  pitchLfo = actx.createOscillator();
  pitchLfo.type = WAVEFORMS[1];
  pitchLfo.frequency.value = 0;
  pitchLfoGain = actx.createGain();
  pitchLfoGain.gain.value = 0;
  pitchLfo.connect(pitchLfoGain);
  pitchLfo.start();

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

    lfoConnections.forEach(function(element){
      if(element.value === true){
        if(element.type === 'volume'){
          lfoGain.disconnect(masterGain.gain);
          document.getElementById(`lfo_${element.type}`).classList.remove('active');
        }
        else if(element.type === 'filter'){
          lfoGain.disconnect(filter.detune);
          document.getElementById(`lfo_${element.type}`).classList.remove('active');
        }
        else{
          document.getElementById(`lfo_pitch`).classList.remove('active');
          pitchLfoGain.gain.value = 0;
          pitchLfo.frequency.value = 0;
        }
        element.value = false;

      }   
    });
  
    switch (type) {
      case 'filter':
        name.classList.add('active');
        lfoGain.connect(filter.detune);
        lfoConnections[0].value = true;
        break;

      case 'volume':
        name.classList.add('active');
        lfoGain.gain.value /= 2000;
        lfoGain.connect(masterGain.gain);
        lfoConnections[1].value = true;
        break;
    }
    
  },

  lfoPitchChange:function(name){
    lfoConnections.forEach(function(element){
      if(element.value === true){
        if(element.type === 'volume'){
          lfoGain.disconnect(masterGain.gain);
          document.getElementById(`lfo_${element.type}`).classList.remove('active');
        }
        else if(element.type === 'filter'){
          lfoGain.disconnect(filter.detune);
          document.getElementById(`lfo_${element.type}`).classList.remove('active');
        }
        element.value = false;

      }   
    });
    name.classList.add('active');
    pitchLfoGain.gain.value = 100;
    pitchLfo.frequency.value = 2;
    lfoConnections[2].value = true;
  },

  changeLfo:function(value, type){

    switch (type){
      case 'lfoDepth':
        
        if(lfoConnections[0].value === true){
          lfoGain.gain.value = value;
        }
    
        else if (lfoConnections[2].value === true){
          pitchLfoGain.gain.value = value;
        }
        else{ 
          lfoGain.gain.value = value / 10000;
        }
        const lfoDepthText = Number (value / 50);
        lfoDepthValueEl.textContent = `${Math.trunc(lfoDepthText)} %`;
      break;
      case 'lfoRate':
        if (lfoConnections[2].value === true){
          pitchLfo.frequency.value = value;
        }
        else{
          lfo.frequency.value = value;
        }
        lfoRateValueEl.textContent = `${value} hz`;
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
      unisonFieldEl.textContent = `${unisonValue}`;
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
      case 'dlyLfoDepth':
        lfoDelayGain.gain.value = Number (value / 1000);
        dlyLfoDepthValueEl.textContent = `${value * 10} %`;
        break;
      case 'dlyLfoRate':
        lfoDelay.frequency.value = Number (value / 1000);
        dlyLfoRateValueEl.textContent = `${value / 1000} hz`;
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
      chorusTimeEl.textContent = `off`;
      chorusFeedbackEl.textContent = `off`;
      chorusDepthEl.textContent = `off`;
      chorusRateEl.textContent = `off`;
      name.classList.remove('active');
      chorusBypass = true;
      filter.disconnect(chorusNode);
      chorusNode.disconnect(dlyLPFilter);
      
    }
    else{
      chorusTimeEl.textContent = `${document.getElementById('chorusTime').value} ms`;
      chorusFeedbackEl.textContent = `${document.getElementById('chorusFeedback').value * 100} %`;
      chorusDepthEl.textContent = `${document.getElementById('chorusDepth').value * 20} %`;
      chorusRateEl.textContent = `${document.getElementById('chorusRate').value / 1000} hz`;
      name.classList.add('active');
      chorusBypass = false;

    }
      
  },

  chorusChange:function(value, parameter){
    if(!chorusBypass){
    switch(parameter){
      case 'chorusTime':
        let dlyTime = Number(value / 1000);
        chorusNode.delayTime.value = dlyTime;
        chorusTimeEl.textContent = `${value} ms`;
        break;
      
      case 'chorusFeedback':
        chorusFeedback.gain.value = value;
        chorusFeedbackEl.textContent = `${value * 100} %`
        break;
      
      case 'chorusDepth':
        lfoChorusGain.gain.value = Number (value / 1000);
        chorusDepthEl.textContent = `${value * 20} %`
        break;

      case 'chorusRate':
        lfoChorus.frequency.value = Number (value / 1000);
        chorusRateEl.textContent = `${value / 1000}  hz `;
      break;
    }
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


// // START NOTE MOUSE
// document.querySelectorAll('button[data-note]').forEach((button)=>{
//   button.addEventListener('mousedown', () =>{
//   noteOn(button.dataset.note);
//   });

//   button.addEventListener('mouseup', () =>{
//     noteOff();

//   });
// });

//START NOTE KEYS
document.addEventListener('keydown', (event)=>{
  let keyName = event.key;
  if (keyName in KEYS){
    if(!pressed){
      noteOn(KEYS[keyName]);
      showKey(KEYS[keyName]);
      pressed = true;
    } 
  }
  
  document.addEventListener('keyup',() =>{
    oscBank.forEach(element => noteOff(element));
    pressed = false;
    showKey(null)
  });
  
});

const transpose = (freq, steps) => freq * Math.pow(2, steps/12);

function showKey(keyPressed){
  if(keyPressed){
    const showKey = keyPressed.includes("-") ? keyPressed.slice(0,1) : keyPressed.slice(0,2);
    document.getElementById('keyPressed').textContent = `Note played: ${showKey.toUpperCase()} `;
  }
  else{
    document.getElementById('keyPressed').textContent = `Use keyboard to play notes. Range is from C-4(A) to C-5 (J)`;
  }
}

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
pitchLfoGain.connect(osc.detune);
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


