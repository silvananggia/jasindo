import React, { useEffect, useRef, useState } from 'react';

import 'ol/ol.css';
import "ol-ext/dist/ol-ext.css";
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import Map from 'ol/Map';
import View from 'ol/View';
import { VectorTile as VectorTileLayer } from 'ol/layer';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';
import { Fill, Stroke, Style } from 'ol/style';
import { toGeometry } from 'ol/render/Feature';
import { fromLonLat } from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Draw, Select, Delete } from 'ol/interaction';
import { click, singleClick } from 'ol/events/condition';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import Geolocation from 'ol/Geolocation';
import GeolocationButton from 'ol-ext/control/GeolocationButton';
import { Autocomplete } from '@react-google-maps/api';
import Spinner from '../components/Spinner/Loading-spinner';
import { checkAuth } from "../actions/authActions";
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  TablePagination,
  Tabs,
  Tab,
  Box,
  Typography,
  Switch,
  Slider,
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import ListIcon from '@mui/icons-material/List';
import LayersIcon from '@mui/icons-material/Layers';
import OpacityIcon from "@mui/icons-material/Opacity"
import OSM from 'ol/source/OSM';
import Swal from "sweetalert2";

import { createPetak } from "../actions/petakActions";

const MapRegister = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  const { loading, errmessage } = useSelector((state) => state.auth);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const polygonLayerRef = useRef(null);
  const geolocation = useRef(null);
  const basemapLayerRef = useRef(null);
  const drawRef = useRef(null);
  const selectRef = useRef(null);
  const drawSourceRef = useRef(new VectorSource());
  const drawLayerRef = useRef(null);



  const [formData, setFormData] = useState({ nik: '1234', nama: '', address: '', idkab: '' });
  const [searchInput, setSearchInput] = useState('');
  const [selectedPercils, setSelectedPercils] = useState([]);
  const [autocomplete, setAutocomplete] = useState(null);
  const [selectedBasemap, setSelectedBasemap] = useState("map-switch-basic");

  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [tabValue, setTabValue] = useState(0);
  const [isPolygonVisible, setIsPolygonVisible] = useState(true);
  const [polygonOpacity, setPolygonOpacity] = useState(1);

  const basemapOptions = [
    { key: "map-switch-default", label: "Plain" },
    { key: "map-switch-basic", label: "Road" },
    { key: "map-switch-satellite", label: "Imagery" },
    { key: "map-switch-topography", label: "Topography" },
  ];

  const changeBasemap = (basemap) => {
    if (!mapInstance.current) return;

    let newBasemapLayer;

    switch (basemap) {
      case "map-switch-default":
        newBasemapLayer = new TileLayer({
          title: "Basemap",
          source: new XYZ({
            url: "https://abcd.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
            attributions: "&copy; <a href='http://osm.org'>OpenStreetMap</a> contributors, &copy; <a href='https://carto.com/'>CARTO</a>",
          }),
        });
        break;

      case "map-switch-basic":
        newBasemapLayer = new TileLayer({
          title: "Basemap",
          source: new XYZ({
            url: `https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&key=${process.env.REACT_APP_GOOGLE_API_KEY}`,
            attributions: '© Google',
          }),
        });
        break;

      case "map-switch-topography":
        newBasemapLayer = new TileLayer({
          title: "Basemap",
          source: new XYZ({
            url: "https://tile.opentopomap.org/{z}/{x}/{y}.png",
            attributions: "&copy;  <a href='https://openstreetmap.org/copyright'>OpenStreetMap</a> contributors, <a href='http://viewfinderpanoramas.org'>SRTM</a> | map style: © <a href='https://opentopomap.org'>OpenTopoMap</a> (<a href='https://creativecommons.org/licenses/by-sa/3.0/'>CC-BY-SA</a>)",
          }),
        });
        break;

      case "map-switch-satellite":
        newBasemapLayer = new TileLayer({
          title: "Basemap",
          source: new XYZ({
            url: `https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}&key=${process.env.REACT_APP_GOOGLE_API_KEY}`,
            attributions: '© Google',
          }),
        });
        break;

      default:
        newBasemapLayer = new TileLayer({
          title: "Basemap",
          source: new OSM(),
        });
        break;
    }

    // Remove old basemap if exists
    if (basemapLayerRef.current) {
      mapInstance.current.removeLayer(basemapLayerRef.current);
    }

    mapInstance.current.getLayers().insertAt(0, newBasemapLayer);
    basemapLayerRef.current = newBasemapLayer;
    setSelectedBasemap(basemap);
  };


  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {

    const handleMessage = (e) => {
      // Optional: check origin or expected format
      if (e.data && e.data.nik) {

        setFormData(e.data);
        setSearchInput(e.data.address);
        setTimeout(() => {
          handleSearch(e.data.address);
        }, 1000);
      }
    };


    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const location = useLocation(); // Get the current location object

  useEffect(() => {
    // Use URLSearchParams to extract query parameters from the URL
    const urlParams = new URLSearchParams(location.search);
    const nik = urlParams.get('nik');
    const idkab = urlParams.get('id');

    // Update state with the extracted parameters
    if (nik && idkab) {
      setFormData({
        nik,
        idkab
      });

    }
  }, [location.search]); // Depend on location.search to re-run when the URL changes


  // Dynamic style based on passed-in selection
  const getPercilStyle = (selection) => (feature) => {

    const id = feature.get('id');
    const isSelected = selection.some((p) => p.id === id);
    return new Style({
      stroke: new Stroke({
        color: isSelected ? '#FF5733' : '#00FF00',
        width: 2,
      }),
      fill: new Fill({
        color: isSelected
          ?
          'rgba(255, 87, 51, 0.3)' : 'rgba(0, 255, 0, 0.3)',
      }),
    });
  };





  useEffect(() => {
    if (!isAuthenticated || !mapRef.current) return;

    if (!basemapLayerRef.current) {
      basemapLayerRef.current = new TileLayer({
        title: "Basemap",
        source: new XYZ({
          url: `https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}&key=${process.env.REACT_APP_GOOGLE_API_KEY}`,
          attributions: '© Google',
        }),
      });
    }


    polygonLayerRef.current = new VectorTileLayer({
      source: new VectorTileSource({
        format: new MVT(),

        url: `${process.env.REACT_APP_TILE_URL}/petak_desa/{z}/{x}/{y}?id=29530`,
        //url: 'http://localhost:3333/petak_sawah/{z}/{x}/{y}',
        // url: `${process.env.REACT_APP_TILE_URL}/petak_kabupaten/{z}/{x}/{y}?id=${formData.idkab}`,

        // url: 'http://localhost:3333/function_zxy_id_petaksawah/{z}/{x}/{y}?fid=235184',
        // url: 'http://localhost:3333/function_zxy_query_petaksawah/{z}/{x}/{y}?filter_ids=[235183,235184,235185]',
      }),
      style: getPercilStyle([]),
    });

    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [basemapLayerRef.current, polygonLayerRef.current],
      view: new View({
        center: fromLonLat([107.6237476,  -6.3292777]),
        zoom: 16,

      }),
    });

    //basemapLayerRef.current = googleLayer;
    // Create the Geolocation object
    geolocation.current = new Geolocation({
      tracking: false,
      projection: mapInstance.current.getView().getProjection(),
      trackingOptions: {
        enableHighAccuracy: true,
      },
    });

    // Create the GeolocationButton control
    const geoControl = new GeolocationButton({
      geolocation: geolocation.current,
      className: 'geolocation-control', // Customize the button style
      tipLabel: 'Get Location',
    });

    // Add the control to the map
    mapInstance.current.addControl(geoControl);


    const geojsonFormat = new GeoJSON();

    mapInstance.current.on('click', (e) => {
      mapInstance.current.forEachFeatureAtPixel(e.pixel, (feature) => {
        try {


          const geometry = toGeometry(feature.getGeometry());
          const sourceProjection = mapInstance.current.getView().getProjection(); // Current projection (e.g., 'EPSG:3857')
          const targetProjection = 'EPSG:4326'; // WGS84

          const geometryClone = geometry.clone(); // Avoid mutating original feature geometry
          geometryClone.transform(sourceProjection, targetProjection);

          let geometryGeoJSON = geojsonFormat.writeGeometryObject(geometryClone);

          // Function to add Z dimension (default Z = 0)
          function addZDimension(geometry) {
            if (geometry.type === 'Polygon') {
              geometry.coordinates = geometry.coordinates.map(ring =>
                ring.map(coord => [...coord, 0]) // Add Z=0
              );
            }
            return geometry;
          }

          // Ensure Z dimension
          geometryGeoJSON = addZDimension(geometryGeoJSON);


          const id = feature.get('id');
          const area = feature.get('luas');

          // Update selected features
          setSelectedPercils((prev) => {
            const exists = prev.find((p) => p.id === id);
            const updated = exists
              ? prev.filter((p) => p.id !== id)
              : [...prev, { id, area, geometry: geometryGeoJSON }];

            // Update style after state change
            polygonLayerRef.current.setStyle(getPercilStyle(updated));
            polygonLayerRef.current.changed();  // Trigger re-render
            return updated;
          });

        } catch (err) {
          console.error('Error converting feature:', err);
        }

        return true;
      });
    });



    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(null);
      }
    };
  }, [isAuthenticated]);


  const totalArea = selectedPercils.reduce(
    (sum, p) => sum + parseFloat(p.area || 0),
    0
  );



  const handleSearch = async (query) => {
    if (!query) return;
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${process.env.REACT_APP_GOOGLE_API_KEY}`
      );
      const data = await response.json();
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        mapInstance.current.getView().animate({
          center: fromLonLat([location.lng, location.lat]),
          zoom: 17,
          duration: 1000,
        });
      } else {
        alert('Alamat tidak ditemukan.');
      }
    } catch (error) {
      console.error('Google Geocoding error:', error);
    }
  };



  const handlePlaceChange = () => {
    const place = autocomplete.getPlace();
    if (place.geometry) {
      const location = place.geometry.location;
      mapInstance.current.getView().animate({
        center: fromLonLat([location.lng(), location.lat()]),
        zoom: 17,
        duration: 1000,
      });
    }
  };


  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleSimpan = async () => {
    console.log("Selected percils to save:", selectedPercils);

    const payload = selectedPercils.map(p => ({
      nik: formData.nik,
      idpetak: p.id,
      luas: p.area,
      musim_tanam: formData.musimTanam || 'MT1', // Default value if not provided
      tgl_tanam: formData.tanggalTanam || new Date().toISOString().split('T')[0], // Default to today
      tgl_panen: formData.tanggalPanen || new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0], // Default to 90 days from now
      geometry: p.geometry,
    }));

    console.log(JSON.stringify(payload));

    try {
      await dispatch(createPetak(payload));

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Data Berhasil Disimpan.",
      });
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Gagal Menyimpan Data.",
      });
    }
  };

  useEffect(() => {
    if (polygonLayerRef.current) {
      polygonLayerRef.current.setVisible(isPolygonVisible);
      polygonLayerRef.current.setOpacity(polygonOpacity);
    }
  }, [isPolygonVisible, polygonOpacity]);

  useEffect(() => {
    changeBasemap(selectedBasemap);
  }, [selectedBasemap]);

  
  const drawSource = new VectorSource();
  const drawLayer = new VectorLayer({
    source: drawSource,
    style: new Style({
      stroke: new Stroke({
        color: '#0000FF',
        width: 2,
      }),
      fill: new Fill({
        color: 'rgba(0, 0, 255, 0.2)',
      }),
    }),
  });
  
  // Clear previous interactions
  const clearInteractions = () => {
    mapInstance.current.getInteractions().forEach((interaction) => {
      if (
        interaction instanceof Draw ||
        interaction instanceof Select
      ) {
        mapInstance.current.removeInteraction(interaction);
      }
    });
  };
  
  useEffect(() => {
    drawLayerRef.current = drawLayer;
  }, []);
  
  // Start drawing interaction
  const startDrawing = () => {
    clearInteractions();
      
    const drawInteraction = new Draw({
      source: drawSource,
      type: 'Polygon', // or 'Point' / 'LineString'
    });
  
    drawInteraction.on('drawend', (e) => {
      const feature = e.feature;
      const geom = feature.getGeometry();
    
      const area = geom.getArea();
      const id = `manual-${Date.now()}`;
      feature.setId(id); // <-- Assign unique ID
    
      const geojson = new GeoJSON().writeFeatureObject(feature, {
        featureProjection: mapInstance.current.getView().getProjection(),
        dataProjection: 'EPSG:4326',
      });
    
      setSelectedPercils((prev) => [
        ...prev,
        { id, geometry: geojson, area, source: 'manual' },
      ]);
    });

    
    mapInstance.current.addInteraction(drawInteraction);
  };
  
  // Activate select interaction
  const activateSelect = () => {
    clearInteractions();
  
    const select = new Select({
      condition: click,
      layers: [drawLayerRef.current],
    });
  
    selectRef.current = select;
    mapInstance.current.addInteraction(select);
  };
  // Add the layer to the map
  useEffect(() => {
    if (mapInstance.current && drawLayer) {
      mapInstance.current.addLayer(drawLayer);
    }
  }, [drawLayer]);
  
  
  return loading ? (

    <Spinner className="content-loader" />

  ) : errmessage ? (
    <div>
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>Akses Ditolak</h2>
        <p>Silakan login untuk melihat peta.</p>
      </div>
    </div>
  ) : (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {isAuthenticated && (
        <div
          ref={mapRef}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
      )}

      {/* Sidebar Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '40px',
          width: '100%',
          maxWidth: '320px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '1rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxHeight: '90vh',
          overflowY: 'auto', // Scrollable sidebar content
        }}
      >
        <Box >
          <Tabs value={tabValue} onChange={handleTabChange} >
            <Tab label="Data" icon={<ListIcon />} iconPosition="start" />
            <Tab label="Layers" icon={<LayersIcon />} iconPosition="start" />
          </Tabs>

          {/* Tab Panel 1: Existing content */}
          {tabValue === 0 && (
            <Box p={2}>

              <p><strong>NIK:</strong> {formData.nik}</p>
              <h3>Pilih Lahan</h3>
              {selectedPercils.length === 0 ? (
                <p>Belum Ada Lahan Terpilih</p>
              ) : (
                <>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>ID</strong></TableCell>
                        <TableCell><strong>Luas</strong></TableCell>
                        <TableCell align="right"><strong>Aksi</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedPercils.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.id}</TableCell>
                          <TableCell>{p.area}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              aria-label={`Hapus Lahan ${p.id}`}
                              onClick={() => {
                                const updated = selectedPercils.filter(
                                  (item) => item.id !== p.id
                                );
                                setSelectedPercils(updated);
                                polygonLayerRef.current.setStyle(getPercilStyle(updated));
                                
                              }}
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <p style={{ marginTop: '0.5rem' }}>
                    <strong>Luas Total:</strong> {totalArea.toFixed(2)} ha
                  </p>
                  <TablePagination
                    component="div"
                    count={selectedPercils.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[10]}
                  />

                  {selectedPercils.length > 0 && (
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      startIcon={<SaveIcon />}
                      onClick={handleSimpan}
                      sx={{ mt: 2 }}
                    >
                      Simpan
                    </Button>
                  )}
                </>

              )}

            </Box>
          )}

          {/* Tab Panel 2: Layer control */}
          {tabValue === 1 && (
            <Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, paddingTop: '20px' }}>
                <Typography variant="subtitle2">Layer Petak</Typography>
                <Switch
                  checked={isPolygonVisible}
                  onChange={(e) => setIsPolygonVisible(e.target.checked)}
                />
                <Divider />



              </Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2, // spacing between icon, slider, and value
                  width: 300, // or any desired width
                }}
              >
                <OpacityIcon fontSize="small" />

                <Slider
                  value={polygonOpacity}
                  min={0}
                  max={1}
                  step={0.1}
                  aria-label="Opacity"
                  valueLabelDisplay='auto'
                  onChange={(e, value) => setPolygonOpacity(value)}
                  sx={{ flexGrow: 1 }}
                />


              </Box>


              <Divider />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, paddingTop: '20px' }}>
                <Typography variant="subtitle2">Basemap</Typography>

                <Divider />

              </Box>
              <Divider />
              <div className="basemap-option">
                {basemapOptions.map((option) => (
                  <div key={option.key} className="button-container">


                    <div
                      className={`image ${selectedBasemap === option.key ? "active" : ""}`}
                      id={option.key}
                      onClick={() => changeBasemap(option.key)}
                    ></div>
                    <div
                      className={`label-basemap ${selectedBasemap === option.key ? "active" : ""
                        }`}
                    >
                      <Typography fontSize={10} align="center">
                        {" "}
                        {option.label}
                      </Typography>
                    </div>{" "}
                    {/* Label below div */}
                  </div>
                ))}
              </div>





              <Divider />
            </Box>
          )}
        </Box>


        <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 999 }}>
          <Button variant="contained" onClick={startDrawing}>Draw Polygon</Button>
          <Button variant="contained" onClick={activateSelect}>Select</Button>
         {/*  <Button variant="contained" color="error" onClick={deleteSelected}>Delete</Button> */}
        </div>
      </div>



      {/* Search Bar in Top Left */}
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
        <IconButton
          onClick={() => handleSearch(searchInput)}
          style={{
            borderRadius: '25%',
            backgroundColor: '#1976d2',
            color: 'white',
            padding: '7px',
          }}
        >
          <SearchIcon />
        </IconButton>
      </div>

    </div>
  );



};

export default MapRegister;
