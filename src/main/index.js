import { app, shell, BrowserWindow, ipcMain, ipcRenderer, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import { IoMdOptions } from 'react-icons/io'
import { DOMParser, XMLSerializer } from 'xmldom'
import {Canvas , Rect} from 'fabric'
import * as fabric from 'fabric'
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 950,
    height: 750,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
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

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // ipcMain.handle('save-svg', () => {
  //   console.log("Hello from handle.")
  // })

  // Handle save dialog request
  ipcMain.handle('dialog:save', async (_,svgData) => {
    const result = await dialog.showSaveDialog({
      title: 'Save Canvas As SVG',
      defaultPath: 'drawing.svg',
      filters: [{ name: 'SVG Files', extensions: ['svg'] }]
  })
  console.log("result from ipcmain",result.filePath)


  if(result.filePath){
    console.log("Inside ipcmain if block.")
    fs.writeFileSync(result.filePath, svgData)
    return { success : true }
  }else{
    console.log("Inside else block",result.filePath)
    return { success : false }
  }


  // return result.filePath
})

ipcMain.handle('open-svg', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Open SVG File',
    filters: [
      { name: 'SVG Files', extensions: ['svg'] }
    ]
  });

  if (filePaths.length > 0) {
    const filePath = filePaths[0];
    const svgData = fs.readFileSync(filePath, 'utf-8');
    return svgData;
  }
});

  // ipcMain.handle('dialog:open', async (_,canvas) => {
  //   const result = await dialog.showOpenDialog({
  //     title: "Open svg as canvas",
  //     filters : [{name :"SVG files", extensions: ['svg']}]
  //   })

  //   const filepath = result.filePaths[0]
  //   console.log("result ipcmain dialog:open: ",filepath)


  //   if(filepath){
  //     console.log("Inside ipcmain dialog:open if block.")

  //     try {
  //       const data = fs.readFileSync(filepath, 'utf8')
  //       console.log("Read complete the data of file is:")
  //       const parser = new DOMParser()
  //       const svgDoc = parser.parseFromString(data, 'image/svg+xml')
  //       const svgString = new XMLSerializer().serializeToString(svgDoc)
  //       // const svgElement = svgDoc.documentElement
  //       console.log("from dialog:open before loading string on canvas.")
  
  //       if (typeof fabric.loadSVGFromString === 'function') {
  //         console.log('Canvas has loadSVGFromString method.');
  //         // Safe to call loadSVGFromString
  //       } else {
  //         console.log('Canvas does not have loadSVGFromString method.');
  //       }

  //       fabric.loadSVGFromString(svgString, (objects, options) => {
  //         const fabricCanvas = new fabric.Canvas()
  //         fabricCanvas.add(...objects)
  //         fabricCanvas.renderAll()
  //       })
  
  //       // canvas.loadSVGFromString(data, (objects, options) => {
  //       //   canvas.renderAll()
  //       // })
  //     } catch (error) {
  //       console.log("error while reading file:", error)
  //     }

  //     // fs.readFileSync(filepath, 'utf8', (err,data) => {
  //     //   console.log("Inside fs.readfilesync block.")
  //     //   if(err){
  //     //     console.log("error while reading file.")
  //     //   } else {
  //     //     console.log("Inside dialog:open filepath else block.")
  //     //     console.log("data from file",data)
  //     //     const svgString = data
  //     //     const parser = new DOMParser()
  //     //     const svgDoc = parser.parseFromString(svgString, 'image/svg+xml')
  //     //     const svgElement = svgDoc.documentElement
  //     //     console.log("from dialog:oprn before loading string on canvas.")
  //     //     canvas.loadSVGFromString(svgString, (objects, options) => {
  //     //       canvas.renderAll()
  //     //     })
  //     //   }
  //     // })
  //   }

  //   return result.filePaths[0]
  // })

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
