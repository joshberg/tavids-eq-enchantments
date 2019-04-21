import {
  app,
  BrowserWindow,
  ipcMain
} from 'electron';
import installExtension, {
  REACT_DEVELOPER_TOOLS
} from 'electron-devtools-installer';
import {
  enableLiveReload
} from 'electron-compile';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const isDevMode = process.execPath.match(/[\\/]electron/);

if (isDevMode) enableLiveReload({
  strategy: 'react-hmr'
});

const createWindow = async () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 900,
    height: 800,
    minWidth: 200,
    minHeight: 100
  });

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Open the DevTools.
  // if (isDevMode) {
  //   await installExtension(REACT_DEVELOPER_TOOLS);
  //   mainWindow.webContents.openDevTools();
  // }

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
let windowDps;
let windowMap;
let windowSpellTimers;
let windowMobInfo;
let isWindowDpsOn = false;
let isWindowMapOn = false;
let isWindowSpellTimersOn = false;
let isWindowMobInfoOn = false;

app.on('ready', function () {
  createWindow();

  ipcMain.on('overlayToggleDPS', function (event, dpsConfig) {
    if (!isWindowDpsOn) {
      windowDps = new BrowserWindow({
        width: dpsConfig.Width,
        height: dpsConfig.Height,
        show: false,
        x: dpsConfig.X,
        y: dpsConfig.Y,
        movable: true,
        alwaysOnTop: true,
        transparent: true,
        frame: false,
        maximizable: false,
        enableRemoteModule: true,
        resizable: false
      })
      windowDps.loadURL(`file://${__dirname}/views/dps.html`);
      windowDps.once("ready-to-show", () => {
        windowDps.show();
        windowDps.send("dpsProps", dpsConfig);
      });
      isWindowDpsOn = true;
    } else {
      windowDps.hide();
      isWindowDpsOn = false;
    }
  });
  ipcMain.on('overlayDpsUpdate', (event, data) => {
    if (isWindowDpsOn === true)
      windowDps.send("dpsProps", data);
  });

  ipcMain.on('overlayMobInfoToggle', function (event, mobInfo) {
    if (!isWindowMobInfoOn) {
      windowMobInfo = new BrowserWindow({
        width: mobInfo.Width,
        height: mobInfo.Height,
        show: false,
        x: mobInfo.X,
        y: mobInfo.Y,
        movable: true,
        alwaysOnTop: true,
        transparent: true,
        frame: false,
        maximizable: false,
        enableRemoteModule: true,
        resizable: false
      })
      windowMobInfo.loadURL(`file://${__dirname}/views/mobInfo.html`);
      windowMobInfo.once("ready-to-show", () => {
        windowMobInfo.show();
        windowMobInfo.send("mobInfoProps", mobInfo);
      });
      isWindowMobInfoOn = true;
    } else {
      windowMobInfo.hide();
      isWindowMobInfoOn = false;
    }
  });
  ipcMain.on('overlayMobInfoUpdate', (event, data) => {
    if (isWindowMobInfoOn === true)
      windowMobInfo.send("mobInfoProps", data);
  });

  ipcMain.on('overlayMapToggle', function (event, map) {
    if (!isWindowMapOn) {
      windowMap = new BrowserWindow({
        width: map.Width,
        height: map.Height,
        show: false,
        x: map.X,
        y: map.Y,
        movable: true,
        alwaysOnTop: true,
        transparent: true,
        frame: false,
        maximizable: false,
        enableRemoteModule: true,
        resizable: false
      })
      windowMap.loadURL(`file://${__dirname}/views/map.html`);
      windowMap.once("ready-to-show", () => {
        windowMap.show();
        windowMap.send("mapProps", map);
      });
      isWindowMapOn = true;
    } else {
      windowMap.hide();
      isWindowMapOn = false;
    }
  });
  ipcMain.on('overlayMapUpdate', (event, data) => {
    if (isWindowMapOn === true)
      windowMap.send("mapProps", data);
  });

  ipcMain.on('logme', (event,data)=>{
    console.log(data);
  });
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.