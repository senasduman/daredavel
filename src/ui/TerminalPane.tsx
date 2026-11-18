import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

export default function TerminalPane({id, shell, cwd}:{id:string;shell:string;cwd:string}) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!host.current) return
    const terminal = new Terminal({ cursorBlink: true, fontFamily: 'Cascadia Code, Consolas, monospace', fontSize: 12, lineHeight: 1.4, scrollback: 2500,
      theme: { background: '#111214', foreground: '#d8d9dc', cursor: '#c8c9ce', selectionBackground: '#3b3d43', black: '#111214', green: '#71d395', blue: '#6ea8fe', yellow: '#e8c773', red: '#f07178' } })
    const fit = new FitAddon(); terminal.loadAddon(fit); terminal.open(host.current)
    const api = (window as any).daredavel
    const fitSoon = () => { try { fit.fit(); api?.resizeTerminal?.(id, terminal.cols, terminal.rows) } catch {} }
    const timer = window.setTimeout(async () => { fitSoon(); const result = await api?.createTerminal?.(id, shell, cwd || undefined); if (result?.buffer) terminal.write(result.buffer) }, 120)
    const input = terminal.onData(data => api?.writeTerminal?.(id, data))
    const removeData = api?.onTerminalData?.(({id: target, data}:{id:string;data:string}) => { if (target === id) terminal.write(data) })
    const ro = new ResizeObserver(fitSoon); ro.observe(host.current)
    return () => { window.clearTimeout(timer); ro.disconnect(); input.dispose(); removeData?.(); terminal.dispose() }
  }, [id, shell, cwd])
  return <div className="terminal-widget" ref={host}/>
}
