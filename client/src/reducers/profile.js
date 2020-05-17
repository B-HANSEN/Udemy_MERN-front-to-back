import { GET_PROFILE, PROFILE_ERROR } from '../actions/types';

const initialState = {
	profile: null,
	profiles: [],
	repos: [],
	loading: true,
	error: {},
};

export default function (state = initialState, action) {
	const { type, payload } = action;

	switch (type) {
		case GET_PROFILE:
			return {
				...state,
				// response sent back includes the whole profile, add to state:
				profile: payload,
				loading: false,
			};
		case PROFILE_ERROR:
			return {
				...state,
				// object with message and status
				error: payload,
				loading: false,
			};
		default:
			return state;
	}
}
