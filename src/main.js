const { app, BrowserWindow, ipcMain } = require('electron/main');
const { autoUpdater } = require('electron-updater');
const path = require('node:path');
const AutoLaunch = require('auto-launch');
const fs = require('fs');

function logToFile(message) {
    const logFilePath = path.join(app.getPath('userData'), 'app.log');
    fs.appendFileSync(logFilePath, message + '\n');
}
let mainWindow;
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.focus()
    app.exit()
    logToFile("seconde insatnce...")
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

function createWindow () {
    mainWindow = new BrowserWindow({
        autoHideMenuBar: true,
        width: 800,
        height: 650,
        title: 'ARIS Manager',
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
    //     // mainWindow.webContents.openDevTools()
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

app.on('before-quit', async (event) => {
    event.preventDefault();
    try {
        const {default: ElectronStore} = await import('electron-store');
        const store = new ElectronStore({
            name: 'elpSession',
            cwd: 'storage',
        });
        const token = store.get('token');
        console.log("on est la...")
        if (token) {
            const response = await fetch('http://11.140.1.112:8082/pointage/', {
                method: 'put',
                headers: {
                    "Content-Type": 'application/json',
                    "Authorization": `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Erreur lors de la requête de déconnexion');
            }
        }
        app.exit();
    } catch (error) {
        console.log(error.message)
        app.exit();
    }
})

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
    autoUpdater.on("checking-for-update",()=>{
        event.sender.send('update-status', "Cherche...");
    })
    autoUpdater.on("update-available",(info)=>{
        autoUpdater.downloadUpdate().then(()=>{
            event.sender.send('update-status', "Telechargement de mise à jour...");
        }).catch((er)=>{
            event.sender.send('status-update',-10)
            event.sender.send('update-status', "Erreur lors du téléchargement : " + er.message);
        })

    })
    autoUpdater.on("update-not-available",()=>{
        event.sender.send('update-status', "Pas de mise à jour disponible!");
        event.sender.send('status-update',-1)
    })
    autoUpdater.on("update-downloaded",()=>{
        event.sender.send('update-status', "Installation de mise à jour....")
        autoUpdater.quitAndInstall();
    })
    autoUpdater.on("download-progress", (progress)=>{
        event.sender.send('status-update',2)
        event.sender.send('update-status', progress.percent.toFixed(2))
    })
    autoUpdater.on('error', (error) => {
        event.sender.send('update-status',  "  ....Erreur lors de la mise à jour : " + error.message);
    });
    autoUpdater.checkForUpdates().catch(err=>{
        event.sender.send('update-status',  "  ....Erreur lors de la mise à jour : " + error.message);

    })
}
ipcMain.on('update',(event)=>{
    checkUpdate(event)
})