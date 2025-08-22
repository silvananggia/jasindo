const axios = require("axios");
const cheerio = require("cheerio");


exports.getAnggota = async (req, res) => {
  const { id } = req.params;
  const clientCookies = req.headers.cookie;

  if (!clientCookies) {
    return res.status(401).json({ message: "No session cookie found" });
  }

  const targetUrl = `http://localhost/newautp/autp_disetujui/detil/${id}/ajax_list`;

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


      const { data: html } = await axios.get(targetUrl, {
        headers: {
          Cookie: req.headers.cookie,
          'User-Agent': req.headers['user-agent'],
          'Accept': req.headers['accept'],
          'Accept-Language': req.headers['accept-language']
        }
      });

      const $ = cheerio.load(html);

      const headers = [];
      const data = [];

      // Extract table headers
      $('#flex1 thead th').each((_, el) => {
        headers.push($(el).text().trim());
      });

      // Extract table rows
      $('#flex1 tbody tr').each((_, tr) => {
        const row = {};
        $(tr).find('td').each((i, td) => {
          const text = $(td).text().trim();
          row[headers[i] || `column_${i}`] = text === '\xa0' ? '' : text;
        });
        data.push(row);
      });
      const noPolis = $('#field-no_polis').val();
      res.json({
        success: true,
        id,
        noPolis,
        data
      });
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }

  } catch (err) {
    console.error('Fetch error:', err.response?.status, err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to fetch or parse HTML', error: err.message });
  }
};


exports.getAnggotaKlaim = async (req, res) => {
  const { idkelompok } = req.params;
  const { idklaim } = req.params;
  const clientCookies = req.headers.cookie;

  if (!clientCookies) {
    return res.status(401).json({ message: "No session cookie found" });
  }

  const targetUrl = `http://localhost/newautp/klaim/data_klaim_detail/${idkelompok}/${idklaim}/ajax_list`;

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


      const { data: html } = await axios.get(targetUrl, {
        headers: {
          Cookie: req.headers.cookie,
          'User-Agent': req.headers['user-agent'],
          'Accept': req.headers['accept'],
          'Accept-Language': req.headers['accept-language']
        }
      });

      const $ = cheerio.load(html);

      const headers = [];
      const data = [];

      // Extract table headers
      $('#flex1 thead th').each((_, el) => {
        headers.push($(el).text().trim());
      });

      // Extract table rows
      $('#flex1 tbody tr').each((_, tr) => {
        const row = {};
        $(tr).find('td').each((i, td) => {
          const text = $(td).text().trim();
          row[headers[i] || `column_${i}`] = text === '\xa0' ? '' : text;
        });
        data.push(row);
      });
      const noPolis = $('#field-no_polis').val();
      res.json({
        success: true,
        idkelompok,
        idklaim,
        noPolis,
        data
      });
    } else {
      res.status(401).json({ message: 'Unauthorized' });
    }

  } catch (err) {
    console.error('Fetch error:', err.response?.status, err.response?.data || err.message);
    res.status(500).json({ message: 'Failed to fetch or parse HTML', error: err.message });
  }
};
