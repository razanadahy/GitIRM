const { app, BrowserWindow, ipcMain } = require('electron/main');
const { autoUpdater, AppUpdater } = require('electron-updater');
const path = require('node:path');
const AutoLaunch = require('auto-launch');
const fs = require('fs');

function logToFile(message) {
    const logFilePath = path.join(app.getPath('userData'), 'app.log');
    fs.appendFileSync(logFilePath, message + '\n');
}
let mainWindow;
let isLoading = true;
function createWindow () {
    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        width: 800,
        height: 650,
        icon: path.join(__dirname,'./build/logoA.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
            webSecurity: false,
            // devTools: false
        }
    });

    // mainWindow.loadFile(path.join(__dirname, 'build', 'index.html')).then(()=>{
    //     mainWindow.webContents.openDevTools()
    // });
    mainWindow.loadURL('http://localhost:3000/').then(()=>{
        mainWindow.webContents.openDevTools()
    })
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(()=>{
    createWindow()
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
ipcMain.on('maximise',()=>{
    mainWindow.maximize();
    mainWindow.setMinimumSize(1200, 720);
})
const autoLauncher = new AutoLaunch({
    name: 'irm',
    path: process.execPath,
});

autoLauncher.isEnabled()
    .then((isEnabled) => {
        logToFile("date : "+ new Date()+ "  ....auto lunch"+app.getVersion())
        if (!isEnabled) autoLauncher.enable();
    })
    .catch((err) => {
        logToFile("date : "+ new Date()+ "  erreur : "+ err.message())
        console.error(err);
    });
// const crypto=require('crypto')
// const encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
// console.error(encryptionKey)
(async () => {
    const { default: ElectronStore } = await import('electron-store');

    const store = new ElectronStore({
        name: 'elpSession',
        cwd: 'storage',
        // encryptionKey: encryptionKey,
    });
    ipcMain.on('clear',()=>{
        store.clear()
    })
    ipcMain.on('set',(event,name,value)=>{
        store.set(name,value)
    })
    ipcMain.handle('get', async (event,name)=>{
        return store.get(name) || null
    })
})();

const checkUpdate = (event) => {
    autoUpdater.autoDownload=false
    autoUpdater.autoInstallOnAppQuit=true
    autoUpdater.on("update-available",(info)=>{
        logToFile("date : "+ new Date()+ "  ....update available...")
        const mes=autoUpdater.downloadUpdate()
        logToFile(mes)
    })
    autoUpdater.on("update-not-available",(event)=>{
        // event.sender.send('update-status', 3);
        logToFile("pas de mise à jour....")
    })
    autoUpdater.on("update-downloaded",()=>{
        event.sender.send('update-status', "update-dowloaded....");
        logToFile("update-downloaded.....")
    })
    autoUpdater.on("download-progress", (progress)=>{
        event.sender.send('update-status', progress.transferred)
        logToFile(progress.percent)
    })
    autoUpdater.checkForUpdates()
}
ipcMain.on('update',(event)=>{
    checkUpdate(event)
})