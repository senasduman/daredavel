# Daredavel

Daredavel is a local-first, multi-agent coding workspace. The initial desktop prototype provides a dark, multi-panel workspace, persistent terminal processes while the window is hidden, Claude Code/Codex/OpenCode launch shortcuts, editable notes, and a localhost webhook for agent status events.

## Run locally

Requirements: Node.js 20+, npm, and the agent CLIs you want to launch (`claude`, `codex`, or `opencode`) installed and available on `PATH`.

```sh
npm install
npm run dev
```

Select **Panel ekle** to open an agent or shell. Use the folder button to pick a project directory first. On Windows, choose PowerShell or WSL2; WSL translates a selected drive path to `/mnt/<drive>/...`. On macOS and Linux the app uses the user's login shell.

Closing the window hides Daredavel to the system tray so its terminal processes continue. Choose **Çıkış** in the tray menu to end the app and its terminal sessions.

## Agent status webhook

The local service accepts JSON `POST` requests at `http://127.0.0.1:43127/hook/<agent-name>` and forwards them to the running UI. Example:

```sh
curl -X POST http://127.0.0.1:43127/hook/claude \
  -H 'content-type: application/json' \
  -d '{"status":"waiting","event":"permission_request"}'
```

The endpoint binds only to loopback. Agent-specific hook/plugin installation and richer status mapping are not yet included in this prototype.

## Build installers

```sh
npm run build
npx electron-builder --linux
npx electron-builder --mac
npx electron-builder --win
```

Native installers need to be built on their target operating system. WSL uses the Windows ConPTY-backed terminal through `node-pty`.

## License

Apache-2.0. See [LICENSE](LICENSE).
