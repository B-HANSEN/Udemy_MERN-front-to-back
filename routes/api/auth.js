const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');

// @route   GET api/auth
// @desc    Test route
// @access  Public
// apply middleware as 2nd parameter makes this route protected; middleware validates tokens
router.get('/', auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('-password');
		res.json(user);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server error.');
	}
});

// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public
router.post(
	'/',
	[
		check('email', 'Please include a valid email.').isEmail(),
		check('password', 'Password is required.').exists(),
	],
	async (req, res) => {
		const errors = validationResult(req);
		// return 400 bad request if there is errors
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { email, password } = req.body;
		try {
			let user = await User.findOne({ email });

			// check if users exists
			if (!user) {
				return res
					.status(400)
					.json({ errors: [{ msg: 'Invalid credentials.' }] });
			}

			// compare plain text pw with encrypted pw from user object from db
			// for security reasons, better to have same err.msg "invalid credentials"
			// to not indicate a user might be actually available
			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				return res
					.status(400)
					.json({ errors: [{ msg: 'Invalid credentials.' }] });
			}

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
