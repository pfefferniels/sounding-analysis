let vrvToolkit = new verovio.toolkit();
let audioBuffer;
points = [];

function playAudioAtFrame(offset, duration) {
  let source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioContext.destination);
  source.start(0, offset/frameRate, duration/frameRate);
}

let xhr = new XMLHttpRequest();
xhr.open('GET', 'grieg_1903.ogg', true);
xhr.responseType = 'arraybuffer';

xhr.onload = function(e) {
  if (this.status == 200) {
    audioContext.decodeAudioData(xhr.response, function(buffer) {
      audioBuffer = buffer;
    }, function() {
      console.log('failed decoding audio data');
    });
  }
};

xhr.send();

$.ajax({
  url: 'grieg_1903.svl',
  dataType: 'text',
  success: function (data) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'application/xml');
    $(doc).find('point').each(function() {
      points.push({
        frame: parseInt($(this).attr('frame'), 10),
        corresp: $(this).attr('label')
      });
    });

    let draw = SVG().addTo('#svl_canvas');

    let factor = 5;
    let marginBottom = 40000;

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
           attr({
            'cursor': 'pointer',
            'fill': 'gray',
            'stroke': '#000',
            'stroke-width': 100
           }).
           id(corresp.slice(1) + '_instant').
           on('mouseover', function() {
             SVG(corresp).opacity(0.1).animate().opacity(1);
           }).
           on('click', function() {
             playAudioAtFrame(points[i].frame, diff[i])
           });
    }

    // draw crotchets
    let barCount = 1;
    for (let i=0; i<points.length-4; i+=4) {
      let meterPos = (i/4)%4+1;
      let verticalDiff = diff2[i/4] * factor;

      let rect = draw.rect(diff2[i/4], verticalDiff).
                      move(points[i].frame, maxDiff - verticalDiff).
                      attr({
                        'cursor': 'pointer',
                        'fill-opacity': 0.1,
                        'stroke': '#000',
                        'stroke-width': 300
                      }).
                      on('mouseover', function() {
                        for (j=0; j<4; j++) {
                          SVG(points[i+j].corresp).opacity(0.1).animate().opacity(1);
                        }
                      }).
                      on('click', function() {
                        playAudioAtFrame(points[i].frame, points[i+4].frame-points[i].frame);
                      }).
                      back();
      draw.plain(meterPos).move(rect.cx(), rect.cy()).font({size: 9999});
      if (meterPos == 4) {
        let x = points[i].frame + rect.width();
        draw.line(x, 0, x, maxDiff+marginBottom).attr({
          'stroke-width': 1000,
          'stroke': 'black',
          'stroke-dasharray': 3000 });
        let y = maxDiff+(marginBottom/2);
        draw.plain('b. ' + barCount).
             move(points[i-12].frame + (points[i].frame-points[i-12].frame)/2, y).
             font({size: 9999});
        draw.rect(x-points[i-12].frame, 20000).
             attr({
              'cursor': 'pointer',
              'fill': 'gray',
              'opacity': 0.1,
              'stroke-width': 1000,
              'stroke': 'black' }).
             move(points[i-12].frame, y-14000).
             on('mouseover', function() {
               for (j=0; j<16; j++) {
                 SVG(points[i+(j-12)].corresp).opacity(0.1).animate().opacity(1);
               }
             }).
             on('click', function() {
               playAudioAtFrame(points[i-12].frame, points[i+4].frame-points[i-12].frame);
             });
        barCount += 1;
      }
    }
  }
});

$.ajax({
  url: 'grieg_butterfly.mei',
  dataType: "text",
  success: function (data) {
    let svg = vrvToolkit.renderData(data, {
      pageWidth: 4000,
      svgViewBox: 1,
      scale: 120,
      footer: 'none',
      adjustPageHeight: 1,
      breaks: 'encoded'
      });
    $("#mei_canvas").html(svg);

    for (let i=0; i<points.length; i++) {
      let frame = points[i].frame;
      let corresp = $(points[i].corresp);
      if (corresp.length != 0) {
        corresp.on('mouseover', function() {
          let instantSelector = '#' + $(this).attr('id') + '_instant';
          let svg = SVG(instantSelector).opacity(0.1).animate().opacity(1);
        });
      }
    }
  }
});
