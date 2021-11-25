// main.js

const is_windows = process.platform === 'win32';
const is_mac = process.platform === 'darwin';
const is_linux = process.platform === 'linux';

// Modules to control application life and create native browser window
const { app, globalShortcut, BrowserWindow, screen, Tray, Menu, MenuItem, ipcMain, dialog } = require('electron')
const path = require('path')


const { mouse, Button } = require("@nut-tree/nut-js");


var selected_deviceId = '';
var is_camera_active = false;
var is_enable_mouse = false;

var mouse_offset = {
  x: 0,
  y: 0
}

var mainWindow;
function createWindow() {
  // Create the browser window.
  let active_screen = screen.getPrimaryDisplay();
  const { width, height } = active_screen.workAreaSize;
  const x = active_screen.workArea.x;
  const y = active_screen.workArea.y;
  mouse_offset.x = active_screen.bounds.x;
  mouse_offset.y = active_screen.bounds.y;

  mainWindow = new BrowserWindow({
    title: 'handable',
    width: width,
    height: height,
    x: x,
    y: y,
    hasShadow: false,
    transparent: true,
    frame: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true
    }
  })




  // and load the index.html of the app.
  //mainWindow.loadFile('index.html')

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.


app.whenReady().then(() => {

  createWindow()
  let menu = Menu.buildFromTemplate(
    [
      {
        label: app.name,
        submenu: [
          {
            role: 'quit',
            label: `${app.name}を終了`
          }
        ]
      }
    ]);
  Menu.setApplicationMenu(menu);

  if (is_windows) tray = new Tray(`${__dirname}/images/icon.ico`);
  else if (is_mac) tray = new Tray(`${__dirname}/images/icon.png`);

  let tray_menu = Menu.buildFromTemplate([
    {
      label: 'Start/Stop',
      accelerator: 'Ctrl+Shift+s',
      click(item, focusedWindows) {
        mainWindow.webContents.executeJavaScript(`toggleMediaPipeHands("${selected_deviceId}"); `, true)
          .then(result => {
            is_camera_active = !is_camera_active;
            if (is_camera_active) {
              tray.setImage(`${__dirname}/images/icon_active.png`);
            }
            else {
              tray.setImage(`${__dirname}/images/icon.png`);
            }
          }).catch(console.error);
      }
    },
    {
      type: 'separator',
    },
    {
      label: 'Mouse operation [experimental]',
      type: 'checkbox',
      click(item, focusedWindows) {
        is_enable_mouse = !is_enable_mouse;
        mainWindow.webContents.executeJavaScript(`toggleFingerGesture(${is_enable_mouse});`, true)
          .then(result => {
          }).catch(console.error);
      }
    },
    // {
    //   label: 'Test',
    //   click(item, focusedWindows) {
    //     mainWindow.webContents.executeJavaScript(`startMediaPipeHands("${selected_deviceId}");`, true)
    //       .then(result => {
    //       }).catch(console.error);
    //   }
    // },
    {
      type: 'separator',
    },

    {
      label: 'About',
      click(item, focusedWindows) {
        const options = {
          type: 'info',  // none/info/error/quetion/warning
          title: 'ABOUT',
          message: `${app.getName()} by Tetsuaki BABA\nVersion: ${app.getVersion()}`,
          detail: `https://github.com/TetsuakiBaba/handable`
        };
        dialog.showMessageBox(options);
      }
    },
    { label: 'Quit', role: 'quit' },
  ]);

  let screens = screen.getAllDisplays();

  var data_append;
  data_append = {
    label: 'Select Display',
    submenu: []
  }
  sc_count = 0;
  for (sc of screens) {
    data_append.submenu[sc_count] = {
      label: 'Display-' + sc.id + " [" + sc.bounds.x + ", " + sc.bounds.y + "] " + sc.bounds.width + "x" + sc.bounds.height,
      type: 'radio',
      x: sc.workArea.x,
      y: sc.workArea.y,
      w: sc.workArea.width,
      h: sc.workArea.height,
      click: function (item) {
        mainWindow.setPosition(item.x, item.y, true);
        mainWindow.setSize(item.w, item.h, true);
        mouse_offset.x = item.x;
        mouse_offset.y = item.y;
      }
    };
    if (sc_count == 0) {
      data_append.submenu[sc_count].checked = true;
    }
    sc_count++;
  }
  tray_menu.insert(2, new MenuItem(data_append));

  var data_append_camera;
  data_append_camera = {
    label: 'Select Video Input',
    submenu: []
  }
  sc_count = 0;
  mainWindow.webContents.executeJavaScript('navigator.mediaDevices.enumerateDevices().then(function (devices) { let device_list = [];devices.forEach(function (device) { if( device.kind == "videoinput" ){device_list.push({label:device.label,id:device.deviceId})} console.log(device.kind + ": " + device.label +  " id = " + device.deviceId); }); return device_list;  }).catch(function (err) {  console.log(err.name + ": " + err.message); });', true)
    .then((result) => {
      for (device of result) {
        data_append_camera.submenu[sc_count] = {
          label: device.label,
          id: device.id,
          type: 'radio',
          click: function (item) {
            console.log('selected', item.id);
            selected_deviceId = item.id;
            if (is_camera_active) {
              mainWindow.webContents.executeJavaScript(`stopMediaPipeHands();`, true)
                .then(result => {
                  mainWindow.webContents.executeJavaScript(`startMediaPipeHands("${selected_deviceId}"); `, true)
                    .then(result => {
                    }).catch(console.error);
                }).catch(console.error);
            }
          }
        };
        if (sc_count == 0) {
          selected_deviceId = device.id;
          data_append_camera.submenu[sc_count].checked = true;
        }
        sc_count++;
      }
      tray_menu.insert(2, new MenuItem(data_append_camera));
      tray.setToolTip('handable');
      tray.setContextMenu(tray_menu);

    });


  tray.on('click', function () {
    tray.popUpContextMenu(tray_menu);
  });


  var ret = globalShortcut.register('ctrl+shift+s', function () {
    console.log('toggle MediaPipeHands');
    mainWindow.webContents.executeJavaScript(`toggleMediaPipeHands("${selected_deviceId}"); `, true)
      .then(result => {
        is_camera_active = !is_camera_active;
        if (is_camera_active) {
          tray.setImage(`${__dirname}/images/icon_active.png`);
        }
        else {
          tray.setImage(`${__dirname}/images/icon.png`);
        }
      }).catch(console.error);
  });



  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.setVisibleOnAllWorkspaces(true, {
    visibleOnFullScreen: true
  });
  mainWindow.setFullScreenable(false);
  mainWindow.setAlwaysOnTop(true, "screen-saver")
  mainWindow.setIgnoreMouseEvents(true);
  mainWindow.loadFile('index.html')
  //mainWindow.webContents.openDevTools();

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
app.on('will-quit', function () {

  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});


//----------------------------------------
// IPC Communication
//----------------------------------------
ipcMain.handle('down', (event, data) => {
  if (is_enable_mouse) {
    (async () => {
      var pos = {
        x: data.x + mouse_offset.x,
        y: data.y + mouse_offset.y
      }
      await mouse.setPosition(pos);
      await mouse.pressButton(Button.LEFT);
    })()
  }

})
ipcMain.handle('drag', (event, data) => {
  if (is_enable_mouse) {
    var pos = {
      x: data.x + mouse_offset.x,
      y: data.y + mouse_offset.y
    }
    mouse.setPosition(pos);
  }
})
ipcMain.handle('up', (event, data) => {
  if (is_enable_mouse) {
    (async () => {
      var pos = {
        x: data.x + mouse_offset.x,
        y: data.y + mouse_offset.y
      }
      await mouse.setPosition(pos);
      await mouse.releaseButton(Button.LEFT);
    })()
  }
})