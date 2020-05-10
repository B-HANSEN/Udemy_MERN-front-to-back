const jwt = require('jsonwebtoken');
const config = require('config');

// access to req/res object, next callback to run to move to next piece of middelware
module.exports = function (req, res, next) {
	// get token from header
	const token = req.header('x-auth-token');

	// check if no token
	if (!token) {
		return res.status(401).json({ msg: 'No token, authorisation denied.' });
	}

	// verify token if there is one
	try {
		const decoded = jwt.verify(token, config.get('jwtSecret'));
		req.user = decoded.user;
		next();
	} catch (err) {
		res.status(401).json({ msg: 'Token is not valid.' });
	}
};
