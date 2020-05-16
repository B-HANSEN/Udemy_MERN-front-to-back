import { v4 as uuidv4 } from 'uuid';
import { SET_ALERT, REMOVE_ALERT } from './types';

export const setAlert = (msg, alertType, timeout = 5000) => dispatch => {
	// create a random universal ID
	const id = uuidv4();
	dispatch({
		type: SET_ALERT,
		payload: { msg, alertType, id },
	});
	// wait 5 sec after set alert and then remove it; wrap into setTimeout()-method:
	setTimeout(() => dispatch({ type: REMOVE_ALERT, payload: id }), timeout);
};
