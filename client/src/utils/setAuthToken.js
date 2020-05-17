// function that takes in the token
// if token there, add it to headers; if not, delete from headers

import axios from 'axios';

// token sent with every request
// other than always identifying which request to send with
const setAuthToken = token => {
	if (token) {
		axios.defaults.headers.common['x-auth-token'] = token;
		localStorage.setItem('token', token);
	} else {
		delete axios.defaults.headers.common['x-auth-token'];
		localStorage.removeItem('token');
	}
};

export default setAuthToken;
