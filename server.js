const express = require('express');

// express.js setup
const app = express();
app.use(express.static(__dirname + '/public'));

app.set('view engine', 'pug');
app.set('views', './views');

app.get('/', function(req, res) {
  res.render('index');
});

app.listen(process.env.PORT || 3000, function() {
  console.log('Listening');
});
