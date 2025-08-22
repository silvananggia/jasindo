import {
    CREATE_PETAK,
    GET_PETAK,
    GET_PETAK_ID,
    GET_PETAK_USER,
    UPDATE_PETAK,
    DELETE_PETAK,
} from "./types";

import PetakService from "../services/petakService";


export const createPetak = (data) => async (dispatch) => {
    try {
        const res = await PetakService.createPetak(data);

        dispatch({
            type: CREATE_PETAK,
            payload: res.data,
        });


        return Promise.resolve(res.data);
    } catch (err) {
        return Promise.reject(err);
    }
};

export const getAllPetak = (search, limit, page) => async (dispatch) => {
    try {

        const res = await PetakService.getPetakAll(search, limit, page);

        dispatch({
            type: GET_PETAK,
            payload: res.data.data,
        });
    } catch (err) {
        console.log(err);
    }
};


export const updatePetak = (id, data) => async (dispatch) => {
    try {
        const res = await PetakService.updatePetak(id, data);
        dispatch({
            type: UPDATE_PETAK,
            payload: res.data,
        });

        return Promise.resolve(res.data);
    } catch (err) {
        return Promise.reject(err);
    }
};

export const deletePetak = (id) => async (dispatch) => {
    try {
        await PetakService.deletePetak(id);

        dispatch({
            type: DELETE_PETAK,
            payload: { id },
        });
    } catch (err) {
        console.error('Error in deletePetak action:', err);
        throw err; // Re-throw the error so it can be caught by the calling function
    }
};

export const getPetakUser = (id) => async (dispatch) => {
    try {
        const res = await PetakService.getPetakUser(id);
     
        dispatch({
            type: GET_PETAK_USER,
            payload: res.data,
        });
    } catch (err) {
        console.log(err);
    }
};


export const getPetakID = (id) => async (dispatch) => {
    try {
        const res = await PetakService.getPetakID(id);

        //console.log(res.data);
        dispatch({
            type: GET_PETAK_ID,
            payload: res.data.data,
        });
        return res.data.data; 
    } catch (err) {
        console.log(err);
    }
};
