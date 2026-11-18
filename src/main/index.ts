import { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage } from 'electron'
import { spawn, IPty } from 'node-pty'
import path from 'node:path'
import os from 'node:os'
import http from 'node:http'

let win: BrowserWindow | null = null
let tray: Tray | null = null
const terminals = new Map<string, IPty>()
const terminalBuffers = new Map<string, string>()
const isDev = !!process.env.VITE_DEV_SERVER_URL

function createWindow() {
  win = new BrowserWindow({ width: 1520, height: 930, minWidth: 940, minHeight: 620, backgroundColor: '#101113', title: 'Daredavel', icon: assetPath('daredavel.png'), autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, '../preload/index.mjs'), contextIsolation: true, nodeIntegration: false, sandbox: false } })
  if (isDev) win.loadURL(process.env.VITE_DEV_SERVER_URL!)
  else win.loadFile(path.join(__dirname, '../renderer/index.html'))
  win.on('close', e => { if (!app.isQuitting) { e.preventDefault(); win?.hide() } })
}

app.whenReady().then(() => {
  createWindow()
  const icon = nativeImage.createFromPath(assetPath('daredavel.png'))
  tray = new Tray(icon)
  tray.setToolTip('Daredavel — yerel ajan çalışma alanı')
  tray.setContextMenu(Menu.buildFromTemplate([{ label: 'Daredavel’i göster', click: () => win?.show() }, { type: 'separator' }, { label: 'Çıkış', click: () => { app.isQuitting = true; app.quit() } }]))
  tray.on('click', () => win?.show())
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); else win?.show() })
})

declare module 'electron' { interface App { isQuitting?: boolean } }
function assetPath(file: string) { return app.isPackaged ? path.join(process.resourcesPath, 'icons', file) : path.resolve(__dirname, '../../resources/icons', file) }
app.on('before-quit', () => { app.isQuitting = true })
app.on('window-all-closed', () => { /* tray keeps the local workspace alive */ })

ipcMain.handle('terminal:create', (_event, args: { id: string; shell: string; cwd?: string }) => {
  if (terminals.has(args.id)) return { ok: true, buffer: terminalBuffers.get(args.id) || '' }
  const home = os.homedir()
  let command = '', argv: string[] = [], cwd = args.cwd || home
  if (process.platform === 'win32') {
    if (args.shell === 'wsl') {
      command = 'wsl.exe'
      const drive = cwd.match(/^([A-Za-z]):[\\/]/)
      const linuxPath = drive ? `/mnt/${drive[1].toLowerCase()}/${cwd.slice(3).replaceAll('\\', '/')}` : '~'
      argv = ['--cd', linuxPath]
    }
    else if (args.shell === 'cmd') { command = 'cmd.exe'; argv = [] }
    else { command = 'powershell.exe'; argv = ['-NoLogo']; }
  } else if (process.platform === 'darwin') { command = args.shell === 'bash' ? 'bash' : 'zsh'; argv = ['-l'] }
  else { command = 'bash'; argv = ['-l'] }
  try {
    const pty = spawn(command, argv, { name: 'xterm-256color', cols: 100, rows: 30, cwd, env: process.env as Record<string, string> })
    terminals.set(args.id, pty)
    terminalBuffers.set(args.id, '')
    pty.onData(data => { const old = terminalBuffers.get(args.id) || ''; terminalBuffers.set(args.id, (old + data).slice(-250000)); win?.webContents.send('terminal:data', { id: args.id, data }) })
    pty.onExit(({ exitCode }) => { terminals.delete(args.id); win?.webContents.send('terminal:exit', { id: args.id, code: exitCode }) })
    return { ok: true, buffer: '' }
  } catch (error) { return { ok: false, error: String(error) } }
})
ipcMain.on('terminal:write', (_event, { id, data }: { id: string; data: string }) => terminals.get(id)?.write(data))
ipcMain.on('terminal:resize', (_event, { id, cols, rows }: { id: string; cols: number; rows: number }) => { try { terminals.get(id)?.resize(Math.max(2, cols), Math.max(2, rows)) } catch {} })
ipcMain.on('terminal:close', (_event, { id }: { id: string }) => { terminals.get(id)?.kill(); terminals.delete(id) })
ipcMain.handle('dialog:folder', async () => { const r = await dialog.showOpenDialog(win!, { properties: ['openDirectory', 'createDirectory'] }); return r.canceled ? null : r.filePaths[0] })

// Local-only status webhook. It accepts agent lifecycle events from configured hooks/plugins.
const server = http.createServer((req, res) => {
  if (req.method !== 'POST' || !req.url?.startsWith('/hook/')) { res.writeHead(404).end(); return }
  let body = ''; req.on('data', chunk => body += chunk); req.on('end', () => {
    try { const agent = decodeURIComponent(req.url!.slice(6)); const payload = JSON.parse(body || '{}'); win?.webContents.send('agent:status', { agent, ...payload }); res.writeHead(204).end() }
    catch { res.writeHead(400).end() }
  })
})
server.listen(43127, '127.0.0.1').on('error', error => console.error('Daredavel status webhook unavailable:', error))
