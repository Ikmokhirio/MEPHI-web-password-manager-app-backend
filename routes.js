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

function successMessage(req, res) {
    res.send({
        message: "OK",
        error_name: ""
    })
}

router.get('/api/error', (req, res) => {
    let flashMessage = req.flash()
    if (flashMessage) {
        res.send({
            message: "ERROR",
            error_name: flashMessage
        })
    } else {
        res.send({
            message: "ERROR",
            error_name: "Unexpected error"
        })
    }
})

// Login
router.post('/api/users/login', passport.authenticate('login',
    {
        failureRedirect: '/api/error',
        failureFlash: true
    }), successMessage)

router.get('/api/user/logout', function (req, res) {
    req.logout();
    res.send({
        message: "OK",
        error_name: ""
    })
});

//==============CRUD USERS===========================

router.get('/api/users', passport.authenticate('cookie', {
    failureRedirect: '/api/error',
    failureFlash: true
}), async (req, res) => {
    res.send({
        username: req.user.username,
        role: req.user.role,
        email: req.user.email
    })
})


router.post('/api/users', passport.authenticate('register', {
    failureRedirect: '/api/error',
    failureFlash: true
}), successMessage)

router.put('/api/users', passport.authenticate('login', {
    failureRedirect: '/api/error',
    failureFlash: true
}), updateUserData, successMessage)

router.delete('/api/users', passport.authenticate('cookie'), deleteUser, successMessage)

//==============CRUD USERS===========================

//==============CRUD PASSWORDS===========================

// Read
router.get('/api/passwords', passport.authenticate('cookie', {
    failureRedirect: '/api/error',
    failureFlash: true
}), async (req, res) => {
    let passwords = await getDecryptedPasswords(req.user)
    res.send(passwords)
})

// Create
router.post('/api/passwords', passport.authenticate('cookie', {
    failureRedirect: '/api/error',
    failureFlash: true
}), createNewPassword, successMessage)

// Update
router.put('/api/passwords', passport.authenticate('cookie', {
    failureRedirect: '/api/error',
    failureFlash: true
}), updatePasswords, successMessage)

// Delete
router.delete('/api/passwords', passport.authenticate('cookie', {
    failureRedirect: '/api/error',
    failureFlash: true
}), deletePassword, successMessage)

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