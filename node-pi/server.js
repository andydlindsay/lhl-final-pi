const motor = require('./motor.js');
const five = require('johnny-five');
const PiIO = require('pi-io');
const raspberryPiCamera = require('raspberry-pi-camera-native');
const fs = require('fs');

const socket = require('socket.io-client')('ws://rpi-lhl-final.herokuapp.com');

socket.on('connect', () => {
  console.log('Connected to socket server');
  socket.emit('identifier', 'car');
  socket.emit('carConnected', { carId: 1 });
})

socket.on('disconnect', () => {
  console.log('Disconnected from web server');
  motor.stop();
})

// playback controls
let playbackControls = [];
let currentlyPlayingback = false;
socket.on('playbackControls', (data) => {
  currentlyPlayingback = data.currentlyPlayingback;
  motor.stop();
  if (currentlyPlayingback) {
    controlPlayback(playbackControls);
  }
});

function controlPlayback(playbackControls) {
  playbackControls.forEach(({ controls, timeout }, index) => {
    setTimeout(() => {
      if (currentlyPlayingback) {
        driveCar(controls);
      }
      if (index === playbackControls.length - 1) {
        console.log('done playback');
        stopPlayback();
      }
    }, timeout);
  });
}

function controlPlaybackReverse() {
  const reversedControls = reverseControls(playbackControls);
  console.log(reversedControls);
  controlPlayback(reversedControls);
}

function reverseControls(controls) {
  let reversed = [];
  console.log(controls);
  controls = controls.reverse();
  for(let i = 0; i < controls.length; i++) {
    console.log(controls[i]);
    reversed.push({ 
      controls: {
        direction: controls[i].controls.direction * -1,
        turn: controls[i].controls.turn * -1,
        cameraRotation: controls[i].controls.cameraRotation * -1
      },
      timeout: i > 0 ? reversed[i-1].timeout + controls[i-1].timeout - controls[i].timeout : 0,
    })
  }
  console.log(reversed);
  return reversed;
}

function stopPlayback() {
  motor.stop();
  socket.emit('playbackComplete');
  currentlyPlayingback = false;
  socket.emit('playbackComplete');
}

let currentlyRecording = false;
let recordingStartTime;
socket.on('controlRecording', (data) => {
  currentlyRecording = data.currentlyRecording;
  if (currentlyRecording) {
    // begin with an empty array
    playbackControls = [];
    recordingStartTime = new Date().getTime();
  } else {
    console.log(`array size = ${playbackControls.length}`);
    const fileName = new Date().getTime().toString() + '.txt';
    fs.writeFileSync(fileName, playbackControls, (err) => {
      if (err) throw err;
      console.log(`${fileName} saved!`);
    });
  }
});

socket.on('controlsOutput', (data) => {
  console.log('Received controls');
  console.log(data);
  if (!currentlyPlayingback) {
    const controls = data;

    if (currentlyRecording) {
      playbackControls.push({
        controls,
        timeout: new Date().getTime() - recordingStartTime
      });
    }

    driveCar(controls);
  }
});

function driveCar({ direction, turn }) {
  if (turn > 0) {
    motor.right();
  } else if (turn < 0) {
    motor.left();
  } else if (direction > 0) {
    motor.reverse();
  } else if (direction < 0) {
    motor.forward();
  } else {
    motor.stop();
  }
}

raspberryPiCamera.on('frame', (data) => {
  socket.emit('frame', data);
});

const cameraOptions = {
  width: 640,
  height: 480,
  fps: 24,
  encoding: 'JPEG',
  quality: 10
};

raspberryPiCamera.start(cameraOptions);

let previousCheck = 0;
const board = new five.Board({ io: new PiIO() });
board.on('ready', () => {
  const proximity = new five.Proximity({
    controller: PiIO.HCSR04,
    triggerPin: 'GPIO23',
    echoPin: 'GPIO24'
  });
  proximity.on('change', function () {
    let obstructed = false;
    if (this.cm <= 40 && previousCheck <= 40 && previousCheck > 11 && this.cm > 11) {
      motor.setObstructed(true);
      obstructed = true;
    } else {
      motor.setObstructed(false);
    }
    previousCheck = this.cm;
    socket.emit('newDistance', { 
      obstructed,
      carId: 1,
      distance: this.cm
    });
  });
});
