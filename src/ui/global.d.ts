export {}
declare global {
  interface Window { daredavel: {
    createTerminal(id: string, shell: string, cwd?: string): Promise<{ ok: boolean; error?: string; buffer?: string }>
    writeTerminal(id: string, data: string): void; resizeTerminal(id: string, cols: number, rows: number): void; closeTerminal(id: string): void
    onTerminalData(cb: (p: { id: string; data: string }) => void): () => void; onTerminalExit(cb: (p: { id: string; code: number }) => void): () => void
    onAgentStatus(cb: (p: { agent: string; status?: string; event?: string }) => void): () => void
    chooseFolder(): Promise<string | null>
  } }
}
