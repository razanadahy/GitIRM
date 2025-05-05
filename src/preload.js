const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronStore',{
    clear: ()=>ipcRenderer.send('clear'),
    set: (name,value)=>ipcRenderer.send('set',name,value),
    get: (name) => ipcRenderer.invoke('get', name)
})
contextBridge.exposeInMainWorld('main',{
    maximise: ()=>ipcRenderer.send('maximise')
})
contextBridge.exposeInMainWorld('checkUpdate',{
    update: ()=>ipcRenderer.send('update'),
    onUpdateStatus: (callback) => ipcRenderer.on('update-status', callback),
    statusUpdate: (callback) => ipcRenderer.on('status-update', callback),
    removeStatusListener: () => ipcRenderer.removeAllListeners('update-status'),
    removeStatusUpdateListener: () => ipcRenderer.removeAllListeners('status-update'),
})
contextBridge.exposeInMainWorld('notification',{
    showNotification: (titre,body,callback)=>ipcRenderer.send('showNotification', titre,body,callback)
})

contextBridge.exposeInMainWorld('badge',{
    setBadge: (count)=>ipcRenderer.send('badge', count)
})

contextBridge.exposeInMainWorld('machineInfo',{
    userGUID: ()=>ipcRenderer.invoke('machineInfo')
})

contextBridge.exposeInMainWorld('navigate', {
    defaultNavigateur: (url) => ipcRenderer.send("navigate", url)
});