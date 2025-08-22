import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { basemapOptions } from '../../utils/mapUtils';

const BasemapSwitcher = ({ selectedBasemap, onBasemapChange }) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, paddingTop: '20px' }}>
        <Typography variant="caption">Basemap</Typography>
        <Divider />
      </Box>
      <Divider />
      <div className="basemap-option">
        {basemapOptions.map((option) => (
          <div key={option.key} className="button-container">
            <div
              className={`image ${selectedBasemap === option.key ? "active" : ""}`}
              id={option.key}
              onClick={() => onBasemapChange(option.key)}
            />
            <div className={`label-basemap ${selectedBasemap === option.key ? "active" : ""}`}>
              <Typography fontSize={10} align="center">
                {option.label}
              </Typography>
            </div>
          </div>
        ))}
      </div>
      <Divider />
    </Box>
  );
};

export default BasemapSwitcher; 