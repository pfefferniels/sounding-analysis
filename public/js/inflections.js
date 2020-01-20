let vrvToolkit = new verovio.toolkit();
points = [];

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
            'fill': 'gray',
            'stroke': '#000',
            'stroke-width': 100
           }).
           id(corresp.slice(1) + '_instant').
           on('mouseover', function() {
             SVG(corresp).opacity(0.1).animate().opacity(1);
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
                        'fill-opacity': 0.1,
                        'stroke': '#000',
                        'stroke-width': 300
                      }).
                      on('mouseover', function() {
                        for (j=0; j<4; j++) {
                          SVG(points[i+j].corresp).opacity(0.1).animate().opacity(1);
                        }
                      }).
                      back();
      draw.plain(meterPos).move(rect.cx(), rect.cy()).font({size: 9999});
      if (meterPos == 4) {
        let x = points[i].frame + rect.width();
        draw.line(x, 0, x, maxDiff+marginBottom).attr({
          'stroke-width': 1000,
          'stroke': 'black',
          'stroke-dasharray': 3000 });
        //draw.plain(barCount).
        //     move(points[i].frame - 0.5*points[i-15].frame, maxDiff + 0.5*marginBottom).
        //     font({size: 9999});
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
