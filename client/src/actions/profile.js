import axios from 'axios';
import { setAlert } from './alert';
import { GET_PROFILE, PROFILE_ERROR } from './types';

// get current user's profile
export const getCurrentProfile = () => async dispatch => {
	try {
		const res = await axios.get('/api/profile/me');

		dispatch({
			type: GET_PROFILE,
			// this route returns all profile data
			payload: res.data,
		});
	} catch (err) {
		dispatch({
			type: PROFILE_ERROR,
			payload: {
				msg: err.response.statusText,
				// HTTP status: 400 or similar
				status: err.response.status,
			},
		});
	}
};

// create or update profile
// history object (with method push) required to redirect to a client-side route
// editing or creating new profile --> edit (avoid creating a separate function)
export const createProfile = (
	formData,
	history,
	edit = false
) => async dispatch => {
	try {
		// to send data, create a config object
		const config = {
			headers: {
				'Content-Type': 'application/json',
			},
		};
		const res = await axios.post('/api/profile', formData, config);

		dispatch({
			type: GET_PROFILE,
			// this route returns all profile data
			payload: res.data,
		});
		dispatch(
			setAlert(edit ? 'Profile updated.' : 'Profile created.', 'success')
		);
		if (!edit) {
			history.push('/dashboard');
		}
	} catch (err) {
		const errors = err.response.data.errors;
		if (errors) {
			errors.forEach(error => dispatch(setAlert(error.msg, 'danger')));
		}

		dispatch({
			type: PROFILE_ERROR,
			payload: {
				msg: err.response.statusText,
				status: err.response.status,
			},
		});
	}
};
