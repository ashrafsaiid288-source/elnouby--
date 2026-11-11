const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  load: () => ipcRenderer.invoke('db:load'),
  save: (db) => ipcRenderer.invoke('db:save', db),
  notify: (title, body) => ipcRenderer.invoke('notify', { title, body }),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  exportBackup: (db) => ipcRenderer.invoke('backup:export', db),
  importBackup: () => ipcRenderer.invoke('backup:import'),
  exportCsv: (name, csv) => ipcRenderer.invoke('export:csv', { name, csv }),
  print: () => ipcRenderer.invoke('print'),
  autostart: (on) => ipcRenderer.invoke('autostart', on),
  openDataFolder: () => ipcRenderer.invoke('open-data-folder'),
  syncStatus: () => ipcRenderer.invoke('sync:status'),
  syncNow: () => ipcRenderer.invoke('sync:now'),
  syncTest: (settings) => ipcRenderer.invoke('sync:test', settings),
  syncPull: () => ipcRenderer.invoke('sync:pull'),
  theme: (t) => ipcRenderer.invoke('theme', t),
  onSync: (cb) => ipcRenderer.on('sync:status', (_e, s) => cb(s))
});
