const bcrypt = require("bcryptjs");

const validator = require("validator");

const jwt = require("jsonwebtoken");

const User = require("../models/user.js");

const Post = require("../models/post.js");

module.exports = {
  createUser: async function ({ userInput }, req) {
    // const email = args.userInput.email; //use when not using destructuring
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({
        message: "Invalid Email",
      });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, {
        min: 5,
      })
    ) {
      errors.push({
        message: "Invalid Password",
      });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid Input");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const existingUser = await User.findOne({
      email: userInput.email,
    });
    if (existingUser) {
      const error = new Error("User Exists");
      throw error;
    }
    const hashedPassword = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPassword,
    });
    const createdUser = await user.save();
    return {
      ...createdUser._doc,
      _id: createdUser._id.toString(),
    };
  },
  login: async function ({ email, password }) {
    const user = await User.findOne({
      email: email,
    });
    if (!user) {
      const error = new Error("User not found");
      error.code = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Incorrect Password");
      error.code = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      "yoursuperdupersecretkeythatisknownonlytoyouandtheserver",
      {
        expiresIn: "1h",
      }
    );
    return {
      token: token,
      userId: user._id.toString(),
    };
  },
  createPost: async function ({ postInput }, req) {
    if (!req.isAuth) {
      const error = new Error("Not Authenticated");
      error.code = 401;
      throw error;
    }
    const errors = [];
    if (
      validator.isEmpty(postInput.title) ||
      !validator.isLength(postInput.title, {
        min: 5,
      })
    ) {
      errors.push({
        message: "Invalid title",
      });
    }
    if (
      validator.isEmpty(postInput.content) ||
      !validator.isLength(postInput.content, {
        min: 5,
      })
    ) {
      errors.push({
        message: "Invalid content",
      });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid Input");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error("Invalid User");
      error.code = 401;
      throw error;
    }
    const post = new Post({
      title: postInput.title,
      content: postInput.content,
      imageUrl: postInput.imageUrl,
      creator: user,
    });
    const createdPost = await post.save();
    user.posts.push(createdPost); //add post to user's posts
    await user.save();
    return {
      ...createdPost._doc,
      _id: createdPost._id.toString(),
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString(),
    };
  },
  posts: async function({ page }, req) {
    if (!req.isAuth) {
      const error = new Error('Not authenticated!');
      error.code = 401;
      throw error;
    }
    if (!page) {
      page = 1;
    }
    const perPage = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate('creator');
    return {
      posts: posts.map(post => {
        return {
          ...post._doc,
          _id: post._id.toString(),
          createdAt: post.createdAt.toISOString(),
          updatedAt: post.updatedAt.toISOString()
        };
      }),
      totalPosts: totalPosts
    };
  }
};
