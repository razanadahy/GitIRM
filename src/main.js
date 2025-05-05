const { app, BrowserWindow, ipcMain } = require('electron/main');
const { shell } = require('electron');
const { nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('node:path');
const AutoLaunch = require('auto-launch');
const notifier = require('node-notifier');
const fs = require('fs');
const { createCanvas } = require('canvas');
// process.env.TZ = "Indian/Antananarivo";

function logToFile(message) {
    const logFilePath = path.join(app.getPath('userData'), 'app.log');
    fs.appendFileSync(logFilePath, message + '\n');
}
let mainWindow;
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
    app.focus()
    app.exit()
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
        icon: path.join(__dirname,'icon.ico'),
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
    mainWindow.loadURL('http://192.168.4.229:3000/').then(()=>{
        mainWindow.webContents.openDevTools()
    })
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(()=>{
    createWindow()
    // process.env.TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "Indian/Antananarivo";
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
            // const response = await fetch('http://192.168.4.229:8082/pointage/', {
            const response = await fetch('https://prod.aris-cc.com/pointage/', {
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
    name: 'arismanager',
    path:  path.join(__dirname, 'ARISManager.exe'),
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


function showNotification(titre,body,callBack) {
    notifier.notify(
        {
            title: titre,
            message: body,
            icon: path.join(__dirname, 'icon.png'),
            sound: true,
            wait: true,
            appName: 'Aris Manager',
            appIcon:  path.join(__dirname, 'icon.png'),
            appID: 'app.aris.manager'
        },
        (err, response) => {
            if (response === 'activate') {
                console.log(callBack)
            }
        }
    );
    notifier.on('click',()=>{
        console.log(callBack)
    })
}

ipcMain.on('showNotification',(event, titre,body,callback)=>{
    showNotification(titre,body,callback)
})
ipcMain.on('badge',(event,count)=>{
    setBadge(count)
})

function createBadgeImage(text) {
    const size = 32;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#794ead';//est ce que ceci accepte les couleurs hexadecimal?
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '18px Segoe UI';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (parseInt(text)>=10){
        ctx.fillText("9+", size / 2, size / 2);
    }else{
        ctx.fillText(text, size / 2, size / 2);
    }

    const buffer = canvas.toBuffer('image/png');
    return nativeImage.createFromBuffer(buffer);
}

function setBadge(count) {
    if (process.platform === 'darwin') {
        app.dock.setBadge(count > 0 ? count.toString() : '');
    } else if (process.platform === 'win32' || process.platform === 'linux') {

        if (count > 0) {
            mainWindow.setOverlayIcon(createBadgeImage(count), `${count} nouvelles notification(s)`);
        } else {
            mainWindow.setOverlayIcon(null, '');
        }
    }
}

const getUserMachineGUID = require('./UserMachineGUID');

ipcMain.handle('machineInfo',async ()=>{
    return await getUserMachineGUID();
})
ipcMain.on('navigate',(event,url)=>{
    shell.openExternal(url)
})