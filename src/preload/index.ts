import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('daredavel', {
  createTerminal: (id: string, shell: string, cwd?: string) => ipcRenderer.invoke('terminal:create', { id, shell, cwd }),
  writeTerminal: (id: string, data: string) => ipcRenderer.send('terminal:write', { id, data }),
  resizeTerminal: (id: string, cols: number, rows: number) => ipcRenderer.send('terminal:resize', { id, cols, rows }),
  closeTerminal: (id: string) => ipcRenderer.send('terminal:close', { id }),
  onTerminalData: (cb: (payload: { id: string; data: string }) => void) => { const fn = (_: unknown, value: { id: string; data: string }) => cb(value); ipcRenderer.on('terminal:data', fn); return () => ipcRenderer.removeListener('terminal:data', fn) },
  onTerminalExit: (cb: (payload: { id: string; code: number }) => void) => { const fn = (_: unknown, value: { id: string; code: number }) => cb(value); ipcRenderer.on('terminal:exit', fn); return () => ipcRenderer.removeListener('terminal:exit', fn) },
  onAgentStatus: (cb: (payload: { agent: string; status?: string; event?: string }) => void) => { const fn = (_: unknown, value: { agent: string; status?: string; event?: string }) => cb(value); ipcRenderer.on('agent:status', fn); return () => ipcRenderer.removeListener('agent:status', fn) },
  chooseFolder: () => ipcRenderer.invoke('dialog:folder')
})
