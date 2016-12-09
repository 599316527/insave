var http = require('http');
var express = require('express');
var app = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fetch = require('node-fetch');
var helper = require('./helper')
var recentLikes = require('./recent_likes');
var insAccount = require('./ins_account');
var config = require('./config');

const SERVER_PORT = 8402;

app.set('views', './views');
app.set('view engine', 'pug');

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));

exports.home_page = function (req, res) {
  res.status(404);
  res.render('login_ins', {recaptcha: config.recaptcha});
};

exports.login_ins = function (req, res) {
  let {username, password} = req.body
  let recaptchaCode = req.body['g-recaptcha-response']

  helper.validateRecaptcha(recaptchaCode)
    .then(function () {
      return insAccount.login(username, password)
    })
    .then(function (data) {
      res.json({
        status: 'ok',
        message: '',
        result: {
          username,
          token: helper.generateVerifyTokenFromUserName(username)
        }
      })
    })
    .catch(function (err) {
      res.json({
        status: 'error',
        message: err instanceof Error ? `[${err.name}] ${err.message}` : err
      })
    });
};

exports.recent_likes = function (req, res) {
  let {user, token} = req.params;
  recentLikes.read(user, token)
    .then(function (items) {
      res.type('text/html')
      res.render('recent_likes', {user, items});
    })
    .catch(function (msg) {
      res.status(500);
      res.render('error_page', {msg});
    });
};

exports.recent_likes_xml = function (req, res) {
  let user = req.params.user
  recentLikes.read(user, req.query.token)
    .then(function (items) {
      res.type('text/xml')
      res.render('recent_likes_xml', {user, items});
    })
    .catch(function (msg) {
      res.status(500);
      res.render('error_page', {msg});
    });
};

app.get('/', exports.home_page);
app.post('/login_ins', exports.login_ins);
app.get('/recent_likes/:user/:token', exports.recent_likes);
app.get('/recent_likes/:user.xml', exports.recent_likes_xml);

http.createServer(app).listen(SERVER_PORT, function(){
  console.log("Express server listening on port " + SERVER_PORT);
});

