$(document).ready(function() {
  $.when($.ajax('data/sommerfugl/grieg_1903.svl'),
         $.ajax('data/sommerfugl/grieg_butterfly.mei'))
   .done(function(instants, score) {
     loadRecording('data/sommerfugl/grieg_1903.ogg');
     renderScore(score[0]);
     renderTimeInstants(instants[0]);
  });


  $('#play').on('click', playRecording);

  $('#zoom-in').on('click', function() {
    $('.canvas').each(function() {
      let width = $(this).css('width');
      $(this).css('width', parseInt(width,10)*1.2);
    });
  });

  $('#zoom-out').on('click', function() {
    $('.canvas').each(function() {
      let width = $(this).css('width');
      $(this).css('width', parseInt(width,10)*0.8);
    });
  });
});
