import axios from "../api/axios";

const getAnggota = (idkelompok) => {
  return axios.get(`/get-anggota/${idkelompok}`);
};

const getAnggotaKlaim = (idkelompok,idklaim) => {
  return axios.get(`/get-anggota-klaim/${idkelompok}/${idklaim}`);
};


const anggotaService = {
  getAnggota,
  getAnggotaKlaim
};

export default anggotaService;
