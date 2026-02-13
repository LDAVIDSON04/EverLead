const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  login: (email, password) => ipcRenderer.invoke('login', email, password),
  hasAuthConfig: () => ipcRenderer.invoke('hasAuthConfig'),
  createAccountSignup: (payload) => ipcRenderer.invoke('createAccountSignup', payload),
});
