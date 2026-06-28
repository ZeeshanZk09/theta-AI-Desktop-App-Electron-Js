# Theta Current Features (Code-Based Audit)

Last verified: 2026-04-13
Scope: Electron desktop app + React frontend + Python wake-word + Supabase function present in repo.

This document lists what is implemented in code right now, not roadmap ideas.

## 1. Core Assistant Experience

- Real-time Gemini Live voice session (connect/disconnect from UI).
- Continuous microphone streaming to AI session.
- Streaming AI voice responses with live transcription.
- Wake-word background listener via Python process.
  - Trigger behavior currently detects words ending with `nic` and forwards remaining speech as command text.
- Manual start/terminate control from center AI portal.
- Voice reasoning display ("Deep Reasoning" toggle):
  - On: thinking budget enabled.
  - Off: thinking budget disabled.

## 2. Multimodal Input and Context

- Camera toggle in left sidebar.
- Live camera frame upload to AI at 1 FPS when camera is on and AI session is connected.
- File attachment pipeline (up to 5 files in chat UI).
- Auto-sync of newly attached files into model context.
- Attached-file reading tool with support for:
  - PDF text extraction.
  - DOCX text extraction.
  - Text/JSON/JS file reads.
  - Binary/image fallback note when text extraction is not possible.

## 3. AI-Callable Toolset (Declared and Reachable)

These tools are declared for Gemini and have handling in the tool runner/Electron bridge:

- `execute_shell_command`
- `manage_files`
- `open_item`
- `render_diagram`
- `store_memory`
- `get_memories`
- `update_dashboard`
- `get_clipboard`
- `set_clipboard`
- `take_screenshot`
- `send_notification`
- `http_request`
- `get_system_info`
- `get_processes`
- `kill_process`
- `window_control`
- `keyboard_press`
- `keyboard_type`
- `play_youtube_video`
- `read_attached_files`
- `send_whatsapp`
- `add_note`
- `read_notes`
- `read_tasks`
- `turn_off`
- Built-in web search tool: `googleSearch`

## 4. Desktop Automation and System Control

- Shell command execution in main process with:
  - Input validation.
  - Blocked dangerous command patterns.
  - Optional user approval gate.
- File system operations (read/list/write/delete/exists/create-dir) via IPC.
- Open files/apps/URLs through system open.
- Desktop screenshot capture.
- Native desktop notifications.
- Clipboard read/write (text/html/image read).
- HTTP API calls (GET/POST/PUT/PATCH/DELETE etc.).
- Detailed system info (CPU, memory, graphics, OS, network, battery).
- Running process listing (top CPU consumers).
- Process kill by PID.
- App window controls (minimize/maximize/fullscreen/close).
- Keyboard simulation:
  - Key press shortcuts.
  - Text typing with optional Enter.
- WhatsApp Desktop automation via PowerShell SendKeys.

## 5. Dashboard and Information Surface

- Headlines + weather dashboard widget in left sidebar.
- Manual refresh action from UI.
- Dashboard settings modal:
  - Interests list.
  - Refresh interval value (stored).
- User profile fields (name/location/profession/bio) used for context.

## 6. Visual and Media Features

- Mermaid diagram rendering in Visual Hub.
- Visual Hub interactions:
  - Expand/minimize.
  - Zoom in/out.
  - Pan/drag.
  - Reset view.
- In-app YouTube player overlay (minimize/maximize/close).
- AI globe visualization with audio-reactive animations.
- Real-time chat transcript + separate log terminal panel.

## 7. Notes, Tasks, Memory, and History

- Memory modal:
  - Add memory entries.
  - Delete memory entries.
- Notes module:
  - Create/edit/delete notes.
  - Search notes.
  - Full-screen style editor.
- Tasks module:
  - Add tasks.
  - Mark complete/incomplete.
  - Delete tasks.
  - Priority and category fields.
- Conversation history:
  - Save/load history.
  - Clear history.
  - History settings storage.

## 8. Vault and Folder Management

- Vault initialization in main process (`Theta_Vault` with default folders).
- Folder import from filesystem.
- Imported folder list persistence.
- Open imported folders.
- Rename/remove imported folder labels in UI.

## 9. Security and Key Management

- Gemini API token storage using OS credential store (`keytar`) with fallback file.
- Legacy secret migration from old JSON key format.
- Context-isolated preload bridge for renderer-main communication.
- CSP and permission request handling in Electron.
- Zod validation on critical IPC actions:
  - File operations.
  - Shell execution.
  - HTTP fetch requests.
  - Kill process.
- Optional explicit approval workflow for risky actions (env-controlled).

## 10. Updates and Packaging

- Electron auto-update flow:
  - Check for update.
  - Download update.
  - Install and restart.
  - Progress and state events to UI.
- Update notification UI panel in app.
- Update signature verification enabled.
- Windows installer packaging via electron-builder.
- Generic publish endpoint configured (Azure Blob URL in builder config).

## 11. Background Services

- Python wake-word service starts from Electron main process.
- Wake-word events forwarded to renderer via IPC channel.

## 12. Present but Not Fully Active / Not Wired in Main Flow

These exist in code but are currently incomplete, unreachable from the declared AI tool schema, or not wired into the main app UI flow:

- `generate_image` handler exists in tool runner, but function is not declared in Gemini tool declarations.
  - Practical effect: AI cannot reliably invoke image generation as a tool in current config.
- `add_task` handler exists in tool runner, but function is not declared in Gemini tool declarations.
  - Practical effect: AI tool-call path for adding tasks is not currently reachable.
- `ContactsModal` component and contacts persistence handlers exist, but modal is not wired into `App.tsx`.
- Dashboard `refreshInterval` is stored but no active scheduler uses it for automatic refresh.
- History `maxContextMessages` is stored but not applied to trim context sent to live session.
- `fetch-dashboard-data` IPC handler exists but main UI path currently uses AI tool-driven dashboard updates.
- `open-vault-folder` IPC handler exists but no active renderer call path found.
- Supabase OpenAI proxy function exists in repo, but no active usage found in frontend/Electron runtime code path.

## 13. Integrations Currently in the Codebase

- Google Gemini Live API (`@google/genai`) for voice + tool-calling session.
- Mermaid CDN runtime for diagrams.
- `systeminformation` for machine diagnostics.
- `screenshot-desktop` for captures.
- `axios` for HTTP tool.
- `keytar` for secret storage.
- `pdf-parse` and `mammoth` for file text extraction.
- YouTube embed playback via iframe.
