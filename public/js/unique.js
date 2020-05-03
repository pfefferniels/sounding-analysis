var vrvToolkit = new verovio.toolkit();

var recordingBuffers = {};
var recordingIsPlaying = {};
var recordingNodes = {};
var gainNodes = {}

async function playOrStopRecording(name) {
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
    adjustPageHeight: 1,
    pageHeight: 20000
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
  $('#bf').on('change', function() {
    toggleStaff(5, $(this).is(':checked'));
    gainNodes['bf'].gain.value = $(this).is(':checked') ? 1.0 : 0.0;
  });

  $('#bc').change(function() {
    toggleStaff(4, $(this).is(':checked'));
    gainNodes['bc'].gain.value = $(this).is(':checked') ? 1.0 : 0.0;
  });

  $('#bfRealization').change(function() {
    toggleStaff(3, $(this).is(':checked'));
    gainNodes['accordes'].gain.value = $(this).is(':checked') ? 1.0 : 0.0;
  });

  $('#rh').change(function() {
    toggleStaff(1, $(this).is(':checked'));
    toggleStaff(2, $(this).is(':checked'));
    gainNodes['original'].gain.value = $(this).is(':checked') ? 1.0 : 0.0;
  });

  audioContext = new AudioContext();

  for (name of ['bf', 'bc', 'accordes', 'original']) {
    gainNodes[name] = audioContext.createGain();
    gainNodes[name].gain.value = 0.0;
    gainNodes[name].connect(audioContext.destination);
  }

  loadRecording('bf', 'data/unique/basse-fondamentale.ogg');
  loadRecording('bc', 'data/unique/basse-continue.ogg');
  loadRecording('accordes', 'data/unique/accordes.ogg');
  loadRecording('original', 'data/unique/original.ogg');

  $.when($.ajax('data/unique/score.mei'))
   .done(function(score) {
     renderScoreWithBF(score);

     $('.measure').each(function() {
       $(this).find('.staff').attr('opacity', '0.2');
     });
     $('.harm').attr('opacity', '0.5');

     for (name of ['#bf', '#bc', '#bfRealization', '#rh']) {
       $(name).prop('checked', true);
       $(name).trigger('change');
     }
   });

   $('#start').on('click', function() {
     if (Object.keys(recordingBuffers).length != 4) {
       $('<p>Sound still loading, try again in a few seconds</p>')
          .appendTo('#play')
          .delay(1500)
          .fadeOut(300);
        return;
     }
     $('#play i').toggle();

     playOrStopRecording('bf');
     playOrStopRecording('bc');
     playOrStopRecording('accordes');
     playOrStopRecording('original');
   });

   $('#stop').on('click', function() {
     $('#play i').toggle();
     for (name of ['bf', 'bc', 'accordes', 'original']) {
       playOrStopRecording();
     }
   });
});
