const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
const Post = require('../../models/Post');

// @route   GET api/profile/me   // based on user ID that is in the token
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, async (req, res) => {
	try {
		// set user to the userID that comes in with the token
		// use populate to add stuff to the query (name, avatar are in the User model, not the Profile model)
		const profile = await Profile.findOne({
			user: req.user.id,
		}).populate('user', ['name', 'avatar']);

		if (!profile) {
			return res
				.status(400)
				.json({ msg: 'There is no profile for this user.' });
		}

		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error.');
	}
});

// @route   POST api/profile
// @desc    Create or update a user's profile
// @access  Private
// require auth and validation middleware, so pass in as []
router.post(
	'/',
	[
		auth,
		[
			check('status', 'Status is required.').not().isEmpty(),
			check('skills', 'Skills is required.').not().isEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const {
			company,
			location,
			website,
			bio,
			skills,
			status,
			githubusername,
			youtube,
			twitter,
			instagram,
			linkedin,
			facebook,
		} = req.body;

		// build profile object, initialise first
		const profileFields = {};
		profileFields.user = req.user.id;
		if (company) profileFields.company = company;
		if (website) profileFields.website = website;
		if (location) profileFields.location = location;
		if (bio) profileFields.bio = bio;
		if (status) profileFields.status = status;
		if (githubusername) profileFields.githubusername = githubusername;
		// turn skills (comma-separated list) into an array with split(',')-method
		// trim()-method eliminates leading and trailing spaces
		if (skills) {
			profileFields.skills = skills.split(',').map(skill => skill.trim());
		}

		// build social object, initialise first
		profileFields.social = {};
		if (youtube) profileFields.social.youtube = youtube;
		if (twitter) profileFields.social.twitter = twitter;
		if (facebook) profileFields.social.facebook = facebook;
		if (linkedin) profileFields.social.linkedin = linkedin;
		if (instagram) profileFields.social.instagram = instagram;

		try {
			let profile = await Profile.findOne({ user: req.user.id });

			// if there is a profile, update it
			if (profile) {
				profile = await Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				);
				return res.json(profile);
			}
			// else create new profile
			profile = new Profile(profileFields);
			await profile.save();
			res.json(profile);
		} catch (err) {
			console.error(err.messafge);
			res.status(500).send('Server Error.');
		}
	}
);

// @route   GET api/profile
// @desc    Get all profiles
// @access  Public
router.get('/', async (req, res) => {
	try {
		const profiles = await Profile.find().populate('user', ['name', 'avatar']);
		res.json(profiles);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route   GET api/profile/user/:user_id  // add colon for placeholder
// @desc    Get profile by user ID
// @access  Public
router.get('/user/:user_id', async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.params.user_id,
		}).populate('user', ['name', 'avatar']);

		// if profile not available
		if (!profile) return res.status(400).json({ msg: 'Profile not found.' });
		// if profile available
		res.json(profile);
	} catch (err) {
		console.error(err.message);
		// error object with name property; CastError is a certain kind of error
		if (err.name === 'CastError') {
			return res.status(400).json({ msg: 'Profile not found.' });
		}
		res.status(500).send('Server Error');
	}
});

// @route   DELETE api/profile
// @desc    Delete profile, user & posts
// @access  Private // i.e. access to the token
router.delete('/', auth, async (req, res) => {
	try {
		// remove user's posts
		await Post.deleteMany({ user: req.user.id });
		// remove profile
		await Profile.findOneAndRemove({ user: req.user.id });
		// remove account
		await User.findOneAndRemove({ _id: req.user.id });

		res.json({ msg: 'User deleted.' });
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route   PUT api/profile/experience
// @desc    Add profile experience
// @access  Private
router.put(
	'/experience',
	[
		auth,
		[
			check('title', 'Title is required.').not().isEmpty(),
			check('company', 'Company is required.').not().isEmpty(),
			check('from', 'From date is required.').not().isEmpty(),
		],
	],
	async (req, res) => {
		// validation
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const {
			title,
			company,
			location,
			from,
			to,
			current,
			description,
		} = req.body;

		const newExp = {
			title,
			company,
			location,
			from,
			to,
			current,
			description,
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });
			profile.experience.unshift(newExp);
			await profile.save();
			res.json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server Error');
		}
	}
);

// @route   DELETE api/profile/experience/:exp_id
// @desc    Delete experience from profile
// @access  Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });
		// get remove index
		const removeIndex = profile.experience
			.map(item => item.id)
			.indexOf(req.params.exp_id);

		// splicing the experience out & save it
		profile.experience.splice(removeIndex, 1);
		await profile.save();
		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route   PUT api/profile/education
// @desc    Add profile education
// @access  Private
router.put(
	'/education',
	[
		auth,
		[
			check('school', 'School is required.').not().isEmpty(),
			check('degree', 'Degree is required.').not().isEmpty(),
			check('fieldofstudy', 'Field of study is required.').not().isEmpty(),
			check('from', 'From date is required.').not().isEmpty(),
		],
	],
	async (req, res) => {
		// validation
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		const {
			school,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			description,
		} = req.body;

		const newEdu = {
			school,
			degree,
			fieldofstudy,
			from,
			to,
			current,
			description,
		};

		try {
			const profile = await Profile.findOne({ user: req.user.id });
			profile.education.unshift(newEdu);
			await profile.save();
			res.json(profile);
		} catch (err) {
			console.error(err.message);
			res.status(500).send('Server Error');
		}
	}
);

// @route   DELETE api/profile/education/:edu
// @desc    Delete education from profile
// @access  Private
router.delete('/education/:edu', auth, async (req, res) => {
	try {
		const profile = await Profile.findOne({ user: req.user.id });
		// get remove index
		const removeIndex = profile.education
			.map(item => item.id)
			.indexOf(req.params.edu);

		// splicing the education out & save it
		profile.education.splice(removeIndex, 1);
		await profile.save();
		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
});

// @route   GET api/profile/github/:username
// @desc    Get user repos from Github
// @access  Public
router.get('/github/:username', async (req, res) => {
	try {
		// define options:
		// username passed thru URL + max 5 pages and sort them,
		// add clientID & client secret from config
		const options = {
			uri: encodeURI(
				`https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
			),
			method: 'GET',
			headers: {
				'user-agent': 'node.js',
				Authorization: `token ${config.get('githubToken')}`,
			},
			// auth: {
			// 	user: config.get('githubClientId'),
			// 	pass: config.get('githubSecret'),
			// },
		};
		request(options, (error, response, body) => {
			if (error) console.error(error);
			// test status response
			if (response.statusCode !== 200) {
				return res.status(404).json({ msg: 'No Github profile found' });
			}
			// body is a regular string with escaped quotes etc, so apply JSON.parse()
			res.json(JSON.parse(body));
		});
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error.');
	}
});

module.exports = router;
