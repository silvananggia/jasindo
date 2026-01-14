import axios from "../api/axios";
import authHeader from "./auth-header";

const getAllKlaim = () => {
  return axios.get(`/klaim`);
};


const getKlaimUser = (id, nopolis) => {
  console.log("klaimService - getKlaimUser called with id:", id, "nopolis:", nopolis);
  
  // Clean NIK - remove HTML tags if present and extract only the value
  let cleanId = id;
  if (typeof id === 'string' && id.includes('<option')) {
    // If id contains HTML options, try to extract the selected value
    // This is a fallback in case HTML was passed by mistake
    const match = id.match(/<option[^>]*selected[^>]*value=['"]([^'"]*)['"]/);
    if (match && match[1]) {
      cleanId = match[1];
    } else {
      // If no selected option found, try to get the first non-empty option value
      const firstMatch = id.match(/<option[^>]*value=['"]([^'"]*)['"]/);
      if (firstMatch && firstMatch[1] && firstMatch[1] !== '0') {
        cleanId = firstMatch[1];
      }
    }
  }
  
  // Strip any remaining HTML tags
  cleanId = cleanId.replace(/<[^>]*>/g, '').trim();
  
  const encodedNopolis = encodeURIComponent(nopolis);
  console.log("klaimService - encoded nopolis:", encodedNopolis);
  console.log("klaimService - cleaned id:", cleanId);
  const url = `/petak-user-klaim/${cleanId}/${encodedNopolis}`;
  console.log("klaimService - API URL:", url);
  return axios.get(url);
};

const getKlaimID = (id) => {
    return axios.get(`/klaimid/${id}`);
  };

const createKlaim = (data) => {
  return axios.post("/save-petak-klaim", data);
};

const updateKlaim = (id, data) => {
  const headers = {
    ...authHeader(),
    "Content-Type": "multipart/form-data",
  };
  return axios.post(`/klaim/${id}`, data, { headers: headers });
};

const deleteKlaim = (id) => {
  console.log('klaimService.deleteKlaim called with id:', id);
  const url = `/petak-klaim/${id}`;
  console.log('klaimService.deleteKlaim URL:', url);
  return axios.delete(url, { headers: authHeader() });
};

const KlaimService = {
    getAllKlaim,
    getKlaimUser,
    getKlaimID,
    createKlaim,
    updateKlaim,
    deleteKlaim
};

export default KlaimService;
