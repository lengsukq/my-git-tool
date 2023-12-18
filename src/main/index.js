import { app, shell, BrowserWindow,ipcMain  } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  // 监听来自渲染进程的消息
  ipcMain.on('gitPull', (event, arg) => {
    console.log('Received message from renderer:', JSON.parse(arg));
    let formInline = JSON.parse(arg)
    // 在这里可以执行相应的操作，并向渲染进程发送回复
    // 执行Shell命令
    exec(`cd ${formInline.file} && git pull`, (error, stdout, stderr) => {
      if (error) {
        event.reply('command-result', { error: error.message });
        return;
      }
      if (stderr) {
        event.reply('command-result', { error: stderr });
        return;
      }
      event.reply('command-result', { result: stdout });
    });
    event.reply('reply-from-main', arg);
  });
  ipcMain.on('gitCommit', (event, arg) => {
    console.log('gitCommit---', JSON.parse(arg));
    let formInline = JSON.parse(arg)
    // 在这里可以执行相应的操作，并向渲染进程发送回复
    // 执行Shell命令
    //stdout（标准输出流） 用于输出正常的程序输出。
    // stderr（标准错误流） 用于输出错误信息和警告，通常用于指示程序执行时的问题。
    exec(`cd ${formInline.file} && git add . && git commit -m ${formInline.text} && git push`, (error, stdout, stderr) => {
      if (error) {
        event.reply('command-result', { error: error.message });
        return;
      }
      if (stderr) {
        event.reply('command-result', { error: stderr });
        return;
      }
      event.reply('command-result', { result: stdout });
    });
    event.reply('reply-from-main', arg);
  });

  // 保存对象到本地
  function saveObjectToCache(obj) {
    const filePath = path.join(app.getPath('userData'), 'cache.json');
    fs.writeFileSync(filePath, obj);
  }
// 监听来自渲染进程的消息，保存对象到本地
  ipcMain.on('save-object', (event, obj) => {
    saveObjectToCache(obj);
  });


// 从本地读取对象
  function getObjectFromCache() {
    const filePath = path.join(app.getPath('userData'), 'cache.json');
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Error reading file:', err);
      return null;
    }
  }

// 监听来自渲染进程的请求，发送本地对象到渲染进程
  ipcMain.on('get-object', (event) => {
    const obj = getObjectFromCache();
    event.reply('send-object', obj);
  });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
