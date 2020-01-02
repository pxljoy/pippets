const electron = require('electron');
const path = require('path');
const uniq = require('lodash/uniq');

const Store = require('electron-store');
const store = new Store();


// const getAnglePO = (x, y) => {
//   if (x > 0) {
//     if (y >= 0) {
//       return Math.atan(y / x);
//     }
//     return Math.atan(y / x) + 2 * Math.PI;
//   }
//   if (!x) {
//     if (!y) {
//       return 0;
//     }
//     if (y > 0) {
//       return Math.PI / 2;
//     }
//     return 3 * Math.PI / 2;
//   }
//   return Math.atan(y / x) + Math.PI;
// }


// const debug = require('electron-debug');

// debug();

let tray = undefined
let window = undefined

const {app, BrowserWindow, ipcMain, Tray, Menu} = electron;

// Don't show the app in the doc
app.dock.hide()

app.on('ready', () => {
  createTray()
  createWindow()

  // let oldMX;
  // let oldMY;

  // let curMX;
  // let curMY;

  // let current = '';

  // // const gesture1 = '46464';
  // // const gesture2 = '19191';
  // // const gesture3 = '73737';
  // // const gesture4 = '28282';
  // // const gesture5 = '64646';
  // // const gesture6 = '91919';
  // // const gesture7 = '37373';
  // // const gesture8 = '82828';

  // let trig = 0;
  // let shown = false;

  // setInterval(function () {
  //   trig += 1;
  //   if (!shown) {
  //     const { x, y } = electron.screen.getCursorScreenPoint();
  //     oldMX = curMX;
  //     oldMY = curMY;

  //     curMX = x;
  //     curMY = y;

  //     distX = Math.abs(curMX - oldMX) * Math.abs(curMX - oldMX)
  //     distY = Math.abs(curMY - oldMY) * Math.abs(curMY - oldMY)
  //     curDist = Math.round(Math.sqrt(distX + distY))

  //     if (curDist > 50) {
  //       const a = getAnglePO(curMY - oldMY, curMX - oldMX) * 57.2957795130823;
  //       let direction;
  //       if (a >= 337.5 || a < 22.5) {
  //         direction = '6';
  //       } else if (a >= 22.5 && a < 67.5) {
  //         direction = '3';
  //       } else if (a >= 67.5 && a < 112.5) {
  //         direction = '2';
  //       } else if (a >= 112.5 && a < 157.5) {
  //         direction = '1';
  //       } else if (a >= 157.5 && a < 202.5) {
  //         direction = '4';
  //       } else if (a >= 202.5 && a < 247.5) {
  //         direction = '7';
  //       } else if (a >= 247.5 && a < 292.5) {
  //         direction = '8';
  //       } else if (a >= 292.5 && a < 337.5) {
  //         direction = '9';
  //       }

  //       if (direction !== current[current.length - 1]) {
  //         current += direction;
  //       }
  //     }
  //     if (trig === 100) {
  //       // console.log(current);
  //       if (current.length >= 3) {
  //         current = '';
  //         // console.log('SHOOK');

  //         window.setPosition(x, y, false);

  //         window.setVisibleOnAllWorkspaces(true); // put the window on all screens
  //         window.focus(); // focus the window up front on the active screen
  //         window.setVisibleOnAllWorkspaces(false); // disable all screen behavior

  //         window.show();
  //       }

  //       current = '';
  //     }
  //   }
  //   if (trig === 100) trig = 0;

  // }, 1);

})

const createTray = () => {
  tray = new Tray(path.join(__dirname, './src/assets/sunTemplate.png'));
  tray.setToolTip('Drag files to hold');
  tray.setTitle(`${store.get('files').length || ''}`);
  tray.on('drop-files', (_, files) => {
    store.set('files', files);
    tray.setToolTip('Click to open palette');
    window.webContents.send('receive-store', store.store);
    showWindow();
    tray.setTitle(store.get('files').length + '');
  });
  tray.on('right-click', () => {
    tray.setTitle('');
    store.set('files', []);
    tray.setToolTip('Drag files into icon to hold');
    window.webContents.send('receive-store', store.store);
  });
  tray.on('click', () => {
    showWindow();
  });

}

const getWindowPosition = () => {
  const windowBounds = window.getBounds();
  const trayBounds = tray.getBounds();

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));

  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height + 4);

  return { x: x, y: y };
}

const createWindow = () => {
  window = new BrowserWindow({
    width: 200,
    height: 300,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      backgroundThrottling: false,
      nodeIntegration: true
    },
    name: 'Pippets',
    vibrancy: 'dark',
    acceptFirstMouse: true,
    backgroundColor: '#AA000000',
  })

  window.loadURL(`file://${path.join(__dirname, 'public/index.html')}`)

  // Hide the window when it loses focus
  window.on('blur', () => {
    if (!window.webContents.isDevToolsOpened()) {
      window.hide()
    }
  })

  window.webContents.on('did-finish-load', () => {
    window.webContents.send('receive-store', store.store);
  });

  ipcMain.on('drag-file', (_, file) => {
    console.log('dragging', file);
    window.webContents.startDrag({
      file,
      icon: path.join(__dirname, './src/assets/img.png')
    });
  });
}

const toggleWindow = () => {
  window.isVisible() ? window.hide() : showWindow();
}

const showWindow = () => {
  const position = getWindowPosition();
  window.setPosition(position.x, position.y, false);

  window.setVisibleOnAllWorkspaces(true); // put the window on all screens
  window.focus(); // focus the window up front on the active screen
  window.setVisibleOnAllWorkspaces(false); // disable all screen behavior

  window.show();
}

ipcMain.on('show-window', () => {
  showWindow();
})
