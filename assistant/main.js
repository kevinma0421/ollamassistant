const robot = require('@hurdlegroup/robotjs');
const path = require('path');
const { app, BrowserWindow, clipboard, globalShortcut } = require('electron');

// Ensure the correct path to the Electron binary
/*console.log(
	'Electron binary path:',
	path.join(__dirname, 'node_modules', '.bin', 'electron.cmd')
);*/

require('electron-reload')(__dirname, {
	electron: path.join(__dirname, 'node_modules', 'electron'),
});

let win;

app.whenReady().then(() => {
	win = new BrowserWindow({
		width: 600,
		height: 800,
		alwaysOnTop: false,
		frame: true,
		webPreferences: {
			nodeIntegration: true,
			preload: path.join(__dirname, 'preload.js'), // Load the preload script
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

	// shortcut to copy paste
	globalShortcut.register('F2', () => {
		//console.log(globalShortcut.isRegistered('F2'));

		robot.keyTap('c', 'control');
		let text = clipboard.readText();
		let trimmed = text.trimStart();
		win.webContents.send('pasteText', trimmed);
		if (win.isMinimized()) {
			win.restore();
		}
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
