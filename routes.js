const router = require('express').Router()
const passport = require('./pass').passport

const logger = require('./logger');
const {findUserById} = require("./database");
const {updateUserData} = require("./database");
const {deleteUser} = require("./database")
const {createNewPassword} = require("./database")
const {getDecryptedPasswords} = require("./database")
const {updatePasswords} = require("./database")
const {deletePassword} = require("./database")

const {
    HttpError,
    FORBIDDEN,
    NOT_FOUND,
    BAD_REQUEST,
    UNAUTHORIZED,
    INTERNAL_SERVER_ERROR
} = require("./httpError");

router.use(logger.logRequestToConsole);

router.get('/api/users/login', (req, res) => {
    let flashMessage = req.flash()
    if (flashMessage) {
        res.send({
            message: flashMessage
        })
    } else {
        res.send({
            message: "Unexpected error"
        })
    }
})

router.post('/api/users/login', passport.authenticate('login',
    {
        failureRedirect: '/api/users/login',
        failureFlash: true
    }), (req, res) => {
    res.send({message: "SUCCESS"})
});

router.get('/api/user/logout', function (req, res) {
    req.logout();
    res.send({message: "SUCCESS LOGOUT"})
});

//==============CRUD USERS===========================

router.get('/api/user', passport.authenticate('cookie', {
    failureRedirect: '/api/users/login',
    failureFlash: true
}), async (req, res) => {
    console.log("HERE")
    res.send({
        username: req.user.username,
        role: req.user.role,
        email: req.user.email
    })
})

router.get('/api/users', passport.authenticate('cookie', {
    failureRedirect: '/api/users/login',
    failureFlash: true
}), async (req, res) => {
    if (req.user) {
        let user = await findUserById(req.user.id)
        res.send(JSON.stringify(user))
    } else {
        res.send("NO OK")
    }
})

router.post('/api/users', passport.authenticate('register', {}), function (req, res) {
    res.send({
        message: "OK",
        error_name: "NO"
    })
})

router.put('/api/users', passport.authenticate('login', {
    failureRedirect: '/api/users/login',
    failureFlash: true
}), updateUserData, function (req, res) {
    res.send({
        message: "OK",
        error_name: "NO"
    })
});

router.delete('/api/users', passport.authenticate('cookie'), deleteUser, (req, res) => {
    res.send({
        message: "OK",
        error_name: "NO"
    })
})

//==============CRUD USERS===========================

//==============CRUD PASSWORDS===========================

// Read
router.get('/api/passwords', passport.authenticate('cookie', {}), async (req, res) => {
    let passwords = await getDecryptedPasswords(req.user)

    res.send(passwords)
})

// Create
router.post('/api/passwords', passport.authenticate('cookie', {}), createNewPassword, function (req, res) {
    res.send({
        message: "OK",
        error_name: "NO"
    })
})

// Update
router.put('/api/passwords', passport.authenticate('cookie', {}), updatePasswords, function (req, res) {
    res.send({
        message: "OK",
        error_name: "NO"
    })
})

// Delete
router.delete('/api/passwords', passport.authenticate('cookie', {}), deletePassword, function (req, res) {
    res.send({
        message: "OK",
        error_name: "NO"
    })
})

//==============CRUD PASSWORDS===========================
router.use(function (req, res, next) {
    throw new HttpError(NOT_FOUND, 'Not Found');
});

router.use(function (err, req, res, next) {

    if (!err.statusCode) {
        err.statusCode = INTERNAL_SERVER_ERROR;
        err.name = INTERNAL_SERVER_ERROR + " ERROR";
    }


    res.send({
        message: err.message,
        error_name: err.name
    });
    next(err);
});

module.exports = router