let audioContext;
let canvasControl;
let scene;
let audioElements = [];
let soundSources = [];
let sourceIds = ['sourceAButton', 'sourceBButton', 'sourceCButton', 'sourceDButton', 'sourceEButton'];
let dimensions = {
  small: {
    width: 1.5, height: 2.4, depth: 1.3,
  },
  medium: {
    width: 4, height: 3.2, depth: 3.9,
  },
  large: {
    width: 8, height: 3.4, depth: 9,
  },
  huge: {
    width: 20, height: 10, depth: 20,
  },
};
let materials = {
  brick: {
    left: 'brick-bare', right: 'brick-bare',
    up: 'brick-bare', down: 'wood-panel',
    front: 'brick-bare', back: 'brick-bare',
  },
  curtains: {
    left: 'curtain-heavy', right: 'curtain-heavy',
    up: 'wood-panel', down: 'wood-panel',
    front: 'curtain-heavy', back: 'curtain-heavy',
  },
  marble: {
    left: 'marble', right: 'marble',
    up: 'marble', down: 'marble',
    front: 'marble', back: 'marble',
  },
  outside: {
    left: 'transparent', right: 'transparent',
    up: 'transparent', down: 'grass',
    front: 'transparent', back: 'transparent',
  },
};
let dimensionSelection = 'huge';
let materialSelection = 'marble';
let audioReady = false;

/**
 * @private
 */
function selectRoomProperties() {
  if (!audioReady)
    return;

  dimensionSelection = 'huge';
  materialSelection = 'marble';
  canvasControl.invokeCallback();
}

/**
 * @param {Object} elements
 * @private
 */
function updatePositions(elements) {
  if (!audioReady)
    return;

  for (let i = 0; i < elements.length; i++) {
    let x = (elements[i].x - 0.5) * dimensions[dimensionSelection].width / 2;
    let y = 0;
    let z = (elements[i].y - 0.5) * dimensions[dimensionSelection].depth / 2;
    if (i < elements.length - 1) {
      soundSources[i].setPosition(x, y, z);
    } else {
      scene.setListenerPosition(x, y, z);
    }
  }
}

/**
 * @private
 */
function initAudio() {
  audioContext = new (window.AudioContext || window.webkitAudioContext);
  let audioSources = [
    'data/schenker/ursatz.wav',
    'data/schenker/erste-schicht.wav',
    'data/schenker/vordergrund.wav',
    'data/schenker/mittelgrund.wav',
    'data/schenker/real.wav'
  ];
  let audioElementSources = [];
  for (let i = 0; i < audioSources.length; i++) {
    audioElements[i] = document.createElement('audio');
    audioElements[i].src = audioSources[i];
    audioElements[i].crossOrigin = 'anonymous';
    audioElements[i].load();
    audioElements[i].loop = true;
    audioElementSources[i] =
      audioContext.createMediaElementSource(audioElements[i]);
  }

  // Initialize scene and create Source(s).
  scene = new ResonanceAudio(audioContext, {
    ambisonicOrder: 1,
  });
  for (let i = 0; i < audioSources.length; i++) {
    soundSources[i] = scene.createSource();
    audioElementSources[i].connect(soundSources[i].input);
  }
  scene.output.connect(audioContext.destination);

  audioReady = true;
}

let onLoad = function() {
  // Initialize play button functionality.
  let button = document.getElementById('playAll');
  button.addEventListener('click', function(event) {
    switch (event.target.textContent) {
      case 'Play': {
        if (!audioReady) {
          initAudio();
        }
        event.target.textContent = 'Pause';
        for (let i = 0; i < sourceIds.length; i++) {
          audioElements[i].play();
        }
      }
      break;
      case 'Pause': {
        event.target.textContent = 'Play';
        for (let i = 0; i < sourceIds.length; i++) {
          audioElements[i].pause();
        }
      }
      break;
    }
  });

  //function scaleBetween(unscaledNum, minAllowed, maxAllowed, min, max) {
  //  return (maxAllowed - minAllowed) * (unscaledNum - min) / (max - min) + minAllowed;
  //}
  //const pHeight = window.innerHeight;
  //const pWidth = window.innerWidth;

  //document.addEventListener('mousemove', function (event) {
  //  if (!scene) {
  //    return;
  //  }
  //  let z = event.clientY * 30
  //  console.log('scaleBetween, x:', scaleBetween(event.clientX, 0, 60, 0, pWidth))
  //  console.log('scaleBetween, y:', scaleBetween(event.clientY, 0, 60, 0, pHeight))
  //  scene.setListenerPosition(scaleBetween(event.clientX, -30, 30, 0, pWidth),
  //                            scaleBetween(event.clientY, -30, 30, 0, pHeight),
  //                            scaleBetween(event.clientY, -30, 30, 0, pHeight))
  //})

  let canvas = document.getElementById('canvas');
  let elements = [
    {
      icon: 'sourceAIcon',
      x: 0.25,
      y: 0.25,
      radius: 0.04,
      alpha: 0.75,
      clickable: true,
    },
    {
      icon: 'sourceBIcon',
      x: 0.75,
      y: 0.25,
      radius: 0.04,
      alpha: 0.75,
      clickable: true,
    },
    {
      icon: 'sourceCIcon',
      x: 0.25,
      y: 0.75,
      radius: 0.04,
      alpha: 0.75,
      clickable: true,
    },
    {
      icon: 'sourceDIcon',
      x: 0.3,
      y: 0.3,
      radius: 0.04,
      alpha: 0.75,
      clickable: true,
    },
    {
      icon: 'sourceEIcon',
      x: 0.4,
      y: 0.4,
      radius: 0.04,
      alpha: 0.75,
      clickable: true,
    },
    {
      icon: 'listenerIcon',
      x: 0.5,
      y: 0.5,
      radius: 0.04,
      alpha: 0.75,
      clickable: true,
    },
  ];
  canvasControl = new CanvasControl(canvas, elements, updatePositions);

  selectRoomProperties();
};
window.addEventListener('load', onLoad);
