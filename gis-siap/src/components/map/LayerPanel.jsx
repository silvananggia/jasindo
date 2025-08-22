import React from 'react';
import { Box, Typography, Switch, Slider, Divider } from '@mui/material';
import OpacityIcon from "@mui/icons-material/Opacity";
import BasemapSwitcher from './BasemapSwitcher';

const LayerPanel = ({
  isPolygonVisible,
  setIsPolygonVisible,
  polygonOpacity,
  setPolygonOpacity,
  selectedBasemap,
  onBasemapChange,
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, paddingTop: '20px' }}>
        <Typography variant="caption">Layer Petak</Typography>
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
          gap: 2,
          width: 300,
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

      <BasemapSwitcher
        selectedBasemap={selectedBasemap}
        onBasemapChange={onBasemapChange}
      />
    </Box>
  );
};

export default LayerPanel; 