const router = require('express').Router()
const passport = require('./pass').passport

const logger = require('./logger');
const {findUserById} = require("./database");
const {updateUserData} = require("./database");
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

//==============CRUD===========================

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

// }), function (req, res) {
//     if (req.query.id) {
//         findUserById(req.query.id).then(user => {
//             if (user) {
//                 res.send(user);
//             } else {
//                 throw new HttpError(INTERNAL_SERVER_ERROR, "During this operation an error occurred");
//             }
//         }).catch(e => {
//             console.log(e);
//             res.send(e);
//         });
//     } else {
//         findAllUsers().then(users => {
//             if (users) {
//                 res.send(users);
//             } else {
//                 throw new HttpError(INTERNAL_SERVER_ERROR, "During this operation an error occurred");
//             }
//         }).catch(e => {
//             console.log(e);
//             res.send(e);
//         });
//     }
// });

router.post('/api/users', passport.authenticate('register', {}), function (req, res) {
    res.send({
        message: "OK",
        error_name: "NO"
    })
})
// }), function (req, res) {
//     let username = req.body.username;
//     let password = req.body.password;
//     let phone_number = req.body.phone_number;
//     let gender = req.body.gender;
//     let description = req.body.description;
//
//     if (!description) description = "";
//
//     if (!username || !password || !phone_number || !gender) throw new HttpError(BAD_REQUEST, "Incorrect parameters");
//
//     createNewUser(username, password, phone_number, gender, description).then(user => {
//         if (user) {
//             res.send("Success");
//         } else {
//             throw new HttpError(INTERNAL_SERVER_ERROR, "During user creation an error occurred");
//         }
//     }).catch(e => {
//         console.log(e);
//         res.send(e);
//     });
//
// });

// router.put('/api/users', passport.authenticate('cookie', {
//     failureRedirect: '/api/users/login',
//     failureFlash: true
// }), updateUserData, function (req, res) {
//
//     res.send("OK")
//
// });

// router.delete('/users', passport.authenticate('api', {
//     failureRedirect: '/login',
//     failureFlash: true
// }), function (req, res) {
//     if (!req.query.id) throw new HttpError(BAD_REQUEST, "Incorrect parameters");
//     deleteUserById(req.query.id).then(result => {
//         console.log(result);
//         if (result) {
//             res.send("Success");
//         } else {
//             throw new HttpError(INTERNAL_SERVER_ERROR, "During this operation an error occurred");
//         }
//     }).catch(e => {
//         console.log(e);
//         res.send(e);
//     });
// });

//==============CRUD===========================
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