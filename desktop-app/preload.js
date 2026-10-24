const { contextBridge, ipcRenderer } = require('electron');

// Expose safe, native Windows APIs to the Studio UI
contextBridge.exposeInMainWorld('genuxNative', {
  platform: 'win32',
  isDesktop: true,
  
  // Custom Modern Frameless Window Controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:isMaximized'),

  // Native File Dialogs
  openVideoDialog: () => ipcRenderer.invoke('dialog:openVideo'),
  openImageDialog: () => ipcRenderer.invoke('dialog:openImage'),
  saveVideoDialog: (defaultName) => ipcRenderer.invoke('dialog:saveVideo', defaultName),
  showItemInFolder: (path) => ipcRenderer.invoke('shell:showItemInFolder', path),
  
  // Hardware & Engine Telemetry
  getGpuTelemetry: () => ipcRenderer.invoke('hardware:getGpuTelemetry'),
  scanLocalModelCaches: () => ipcRenderer.invoke('scanner:scanLocalCaches'),
  
  // Real Model Downloader & Management
  startModelDownload: (modelConfig) => ipcRenderer.invoke('downloader:startDownload', modelConfig),
  cancelModelDownload: (modelId) => ipcRenderer.invoke('downloader:cancelDownload', modelId),
  listModels: () => ipcRenderer.invoke('downloader:listModels'),
  importLocalModelFile: (modelId) => ipcRenderer.invoke('downloader:importLocalModelFile', modelId),
  removeModelFile: (modelId) => ipcRenderer.invoke('downloader:removeModelFile', modelId),
  onModelDownloadProgress: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('downloader:progress', handler);
    return () => ipcRenderer.removeListener('downloader:progress', handler);
  },

  // Real Social Link Importer (yt-dlp / Direct Stream)
  importVideoUrl: (url) => ipcRenderer.invoke('social:importUrl', url),
  searchYouTube: (query) => ipcRenderer.invoke('social:searchYouTube', query),
  getViralFeeds: (params) => ipcRenderer.invoke('social:getViralFeeds', params),
  onSocialImportProgress: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('social:progress', handler);
    return () => ipcRenderer.removeListener('social:progress', handler);
  },

  selectDirectory: (defaultPath) => ipcRenderer.invoke('dialog:selectDirectory', defaultPath),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  openPath: (p) => ipcRenderer.invoke('shell:openPath', p),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),

  // Engine Recasting Job Execution
  startRecastJob: (jobConfig) => ipcRenderer.invoke('engine:startRecastJob', jobConfig),
  cancelRecastJob: () => ipcRenderer.invoke('engine:cancelRecastJob'),
  onPipelineProgress: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('pipeline:progress', handler);
    return () => ipcRenderer.removeListener('pipeline:progress', handler);
  },

  // Auto-Updater APIs
  getAppVersion: () => ipcRenderer.invoke('updater:getVersion'),
  checkAppUpdate: () => ipcRenderer.invoke('updater:checkAppUpdate'),
  downloadAndInstallUpdate: (url) => ipcRenderer.invoke('updater:downloadAndInstallUpdate', url),
  checkModelUpdates: () => ipcRenderer.invoke('updater:checkModelUpdates'),
  onUpdateAvailable: (callback) => {
    const handler = (_, data) => callback(data);
    ipcRenderer.on('updater:updateAvailable', handler);
    return () => ipcRenderer.removeListener('updater:updateAvailable', handler);
  },

  // Anonymous Telemetry & Sync APIs
  syncTelemetry: (extra) => ipcRenderer.invoke('telemetry:sync', extra),
  logClientError: (err) => ipcRenderer.invoke('telemetry:logError', err)
});

