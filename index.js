const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
const flash = require('connect-flash')
const cookieSession = require('cookie-session')
const cookieParser = require('cookie-parser')

const connectToDatabase = require('./database').connectToDatabase
const routes = require('./routes')

const settings = require('./config/settings').settings
const cookieSecret = require('./config/settings').session.cookieSecret
const cookieName = require('./config/settings').session.cookieName

const app = express()

app.use(cookieSession({
    name: cookieName,
    keys: [cookieSecret],
    maxAge: settings.cookieLifeTime,
    secure: false,
    signed: true
}))

app.use(cookieParser())
app.use(passport.initialize())
app.use(passport.session())
app.use(flash())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.use(routes)

app.listen(settings.port, ()=> {
    console.log("SERVER STARTED AT %d PORT", settings.port)

    connectToDatabase().then(()=> {
        console.log("CONNECTION PHASE ENDED")
    }).catch(e => {
        console.log("CONNECT TO DATABASE : ERROR " + e)
    })
})