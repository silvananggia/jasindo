import {
    GET_ANGGOTA,
    GET_ANGGOTA_KLAIM,
} from "./types";

import AnggotaService from "../services/anggotaService";


export const getAnggota = (id) => async (dispatch) => {
    try {
        const res = await AnggotaService.getAnggota(id);
        console.log("getAnggota - res:", res.data);
        dispatch({
            type: GET_ANGGOTA,
            payload: res.data,
        });
    } catch (err) {
        console.log(err);
    }
};


export const getAnggotaKlaim = (idkelompok,idklaim) => async (dispatch) => {
    try {
        const res = await AnggotaService.getAnggotaKlaim(idkelompok,idklaim);
        
        dispatch({
            type: GET_ANGGOTA_KLAIM,
            payload: res.data,
        });
        
    } catch (err) {
        console.error('Error in getAnggotaKlaim:', err);
    }
};
