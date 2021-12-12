// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require("electron")
contextBridge.exposeInMainWorld('myapi', {
    leftClick: async (data) => await ipcRenderer.invoke('leftClick', data),
    up: async (data) => await ipcRenderer.invoke('up', data),
    down: async (data) => await ipcRenderer.invoke('down', data),
    drag: async (data) => await ipcRenderer.invoke('drag', data),
    pressKey: async (data) => await ipcRenderer.invoke('pressKey', data),
    releaseKey: async (data) => await ipcRenderer.invoke('releaseKey', data)
}
)


window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }


})

