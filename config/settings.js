module.exports = {
    settings: {
        port: 3000,
        cookieLifeTime: 24*60*60*1000
    },
    session: {
        cookieSecret: "SecretForCookie",
        cookieName: "session"
    }
}