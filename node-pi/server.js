//const camera = require('./camera');
//const ss = require('socket.io-stream');
//const spawn = require('child_process').spawn;
const motor = require('./motor.js');
const five = require('johnny-five');
const PiIO = require('pi-io');
//let canDrive = true;

const socket = require('socket.io-client')('ws://rpi-lhl-final.herokuapp.com');
//const stream  = ss.createStream();
//const child = spawn('/opt/vc/bin/raspivid', ['-hf', '-w', '1920', '-h', '1080', '-t', '0', '-fps', '24', '-b', '5000000', '-o', '-']);

socket.on('connect', () => {
    console.log('Connected web server');
    socket.emit('carConnected', { carId: 1 });
})

//const video = raspivid();

socket.on('disconnect', () => {
    console.log('Disconnected from web server');
})

//ss(socket).emit('videoStream', stream);
//video.pipe(stream);

socket.on('controlsOutput', (data) => {
    console.log('Received controls');
    console.log(data);
    const controls = data;
    let direction = controls.direction;
    let turn = controls.turn;
    console.log(direction);
    if(turn > 0) {
      motor.right();
    } else if (turn < 0) {
      motor.left();
    } else if (direction > 0) {
      //if (canDrive) {
         motor.forward();
      //}
     } else if (direction < 0) {
         motor.reverse();
     } else {
       motor.stop();
     }
});

let previousCheck = 0;

const board =  new five.Board({io: new PiIO()});
board.on('ready', () => {
  const proximity = new five.Proximity({
    controller: PiIO.HCSR04,
    triggerPin: 'GPIO23',
    echoPin: 'GPIO24'
  });
  proximity.on('change', function() {
    console.log(`cm: ${this.cm} && prev check: ${previousCheck}`);
    if (this.cm <= 40 && previousCheck <= 40) {
      //canDrive = false;
      motor.setObstructed(true);
    } else {
      //canDrive = true;
      motor.setObstructed(false);
    }
    previousCheck = this.cm;
    socket.emit('newDistance', { carId: 1, distance: this.cm });
  });
});

