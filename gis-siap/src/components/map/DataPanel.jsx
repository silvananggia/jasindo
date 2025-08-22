import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  TablePagination,
  Button,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import { getPercilStyle } from '../../utils/percilStyles';
import { Style, Stroke, Fill } from 'ol/style';
import Swal from 'sweetalert2';

const DataPanel = ({
  formData,
  selectedPercils,
  setSelectedPercils,
  totalArea,
  isValid,
  onSave,
  polygonLayerRef,
  listPetak,
  source, // 'MapView' or 'MapRegister'
  isLoading,
  onDeletePetak, // Function to delete petak from database
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);
  const [hoveredId, setHoveredId] = useState(null);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleMouseEnter = (id) => {
    setHoveredId(id);
    
    // Update main layer style
    if (polygonLayerRef.current) {
      const hoverStyle = (feature) => {
        const featureId = feature.get('id');
        const properties = feature.getProperties();
        
        // Try different property names that might contain the petak ID
        const possibleIds = [
          properties.idpetak,
          properties.id,
          properties.idds_siap,
          featureId
        ].filter(Boolean);
        
        // Check for matches using the same logic as the styling function
        const isMatch = possibleIds.some(possibleId => 
          possibleId == id || possibleId.toString() === id || possibleId === id.toString()
        );
        

        
        // Always apply hover style if IDs match
        if (isMatch) {
          return new Style({
            stroke: new Stroke({
              color: '#FF0000',
              width: 3,
            }),
            fill: new Fill({
              color: 'rgba(255, 0, 0, 0.3)',
            }),
          });
        }
        
        // Return default style for non-matching features using the same logic
        const lockedIDs = (listPetak || []).map(p => p.idpetak);
        const totalRegisteredPetak = (listPetak || []).length;
        const totalSelectedPetak = selectedPercils.length;
        const totalPetak = totalRegisteredPetak + totalSelectedPetak;
        const isLimitReached = totalPetak >= formData.jmlPetak;
        return getPercilStyle(selectedPercils, lockedIDs, isLimitReached)(feature);
      };
      
      // Force style update
      polygonLayerRef.current.setStyle(hoverStyle);
      polygonLayerRef.current.changed();
    }
    

  };

  const handleMouseLeave = () => {
    setHoveredId(null);
    
    // Reset main layer style
    if (polygonLayerRef.current) {
      const lockedIDs = (listPetak || []).map(p => p.idpetak);
      const totalRegisteredPetak = (listPetak || []).length;
      const totalSelectedPetak = selectedPercils.length;
      const totalPetak = totalRegisteredPetak + totalSelectedPetak;
      const isLimitReached = totalPetak >= formData.jmlPetak;
      polygonLayerRef.current.setStyle(getPercilStyle(selectedPercils, lockedIDs, isLimitReached));
      polygonLayerRef.current.changed();
    }
    

  };

  const handleDeletePetak = async (petakId, isFromDatabase = false) => {
    try {
      const result = await Swal.fire({
        title: 'Konfirmasi Hapus',
        text: `Apakah Anda yakin ingin menghapus petak ${petakId}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus!',
        cancelButtonText: 'Batal'
      });

      if (result.isConfirmed) {
        if (isFromDatabase) {
          // Delete from database
          if (onDeletePetak) {
            await onDeletePetak(petakId);
          } else {
            console.warn('onDeletePetak function not provided');
          }
        } else {
          // Remove from selected list
          const updated = selectedPercils.filter((item) => item.id !== petakId);
          setSelectedPercils(updated);
          
          // Update map style
          if (polygonLayerRef.current) {
            const lockedIDs = (listPetak || []).map(p => p.idpetak);
            const totalRegisteredPetak = (listPetak || []).length;
            const totalSelectedPetak = updated.length;
            const totalPetak = totalRegisteredPetak + totalSelectedPetak;
            const isLimitReached = totalPetak >= formData.jmlPetak;
            polygonLayerRef.current.setStyle(getPercilStyle(updated, lockedIDs, isLimitReached));
            polygonLayerRef.current.changed();
          }
        }

        Swal.fire(
          'Terhapus!',
          'Petak berhasil dihapus.',
          'success'
        );
      }
    } catch (error) {
      console.error('Error deleting petak:', error);
      Swal.fire(
        'Error!',
        'Gagal menghapus petak.',
        'error'
      );
    }
  };

  return (
    <Box p={2}>
      <Typography variant="body2"><strong>NIK:</strong> {formData.nik}</Typography>
      <Typography variant="body2"><strong>Nama:</strong> {formData.nama}</Typography>
      <Typography variant="body2"><strong>Luas Lahan:</strong> {formData.luasLahan} ha</Typography>
      <Typography variant="body2"><strong>Jumlah Petak:</strong> {formData.jmlPetak}</Typography>
      {source === 'MapClaim' && <Typography variant="body2"><strong>Nomor Polis:</strong> {formData.noPolis}</Typography>}
      
      {/* Combined Total Area */}
      {(source === 'MapRegister' || source === 'MapClaim') && (
        <Box mt={1} p={1} borderRadius={1} sx={{ 
          backgroundColor: '#f3f4f6',
          border: '1px solid #d1d5db'
        }}>
          <Typography variant="body2" sx={{ 
            color: '#374151',
            fontWeight: 'bold'
          }}>
            Total Luas Keseluruhan: {(
              (listPetak?.reduce((sum, p) => sum + parseFloat(p.luas || 0), 0) || 0) + 
              (selectedPercils.reduce((sum, p) => sum + parseFloat(p.area || 0), 0))
            ).toFixed(2)} ha
          </Typography>
        </Box>
      )}

      {/* Status indicator for MapRegister */}
      {(source === 'MapRegister' || source === 'MapClaim') && (
        <Box mt={1} p={1} borderRadius={1} sx={{ 
          backgroundColor: ((listPetak ? listPetak.length : 0) + selectedPercils.length) >= formData.jmlPetak ? '#ffebee' : '#e8f5e8',
          border: `1px solid ${((listPetak ? listPetak.length : 0) + selectedPercils.length) >= formData.jmlPetak ? '#f44336' : '#4caf50'}`
        }}>
          <Typography variant="body2" sx={{ 
            color: ((listPetak ? listPetak.length : 0) + selectedPercils.length) >= formData.jmlPetak ? '#d32f2f' : '#2e7d32',
            fontWeight: 'bold'
          }}>
            Status: {((listPetak ? listPetak.length : 0) + selectedPercils.length) >= formData.jmlPetak 
              ? `Tidak dapat memilih petak baru (${(listPetak ? listPetak.length : 0) + selectedPercils.length}/${formData.jmlPetak})`
              : `Dapat memilih petak (${(listPetak ? listPetak.length : 0) + selectedPercils.length}/${formData.jmlPetak})`
            }
          </Typography>
        </Box>
      )}
      {/* Lahan Terdaftar Section - Show for all sources */}
      <Typography variant="body2" style={{ marginTop: '1rem' }}><strong>Lahan Terdaftar</strong></Typography>
      {listPetak && listPetak.length > 0 ? (
        <>
                    <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
            Total Luas: {listPetak.reduce((sum, p) => sum + parseFloat(p.luas || 0), 0).toFixed(2)} ha
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Typography variant="body2"><strong>ID</strong></Typography></TableCell>
                <TableCell><Typography variant="body2"><strong>Luas</strong></Typography></TableCell>
                {(source === 'MapRegister' || source === 'MapClaim') && (
                  <TableCell align="right"><Typography variant="body2"><strong>Aksi</strong></Typography></TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {listPetak.map((p) => {
                // For both MapRegister and MapClaim, we use idpetak for deletion and display
                const itemId = p.idpuser;
                const itemIdForDisplay = p.idpetak;
                
                return (
                  <TableRow 
                    key={itemId}
                    onMouseEnter={() => handleMouseEnter(itemIdForDisplay)}
                    onMouseLeave={handleMouseLeave}
                    sx={{ 
                      cursor: 'pointer',
                      backgroundColor: hoveredId === itemIdForDisplay ? 'rgba(0, 0, 0, 0.04)' : 'inherit'
                    }}
                  >
                    <TableCell>
                      <Typography variant="caption">
                        {itemIdForDisplay}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">
                        {p.luas}
                      </Typography>
                    </TableCell>
                    {(source === 'MapRegister' || source === 'MapClaim') && (
                      <TableCell align="right">
                        <IconButton
                          aria-label={`Hapus Lahan ${itemIdForDisplay}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePetak(itemId, true);
                          }}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      ) : (
        <Typography variant="body2">Belum Ada Lahan Terdaftar</Typography>
      )}

      <Divider style={{ margin: '1rem 0' }} />

      {/* Selected Petak List - Only show in MapRegister or MapClaim */}
      {(source === 'MapRegister' || source === 'MapClaim') && (() => {
        const availablePetak = Math.max(0, formData.jmlPetak - (listPetak ? listPetak.length : 0));
        
        // Only show the section if there are petak available to select OR if there are already selected petak
        if (availablePetak === 0 && selectedPercils.length === 0) {
          return null;
        }
        
        return (
          <>
            <Typography variant="body2"><strong>Lahan Terpilih</strong></Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
              Total Luas: {selectedPercils.reduce((sum, p) => sum + parseFloat(p.area || 0), 0).toFixed(2)} ha
            </Typography>
            {((listPetak ? listPetak.length : 0) + selectedPercils.length) >= formData.jmlPetak && (
              <Box mt={1} p={1} borderRadius={1} sx={{ 
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                mb: 1
              }}>
                <Typography variant="caption" sx={{ color: '#856404', fontWeight: 'bold' }}>
                  ⚠️ Limit tercapai! Tidak dapat memilih petak baru lagi. Anda masih dapat menghapus petak yang sudah dipilih.
                </Typography>
              </Box>
            )}
            <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1 }}>
              {selectedPercils.length} petak terpilih dari maksimal {availablePetak} yang dapat dipilih
            </Typography>
            <Box sx={{ width: '100%', mb: 1 }}>
              <Box sx={{ 
                width: `${Math.min(100, (((listPetak ? listPetak.length : 0) + selectedPercils.length) / formData.jmlPetak) * 100)}%`,
                height: 4,
                backgroundColor: ((listPetak ? listPetak.length : 0) + selectedPercils.length) >= formData.jmlPetak ? '#f44336' : '#4caf50',
                borderRadius: 2,
                transition: 'width 0.3s ease'
              }} />
            </Box>
            {selectedPercils.length === 0 ? (
              <Typography variant="body2">Belum Ada Lahan Terpilih</Typography>
            ) : (
              <>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><Typography variant="body2"><strong>ID</strong></Typography></TableCell>
                      <TableCell><Typography variant="body2"><strong>Luas</strong></Typography></TableCell>
                      <TableCell align="right"><Typography variant="body2"><strong>Aksi</strong></Typography></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedPercils.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((p) => (
                      <TableRow 
                        key={p.id}
                        onMouseEnter={() => handleMouseEnter(p.id)}
                        onMouseLeave={handleMouseLeave}
                        sx={{ 
                          cursor: 'pointer',
                          backgroundColor: hoveredId === p.id ? 'rgba(0, 0, 0, 0.04)' : 'inherit'
                        }}
                      >
                        <TableCell><Typography variant="caption">{p.id}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{p.area}</Typography></TableCell>
                        <TableCell align="right">
                          <IconButton
                            aria-label={`Hapus Lahan ${p.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePetak(p.id, false);
                            }}
                            size="small"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Typography variant="body2" style={{ marginTop: '0.5rem' }}>
                  <strong>Luas Total:</strong> {totalArea.toFixed(2)} ha
                </Typography>
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
                    onClick={onSave}
                    sx={{ mt: 2 }}
                    disabled={!isValid}
                  >
                    Simpan
                  </Button>
                )}
              </>
            )}
          </>
        );
      })()}
    </Box>
  );
};

export default DataPanel;