
exports.encodeUserName = function (userName) {
    let s = userName.split('')
        .map(c => String.fromCharCode((c.charCodeAt() + userName.length) % 128))
        .join('')
    return encodeURIComponent(s).replace(/%/g, '').toLowerCase()
}

exports.recaptcha = {
    site_key: '',
    secret_key: ''
}
