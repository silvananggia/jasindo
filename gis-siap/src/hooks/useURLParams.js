import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const useURLParams = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    nik: '320328-021093-0003',
    nama: 'SUBHI',
    address: 'Sukamandijaya, Ciasem, Subang, Jawa Barat',
    idkab: '',
    idkec: '1074',
    jmlPetak: 5,
    luasLahan: 1.00,
    noPolis:'423.266.110.25.2/100/000',
    idkelompok:'107020',
    idklaim:'636'

  });

  useEffect(() => {

    const handleMessage = (e) => {
      // Optional: check origin or expected format
      if (e.data && e.data.nama && e.data.noPolis) {
        setFormData(e.data);
      }
    };


    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);
  /* 
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const nik = urlParams.get('nik');
    const idkab = urlParams.get('idkab');
    const idkec = urlParams.get('idkec');

    if (nik) {
      setFormData(prev => ({
        ...prev,
        nik,
        idkab,
        idkec
      }));
    }
  }, [location.search]); */

  return { formData, setFormData };
}; 