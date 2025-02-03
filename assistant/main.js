const path = require('path');

// Ensure the correct path to the Electron binary
console.log(
	'Electron binary path:',
	path.join(__dirname, 'node_modules', '.bin', 'electron.cmd')
);

require('electron-reload')(__dirname, {
	electron: require(`${__dirname}/node_modules/electron`),
});
const { app, BrowserWindow, clipboard, globalShortcut } = require('electron');

let win;

app.whenReady().then(() => {
	win = new BrowserWindow({
		width: 600,
		height: 800,
		alwaysOnTop: false, // Floating window
		frame: true, // Keep a simple UI
		webPreferences: {
			nodeIntegration: true,
			preload: './preload.js', // Load the preload script
			contextIsolation: true,
		},
	});

	win.loadURL('http://localhost:3000'); // Loads Next.js frontend

	win.on('blur', () => {
		if (!win.isFocused()) {
			//console.log('poor');
			win.minimize();
		}
	});
	//win.setMenu(null);

	// Global shortcut to paste selected text into the chat
	globalShortcut.register('CommandOrControl+Shift+V', () => {
		let text = clipboard.readText(); // Read copied text
		win.webContents.send('pasteText', text); // Send it to the chat UI
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
