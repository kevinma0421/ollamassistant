console.log('Preload script is loaded and running!');

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
	on: (channel, listener) => ipcRenderer.on(channel, listener),
	send: (channel, data) => ipcRenderer.send(channel, data),
});
