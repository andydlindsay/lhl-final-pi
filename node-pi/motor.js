const gpio = require('onoff').Gpio;

const ma = new gpio(22, 'out');
const pwma = new gpio(17, 'out');
const mb = new gpio(27, 'out');
const pwmb = new gpio(22, 'out');
let obstructed = false;

//pwma.writeSync(1)

exports.setObstructed = function(value) {
  obstructed = value;
}

function logSignals() {
  console.log(`pwma = ${pwma.readSync()}, pwmb = ${pwmb.readSync()}, ma = ${ma.readSync()}, mb = ${mb.readSync()}`);
}

exports.forward = function() {
  if (!obstructed) {
    pwma.writeSync(1);
    pwmb.writeSync(1);
    ma.writeSync(1);
    mb.writeSync(1);
    logSignals();
  } else {
    pwma.writeSync(0);
    pwmb.writeSync(0);
  }
}

exports.reverse = function() {
  pwma.writeSync(1);
  pwmb.writeSync(1);
  ma.writeSync(0);
  mb.writeSync(0);
  logSignals();
}

exports.right = function() {
  pwma.writeSync(1);
  pwmb.writeSync(1);
  ma.writeSync(1);
  mb.writeSync(0);
  logSignals();
}

exports.left = function() {
  pwma.writeSync(1);
  pwmb.writeSync(1);
  ma.writeSync(0);
  mb.writeSync(1);
  logSignals();
}

exports.forwardRight = function() {
  pwmb.writeSync(1);
  setInterval(() => {
    pwma.writeSync(!pwmb.readSync);
  }, 50);
  ma.writeSync(1);
  mb.writeSync(1);
}

exports.forwardLeft = function() {
  pwma.writeSync(1);
  setInterval(() => {
    pwmb.writeSync(!pwmb.readSync);
  }, 50);
  ma.writeSync(1);
  mb.writeSync(1);
}

exports.stop = function() {
  pwma.writeSync(0);
  pwmb.writeSync(0);
  ma.writeSync(0);
  mb.writeSync(0);
}
