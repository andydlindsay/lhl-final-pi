const motor = require('./motor.js');
const five = require('johnny-five');
const PiIO = require('pi-io');
const raspberryPiCamera = require('raspberry-pi-camera-native');

const socket = require('socket.io-client')('ws://rpi-lhl-final.herokuapp.com');

socket.on('connect', () => {
  console.log('Connected web server');
  socket.emit('carConnected', { carId: 1 });
})

socket.on('disconnect', () => {
  console.log('Disconnected from web server');
})

// playback controls
let playbackControls = [];
let currentlyPlayingback = false;
socket.on('playbackControls', (data) => {
  currentlyPlayingback = data.currentlyPlayingback;
  if (currentlyPlayingback) {
    motor.stop();
    controlPlayback();
  }
});

function controlPlayback() {
  playbackControls.forEach(({ controls, timeout }, index) => {
    setTimeout(() => {
      driveCar(controls);
      if (index === playbackControls.length - 1) {
        stopPlayback();
      }
    }, timeout);
  });
}

function stopPlayback() {
  currentlyPlayingback = false;
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
  if (direction > 0 && turn > 0) {
    motor.forwardRight();
  } else if (direction > 0 && turn < 0) {
    motor.forwardLeft();
  } else if (turn > 0) {
    motor.right();
  } else if (turn < 0) {
    motor.left();
  } else if (direction > 0) {
    motor.forward();
  } else if (direction < 0) {
    motor.reverse();
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
    if (this.cm <= 40 && previousCheck <= 40) {
      motor.setObstructed(true);
    } else {
      motor.setObstructed(false);
    }
    previousCheck = this.cm;
    socket.emit('newDistance', { carId: 1, distance: this.cm });
  });
  //  var imu = new five.Accelerometer({
  //      controller: "MPU6050"
  //  });
  //
  //  imu.on("change", function() {
  //          console.log("Thermometer");
  //          console.log("  celsius      : ", this.thermometer.celsius);
  //          console.log("  fahrenheit   : ", this.thermometer.fahrenheit);
  //          console.log("  kelvin       : ", this.thermometer.kelvin);
  //          console.log("--------------------------------------");
  //
  //          console.log("Accelerometer");
  //          console.log("  x            : ", this.accelerometer.x);
  //          console.log("  y            : ", this.accelerometer.y);
  //          console.log("  z            : ", this.accelerometer.z);
  //          console.log("  pitch        : ", this.accelerometer.pitch);
  //          console.log("  roll         : ", this.accelerometer.roll);
  //          console.log("  acceleration : ", this.accelerometer.acceleration);
  //          console.log("  inclination  : ", this.accelerometer.inclination);
  //          console.log("  orientation  : ", this.accelerometer.orientation);
  //          console.log("--------------------------------------");
  //
  //          console.log("Gyroscope");
  //          console.log("  x            : ", this.gyro.x);
  //          console.log("  y            : ", this.gyro.y);
  //          console.log("  z            : ", this.gyro.z);
  //          console.log("  pitch        : ", this.gyro.pitch);
  //          console.log("  roll         : ", this.gyro.roll);
  //          console.log("  yaw          : ", this.gyro.yaw);
  //         console.log("  rate         : ", this.gyro.rate);
  //          console.log("  isCalibrated : ", this.gyro.isCalibrated);
  //         console.log("--------------------------------------");
  //       });
});

