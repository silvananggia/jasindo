const db = require("../config/database");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { promisify } = require('util');
const axios = require("axios");

exports.checkAuth = async (req, res, next) => {
  const clientCookies = req.headers.cookie;
  if (!clientCookies) return res.status(401).json({ message: 'No session cookies found' });

  try {
    // console.log("Forwarding cookies:", req.headers.cookie);

    const response = await axios.get('http://localhost/newautp/auth/check_session', {
      headers: {
        Cookie: req.headers.cookie,
        'User-Agent': req.headers['user-agent'],
        'Accept': req.headers['accept'],
        'Accept-Language': req.headers['accept-language']
      }
    });
    
   // console.log("Response from CI:", response.data);

    if (response.data.logged_in) {
      req.user = response.data.user;
      res.status(200).json({ message: 'authorized' });
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }
  } catch (error) {
    console.error('Session check failed:', error.response?.data || error.message);
    res.status(500).json({ message: 'Session check failed' });
  }
};

