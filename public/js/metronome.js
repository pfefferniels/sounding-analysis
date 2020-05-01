const noteLength = 0.05;    // length of a beep in seconds
const scheduleAheadTime = 0.5; // How far ahead to schedule audio (sec)
                            // This is calculated from lookahead, and overlaps
                            // with next interval (in case the timer is late)
const lookahead = 25.0;     // How frequently to call scheduling function (in ms)

let unlocked = false;
let isPlaying = false;      // Are we currently playing?
let currentPoint;           // What note is currently last scheduled?
let nextNoteTime = 0.0;     // when the next note is due.
let lastPointDrawn = -1;    // the last "box" we drew on the screen
let notesInQueue = [];      // the notes that have been put into the web audio,
                            // and may or may not have played yet. {note, time}
let timerWorker = null;     // The Web Worker used to fire timer messages


// Add the duration of the current point and advance to the next time point
function nextNote() {
  let duration = (points[currentPoint+1].frame-points[currentPoint].frame) / frameRate;    // pick this from the points[]
  nextNoteTime += duration;

  currentPoint++;

  // When all the points were played, jump back to the beginning.
  if (currentPoint == points.length-1) {
      currentPoint = 0;
  }
}

function scheduleNote(beatNumber, time) {
  // push the note on the queue, even if we're not playing.
  notesInQueue.push({ note: beatNumber, time: time });

  // create an oscillator
  var osc = audioContext.createOscillator();
  osc.connect(audioContext.destination);

  if (beatNumber % 16 === 0) {
    osc.frequency.value = 880.0; // high pitch on 1st beat in measure
  }
  else if (beatNumber % 4 === 0 ) {
    osc.frequency.value = 500.0; // medium pitch on the quarter notes
  }
  else {
    osc.frequency.value = 0.0;  // low pitch on 16th notes
  }

  osc.start(time);
  osc.stop(time + noteLength);
}

function scheduler() {
  // while there are notes that will need to play before the next interval,
  // schedule them and advance the pointer.
  while (nextNoteTime < audioContext.currentTime + scheduleAheadTime) {
    scheduleNote(currentPoint, nextNoteTime);
    nextNote();
  }
}

function play() {
  if (!unlocked) {
    // play silent buffer to unlock the audio
    let buffer = audioContext.createBuffer(1, 1, 22050);
    let node = audioContext.createBufferSource();
    node.buffer = buffer;
    node.start(0);
    unlocked = true;
  }

  isPlaying = !isPlaying;

  if (isPlaying) { // start playing
      currentPoint = 0;
      nextNoteTime = audioContext.currentTime;
      timerWorker.postMessage("start");
  } else {
      timerWorker.postMessage("stop");
  }

  $('#play i').toggle();
}

function draw() {
  let currentNote = lastPointDrawn;
  const currentTime = audioContext.currentTime;

  while (notesInQueue.length && notesInQueue[0].time < currentTime) {
    currentNote = notesInQueue[0].note;
    notesInQueue.splice(0,1); // remove note from queue
  }

  // We only need to draw if the note has moved.
  if (lastPointDrawn != currentNote) {
    let svg = SVG(points[currentNote].corresp + '_instant');
    if (svg != null) {
      svg.opacity(0).animate().opacity(1);
    }
    svg = SVG(points[currentNote].corresp);
    if (svg != null) {
      svg.opacity(0).animate().opacity(1);
    }

    lastPointDrawn = currentNote;
  }

  // set up to draw again
  requestAnimationFrame(draw);
}

function init() {
  audioContext = new AudioContext();

  requestAnimationFrame(draw);

  timerWorker = new Worker("js/metronomeworker.js");
  timerWorker.onmessage = function(e) {
    if (e.data == "tick") {
      scheduler();
    }
    else {
      console.log("message: " + e.data);
    }
  };
  timerWorker.postMessage({"interval": lookahead});
}

$(document).ready(function() {
  init();

  $('#play').on('click', play);
});
