const { spawn } = require('child_process');

module.exports.start = function(rtmpURL) {

  const ffmpegCreate = function(runningCB) {
    const ffmpeg = spawn('sh', ['-c', `ffmpeg -i tcp://127.0.0.1:8181?listen -c:v libx264  -preset ultrafast -tune zerolatency -an  -c:v copy -c:a aac -ar 44100 -f flv ${rtmpURL}`]);
    
    ffmpeg.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
  
    ffmpeg.stderr.on('data', (data) => {
      if (data.toString().startsWith('ffmpeg version')) {
        setTimeout(runningCB, 1000);
      }
      console.log(`stderr: ${data}`);
    });
  
    ffmpeg.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });
    
    return ffmpeg;
  };

  const picamCreate = function() {
    const picam = spawn('sh', ['-c', '~/picam/picam --alsadev hw:1,0 -w 1408 -h 792 --fps 24 --rotation 180 --tcpout tcp://127.0.0.1:8181']);
    
    picam.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
  
    picam.stderr.on('data', (data) => {
      console.log(`stderr: ${data}`);
    });
  
    picam.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
    });
    
    return picam;
  };

  const ffmpeg = ffmpegCreate(() => {
    const picam = picamCreate();
  });
  
};
