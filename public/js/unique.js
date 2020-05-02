var vrvToolkit = new verovio.toolkit();

var recordingBuffers = {};
var recordingIsPlaying = {};
var recordingNodes = {};
var gainNodes = {}

function playRecording(name) {
  if (recordingNodes[name] == null || !recordingNodes[name]) {
    recordingNodes[name] = audioContext.createBufferSource();
    recordingNodes[name].connect(gainNodes[name]);
    recordingNodes[name].buffer = recordingBuffers[name];
  }

  if (!recordingIsPlaying[name]) {
    recordingNodes[name].start();
    recordingIsPlaying[name] = true;
  } else {
    recordingNodes[name].stop();
    recordingIsPlaying[name] = false;
    recordingNodes[name] = null;
  }
}

function loadRecording(name, path) {
	let xhr = new XMLHttpRequest();

	return new Promise(function (resolve, reject) {
    xhr.onload = function(e) {
      if (this.status == 200) {
        audioContext.decodeAudioData(xhr.response, function(buffer) {
          recordingBuffers[name] = buffer;
        }, function() {
          console.log('failed decoding audio data');
        });
      }
    };

    xhr.open('GET', path, true);
    xhr.responseType = 'arraybuffer';
		xhr.send();
	});
};


function renderScoreWithBF(mei) {
  let svg = vrvToolkit.renderData(mei, {
    svgViewBox: 1,
    footer: 'none',
    adjustPageHeight: 1
  });

  $("#mei_canvas").html(svg);
}

function toggleStaff(n, onOff) {
  if (onOff) {
    $('.measure').each(function() {
      $(this).find('.staff')[n-1].setAttribute('opacity', '1');
    });
    return;
  }
  $('.measure').each(function() {
    $(this).find('.staff')[n-1].setAttribute('opacity', '0.2');
  });
}

$(document).ready(function() {
  audioContext = new AudioContext();

  for (name of ['bf', 'bc', 'bf-realization', 'rh']) {
    gainNodes[name] = audioContext.createGain();
    gainNodes[name].gain.value = 0.0;
    gainNodes[name].connect(audioContext.destination);

  }

  loadRecording('bf', 'data/unique/bf.ogg');
  loadRecording('bc', 'data/unique/bc.ogg');
  loadRecording('bf-realization', 'data/unique/bf-realization.ogg');
  loadRecording('rh', 'data/unique/rh.ogg');

  $.when($.ajax('data/unique/score.mei'))
   .done(function(score) {
     renderScoreWithBF(score);

     $('.measure').each(function() {
       $(this).find('.staff').attr('opacity', '0.2');
     });
     $('.harm').attr('opacity', '0.2');

     $('#bf').change(function() {
       toggleStaff(3, $(this).is(':checked'));
       gainNodes['bf'].gain.value = $(this).is(':checked') ? 1.0 : 0.0;
     });

     $('#bc').change(function() {
       toggleStaff(2, $(this).is(':checked'));
       gainNodes['bc'].gain.value = $(this).is(':checked') ? 1.0 : 0.0;
     });

     $('#bfRealization').change(function() {
       toggleStaff(3, $(this).is(':checked'));
       gainNodes['bf-realization'].gain.value = $(this).is(':checked') ? 1.0 : 0.0;
     });

     $('#rh').change(function() {
       toggleStaff(1, $(this).is(':checked'));
       gainNodes['rh'].gain.value = $(this).is(':checked') ? 1.0 : 0.0;
     });
   });


   $('#start').on('click', function() {
     playRecording('bf');
     playRecording('bc');
     playRecording('rh');
     playRecording('bf-realization');
   });

});
