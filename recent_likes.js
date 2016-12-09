var fetch = require('node-fetch')
var helper = require('./helper')

// const INS_ENDPOINT = 'http://127.0.0.1:8403/';
const INS_ENDPOINT = 'https://i.instagram.com';

exports.read = function (userName, userToken) {
  return helper.validateAuth(userName, userToken)
    .then(function () {
      return helper.readCookieByUserName(userName)
    })
    .then(function (cookie) {
      return fetchMoreRecentLikes(cookie, {}, 1)
    })
}

function fetchRecentLikes(cookie, params) {
  var headers = {
    'x-ig-capabilities': '3wo=',
    'user-agent': 'Instagram 10.0.1 (iPhone9,1; iOS 10_1_1; zh_CN; zh-Hans-CN; scale=2.00; 750x1334) AppleWebKit/420+',
    'x-ig-connection-type': 'WiFi',
    'cookie': cookie
  };

  return fetch(INS_ENDPOINT + '/api/v1/feed/liked/?' + helper.stringifyParams(params), {
    method: 'GET',
    headers
  }).then(function (res) {
    return res.json();
  }).then(function (json) {
    if (json.status !== 'ok') {
      return Promise.reject(json.message)
    }
    return Promise.resolve(json)
  })
}

function fetchMoreRecentLikes(cookie, params, count = 1) {
  return fetchRecentLikes(cookie, params).then(function (json) {
    if (count > 1 && json.more_available) {
      return fetchMoreRecentLikes(cookie, {
        max_id: json.next_max_id
      }, count - 1).then(function (items) {
        return Promise.resolve(json.items.concat(items));
      })
    }
    return Promise.resolve(json.items)
  })
}


