let capture;

const videoElement = document.getElementsByClassName('input_video')[0];

videoElement.style.opacity = 0;
videoElement.style.position = "absolute";
videoElement.style.zIndex = -200; // "send to back"

const canvasElement = document.getElementsByClassName('output_canvas')[0];
canvasElement.style.position = "absolute";
canvasElement.style.zIndex = -100; // "send to front"
canvasElement.style.transform = 'scale(-1,1)';

const canvasCtx = canvasElement.getContext('2d');

const hands = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  }
});
hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.8,
  minTrackingConfidence: 0.8
});
hands.onResults(onResults);

const webcam = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({
      image: videoElement
    });
  },
  width: 640,
  height: 480
});
webcam.start();

colors = ['rgb(40, 32, 68)',
'rgb(55, 42, 80)',
'rgb(85, 56, 100)',
'rgb(141, 92, 131)',
'rgb(202, 124, 152)',
'rgb(255, 161, 155)',
'rgb(255, 190, 137)'];

let cnv, radius;
let fingers = [];

function setup() {
  createCanvas(1024, 768);
  cnv = createGraphics(1024, 768);
  cnv.noStroke();
  //cnv.strokeCap(ROUND);
  cnv.colorMode(HSB);

  
  background(0,0,0,200);
  //cnv.background(colors[0]);
  
  for (let i = 1; i <=5; i++) {
    fingers.push(new finger(i));
  }
  
}


function draw() {
  radius = 2 + abs( 10 * sin(frameCount/20) );
  //cnv.strokeWeight(radius);

  fingers[1].draw();
  
  image(cnv, 0, 0);

}

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiHandLandmarks) {
    
    //fingertips = [];

    for (const landmarks of results.multiHandLandmarks) {
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
        color: 'rgba(255,20,20,0.5)',
        lineWidth: 2
      });
      
      for (let i = 1; i <= 5; i++) {
        fingers[i - 1].update(1.0 - landmarks[4*i].x, landmarks[4*i].y);
        fingers[i - 1].wasUpdated = true;
      }

      /*
      drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 1});
      */
    }
  } else {
      for (let i = 1; i <= 5; i++) {
        fingers[i - 1].wasUpdated = false;
      }    
  }
  canvasCtx.restore();
}


function finger(index) {
  
  this.x = NaN;
  this.y = NaN;
  this.prevx = NaN;
  this.prevy = NaN;
  this.wasUpdated = false;

  this.index = index;
  this.smoothing = 0.9;

  this.update = function(x, y) {
    this.prevx = this.x;
    this.prevy = this.y;
    
    this.x = this.x ? this.smoothing * this.x + (1 - this.smoothing) * x : x;
    this.y = this.y ? this.smoothing * this.y + (1 - this.smoothing) * y : y;
  };

  this.draw = function() {
    if (this.x && this.y && this.wasUpdated) {
        //cnv.stroke(colors[this.index + 1]);
        let angle = atan2(this.y - this.prevy, this.x - this.prevx) - PI/4;

        let deltax = radius * cos(angle);
        let deltay = radius * sin(angle);

        let steps = dist(width*this.x, height*this.y, width*this.prevx, height*this.prevy);

        for (let n = 0; n < steps; n++) {
            for (let i=0; i <= 5; i++) {
              let x = map(n,0,steps,this.prevx,this.x);
              let y = map(n,0,steps,this.prevy,this.y);
              cnv.fill(55 - 3*i, 80, 100);          
              cnv.circle(width * x - deltax/2 + deltax * i/5,
                height * y - deltay/2 + deltay * i/5,
                radius/2);
            }
        }

    }
  };
}