let vrvToolkit = new verovio.toolkit();

function highlight(el) {
  let svg = SVG(el);
  if (svg != null) {
    svg.opacity(0.1).animate().opacity(1);
  } else {
    console.log('no corresponding element', el);
  }
}

function playRecordingAtFrame(offset, duration) {
  let source = audioContext.createBufferSource();
  source.buffer = recordingBuffer;
  source.connect(audioContext.destination);
  source.start(0, offset/frameRate, duration/frameRate);
}

var recordingIsPlaying = false;
var recordingNode = null;
function playRecording() {
  if (recordingNode == null) {
    recordingNode = audioContext.createBufferSource();
    recordingNode.connect(audioContext.destination);
    recordingNode.buffer = recordingBuffer;
  }

  if (!recordingIsPlaying) {
    recordingNode.start(0, points[0].frame/frameRate);
    recordingIsPlaying = true;
  } else {
    recordingNode.stop();
    recordingIsPlaying = false;
    recordingNode = null;
  }
}

// load the recording ($.ajax is not usable with 'arraybuffer' as response type)
function loadRecording(path) {
	let xhr = new XMLHttpRequest();

	return new Promise(function (resolve, reject) {
    xhr.onload = function(e) {
      if (this.status == 200) {
        audioContext.decodeAudioData(xhr.response, function(buffer) {
          recordingBuffer = buffer;
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

function renderTimeInstants(data) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'application/xml');
  $(doc).find('point').each(function() {
    points.push({
      frame: parseInt($(this).attr('frame'), 10),
      corresp: $(this).attr('label')
    });
  });

  let draw = SVG().addTo('#svl_canvas');

  let factor = 5; // width and height of every stem are in a fixed ratio
  let marginBottom = 40000; // height of a margin added below the skyline graphic
                            // for displaying measure boxes

  // duration of semiquavers
  let diff = [];
  for (let i=0; i<points.length-1; i++) {
    diff.push(points[i+1].frame - points[i].frame);
  }

  // duration of crotchets
  let diff2 = [];
  for (let i=0; i<points.length-4; i+=4) {
    diff2.push(points[i+4].frame - points[i].frame);
  }

  let maxDiff = Math.max(...diff2) * factor;
  let maxFrame = points[points.length-1].frame;
  let minFrame = points[0].frame;
  draw.viewbox(minFrame, 0, maxFrame, maxDiff+marginBottom);

  // draw semiquavers
  for (let i=0; i<points.length-1; i++) {
    let corresp = points[i].corresp;
    let verticalDiff = diff[i] * factor;

    if (corresp == 'inaudible' || corresp == 'virtual') {
      continue;
    }

    draw.rect(diff[i], verticalDiff).
         move(points[i].frame, maxDiff - verticalDiff).
         attr('class', 'bar semiquaver').
         id(corresp.slice(1) + '_instant').
         on('mouseover', function() {
           highlight(corresp);
         }).
         on('click', function() {
           playRecordingAtFrame(points[i].frame, diff[i])
         });
  }

  // draw crotchets
  let measures = SVG.find('.measure');
  let avgMeasureWidth = (maxFrame/measures.length);
  let shift = 0;
  let barCount = 1;
  let prevL = 0;
  for (let i=0; i<points.length-4; i+=4) {
    let meterPos = (i/4)%4+1;
    let verticalDiff = diff2[i/4] * factor;

    let rect = draw.rect(diff2[i/4], verticalDiff).
                    move(points[i].frame, maxDiff - verticalDiff).
                    attr('class', 'bar crotchet').
                    on('mouseover', function() {
                      for (j=0; j<4; j++) {
                        highlight(points[i+j].corresp);
                      }
                    }).
                    on('click', function() {
                      playRecordingAtFrame(points[i].frame, points[i+4].frame-points[i].frame);
                    }).
                    back();
    draw.plain(meterPos).move(rect.cx(), rect.cy()).font({size: 9999});

    // after every fourth beat, draw vertical line as a bar line
    // and scale size of that measure in the score according to its
    // length in the recording.
    if (meterPos == 4) {
      let x = points[i].frame + rect.width();
      let measureWidth = x - points[i-12].frame;
      let el = measures[barCount - 1];
      let scale = measureWidth / avgMeasureWidth;
      let width = el.bbox().width;
      let l = (width - scale * width) / 2
      shift -= prevL + l;
      el.transform({
        scale: scale
      });
      el.translate(shift, 0);
      prevL = l;

      draw.line(x, 0, x, maxDiff+marginBottom).attr('class', 'barline');
      let y = maxDiff+(marginBottom/2);
      draw.plain('b. ' + barCount).
           move(points[i-12].frame + (points[i].frame-points[i-12].frame)/2, y).
           font({size: 9999});
      draw.rect(measureWidth, 20000).
           attr('class', 'bar measurebox').
           move(points[i-12].frame, y-14000).
           on('mouseover', function() {
             for (j=0; j<16; j++) {
               highlight(points[i+(j-12)].corresp);
             }
           }).
           on('click', function() {
             playRecordingAtFrame(points[i-12].frame, points[i+4].frame-points[i-12].frame);
           });
      barCount += 1;
    }
  }
}

function renderScore(data) {
  let svg = vrvToolkit.renderData(data, {
    pageWidth: 20000,
    svgViewBox: 1,
    footer: 'none',
    adjustPageHeight: 1,
    breaks: 'encoded',
    spacingNonLinear: 1.0
    });
  $("#mei_canvas").html(svg);
  $('.pgHead').hide();
  for (let i=0; i<3; i++) {
    $('.system>path:nth-child(' + (i+1) + ')').hide();
  }

  for (let i=0; i<points.length; i++) {
    let frame = points[i].frame;
    let corresp = $(points[i].corresp);
    if (corresp.length != 0) {
      corresp.on('mouseover', function() {
        let instantSelector = '#' + $(this).attr('id') + '_instant';
        highlight(instantSelector);
      });
    }
  }

  let viewbox = $('#mei_canvas>svg').attr('viewBox').split(' ');
  viewbox[3] = parseInt(viewbox[3],10)*2;
  $('#mei_canvas>svg').attr('viewBox', viewbox.join(' '));
}
