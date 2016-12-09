
var fs = require('fs')
var path = require('path')
var config = require('./config')

exports.validateAuth = function (userName, userToken) {
  return (userName ? Promise.resolve() : Promise.reject('empty user name'))
    .then(function () {
      return generateVerifyTokenFromUserName(userName) === userToken
        ? Promise.resolve()
        : Promise.reject('illegal token')
    })
}

const COOKIES_DIR = path.join(__dirname, 'cookies');

function getCookiePathByUserName(userName) {
  let cookiePath = path.resolve(COOKIES_DIR, userName.replace(/\./g, '-'))
  if (cookiePath.indexOf(COOKIES_DIR) !== 0) {
    throw new Error('Illegal user name')
  }
  return cookiePath;
}

exports.readCookieByUserName = function (userName) {
  return new Promise(function (resolve, reject) {
    fs.readFile(getCookiePathByUserName(userName), 'utf8', function (err, content) {
      if (err) {
        reject('wrong user name')
        return
      }

      resolve(content.trim())
    })
  })
}

exports.writeCookieByUserName = function (userName, content) {
  return new Promise(function (resolve, reject) {
    fs.writeFile(getCookiePathByUserName(userName), content, function (err) {
      if (err) {
        reject('fail to save user token')
        return
      }

      resolve()
    })
  })
}

function generateVerifyTokenFromUserName(userName) {
  return config.encodeUserName(userName)
}
exports.generateVerifyTokenFromUserName = generateVerifyTokenFromUserName

exports.stringifyParams = function (params, joiner = '&') {
  return Object.keys(params).map(key => `${key}=${encodeURIComponent(params[key])}`).join(joiner)
}
