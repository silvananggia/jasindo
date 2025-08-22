import { CHECK_AUTH, AUTH_ERROR } from "./types";

import authService from "../services/authService";

export const checkAuth = () => async (dispatch) => {
    try {
        const res = await authService.checkAuth();
        dispatch({
            type: CHECK_AUTH,
            payload: res.data
        });
    } catch (err) {
        dispatch({
            type: AUTH_ERROR,
            payload: err.response?.data?.message || 'Authentication failed'
        });
    }
};
