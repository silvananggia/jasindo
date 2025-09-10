import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export const useURLParams = () => {
  const location = useLocation();
  // Fallback data for development/testing
  const fallbackData = {
    nik: '320328-021093-0003',
    nama: 'SUBHI',
    address: 'Sukamandijaya, Ciasem, Subang, Jawa Barat',
    idkab: '',
    idkec: '1074',
    jmlPetak: 5,
    luasLahan: 1.00,
    noPolis:'423.266.110.25.2/100/000',
    idKelompok:'107022', // Updated to match debug log
    idKlaim:'636'
  };
  
  const [formData, setFormData] = useState({
    nik: '',
    nama: '',
    address: '',
    idkab: '',
    idkec: '',
    jmlPetak: '',
    luasLahan: '',
    noPolis:'',
    idKelompok:'',
    idKlaim:''
  });
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  useEffect(() => {
    console.log('useURLParams - Effect running, isDataLoaded:', isDataLoaded);
    
    const handleMessage = (e) => {
      console.log('useURLParams - Received message:', e.data);
      console.log('useURLParams - Message origin:', e.origin);
      
      // More flexible validation - check for either nik or idKelompok
      if (e.data && (e.data.nik || e.data.idKelompok)) {
        console.log('useURLParams - Valid message received, updating formData with:', e.data);
        setFormData(e.data);
        setIsDataLoaded(true);
      } else {
        console.log('useURLParams - Invalid message format:', e.data);
      }
    };

    // Set a timeout to use fallback data if no iframe message is received within 5 seconds
    const timeoutId = setTimeout(() => {
      if (!isDataLoaded) {
        console.log('useURLParams - Timeout reached, no iframe message received, using fallback data');
        console.log('useURLParams - isDataLoaded state:', isDataLoaded);
        setFormData(fallbackData);
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

  // Function to manually trigger fallback data (for testing)
  const useFallbackData = () => {
    console.log('useURLParams - Manually triggering fallback data');
    setFormData(fallbackData);
    setIsDataLoaded(true);
  };

  // Function to simulate iframe message for testing
  const simulateIframeMessage = (testData) => {
    console.log('useURLParams - Simulating iframe message with:', testData);
    const event = new MessageEvent('message', {
      data: testData,
      origin: window.location.origin
    });
    window.dispatchEvent(event);
  };

  return { formData, setFormData, isDataLoaded, useFallbackData, simulateIframeMessage };
}; 