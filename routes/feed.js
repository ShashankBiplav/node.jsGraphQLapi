const express = require('express');

const expressValidator = require('express-validator');

const feedController = require('../controllers/feed.js');

const isAuth = require('../middleware/is-auth.js');

const router = express.Router();
// GET /feed/posts
router.get('/posts', isAuth, feedController.getPosts);

//POST /feed/post
router.post('/post',isAuth,[
    expressValidator.check('title').trim().isLength({min:5}),
    expressValidator.check('content').trim().isLength({min:5})
], feedController.createPost);

// GET /feed/post/:postId
router.get('/post/:postId', isAuth,feedController.getPost);

//PUT /feed/post/:postId
router.put('/post/:postId', isAuth,[
    expressValidator.check('title').trim().isLength({min:5}),
    expressValidator.check('content').trim().isLength({min:5})
], feedController.updatePost);

//DELETE /feed/post/:postId
router.delete('/post/:postId', isAuth,feedController.deletePost);

module.exports = router;