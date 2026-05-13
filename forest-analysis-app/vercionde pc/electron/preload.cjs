const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('forestDesktop', {
  platform: 'windows',
  storageMode: 'local-first',
});

