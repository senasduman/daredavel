import { useEffect, useMemo, useState } from 'react'
import { Activity, ArrowDown, ArrowUp, Bell, Bot, Check, ChevronDown, ChevronRight, CircleHelp, Command, FileCode2, Folder, FolderPlus, GitBranch, LayoutGrid, Maximize2, MessageSquare, MoreHorizontal, PanelLeftClose, PanelRightClose, Plus, Search, Settings2, ShieldAlert, TerminalSquare, X } from 'lucide-react'
import TerminalPane from './TerminalPane'
import logo from './assets/daredavel-mark.png'

type Pane = { id: string; title: string; subtitle: string; shell: string; agent: string; tone: string }
const initialPanes: Pane[] = [
  { id: 'claude-main', title: 'Claude Code', subtitle: 'Working · Edit', shell: 'powershell', agent: 'Claude Code', tone: 'violet' },
  { id: 'shell-tests', title: 'Shell', subtitle: 'Running · pwsh', shell: 'powershell', agent: 'Terminal', tone: 'green' },
  { id: 'shell-server', title: 'Dev server', subtitle: 'Running · pwsh', shell: 'powershell', agent: 'Terminal', tone: 'green' }
]

export default function App() {
  const [panes, setPanes] = useState<Pane[]>(() => readSaved('panes', initialPanes))
  const [active, setActive] = useState(() => readSaved('active', 'claude-main'))
  const [selected, setSelected] = useState(() => readSaved('selected', 'Retry failed Stripe webhooks'))
  const [workspace, setWorkspace] = useState(() => readSaved('workspace', 'Release 2.4'))
  const [projectPath, setProjectPath] = useState(() => readSaved('projectPath', ''))
  const [note, setNote] = useState(() => readSaved('note', '## Webhook retries · PAY-412\n\n• Backoff: 2s base, capped at 10m, ±20% jitter\n• Park after 8 attempts in webhook_dead_letters\n• Unknown event types skip retries and park at once\n\n### Ask Maya\nStripe retries for 3 days itself. Is our 10m cap still worth it?'))
  const [notice, setNotice] = useState('')
  const [queueOpen, setQueueOpen] = useState(true)
  const [rightOpen, setRightOpen] = useState(true)
  const [navOpen, setNavOpen] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [search, setSearch] = useState(false)
  const [agentStatus, setAgentStatus] = useState<Record<string, string>>({})
  const running = panes.find(p => p.id === active)
  const folderLabel = useMemo(() => projectPath.split(/[\\/]/).filter(Boolean).slice(-2).join('/'), [projectPath])

  useEffect(() => { for (const [key, value] of Object.entries({ panes, active, selected, workspace, projectPath, note })) localStorage.setItem(`daredavel:${key}`, JSON.stringify(value)) }, [panes, active, selected, workspace, projectPath, note])

  useEffect(() => {
    const api = (window as any).daredavel
    return api?.onAgentStatus?.((data: { agent: string; status?: string; event?: string }) => setAgentStatus(old => ({ ...old, [data.agent]: data.status || data.event || 'idle' })))
  }, [])

  async function addPane(agent = 'Terminal', shell = 'powershell') {
    const id = `${agent.toLowerCase().replaceAll(' ', '-')}-${Date.now()}`
    const next: Pane = { id, title: agent === 'Terminal' ? 'Shell' : agent, subtitle: 'Starting…', shell, agent, tone: agent === 'Terminal' ? 'green' : 'violet' }
    setPanes(p => [...p, next]); setActive(id); setOpenModal(false)
    const api = (window as any).daredavel
    if (projectPath && api?.createTerminal) await api.createTerminal(id, shell, projectPath)
    if (agent !== 'Terminal') setTimeout(() => api?.writeTerminal?.(id, `${agent === 'Claude Code' ? 'claude' : agent === 'Codex' ? 'codex' : 'opencode'}\r`), 400)
  }
  async function chooseFolder() {
    const folder = await (window as any).daredavel?.chooseFolder?.()
    if (folder) { setProjectPath(folder); setNotice(`Proje eklendi: ${folder.split(/[\\/]/).pop()}`); setTimeout(() => setNotice(''), 2800) }
  }
  const hideModal = () => setOpenModal(false)

  return <div className="app-shell">
    <header className="topbar">
      <div className="brand"><img className="brand-mark" src={logo} alt=""/><span>daredavel</span><button className="icon-btn top-plus" title="Çalışma alanı ekle" onClick={() => setWorkspace('Yeni çalışma alanı')}><Plus size={15}/></button><button className="icon-btn" title="Paneller" onClick={() => setRightOpen(v => !v)}><LayoutGrid size={14}/></button></div>
      <div className="crumbs"><span className="crumb-project"><i className="tiny-dot blue"/>checkout-api</span><span className="slash">/</span><strong>{selected}</strong><span className="path-chip">{folderLabel || '_code/checkout-api'}</span><span className="branch"><GitBranch size={12}/>fix/webhook-retries <b>↑1</b></span><span className="issue">#482 open</span><span className="issue muted">PAY-412</span></div>
      <button className="add-pane" onClick={() => setOpenModal(true)}><Plus size={14}/> Panel ekle</button>
    </header>
    <div className="body-shell">
      {navOpen && <aside className="sidebar">
        <div className="searchbox" onClick={() => setSearch(true)}><Search size={14}/><span>Arayın veya çalıştırın...</span><kbd>Ctrl K</kbd></div>
        <div className="side-scroll">
          <div className="section-head">ÇALIŞMA ALANLARI <button className="tiny-action" onClick={() => setWorkspace('Yeni çalışma alanı')}><Plus size={13}/></button></div>
          <button className="workspace-row" onClick={() => setWorkspace(workspace === 'Release 2.4' ? 'Sprint 18' : 'Release 2.4')}><i className="tiny-dot yellow"/><span>{workspace}</span><ChevronDown size={13}/></button>
          <div className="workspace-meta">3 panel · 2 proje</div>
          <div className="section-head project-head">PROJELER <button className="tiny-action" onClick={chooseFolder}><FolderPlus size={13}/></button></div>
          <button className="project-row"><i className="tiny-dot purple"/><span>checkout-api</span><span className="badge-count">2</span></button>
          <button className="task-row" onClick={() => setSelected('Rate limit POST /v1/refunds')}><span className="task-bullet">•</span><span><b>Rate limit POST /v1/refunds</b><small>Done · Refunds capped...</small></span></button>
          <button className={`task-row ${selected.includes('Retry') ? 'selected' : ''}`} onClick={() => setSelected('Retry failed Stripe webhooks')}><span className="task-bullet">•</span><span><b>Retry failed Stripe webhooks</b><small>Edit · {agentStatus['claude-main'] || agentStatus.claude || 'now'}</small></span><MoreHorizontal size={14}/></button>
          <button className="subtask-row" onClick={() => setSelected('Map every webhook retry path')}><ChevronRight size={12}/>Map every webhook retry path <small>now</small></button>
          <button className="project-row alt"><i className="tiny-dot cyan"/><span>web-dashboard</span><span className="badge-count blue-count">3</span></button>
          <button className="task-row"><span className="task-bullet">•</span><span><b>Move settings to the App Router</b><small>Allow bash: pnpm vitest...</small></span></button>
          <button className="task-row"><span className="task-bullet">•</span><span><b>Flaky invoice table test</b><small>Claude needs your permission</small></span><span className="badge-count">!</span></button>
          <div className="section-head project-head">FAVORİLER</div>
          <button className="project-row"><Folder size={13}/><span>infra</span><span className="badge-count">1</span></button>
          <button className="task-row"><span className="task-bullet">•</span><span><b>Postgres 16 on staging</b><small>chore/db-postgres-16</small></span></button>
        </div>
        <div className={`queue ${queueOpen ? '' : 'queue-collapsed'}`}>
          <button className="queue-title" onClick={() => setQueueOpen(v => !v)}><span><Bell size={14}/> Sizden bekleyenler <b>3</b></span><ChevronDown size={13}/></button>
          {queueOpen && <><QueueItem title="Move settings to the App Router" desc="Allow bash: pnpm vitest run" color="yellow" status="İzin gerekli"/><QueueItem title="Flaky invoice table test" desc="Claude needs your permission" color="purple" status="şimdi"/><QueueItem title="Rate limit POST /v1/refunds" desc="Done · Refunds capped at..." color="blue" status="Tamamlandı"/></>}
        </div>
        <div className="sidebar-foot"><button className="icon-btn"><CircleHelp size={14}/></button><span>Daredavel Local</span><button className="icon-btn" onClick={() => setNotice('Ayarlar yakında')}><Settings2 size={14}/></button></div>
      </aside>}

      <main className="main-area">
        {!navOpen && <button className="floating-nav" onClick={() => setNavOpen(true)}><PanelLeftClose size={15}/></button>}
        <div className={`center-column ${rightOpen ? '' : 'wide'}`}>
          <div className="pane-tabs">{panes.map(p => <button key={p.id} onClick={() => setActive(p.id)} className={`pane-tab ${active === p.id ? 'active' : ''}`}><i className={`status-dot ${p.tone}`}/><span>{p.title}</span><small>{p.subtitle}</small><button className="tab-close" onClick={e => {e.stopPropagation(); setPanes(all => all.filter(x => x.id !== p.id)); if(active === p.id) setActive(panes.find(x => x.id !== p.id)?.id || '')}}><X size={12}/></button></button>)}<button className="icon-btn tab-add" onClick={() => addPane()}><Plus size={14}/></button><div className="tab-tools"><button className="icon-btn" onClick={() => setNavOpen(false)}><PanelLeftClose size={14}/></button><button className="icon-btn"><MoreHorizontal size={15}/></button><button className="icon-btn"><Maximize2 size={13}/></button></div></div>
          <div className="main-terminal">{running && <div key={running.id} className="terminal-host"><TerminalPane id={running.id} shell={running.shell} cwd={projectPath}/></div>}{!panes.length && <div className="empty-term"><TerminalSquare size={26}/><p>Bu çalışma alanında açık panel yok.</p><button className="primary-btn" onClick={() => addPane()}>Terminal aç</button></div>}</div>
          <div className="composer"><div className="composer-top"><span className="composer-mode"><Command size={12}/> Düzenlemeleri kabul et <ChevronDown size={12}/></span><span className="composer-context"><i className="tiny-dot blue"/> {folderLabel || 'checkout-api'} <ChevronDown size={12}/></span><button className="icon-btn"><MoreHorizontal size={14}/></button></div><div className="composer-input"><span className="prompt-chevron">›</span><span>Bir sonraki görevi yazın...</span><button><ArrowUp size={14}/></button></div><div className="composer-foot"><span><kbd>⌘</kbd> + <kbd>Enter</kbd> gönder</span><span><ShieldAlert size={12}/> Yerel oturum</span></div></div>
        </div>
        {rightOpen && <aside className="right-rail">
          <section className="notes-panel"><div className="panel-heading"><span><i className="status-dot green"/> Notlar</span><small>Claude tarafından güncellendi</small><button className="icon-btn"><MoreHorizontal size={14}/></button></div><textarea className="notes-editor" value={note} onChange={e => setNote(e.target.value)} spellCheck={false}/><div className="note-foot"><span><Check size={12}/> Kaydedildi</span><button className="icon-btn"><Maximize2 size={12}/></button></div></section>
          <div className="right-panels">{panes.filter(p => p.id !== active).slice(0, 2).map((p, i) => <section className="mini-panel" key={p.id}><div className="panel-heading"><button className="mini-title" onClick={() => setActive(p.id)}><i className={`status-dot ${p.tone}`}/>{p.title}<small>{p.subtitle}</small></button><button className="icon-btn" onClick={() => setActive(p.id)}><Maximize2 size={12}/></button></div><div className="mini-terminal"><TerminalPane id={p.id} shell={p.shell} cwd={projectPath}/></div></section>)}
            <section className="activity-panel"><div className="panel-heading"><span><Activity size={13}/> Son etkinlik</span><button className="icon-btn"><MoreHorizontal size={14}/></button></div><div className="activity-line"><i className="status-dot green"/><span>Testler geçti<small>internal/webhooks · 4 sn önce</small></span></div><div className="activity-line"><i className="status-dot blue"/><span>Değişiklikler kaydedildi<small>handler.go · 1 dk önce</small></span></div><button className="activity-more">Tüm etkinliği gör <ChevronRight size={12}/></button></section>
          </div>
        </aside>}
        {notice && <div className="toast">{notice}<button onClick={() => setNotice('')}><X size={12}/></button></div>}
      </main>
    </div>
    {openModal && <div className="modal-backdrop" onClick={hideModal}><div className="add-modal" onClick={e => e.stopPropagation()}><div className="modal-head"><div><b>Yeni panel</b><small>Çalıştırmak istediğiniz ajanı veya terminali seçin.</small></div><button className="icon-btn" onClick={hideModal}><X size={15}/></button></div><button className="agent-option" onClick={() => addPane('Claude Code')}><span className="agent-icon claude">✳</span><span><b>Claude Code</b><small>Terminalde `claude` başlat</small></span><ChevronRight size={15}/></button><button className="agent-option" onClick={() => addPane('Codex')}><span className="agent-icon codex">◉</span><span><b>Codex</b><small>Terminalde `codex` başlat</small></span><ChevronRight size={15}/></button><button className="agent-option" onClick={() => addPane('OpenCode')}><span className="agent-icon opencode">⌘</span><span><b>OpenCode</b><small>Terminalde `opencode` başlat</small></span><ChevronRight size={15}/></button><button className="agent-option" onClick={() => addPane()}><span className="agent-icon terminal"><TerminalSquare size={17}/></span><span><b>Boş terminal</b><small>PowerShell oturumu aç</small></span><ChevronRight size={15}/></button><button className="agent-option" onClick={() => addPane('WSL2', 'wsl')}><span className="agent-icon terminal">W</span><span><b>WSL2 terminali</b><small>Varsayılan Linux dağıtımını aç</small></span><ChevronRight size={15}/></button><div className="modal-foot">Proje dizini: <button onClick={chooseFolder}>{folderLabel || 'klasör seçin'} <Folder size={12}/></button></div></div></div>}
    {search && <div className="modal-backdrop" onClick={() => setSearch(false)}><div className="search-modal" onClick={e => e.stopPropagation()}><Search size={16}/><input autoFocus placeholder="Proje, görev veya komut ara..."/><kbd>ESC</kbd></div></div>}
  </div>
}

function QueueItem({title,desc,color,status}:{title:string;desc:string;color:string;status:string}) { return <button className="queue-item"><i className={`tiny-dot ${color}`}/><span><b>{title}</b><small>{desc}</small></span><em>{status}</em></button> }

function readSaved<T>(key: string, fallback: T): T {
  try {
    const current = localStorage.getItem(`daredavel:${key}`)
    const previous = current ? null : localStorage.getItem(`daredevil:${key}`)
    if (previous) localStorage.setItem(`daredavel:${key}`, previous)
    const raw = current || previous
    return raw ? JSON.parse(raw) as T : fallback
  } catch { return fallback }
}
