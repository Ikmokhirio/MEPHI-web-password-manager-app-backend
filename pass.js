const pass = require('passport')
const LocalStrategy = require('passport-local').Strategy
const CookieStrategy = require('passport-cookie').Strategy
const User = require('./database').User
const cookieName = require('./config/settings').session.cookieName
const createNewUser = require('./database').createNewUser
const isUserExist = require('./database').isUserExist
const getUserPassword = require('./database').getUserPassword
const findUserById = require('./database').findUserById
const findUser = require('./database').findUser
const argon = require('argon2')

const loginStrategy = new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {

    let user = findUser(username)
    if (user === undefined || user === null) return done(null, false, {message: "No such user"})

    let hash = getUserPassword(username)

    let result = await argon.verify(hash, password)

    if (result) {
        return done(null, user)
    }

    return done(null, false)

})

const registerStrategy = new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {

    let exist = await isUserExist(username)
    if (!exist) {
        let newUser = await createNewUser(username, password, req.body.email, req.body.master_password)
        if (newUser) {
            return done(null, newUser)
        }

        return done(null, false)
    }

    return done(null, false)
})

const cookieStrategy = new CookieStrategy({
    cookieName: cookieName,
    passReqToCallback: true
}, async (req, session, done) => {
    if (!req.user) return done(null, false, {message: "You should authorize to access this page"});

    let user = await findUser(req.user.username)

    if (user !== undefined && user !== null) {
        return done(null, user)
    }

    return done(null, false, {message: "You should authorize to access this page"});

})

pass.serializeUser((user, done) => {
    done(null, user.id)
})

pass.deserializeUser((id, done) => {
    findUserById(id).then(user => {
        done(null, user)
    })
})

pass.use('login', loginStrategy)
pass.use('register', registerStrategy)
pass.use('cookie', cookieStrategy)

exports.passport = pass;