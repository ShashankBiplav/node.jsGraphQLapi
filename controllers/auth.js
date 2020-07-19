const expressValidator = require('express-validator');

const jwt = require('jsonwebtoken');

const bcrypt = require('bcryptjs');

const User = require('../models/user.js');

exports.signup = async (req, res, next) => {
    const errors = expressValidator.validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed.');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    try {
        const hashedPwd = await bcrypt.hash(password, 12);
        const user = new User({
            email: email,
            password: hashedPwd,
            name: name
        });
        const result = await user.save();
        res.status(201).json({
            message: 'User Created',
            userId: result._id
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.login = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    let loadedUser;
    try {
        const user = await User.findOne({
            email: email
        });
        if (!user) {
            const error = new Error('User with this email not found');
            eror.statusCode = 401;
            throw error;
        }
        loadedUser = user;
        const isEqual = await bcrypt.compare(password, user.password); //returned from password comparison : true or false
        if (!isEqual) {
            const error = new Error('Wrong Password');
            error.statusCode = 401;
            throw error;
        }
        const token = jwt.sign({ // creating a JWT token
            email: loadedUser.email,
            userId: loadedUser._id.toString()
        }, 'yoursuperdupersecretkeythatisknownonlytoyouandtheserver', {
            expiresIn: '1h'
        });
        res.status(200).json({
            token: token,
            userId: loadedUser._id.toString()
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.getUserStatus = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId)
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        res.status(200).json({
            status: user.status
        });
    } catch (err) {

        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.updateUserStatus = async (req, res, next) => {
    const newStatus = req.body.status;
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }
        user.status = newStatus;
        await user.save();
        res.status(200).json({
            message: 'User updated successfully'
        });
    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};