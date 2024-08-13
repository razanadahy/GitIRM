const { app, BrowserWindow, ipcMain } = require('electron/main');
// const { autoUpdater } = require('electron-updater');
const path = require('node:path');
const AutoLaunch = require('auto-launch');
const https = require('http');
const { exec } = require('child_process').exec;
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
        icon: path.join(__dirname,'../build/logoA.ico'),
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
        logToFile("date : "+ new Date()+ "  ....auto lunch 1.0.1")
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
    store.set('version','1.0.0')
    ipcMain.on('clear',()=>{
        store.clear()
    })
    ipcMain.on('set',(event,name,value)=>{
        store.set(name,value)
    })
    ipcMain.handle('get', async (event,name)=>{
        return store.get(name) || null
    })
    const log = require('electron-log');
    const checkUpdate = (event,server, version) => {
        if (version===store.get('version')){
            event.sender.send('update-status', 1);
            return
        }
        const file = fs.createWriteStream(path.join(app.getPath('temp'), 'myapp-update.msi'));
        https.get(`${server}/update/latest`, function(response) {
            response.pipe(file);
            file.on('finish', function() {
                file.close(() => {
                    exec(`"${path.join(app.getPath('temp'), 'myapp-update.msi')}"`, (error) => {
                        if (error) {
                            console.error(`exec error: ${error}`);
                            return;
                        }
                        app.quit();
                    });
                });
            });
        });
        // autoUpdater.logger = log;
        // autoUpdater.logger.transports.file.level = 'info';
        // event.sender.send('update-status', 2);
        // const feed = `${server}/update/latest`;
        // autoUpdater.setFeedURL({ url: feed });
        // autoUpdater.on('update-downloaded', (info) => {
        //     autoUpdater.quitAndInstall();
        //     store.set('version',version)
        // });
        // autoUpdater.checkForUpdates()
        // autoUpdater.setFeedURL({
        //     provider: 'generic',
        //     url: `${server}/update/latest`
        // });
        // autoUpdater.checkForUpdatesAndNotify();
    }
    ipcMain.on('update',(event,server,version)=>{
        checkUpdate(event,server,version)
    })
})();


