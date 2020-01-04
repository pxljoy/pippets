const electron = require('electron');
const path = require('path');
const fs = require('fs');

const Store = require('electron-store');

const store = new Store();

// const debug = require('electron-debug');

// debug();

let tray;
let window;

const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  shell,
} = electron;

// Don't show the app in the doc
app.dock.hide();


const getWindowPosition = () => {
  const windowBounds = window.getBounds();
  const trayBounds = tray.getBounds();

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));

  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height + 4);

  return { x, y };
};


const showWindow = () => {
  const position = getWindowPosition();
  window.setPosition(position.x, position.y, false);

  window.setVisibleOnAllWorkspaces(true); // put the window on all screens
  window.focus(); // focus the window up front on the active screen
  window.setVisibleOnAllWorkspaces(false); // disable all screen behavior

  window.show();
};

const toggleWindow = () => {
  if (window.isVisible()) {
    window.hide();
  } else {
    showWindow();
  }
};
const createWindow = () => {
  window = new BrowserWindow({
    width: 400,
    height: 600,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true,
    },
    name: 'Pippets',
    vibrancy: 'dark',
    acceptFirstMouse: true,
    backgroundColor: '#AA000000',
  });

  window.loadURL(`file://${path.join(__dirname, 'public/index.html')}`);

  // Hide the window when it loses focus
  window.on('blur', () => {
    if (!window.webContents.isDevToolsOpened()) {
      window.hide();
    }
  });

  window.webContents.on('did-finish-load', () => {
    window.webContents.send('receive-store', store.store);
  });

  ipcMain.on('drag-file', (_, file) => {
    window.webContents.startDrag({
      file,
      icon: path.join(__dirname, './src/assets/img.png'),
    });
  });
};

const addFiles = async (files) => {
  const images = await Promise.all(files.map(async (file) => ({
    path: file,
    ext: path.extname(file).substr(1),
    directory: fs.lstatSync(file).isDirectory(),
    image: await (await app.getFileIcon(file, { size: 'normal' })).toDataURL(),
  })));

  store.set('files', images);
  tray.setTitle(`${images.length}`);
  tray.setToolTip('Click to open palette');
  window.webContents.send('receive-store', store.store);
};

const createTray = () => {
  tray = new Tray(path.join(__dirname, './src/assets/sunTemplate.png'));
  tray.setToolTip('Drag files to hold');
  tray.setTitle(`${(store.get('files') || []).length || ''}`);
  tray.on('drop-files', async (_, files) => {
    await addFiles(files);
    showWindow();
  });
  tray.on('right-click', () => {
    tray.setTitle('');
    store.set('files', []);
    tray.setToolTip('Drag files into icon to hold');
    window.webContents.send('receive-store', store.store);
    window.hide();
  });
  tray.on('click', () => {
    toggleWindow();
  });
};

app.on('ready', () => {
  createTray();
  createWindow();
});

app.on('open-file', (_, file) => {
  addFiles([file]);
});


ipcMain.on('show-window', () => {
  showWindow();
});

ipcMain.on('open-file', (_, file) => {
  shell.openItem(file);
});
