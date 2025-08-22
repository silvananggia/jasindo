import { Fill, Stroke, Style } from 'ol/style';

export const getPercilStyle = (selection, lockedIDs = [], isLimitReached = false) => (feature) => {
  const id = feature.get('id');
  const properties = feature.getProperties();
  
  // Try different property names that might contain the petak ID
  const possibleIds = [
    properties.idpetak,
    properties.id,
    properties.idds_siap, // This might be the actual petak identifier
    id
  ].filter(Boolean); // Remove undefined values
  
  // Check multiple ID formats for matching, including string conversion
  const isSelected = selection.some((p) => possibleIds.includes(p.id));
  const isLocked = possibleIds.some(possibleId => 
    lockedIDs.includes(possibleId) || lockedIDs.includes(possibleId.toString())
  );
  

  
  let strokeColor = '#FF5733'; // Default red
  let fillColor = 'rgba(255, 87, 51, 0.1)'; // Default red fill
  
  if (isSelected || isLocked) {
    strokeColor = '#00FF00'; // Green for selected and registered
    fillColor = 'rgba(0, 255, 0, 0.1)'; // Green fill
  } else if (isLimitReached) {
    strokeColor = '#9E9E9E'; // Light gray for unavailable when limit reached
    fillColor = 'rgba(158, 158, 158, 0.05)'; // Very light gray fill
  }
  
  return new Style({
    stroke: new Stroke({
      color: strokeColor,
      width: 1,
    }),
    fill: new Fill({
      color: fillColor,
    }),
  });
}; 