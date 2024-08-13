window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type])
    }
})

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