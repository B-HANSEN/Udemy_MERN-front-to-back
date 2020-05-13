const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   POST api/posts
// @desc    Create a post
// @access  Private
router.post(
	'/',
	[auth, [check('text', 'Text is required').not().isEmpty()]],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		try {
			const user = await User.findById(req.user.id).select('-password');

			// instantiate a new Post from the model
			const newPost = new Post({
				// text coming from body:
				text: req.body.text,
				// rest coming from user:
				name: user.name,
				avatar: user.avatar,
				// user coming from request:
				user: req.user.id,
			});

			const post = await newPost.save();
			res.json(post);
		} catch (error) {
			console.error(err.message);
			res.status(500).send('Server Error.');
		}
	}
);

// @route   GET api/posts
// @desc    Get all posts
// @access  Private  // must be logged in to see the posts
router.get('/', auth, async (req, res) => {
	try {
		// most recent first, i.e. -1 else +1
		const posts = await Post.find().sort({ date: -1 });
		res.json(posts);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error.');
	}
});

// @route   GET api/posts/:id
// @desc    Get post by ID
// @access  Private  // must be logged in to see the posts
router.get('/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ msg: 'Post not found.' });
		}

		res.json(post);
	} catch (err) {
		console.error(err.message);
		if (err.name === 'CastError') {
			return res.status(404).json({ msg: 'Post not found.' });
		}
		res.status(500).send('Server Error.');
	}
});

// @route   DELETE api/posts/:id
// @desc    Delete a posts
// @access  Private  // must be logged in to see the posts
router.delete('/:id', auth, async (req, res) => {
	try {
		const post = await Post.findById(req.params.id);
		// if post not found, return error
		if (!post) {
			return res.status(404).json({ msg: 'Post not found.' });
		}
		// only user that created the post can delete the post
		// check user (post.user is an object id; req.user.id is a string)
		if (post.user.toString() !== req.user.id) {
			return res.status(401).json({ msg: 'User not authorized.' });
		}
		await post.remove();
		res.json({ msg: 'Post removed.' });
	} catch (err) {
		console.error(err.message);
		if (err.name === 'CastError') {
			return res.status(404).json({ msg: 'Post not found.' });
		}
		res.status(500).send('Server Error.');
	}
});

module.exports = router;
