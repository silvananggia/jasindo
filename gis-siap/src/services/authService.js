import axios from "../api/axios";

const checkAuth = () => {
  return axios.get(`/checkAuth`, {
    withCredentials: true,
  }
  );
  
};


const authService = {
  checkAuth
};

export default authService;
