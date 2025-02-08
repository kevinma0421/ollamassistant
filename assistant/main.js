const robot = require('@hurdlegroup/robotjs');
const path = require('path');
const { app, BrowserWindow, clipboard, globalShortcut } = require('electron');

require('electron-reload')(__dirname, {
	electron: path.join(
		__dirname,
		'node_modules',
		'electron',
		'dist',
		'electron.exe'
	),
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
		transparent: false,
		hasShadow: false,
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
		win.webContents.executeJavaScript(`
            const inputBox = document.querySelector('input');
            if (inputBox) {
                inputBox.focus();
            }
        `);
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
