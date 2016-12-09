var fetch = require('node-fetch')
var setCookie = require('set-cookie-parser')
var u = require('underscore')
var helper = require('./helper')

const UA = 'user-agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_2) '
    + 'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.75 Safari/537.36'

const DEBUG = false

exports.login = function (username, password) {
    return prepareCookie().then(function (cookies) {
        return makeLogin(cookies, username, password)
    }).then(function (cookies) {
        return refreshHomePage(cookies)
    }).then(function (cookies) {
        return helper.writeCookieByUserName(username, helper.stringifyParams(cookies, '; '))
    })
}


function prepareCookie() {
    return fetch('https://www.instagram.com/', {
        method: 'GET',
        headers: {
            'user-agent': UA
        }
    }).then(function (res) {
        DEBUG && console.log('\nprepareCookie', res.headers.raw())
        return Promise.resolve(filterCookie(res.headers.getAll('set-cookie')))
    })
}

function filterCookie(setCookies) {
    return setCookie.parse(setCookies).reduce(function (alive, {name, value, expires}) {
        if (expires.getTime() > Date.now()) {
            alive[name] = decodeURIComponent(value)
        }
        return alive
    }, {})
}

function makeLogin(cookies, username, password) {
    cookies.ig_pr = 1
    cookies.ig_vw = 1368

    let headers = {
        'user-agent': UA,
        'referer': 'https://www.instagram.com/',
        'x-instagram-ajax': 1,
        'x-requested-with': 'XMLHttpRequest',
        'authority': 'www.instagram.com',
        'origin': 'https://www.instagram.com',
        'pragma': 'no-cache',
        'content-type': 'application/x-www-form-urlencoded',
        'cookie': helper.stringifyParams(cookies, '; ')
    }

    if (cookies.csrftoken) {
        headers['x-csrftoken'] = cookies.csrftoken
    }

    let body = helper.stringifyParams({username, password})

    return fetch('https://www.instagram.com/accounts/login/ajax/', {
        method: 'POST',
        headers,
        body
    }).then(function (res) {
        DEBUG && console.log('\nmakeLogin', res.headers.raw())

        let loginedCookies = filterCookie(res.headers.getAll('set-cookie'))
        loginedCookies = u.extend({
            igfl: username,
            ds_user: username
        }, cookies, loginedCookies);

        return Promise.all([
            Promise.resolve(loginedCookies),
            res.json()
        ])
    }).then(function ([cookies, json]) {
        DEBUG && console.log('Login attempt: %s\t%s', username, JSON.stringify(json))

        if (json.authenticated) {
            return Promise.resolve(cookies)
        }
        return Promise.reject('Fail to login')
    })
}

function refreshHomePage(cookies) {
    return fetch('https://www.instagram.com/', {
        method: 'GET',
        headers: {
            'user-agent': UA,
            'referer': 'https://www.instagram.com/',
            'cookie': helper.stringifyParams(cookies, '; ')
        },
        redirect: 'manual'
    }).then(function (res) {
        DEBUG && console.log('\nrefreshHomePage', res.headers.raw())

        let loginedCookies = filterCookie(res.headers.getAll('set-cookie'))
        if (loginedCookies.sessionid) {
            return Promise.resolve(u.extend(cookies, loginedCookies))
        }
        return Promise.reject('Fail to validate login status')
    })
}




