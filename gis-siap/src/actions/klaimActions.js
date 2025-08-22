import {
    CREATE_KLAIM,
    GET_KLAIM,
    GET_KLAIM_ID,
    GET_KLAIM_USER,
    UPDATE_KLAIM,
    DELETE_KLAIM,
} from "./types";

import KlaimService from "../services/klaimService";

export const createKlaim = (data) => async (dispatch) => {
    try {
        const res = await KlaimService.createKlaim(data);

        dispatch({
            type: CREATE_KLAIM,
            payload: res.data,
        });


        return Promise.resolve(res.data);
    } catch (err) {
        return Promise.reject(err);
    }
};

    export const getAllKlaim = (search, limit, page) => async (dispatch) => {
    try {

        const res = await KlaimService.getAllKlaim(search, limit, page);

        dispatch({
            type: GET_KLAIM,
            payload: res.data.data,
        });
    } catch (err) {
        console.log(err);
    }
};


export const updateKlaim = (id, data) => async (dispatch) => {
    try {
        const res = await KlaimService.updateKlaim(id, data);
        dispatch({
            type: UPDATE_KLAIM,
            payload: res.data,
        });

        return Promise.resolve(res.data);
    } catch (err) {
        return Promise.reject(err);
    }
};

export const deleteKlaim = (id) => async (dispatch) => {
    try {
        await KlaimService.deleteKlaim(id);

        dispatch({
            type: DELETE_KLAIM,
            payload: { id },
        });
    } catch (err) {
        console.log(err);
    }
};

export const getKlaimUser = (id, nopolis) => async (dispatch) => {
    try {
        const res = await KlaimService.getKlaimUser(id, nopolis);
     
        dispatch({
            type: GET_KLAIM_USER,
            payload: res.data,
        });
    } catch (err) {
        console.log(err);
    }
};


export const getKlaimID = (id) => async (dispatch) => {
    try {
        const res = await KlaimService.getKlaimID(id);

        //console.log(res.data);
        dispatch({
            type: GET_KLAIM_ID,
            payload: res.data.data,
        });
        return res.data.data; 
    } catch (err) {
        console.log(err);
    }
};
