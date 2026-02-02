import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import { VectorTile as VectorTileLayer } from 'ol/layer';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';
import { fromLonLat } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { toGeometry } from 'ol/render/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import Control from 'ol/control/Control';
import { getArea as getGeodesicArea } from 'ol/sphere';
import { createBasemapLayer } from '../utils/mapUtils';
import { getPercilStyle } from '../utils/percilStyles';
import { getVersionAttribution } from '../config/version';

export const useMap = (isAuthenticated, googleApiKey, onPercilSelect, tileUrl) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const polygonLayerRef = useRef(null);
  const basemapLayerRef = useRef(null);
  const clickHandlerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !mapRef.current) return;

    if (!basemapLayerRef.current) {
      basemapLayerRef.current = createBasemapLayer("map-switch-basic", googleApiKey);
    }

    // Create initial polygon layer with empty source
    if (tileUrl && typeof tileUrl === 'string' && tileUrl.trim() !== '') {
      polygonLayerRef.current = new VectorTileLayer({
        source: new VectorTileSource({
          format: new MVT(),
          url: `${process.env.REACT_APP_TILE_URL}/${tileUrl}`,
        }),
        style: getPercilStyle([], [], false),
      });
    } else {
      // Create a placeholder layer when tileUrl is not available
      polygonLayerRef.current = new VectorTileLayer({
        source: new VectorTileSource({
          format: new MVT(),
          url: '', // Empty URL to prevent 404 errors
        }),
        style: getPercilStyle([], [], false),
        visible: false, // Hide the layer until proper URL is set
      });
    }

    mapInstance.current = new Map({
      target: mapRef.current,
      layers: [basemapLayerRef.current, polygonLayerRef.current],
      view: new View({
        center: fromLonLat([107.6237476,  -6.3292777]),
        zoom: 16,
      }),
    });

    // Add version information to map attribution
    // Wait for map to render, then add version info to attribution
    setTimeout(() => {
      const attributionElement = mapRef.current.querySelector('.ol-attribution');
      if (attributionElement) {
        // Check if version info already exists to avoid duplicates
        const existingVersion = attributionElement.querySelector('.version-info');
        if (!existingVersion) {
          const versionSpan = document.createElement('span');
          versionSpan.className = 'version-info';
          versionSpan.textContent = ` | ${getVersionAttribution()}`;
          versionSpan.style.marginLeft = '8px';
          versionSpan.style.fontSize = '11px';
          versionSpan.style.color = '#666';
          attributionElement.appendChild(versionSpan);
        }
      } else {
        // Fallback: create custom version control if attribution not found
        const versionControl = new Control({
          element: document.createElement('div'),
        });
        
        versionControl.element.className = 'ol-attribution ol-unselectable ol-control';
        versionControl.element.style.cssText = 'bottom: 0; right: 0; max-width: calc(100% - 1em); font-size: 11px;';
        versionControl.element.innerHTML = getVersionAttribution();
        
        mapInstance.current.addControl(versionControl);
      }
    }, 100);

    // Add click event handler
    const geojsonFormat = new GeoJSON();
    clickHandlerRef.current = (e) => {
      mapInstance.current.forEachFeatureAtPixel(e.pixel, async (feature) => {
        try {
          const geometry = toGeometry(feature.getGeometry());
          const sourceProjection = mapInstance.current.getView().getProjection();
          const targetProjection = 'EPSG:4326';

          const geometryClone = geometry.clone();
          geometryClone.transform(sourceProjection, targetProjection);

          let geometryGeoJSON = geojsonFormat.writeGeometryObject(geometryClone);

          function addZDimension(geometry) {
            if (geometry.type === 'Polygon') {
              geometry.coordinates = geometry.coordinates.map(ring =>
                ring.map(coord => [...coord, 0])
              );
            }
            return geometry;
          }

          geometryGeoJSON = addZDimension(geometryGeoJSON);

          // Extract all feature properties
          const allProperties = feature.getProperties();

          // IDs (tile key can vary)
          const psid =
            feature.get('psid') ??
            allProperties?.psid ??
            feature.get('id') ??
            allProperties?.id;

          // Backend expects `petak_id` (your log shows it's present)
          const petak_id =
            feature.get('petak_id') ??
            allProperties?.petak_id ??
            feature.get('idpetak') ??
            allProperties?.idpetak ??
            feature.get('petakid') ??
            allProperties?.petakid;

          // Area:
          // Your current `luas` attribute is extremely small (likely not in ha),
          // so compute geodesic area from geometry (EPSG:4326) and convert m2 -> ha.
          const areaM2 = getGeodesicArea(geometryClone, { projection: targetProjection });
          const area = Number.isFinite(areaM2) ? areaM2 / 10000 : 0;
          
          // Create percilData object with all properties
          const percilData = {
            // keep compatibility with MapRegister:
            // - it checks `.psid`
            // - it saves `.petak_id` and reads `.area`
            psid,
            id: psid,
            petak_id,
            petakid: petak_id,
            idpetak: petak_id,
            area,
            geometry: geometryGeoJSON,
            ...allProperties // Spread all other properties
          };

          onPercilSelect(percilData);
        } catch (err) {
          console.error('Error processing feature:', err);
        }

        return true;
      });
    };

    mapInstance.current.on('click', clickHandlerRef.current);

    return () => {
      if (mapInstance.current) {
        if (clickHandlerRef.current) {
          mapInstance.current.un('click', clickHandlerRef.current);
        }
        mapInstance.current.setTarget(null);
      }
    };
  }, [isAuthenticated, googleApiKey]);

  // Update click handler when onPercilSelect changes
  useEffect(() => {
    if (mapInstance.current && clickHandlerRef.current) {
      mapInstance.current.un('click', clickHandlerRef.current);
      mapInstance.current.on('click', clickHandlerRef.current);
    }
  }, [onPercilSelect]);

  return {
    mapRef,
    mapInstance,
    polygonLayerRef,
    basemapLayerRef,
  };
}; 