const {Sequelize} = require('sequelize')
const settings = require('./config/config.json').development
const argon = require('argon2')
const crypto = require('crypto')
const algorithm = 'aes-256-cbc'
const salt = require('./config/settings').password.salt

const sequelize = new Sequelize(settings.database, settings.username, settings.password, {
    host: settings.host,
    dialect: settings.dialect,
    logging: false
})

const userModel = require('./models/user')(sequelize, Sequelize)
const passwordModel = require('./models/passwords')(sequelize, Sequelize)

async function connectToDatabase() {
    try {
        await sequelize.authenticate()
        console.log("Connection has been established successfully")
    } catch (error) {
        console.error("Unable to connect to the database: ", error)
    }
}

async function findUser(username) {
    return await userModel.findOne({
        where: {
            username: username
        }
    })
}

async function findUserById(id) {
    return await userModel.findOne({
        where: {
            id: id
        }
    })
}

async function findPasswordById(id,user) {
    return await passwordModel.findOne({
        where: {
            id: id,
            ownerId: user.id
        }
    })
}


async function deleteUserById(id) {
    return await userModel.destroy({
        where: {
            id: id
        }
    })
}

async function findAllUsers() {
    return await userModel.findAll()
}

async function isUserExist(username) {
    let user = await findUser(username)
    return (user !== undefined && user !== null)
}

async function getUserPassword(username) {
    let user = await findUser(username)
    return user.password
}

async function createNewUser(username, password, email, master_password, role = "User") {
    const hashedPassword = await argon.hash(password);

    let res = await argon.verify(hashedPassword, password);

    if (res) {
        let newUser = userModel.build({
            username: username,
            password: hashedPassword,
            email: email,
            master_password: master_password,
            role: role
        });


        return await newUser.save();

    }

    return undefined;

}

async function updateUserData(req, res, next) {

    let user = await findUserById(req.user.id)

    const body = req.body

    if (body) {
        if (body.new_password) {
            let hashedPassword = await argon.hash(body.new_password);
            let res = await argon.verify(hashedPassword, body.new_password);

            if (res) {
                user.password = hashedPassword
            }

        }
        if (body.new_email) {
            user.email = body.new_email
        }

        // Check master_password

        await user.save()
    }

    next()

}


async function deleteUser(req, res, next) {
    await passwordModel.destroy({
        where: {
            ownerId: req.user.id
        }
    })

    await userModel.destroy({
        where: {
            username: req.user.username
        }
    })


    next()
}


async function encryptPassword(algorithm, masterPassword, password) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(masterPassword, salt, 32, (err, key) => {
            if (err) reject(err)

            let iv = Buffer.alloc(16, 0)
            if (err) reject(err)

            const cipher = crypto.createCipheriv(algorithm, key, iv)

            let hashedPassword = ''

            cipher.setEncoding('hex')

            cipher.on('data', (chunk) => hashedPassword += chunk)
            cipher.on('end', () => {
                resolve(hashedPassword)
            })

            cipher.write(password)
            cipher.end()


        })
    })
}

async function decryptPasswords(algorithm, masterPassword, password) {
    return new Promise((resolve, reject) => {
        crypto.scrypt(masterPassword, salt, 32, (err, key) => {
            if (err) reject(err)

            let iv = Buffer.alloc(16, 0)
            if (err) reject(err)

            const decipher = crypto.createDecipheriv(algorithm, key, iv)

            let decrypted = ''
            decipher.on('readable', () => {
                let chunk
                while ((chunk = decipher.read()) !== null) {
                    decrypted += chunk.toString()
                }
            })

            decipher.setEncoding('utf-8')

            decipher.on('end', () => {
                resolve(decrypted)
            })

            decipher.write(password, 'hex')
            decipher.end()
        })
    })
}

async function getDecryptedPasswords(user) {
    let encrypted = await getUserPasswords(user)

    for (const item of encrypted) {
        item.password = await decryptPasswords(algorithm, user.master_password, item.password)
    }

    return encrypted
}

async function createNewPassword(req, res, next) {
    let body = req.body;

    if (!body) throw Error("No data was passed")

    if (!body.title || !body.login || !body.password) throw Error("No data was passed")

    const encryptedPassword = await encryptPassword(algorithm, req.user.master_password, (body.password))

    let newPassword = passwordModel.build({
        title: body.title,
        login: body.login,
        password: encryptedPassword,
        ownerId: req.user.id
    });

    await newPassword.save()
    next()
}

async function getUserPasswords(user) {
    return await passwordModel.findAll({
        where: {
            ownerId: user.id
        },
        raw: true
    })
}

async function updatePasswords(req, res, next) {

    let body = req.body
    if (!body) throw Error("Incorrect data")

    let password = await findPasswordById(body.id,req.user)

    if (body.title) {
        password.title = body.title
    }

    if (body.login) {
        password.login = body.login
    }

    if (body.password) {
        password.password = await encryptPassword(algorithm, req.user.master_password, body.password)
    }

    await password.save()

    next()

}

async function deletePassword(req, res, next) {
    let body = req.body
    if (!body) throw Error("No data")
    await passwordModel.destroy({
        where: {
            id: body.id
        }
    })

    next()
}

exports.connectToDatabase = connectToDatabase;
exports.sequelize = sequelize;
exports.findUser = findUser;
exports.getUserPassword = getUserPassword;
exports.isUserExist = isUserExist;
exports.User = userModel;
exports.createNewUser = createNewUser;
exports.findUserById = findUserById;
exports.updateUserData = updateUserData;
exports.findAllUsers = findAllUsers;
exports.deleteUserById = deleteUserById;
exports.createNewPassword = createNewPassword
exports.getUserPasswords = getUserPasswords
exports.getDecryptedPasswords = getDecryptedPasswords
exports.updatePasswords = updatePasswords
exports.deletePassword = deletePassword
exports.deleteUser = deleteUser