import 'ol/ol.css';
import "ol-ext/dist/ol-ext.css";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Autocomplete } from '@react-google-maps/api';
import { Box, Tabs, Tab, IconButton, Snackbar, Alert } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ListIcon from '@mui/icons-material/List';
import LayersIcon from '@mui/icons-material/Layers';
import RefreshIcon from '@mui/icons-material/Refresh';
import Swal from 'sweetalert2';
import { fromLonLat } from 'ol/proj';
import { VectorTile as VectorTileLayer } from 'ol/layer';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';
import { useMap } from '../../hooks/useMap';
import { useAuthListener } from '../../hooks/useAuthListener';
import { useURLParams } from '../../hooks/useURLParams';
import { createBasemapLayer } from '../../utils/mapUtils';
import { handleSearch } from '../../utils/mapUtils';
import { getPercilStyle } from '../../utils/percilStyles';
import { getKlaimUser, deleteKlaim } from '../../actions/klaimActions';
import BasemapSwitcher from './BasemapSwitcher';
import GeolocationControl from './GeolocationControl';
import Spinner from '../Spinner/Loading-spinner';
import DataPanel from './DataPanel';
import LayerPanel from './LayerPanel';

const MapViewClaim = () => {
  
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const { loading, errmessage } = useSelector((state) => state.auth);
  const { loading: klaimLoading } = useSelector((state) => state.klaim);
  const listKlaim = useSelector((state) => state.klaim.klaimlist);

  const { formData, setFormData } = useURLParams();

  const [searchInput, setSearchInput] = useState(formData.address);
  const [selectedPercils, setSelectedPercils] = useState([]);
  const [autocomplete, setAutocomplete] = useState(null);
  const [selectedBasemap, setSelectedBasemap] = useState("map-switch-basic");
  const [tabValue, setTabValue] = useState(0);
  const [isPolygonVisible, setIsPolygonVisible] = useState(true);
  const [polygonOpacity, setPolygonOpacity] = useState(1);
  const [totalArea, setTotalArea] = useState(0);
  const [isValid, setIsValid] = useState(true);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [tileUrl, setTileUrl] = useState();
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  // Check if Google Maps API is loaded
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max
    
    const checkGoogleMaps = () => {
      attempts++;
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsGoogleMapsLoaded(true);
      } else if (attempts < maxAttempts) {
        // Retry after a short delay
        setTimeout(checkGoogleMaps, 100);
      } else {
        console.warn('Google Maps API failed to load after 5 seconds');
        // Still set to true to show the input field without autocomplete
        setIsGoogleMapsLoaded(true);
      }
    };
    
    checkGoogleMaps();
  }, []);

  // Function to simulate iframe message
  const handleSimulateIframeMessage = () => {
    console.log("MapViewClaim - Simulating iframe message");
    
    const testMessage = {
      nik: '320328-021093-0003',
      nama: 'SUBHI',
      address: 'Sukamandijaya, Ciasem, Subang, Jawa Barat',
      luasLahan: 1.00,
      jmlPetak: 5,
      noPolis: '423.266.110.25.2/100/000'
    };
    
    console.log("MapViewClaim - Sending test message:", testMessage);
    
    // Simulate the iframe message
    const event = new MessageEvent('message', {
      data: testMessage,
      origin: window.location.origin
    });
    
    // Dispatch the event
    window.dispatchEvent(event);
  };

  const handlePercilSelect = useCallback(async (percilData) => {
    try {
      // For view-only mode, we don't allow selection
      setAlertMessage(`Mode tampilan - tidak dapat memilih lahan`);
      setAlertOpen(true);
      return;
    } catch (err) {
      console.error('Error processing feature:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while processing.',
      });
    }
  }, []);

  const { mapRef, mapInstance, polygonLayerRef, basemapLayerRef } = useMap(
    isAuthenticated,
    process.env.REACT_APP_GOOGLE_API_KEY,
    handlePercilSelect,
    `function_zxy_id_petakuser/{z}/{x}/{y}?id=${formData.nik}`,
  );

  useEffect(() => {
    const handleMessage = (e) => {
      console.log("MapViewClaim - Received message:", e.data);
      console.log("MapViewClaim - Message origin:", e.origin);
      
      if (e.data && e.data.nik) {
        console.log("MapViewClaim - Valid message received, updating formData with:", e.data);
        setFormData(e.data);
        setSearchInput(e.data.address);
        console.log("MapViewClaim - formData and searchInput updated");
        
        setTimeout(() => {
          if (mapInstance.current) {
            console.log("MapViewClaim - Triggering search for address:", e.data.address);
            handleSearch(e.data.address, mapInstance.current, process.env.REACT_APP_GOOGLE_API_KEY);
          }
        }, 1000);
      } else {
        console.log("MapViewClaim - Invalid message format:", e.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [mapInstance, setFormData]);

  useEffect(() => {
    setTotalArea(selectedPercils.reduce(
      (sum, p) => sum + parseFloat(p.area || 0),
      0
    ));
  }, [selectedPercils]);

  useEffect(() => {
    if (polygonLayerRef.current) {
      polygonLayerRef.current.setVisible(isPolygonVisible);
      polygonLayerRef.current.setOpacity(polygonOpacity);
    }
  }, [isPolygonVisible, polygonOpacity]);

  // Fetch klaim data when component mounts or formData changes
  useEffect(() => {
    if (formData.nik && formData.noPolis) {
      dispatch(getKlaimUser(formData.nik, formData.noPolis));
    }
  }, [formData.nik, formData.noPolis, dispatch]);

  // Style registered klaim in the main layer
  useEffect(() => {
    if (!polygonLayerRef.current) return;
    
    const currentListKlaim = listKlaim || [];
    const lockedIDs = currentListKlaim.map(p => p.idpetak);
    
    polygonLayerRef.current.setStyle(getPercilStyle([], lockedIDs, false, true)); // View-only mode
    polygonLayerRef.current.changed();
    
    // Update cursor style for view-only mode
    if (mapInstance.current) {
      const mapElement = mapInstance.current.getViewport();
      mapElement.style.cursor = 'default';
    }
  }, [listKlaim, mapInstance]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handlePlaceChange = () => {
    const place = autocomplete.getPlace();
    if (place.geometry) {
      const location = place.geometry.location;
      mapInstance.current.getView().animate({
        center: fromLonLat([location.lng(), location.lat()]),
        zoom: 15,
        duration: 1000,
      });
    }
  };

  const handleDeleteKlaim = async (klaimId) => {
    try {
      console.log('MapViewClaim.handleDeleteKlaim called with klaimId:', klaimId);
      await dispatch(deleteKlaim(klaimId));
      console.log('MapViewClaim.handleDeleteKlaim: deleteKlaim completed');
      // Refresh the klaim list after deletion
      await dispatch(getKlaimUser(formData.nik, formData.noPolis));
      console.log('MapViewClaim.handleDeleteKlaim: getKlaimUser completed');
    } catch (error) {
      console.error("Error deleting klaim:", error);
      throw error; // Re-throw to be handled by the DataPanel
    }
  };

  // Update polygon layer when formData changes
  useEffect(() => {
    if (!polygonLayerRef.current || !mapInstance.current) return;

    setTileUrl(`function_zxy_id_petakuser/{z}/{x}/{y}?id=${formData.nik}`);

    // Create new source with updated URL
    const newSource = new VectorTileSource({
      format: new MVT(),
      url: `${process.env.REACT_APP_TILE_URL}/${tileUrl}`,
    });

    // Update the layer's source
    polygonLayerRef.current.setSource(newSource);
    polygonLayerRef.current.changed();
  }, [formData.idkec, formData.nik, formData.idkab, mapInstance, polygonLayerRef, tileUrl]);

  useAuthListener();

  if (loading) {
    return <Spinner className="content-loader" />;
  }

  if (errmessage) {
    return (
      <div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Akses Ditolak</h2>
          <p>Silakan login untuk melihat peta.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {isAuthenticated && (
        <div
          ref={mapRef}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}

      <GeolocationControl mapInstance={mapInstance.current} />

      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '40px',
          width: '100%',
          maxWidth: '320px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '0 10px 10px 10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <Box>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Data" icon={<ListIcon />} iconPosition="start" />
            <Tab label="Layers" icon={<LayersIcon />} iconPosition="start" />
          </Tabs>

          {tabValue === 0 && (
            <DataPanel
              formData={formData}
              selectedPercils={selectedPercils}
              setSelectedPercils={setSelectedPercils}
              totalArea={totalArea}
              isValid={isValid}
              onSave={() => {}} // No save functionality in view mode
              polygonLayerRef={polygonLayerRef}
              listPetak={listKlaim}
              source="MapViewClaim"
              isLoading={klaimLoading}
              onDeletePetak={handleDeleteKlaim}
              mapInstance={mapInstance}
            />
          )}

          {tabValue === 1 && (
            <LayerPanel
              isPolygonVisible={isPolygonVisible}
              setIsPolygonVisible={setIsPolygonVisible}
              polygonOpacity={polygonOpacity}
              setPolygonOpacity={setPolygonOpacity}
              selectedBasemap={selectedBasemap}
              onBasemapChange={(basemap) => {
                const newBasemapLayer = createBasemapLayer(basemap, process.env.REACT_APP_GOOGLE_API_KEY);
                if (basemapLayerRef.current) {
                  mapInstance.current.removeLayer(basemapLayerRef.current);
                }
                mapInstance.current.getLayers().insertAt(0, newBasemapLayer);
                basemapLayerRef.current = newBasemapLayer;
                setSelectedBasemap(basemap);
              }}
            />
          )}
        </Box>
      </div>

      <div
        style={{
          position: 'absolute',
          top: '10px',
          left: '20px',
          padding: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {isGoogleMapsLoaded ? (
          <Autocomplete
            onLoad={(autocompleteInstance) => setAutocomplete(autocompleteInstance)}
            onPlaceChanged={handlePlaceChange}
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari alamat"
              style={{
                flex: 1,
                padding: '10px 15px',
                borderRadius: '5px',
                border: '1px solid #ccc',
                outline: 'none',
                width: '250px',
              }}
            />
          </Autocomplete>
        ) : (
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari alamat (Loading...)"
            style={{
              flex: 1,
              padding: '10px 15px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              outline: 'none',
              width: '250px',
            }}
          />
        )}
        <IconButton
          onClick={() => handleSearch(searchInput, mapInstance.current, process.env.REACT_APP_GOOGLE_API_KEY)}
          style={{
            borderRadius: '25%',
            backgroundColor: '#1976d2',
            color: 'white',
            padding: '7px',
          }}
        >
          <SearchIcon />
        </IconButton>
        <IconButton
          onClick={handleSimulateIframeMessage}
          style={{
            borderRadius: '25%',
            backgroundColor: '#4CAF50',
            color: 'white',
            padding: '7px',
          }}
        >
          <RefreshIcon />
        </IconButton>
      </div>

      <Snackbar open={alertOpen} onClose={() => setAlertOpen(false)}>
        <Alert onClose={() => setAlertOpen(false)} severity="error" sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default MapViewClaim;
