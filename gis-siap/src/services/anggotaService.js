import axios from "../api/axios";

const getAnggota = (id) => {
  return axios.get(`/get-anggota/${id}`);
};

const getAnggotaKlaim = (idkelompok,idklaim) => {
  return axios.get(`/get-anggota-klaim/${idkelompok}/${idklaim}`);
};


const anggotaService = {
  getAnggota,
  getAnggotaKlaim
};

export default anggotaService;
