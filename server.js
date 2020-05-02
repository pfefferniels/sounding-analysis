const express = require('express');

// express.js setup
const app = express();
app.use(express.static(__dirname + '/public'));

app.set('view engine', 'pug');
app.set('views', './views');

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/sommerfugl', function(req, res) {
  res.render('sommerfugl');
});

app.get('/unique', function(req, res) {
  res.render('unique');
});

//app.get('/raphaele', function(req, res) {
//  res.render('raphaele');
//});


app.listen(process.env.PORT || 3002, function() {
  console.log('Listening');
});
