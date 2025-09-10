import axios from "../api/axios";
import authHeader from "./auth-header";

const getPetakAll = () => {
  return axios.get(`/petak`);
};


const getPetakUser = (id) => {
  return axios.get(`/petak-user/${id}`);
};

const getCenterPetakUser = (id) => {
  return axios.get(`/center-petak-user/${id}`);
};

const getPetakById = (id) => {
  return axios.get(`/petak-by-id/${id}`);
};

const getPetakID = (id) => {
    return axios.get(`/petakid/${id}`);
  };

const createPetak = (data) => {
  return axios.post("/save-petak", data);
};

const updatePetak = (id, data) => {
  const headers = {
    ...authHeader(),
    "Content-Type": "multipart/form-data",
  };
  return axios.post(`/petak/${id}`, data, { headers: headers });
};

const deletePetak = (id) => {
  return axios.delete(`/petak/${id}`, { headers: authHeader() });
};

const PetakService = {
    getPetakAll,
    getPetakUser,
    getCenterPetakUser,
    getPetakById,
    getPetakID,
    createPetak,
    updatePetak,
    deletePetak
};

export default PetakService;
