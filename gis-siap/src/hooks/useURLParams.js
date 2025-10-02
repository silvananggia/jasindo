import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const useURLParams = () => {
  const location = useLocation();
   
  const [formData, setFormData] = useState({
    nik: '',
    nama: '',
    address: '',
    idkab: '',
    idkec: '',
    jmlPetak: 0, // Initialize with 0 instead of empty string
    luasLahan: 0,
    noPolis:'',
    idKelompok:'',
    idKlaim:''
  });

  // Debug: Track when formData changes
  useEffect(() => {
   // console.log('useURLParams - formData changed:', formData);
    // console.log('useURLParams - formData.jmlPetak:', formData.jmlPetak, 'type:', typeof formData.jmlPetak);
  }, [formData]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  useEffect(() => {
   
    
    const handleMessage = (e) => {
      console.log('useURLParams - Received message:', e.data);
      
      // More flexible validation - check for either nik or idKelompok
      if (e.data && (e.data.nik || e.data.idKelompok)) {
        //console.log('useURLParams - Setting formData with:', e.data);
       // console.log('useURLParams - jmlPetak in message:', e.data.jmlPetak, 'type:', typeof e.data.jmlPetak);
        setFormData(e.data);
        setIsDataLoaded(true);
      } else {
        console.log('useURLParams - Invalid message format:', e.data);
      }
    };

    // Set a timeout to use fallback data if no iframe message is received within 5 seconds
    const timeoutId = setTimeout(() => {
      if (!isDataLoaded) {
      
     
        setIsDataLoaded(true);
      } else {
        console.log('useURLParams - Timeout reached but data already loaded, skipping fallback');
      }
    }, 5000);

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeoutId);
    };
  }, [isDataLoaded]);
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



  return { formData, setFormData, isDataLoaded,   };
}; 