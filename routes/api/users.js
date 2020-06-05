const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const normalize = require('normalize-url');

const User = require('../../models/User');

// @route   POST api/users
// @desc    Register User
// @access  Public
router.post(
	'/',
	[
		check('name', 'Name is required').not().isEmpty(),
		check('email', 'Please include a valid email').isEmail(),
		check(
			'password',
			'Please enter a password with 6 or more characters'
		).isLength({ min: 6 }),
	],
	async (req, res) => {
		const errors = validationResult(req);
		// return 400 bad request if there is errors
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { name, email, password } = req.body;

		try {
			let user = await User.findOne({ email });

			// check if users exists
			if (user) {
				return res
					.status(400)
					.json({ errors: [{ msg: 'User already exists.' }] });
			}

			// get users gravatar
			const avatar = normalize(
				gravatar.url(email, {
					s: '200', // size
					r: 'pg', // rating
					d: 'mm', // default img, a user icon
				}),
				{ forceHttps: true }
			);

			// create instance of user
			user = new User({
				name,
				email,
				avatar,
				password,
			});

			// encrypt password using bcrypt; use 10 rounds as per docs; salt to do hashing with
			const salt = await bcrypt.genSalt(10);
			user.password = await bcrypt.hash(password, salt);
			// save to DB
			await user.save();

			// return json webtoken
			const payload = {
				user: {
					id: user.id,
				},
			};
			jwt.sign(
				payload,
				config.get('jwtSecret'),
				// option to expire in e.g. 1 hour in production, in dev more
				{ expiresIn: 360000 },
				// callback, check for error or send token back to client
				(err, token) => {
					if (err) throw err;
					res.json({ token });
				}
			);
		} catch (err) {
			console.log(err.message);
			res.status(500).send('Server error.');
		}
	}
);

module.exports = router;
