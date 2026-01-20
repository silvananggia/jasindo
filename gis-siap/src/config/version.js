/**
 * Version Information Configuration
 * 
 * Cara Update Versi:
 * 1. Update field 'version' dengan versi baru (contoh: '1.0.1', '1.1.0', '2.0.0')
 * 2. Update 'buildDate' dengan tanggal build (format: YYYY-MM-DD)
 * 3. Update 'releaseNotes' dengan catatan perubahan versi
 * 
 * Informasi versi ini akan otomatis ditampilkan di bagian attribution peta
 * pada semua halaman map yang menggunakan hook useMap.
 */

export const versionInfo = {
  version: '0.0.1',
  buildDate: '2026-01-20', // YYYY-MM-DD format - Update saat release baru
  buildTime: new Date().toTimeString().split(' ')[0], // HH:MM:SS format
  releaseNotes: 'Initial release',
};

/**
 * Get formatted version string for display
 */
export const getVersionString = () => {
  return `v${versionInfo.version}`;
};

/**
 * Get full version information string
 */
export const getFullVersionInfo = () => {
  return `GIS SIAP ${getVersionString()} | Build: ${versionInfo.buildDate}`;
};

/**
 * Get version attribution text for map (plain text)
 */
export const getVersionAttribution = () => {
  return getFullVersionInfo();
};

/**
 * Get version attribution HTML for map (with styling)
 */
export const getVersionAttributionHTML = () => {
  return `<span style="font-size: 11px; color: #666;">${getFullVersionInfo()}</span>`;
};

export default versionInfo;
