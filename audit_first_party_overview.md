## FILE: %USERPROFILE%\Desktop\usman_ahmed\customer_data.csv
Lines: 1
Imports/Requires: none
Exports: none

## FILE: %USERPROFILE%\Desktop\usman_ahmed\customer_data.txt
Lines: 1
Imports/Requires: none
Exports: none

## FILE: .env
Lines: 0
Imports/Requires: none
Exports: none

## FILE: .env.example
Lines: 10
Imports/Requires: none
Exports: none

## FILE: .gitignore
Lines: 13
Imports/Requires: none
Exports: none

## FILE: .vscode\extensions.json
Lines: 3
Imports/Requires: none
Exports: none

## FILE: .vscode\settings.json
Lines: 24
Imports/Requires: none
Exports: none

## FILE: AI_CAPABILITIES.md
Lines: 249
Imports/Requires: none
Exports: none

## FILE: config_bak_C.dat
Lines: 1
Imports/Requires: none
Exports: none

## FILE: dev-app-update.yml
Lines: 2
Imports/Requires: none
Exports: none

## FILE: document_D4.txt
Lines: 1
Imports/Requires: none
Exports: none

## FILE: electron\main.js
Lines: 1033
Imports/Requires:
  L1: const { app, BrowserWindow, ipcMain, powerSaveBlocker, nativeImage } = require('electron');
  L2: const { spawn } = require('child_process');
  L3: const path = require('path');
  L4: const fs = require('fs');
  L5: const os = require('os');
  L6: const { exec } = require('child_process');
  L7: const { dialog } = require('electron');
  L8: const mime = require('mime-types');
  L9: const si = require('systeminformation');
  L10: const screenshot = require('screenshot-desktop');
  L11: const axios = require('axios');
  L12: const { clipboard, Notification } = require('electron');
  L13: const http = require('http');
  L21: const pdf = require('pdf-parse');
  L22: const mammoth = require('mammoth');
  L25: const { autoUpdater } = require('electron-updater');
  L68: const { GoogleGenAI } = require('@google/genai');
Exports: none
IPC:
  L226: ipcMain.handle('load-memories', async () => {
  L234: ipcMain.handle('save-memories', async (event, memories) => {
  L242: ipcMain.handle('load-user-profile', async () => {
  L250: ipcMain.handle('save-user-profile', async (event, profile) => {
  L258: ipcMain.handle('load-dashboard-settings', async () => {
  L266: ipcMain.handle('save-dashboard-settings', async (event, settings) => {
  L273: ipcMain.handle('fetch-dashboard-data', async (event, { location, interests }) => {
  L293: ipcMain.handle('load-history', async () => {
  L301: ipcMain.handle('save-history', async (event, history) => {
  L308: ipcMain.handle('clear-history', async () => {
  L316: ipcMain.handle('load-history-settings', async () => {
  L324: ipcMain.handle('save-history-settings', async (event, settings) => {
  L332: ipcMain.handle('load-contacts', async () => {
  L340: ipcMain.handle('save-contacts', async (event, contacts) => {
  L348: ipcMain.handle('load-notes', async () => {
  L356: ipcMain.handle('save-notes', async (event, notes) => {
  L364: ipcMain.handle('load-tasks', async () => {
  L372: ipcMain.handle('save-tasks', async (event, tasks) => {
  L380: ipcMain.handle('initialize-vault', async () => {
  L396: ipcMain.handle('open-vault-folder', async (event, folderName) => {
  L405: ipcMain.handle('load-imported-folders', async () => {
  L413: ipcMain.handle('save-imported-folders', async (event, folders) => {
  L420: ipcMain.handle('pick-folder', async () => {
  L433: ipcMain.handle('get-gemini-token', async () => {
  L446: ipcMain.handle('save-gemini-token', async (event, apiKey) => {
  L456: ipcMain.handle('system-fs-op', async (event, { operation, path: targetPath, content }) => {
  L470: ipcMain.handle('system-open', async (event, { target }) => {
  L476: ipcMain.handle('system-exec-command', async (event, { command }) => {
  L484: ipcMain.handle('save-image', async (event, { base64Data }) => {
  L493: ipcMain.handle('read-file-content', async (event, { path: filePath }) => {
  L521: ipcMain.handle('pick-and-read-files', async () => {
  L554: ipcMain.handle('clipboard-read', async () => {
  L564: ipcMain.handle('clipboard-write', async (event, { text, html }) => {
  L573: ipcMain.handle('take-screenshot', async () => {
  L585: ipcMain.handle('send-notification', async (event, { title, body, icon }) => {
  L598: ipcMain.handle('http-fetch', async (event, { url, method, headers, body }) => {
  L623: ipcMain.handle('get-detailed-system-info', async () => {
  L638: ipcMain.handle('window-control', async (event, { action }) => {
  L654: ipcMain.handle('get-processes', async () => {
  L667: ipcMain.handle('kill-process', async (event, { pid }) => {
  L675: ipcMain.handle('send-whatsapp-keyboard', async (event, { name, message }) => {
  L775: ipcMain.handle('keyboard-press', async (event, { key }) => {
  L823: ipcMain.handle('keyboard-type', async (event, { text, pressEnter }) => {
  L864: ipcMain.handle('check-for-update', async () => {
  L873: ipcMain.handle('download-update', async () => {
  L882: ipcMain.handle('install-update', async () => {
  L887: ipcMain.handle('get-app-version', async () => {
Risky Patterns:
  L26: autoUpdater.autoDownload = false;
  L82: nodeIntegration: true,
  L83: contextIsolation: true,
  L85: webviewTag: true,
  L86: webSecurity: false, // CRITICAL: Allow YouTube iframe to load in production
  L87: allowRunningInsecureContent: true, // Allow external media content
  L229: if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  L236: fs.writeFileSync(getMemoryPath(), JSON.stringify(memories, null, 2));
  L245: if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  L252: fs.writeFileSync(getUserProfilePath(), JSON.stringify(profile, null, 2));
  L261: if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  L268: fs.writeFileSync(getDashboardSettingsPath(), JSON.stringify(settings, null, 2));
  L296: if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  L303: fs.writeFileSync(getHistoryPath(), JSON.stringify(history, null, 2));
  L311: if (fs.existsSync(p)) fs.unlinkSync(p);
  L319: if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  L326: fs.writeFileSync(getHistorySettingsPath(), JSON.stringify(settings, null, 2));
  L335: if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  L342: fs.writeFileSync(getContactsPath(), JSON.stringify(contacts, null, 2));
  L351: if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  L358: fs.writeFileSync(getNotesPath(), JSON.stringify(notes, null, 2));
  L367: if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  L374: fs.writeFileSync(getTasksPath(), JSON.stringify(tasks, null, 2));
  L384: if (!fs.existsSync(vaultBase)) fs.mkdirSync(vaultBase, { recursive: true });
  L387: if (fs.existsSync(configPath)) folderNames = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  L390: if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  L408: if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  L415: fs.writeFileSync(getFolderConfigPath(), JSON.stringify(folders, null, 2));
  L436: if (fs.existsSync(p)) {
  L437: const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  L448: fs.writeFileSync(getSecretKeyPath(), JSON.stringify({ apiKey, updatedAt: Date.now() }, null, 2));
  L459: case 'read-dir': return fs.readdirSync(targetPath);
  L460: case 'create-dir': if (!fs.existsSync(targetPath)) fs.mkdirSync(targetPath, { recursive: true }); return true;
  L461: case 'write-file': fs.writeFileSync(targetPath, content); return true;
  L462: case 'read-file': return fs.readFileSync(targetPath, 'utf8');
  L463: case 'delete': fs.rmSync(targetPath, { recursive: true, force: true }); return true;
  L464: case 'exists': return fs.existsSync(targetPath);
  L478: exec(command, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
  L488: fs.writeFileSync(filePath, buffer);
  L495: if (!fs.existsSync(filePath)) return { error: 'File not found' };
  L498: const buffer = fs.readFileSync(filePath);
  L533: const stats = fs.statSync(filePath);
  L539: const buffer = fs.readFileSync(filePath);
  L718: exec('start whatsapp:', (err) => {
  L811: exec(`powershell -Command "${psCommand}"`, { timeout: 30000 }, (error, stdout, stderr) => {
  L852: exec(`powershell -Command "${psCommand}"`, { timeout: 20000 }, (error, stdout, stderr) => {
  L898: wakeWordProcess = spawn('python', [path.join(__dirname, '../wake_word_bg.py')]);
  L935: "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; " +
  L940: "script-src * 'unsafe-inline' 'unsafe-eval'; " +
  L941: "style-src * 'unsafe-inline'; " +
Any usage:
  L159: // SPA fallback - serve index.html for any unknown route

## FILE: electron\preload.js
Lines: 15
Imports/Requires:
  L1: const { contextBridge, ipcRenderer, webFrame } = require('electron');
Exports: none
IPC:
  L3: contextBridge.exposeInMainWorld('electronAPI', {
  L5: onUpdateLog: (callback) => ipcRenderer.on('update-log', (_event, value) => callback(value)),
  L9: invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  L12: ipcRenderer.on(channel, subscription);

## FILE: electron-builder.json.bak
Lines: 36
Imports/Requires: none
Exports: none

## FILE: electron-builder.yml
Lines: 43
Imports/Requires: none
Exports: none

## FILE: file_G7.txt
Lines: 1
Imports/Requires: none
Exports: none

## FILE: index.html
Lines: 23
Imports/Requires: none
Exports: none

## FILE: junk_E5.tmp
Lines: 1
Imports/Requires: none
Exports: none

## FILE: main.py
Lines: 0
Imports/Requires: none
Exports: none

## FILE: package.json
Lines: 56
Imports/Requires: none
Exports: none

## FILE: package-lock.json
Lines: 10093
Imports/Requires: none
Exports: none
Any usage:
  L2749: "node_modules/any-promise": {
  L2751: "resolved": "https://registry.npmjs.org/any-promise/-/any-promise-1.3.0.tgz",
  L7261: "any-promise": "^1.0.0",
  L9328: "any-promise": "^1.0.0"

## FILE: postcss.config.js
Lines: 6
Imports/Requires: none
Exports:
  L1: module.exports = {

## FILE: public\audio-processor-worklet.js
Lines: 38
Imports/Requires: none
Exports: none

## FILE: random_junk_1.txt
Lines: 1
Imports/Requires: none
Exports: none

## FILE: README.md
Lines: 42
Imports/Requires: none
Exports: none

## FILE: report_F6.log
Lines: 1
Imports/Requires: none
Exports: none

## FILE: src\App.tsx
Lines: 897
Imports/Requires:
  L1: import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
  L2: import { Settings } from 'lucide-react';
  L4: import { useGeminiLive } from './hooks/useGeminiLive';
  L5: import { useZoom } from './hooks/useZoom';
  L6: import { useAudio } from './hooks/useAudio';
  L7: import { ConnectionStatus } from './types';
  L11: import MemoryModal from './components/modals/MemoryModal';
  L12: import UserProfileModal from './components/modals/UserProfileModal';
  L13: import DashboardSettingsModal from './components/modals/DashboardSettingsModal';
  L14: import HistoryModal from './components/modals/HistoryModal';
  L15: import SecretKeyModal from './components/modals/SecretKeyModal';
  L16: import SettingsModal from './components/modals/SettingsModal';
  L20: import LoadingScreen from './components/modules/LoadingScreen';
  L21: import SidebarLeft from './components/modules/SidebarLeft';
  L22: import SidebarRight from './components/modules/SidebarRight';
  L23: import VisualHub from './components/modules/VisualHub';
  L24: import SystemConnections from './components/modules/SystemConnections';
  L25: import FolderExplorer from './components/modules/FolderExplorer';
  L26: import SystemControls from './components/modules/SystemControls';
  L27: import AIGlobePortal from './components/modules/AIGlobePortal';
  L28: import NotesSection from './components/modules/NotesSection';
  L29: import TasksSection from './components/modules/TasksSection';
  L30: import UpdateNotification from './components/modules/UpdateNotification';
  L31: import YouTubePlayer from './components/modules/YouTubePlayer';
Exports:
  L897: export default App;
Any usage:
  L35: const electronAPI = (window as any).electronAPI;
  L74: const [memories, setMemories] = useState<any[]>([]);
  L75: const [userProfile, setUserProfile] = useState<any>({
  L82: const [dashboardSettings, setDashboardSettings] = useState<any>({
  L86: const [history, setHistory] = useState<any[]>([]);
  L87: const [historySettings, setHistorySettings] = useState<any>({
  L99: const [notes, setNotes] = useState<any[]>([]);
  L100: const [tasks, setTasks] = useState<any[]>([]);
  L101: const [dashboardData, setDashboardData] = useState<any>(null);
  L111: electronAPI.invoke('load-user-profile').then((profile: any) => {
  L117: electronAPI.invoke('load-imported-folders').then((folders: any[]) => {
  L122: electronAPI.invoke('initialize-vault').then((data: any) => {
  L147: const handleUpdateDashboardSettings = async (settings: any) => {
  L214: const handleSaveNote = async (note: any) => {
  L228: const handleSaveTasks = async (updatedTasks: any[]) => {
  L243: const handleMemoriesUpdated = useCallback(async (updatedMemories: any[]) => {
  L248: const handleDashboardUpdate = useCallback((data: any) => {
  L307: const unsubscribe = electronAPI.on('wake-word-detected', (data: any) => {
  L377: const handleUpdateHistorySettings = async (settings: any) => {

## FILE: src\App_fix_destructure.txt
Lines: 6
Imports/Requires: none
Exports: none

## FILE: src\components\DotGlobe.tsx
Lines: 212
Imports/Requires:
  L2: import React, { useEffect, useRef, useMemo } from 'react';
Exports:
  L212: export default DotGlobe;

## FILE: src\components\layout\MainLayout.tsx
Lines: 49
Imports/Requires:
  L1: import React from 'react';
Exports:
  L49: export default MainLayout;

## FILE: src\components\LogTerminal.tsx
Lines: 100
Imports/Requires:
  L1: import React, { useEffect, useRef } from 'react';
  L2: import { Terminal, Cpu, Info, CheckCircle, AlertTriangle, XCircle, Code } from 'lucide-react';
  L3: import { SystemLog } from '../hooks/useGeminiLive';
Exports:
  L100: export default LogTerminal;

## FILE: src\components\modals\ContactsModal.tsx
Lines: 174
Imports/Requires:
  L1: import React, { useState } from 'react';
  L2: import { Users, X, Plus, Trash2, Phone, Search } from 'lucide-react';
  L3: import { useAudio } from '../../hooks/useAudio';
Exports:
  L174: export default ContactsModal;

## FILE: src\components\modals\DashboardSettingsModal.tsx
Lines: 82
Imports/Requires:
  L1: import { Sliders, X } from 'lucide-react';
  L2: import { useAudio } from '../../hooks/useAudio';
Exports:
  L82: export default DashboardSettingsModal;
Any usage:
  L8: dashboardSettings: any;
  L9: handleUpdateDashboardSettings: (settings: any) => void;

## FILE: src\components\modals\HistoryModal.tsx
Lines: 125
Imports/Requires:
  L1: import React from 'react';
  L2: import { Database, X } from 'lucide-react';
  L3: import { useAudio } from '../../hooks/useAudio';
Exports:
  L125: export default HistoryModal;
Any usage:
  L10: history: any[];
  L11: historySettings: any;
  L12: handleUpdateHistorySettings: (settings: any) => void;
  L96: history.slice().reverse().map((msg: any, idx: number) => (

## FILE: src\components\modals\MemoryModal.tsx
Lines: 131
Imports/Requires:
  L1: import { Brain, X, Plus, Trash2 } from 'lucide-react';
  L2: import { useAudio } from '../../hooks/useAudio';
Exports:
  L131: export default MemoryModal;
Any usage:
  L8: memories: any[];
  L83: memories.map((memo: any) => (

## FILE: src\components\modals\SecretKeyModal.tsx
Lines: 118
Imports/Requires:
  L1: import React, { useState } from 'react';
  L2: import { Key, ShieldCheck, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
  L3: import { useAudio } from '../../hooks/useAudio';
Exports:
  L117: export default SecretKeyModal;
Any usage:
  L35: const success = await (window as any).electronAPI.invoke('save-gemini-token', key.trim());
  L41: } catch (err: any) {

## FILE: src\components\modals\SettingsModal.tsx
Lines: 158
Imports/Requires:
  L1: import React, { useState, useEffect } from 'react';
  L2: import { X, Settings, Database, Key, Trash2, Save, CheckCircle2, AlertCircle } from 'lucide-react';
  L3: import { useAudio } from '../../hooks/useAudio';
Exports:
  L157: export default SettingsModal;
Any usage:
  L19: (window as any).electronAPI.invoke('get-gemini-token').then((key: string) => {
  L23: (window as any).electronAPI.invoke('get-app-version').then((version: string) => {
  L34: const success = await (window as any).electronAPI.invoke('save-gemini-token', apiKey);
  L41: } catch (err: any) {
  L51: await (window as any).electronAPI.invoke('save-memories', []);

## FILE: src\components\modals\UserProfileModal.tsx
Lines: 99
Imports/Requires:
  L1: import { User, X } from 'lucide-react';
  L2: import { useAudio } from '../../hooks/useAudio';
Exports:
  L99: export default UserProfileModal;
Any usage:
  L8: userProfile: any;

## FILE: src\components\modules\AIGlobePortal.tsx
Lines: 70
Imports/Requires:
  L1: import React from 'react';
  L2: import DotGlobe from '../DotGlobe';
  L3: import { ConnectionStatus } from '../../types';
Exports:
  L70: export default AIGlobePortal;
Any usage:
  L8: analyser: any;
  L9: micAnalyser: any;

## FILE: src\components\modules\FolderExplorer.tsx
Lines: 95
Imports/Requires:
  L1: import React from 'react';
  L2: import { Plus, Folder, X } from 'lucide-react';
Exports:
  L95: export default FolderExplorer;

## FILE: src\components\modules\LoadingScreen.tsx
Lines: 153
Imports/Requires:
  L1: import React, { useState, useEffect, useRef } from 'react';
Exports:
  L153: export default LoadingScreen;

## FILE: src\components\modules\NotesSection.tsx
Lines: 204
Imports/Requires:
  L1: import React, { useState } from 'react';
  L2: import { Plus, Trash2, Edit3, Save, X, Search } from 'lucide-react';
  L3: import { useAudio } from '../../hooks/useAudio';
Exports:
  L204: export default NotesSection;

## FILE: src\components\modules\SidebarLeft.tsx
Lines: 121
Imports/Requires:
  L1: import { Camera, CameraOff } from 'lucide-react';
  L2: import TodayHeadlines from '../TodayHeadlines';
  L3: import { useAudio } from '../../hooks/useAudio';
Exports:
  L121: export default SidebarLeft;
Any usage:
  L15: dashboardData: any;

## FILE: src\components\modules\SidebarRight.tsx
Lines: 325
Imports/Requires:
  L1: import React from 'react';
  L2: import { MessageSquare, Paperclip, X, Plus } from 'lucide-react';
  L3: import { ConnectionStatus } from '../../types';
  L4: import LogTerminal from '../LogTerminal';
  L5: import { useAudio } from '../../hooks/useAudio';
Exports:
  L325: export default SidebarRight;
Any usage:
  L13: messages: any[];
  L14: logs: any[];
  L16: attachedFiles: any[];

## FILE: src\components\modules\SystemConnections.tsx
Lines: 72
Imports/Requires:
  L1: import React from 'react';
Exports:
  L72: export default SystemConnections;

## FILE: src\components\modules\SystemControls.tsx
Lines: 109
Imports/Requires:
  L1: import { Paperclip, X, Brain, Database, User } from 'lucide-react';
  L2: import { useAudio } from '../../hooks/useAudio';
Exports:
  L109: export default SystemControls;
Any usage:
  L7: attachedFiles: any[];

## FILE: src\components\modules\TasksSection.tsx
Lines: 196
Imports/Requires:
  L1: import React, { useState } from 'react';
  L2: import { Plus, Trash2, CheckCircle2, Circle, AlertCircle, Clock, Tag } from 'lucide-react';
  L3: import { useAudio } from '../../hooks/useAudio';
Exports:
  L196: export default TasksSection;
Any usage:
  L107: onChange={(e: any) => setSelectedPriority(e.target.value)}

## FILE: src\components\modules\UpdateNotification.tsx
Lines: 259
Imports/Requires:
  L1: import React, { useState, useEffect } from 'react';
  L2: import { createPortal } from 'react-dom';
  L3: import { Download, X, Check, RefreshCw } from 'lucide-react';
Exports:
  L259: export default UpdateNotification;
Any usage:
  L5: const electronAPI = (window as any).electronAPI;
  L83: .then((res: any) => {
  L99: .catch((err: any) => console.error("Manual check error:", err));

## FILE: src\components\modules\VisualHub.tsx
Lines: 274
Imports/Requires:
  L1: import React, { useRef, useEffect, useState } from 'react';
  L2: import { Maximize2, Minimize2, Zap, Layers, ZoomIn, ZoomOut, RotateCcw, Move, X } from 'lucide-react';
Exports:
  L274: export default VisualHub;
Risky Patterns:
  L45: if (diagramRef.current) diagramRef.current.innerHTML = '';
  L49: diagramRef.current.innerHTML = svg;
  L54: diagramRef.current.innerHTML = `<div class="p-6 border border-j-crimson/30 bg-j-crimson/5 rounded-xl text-j-crimson text-xs font-mono text-left overflow-auto max-h-full">
Any usage:
  L51: } catch (err: any) {

## FILE: src\components\modules\YouTubePlayer.tsx
Lines: 92
Imports/Requires:
  L1: import React, { useState } from 'react';
  L2: import { X, Minus, Maximize2, Music } from 'lucide-react';
Exports:
  L92: export default YouTubePlayer;

## FILE: src\components\ParticleSphere.tsx
Lines: 119
Imports/Requires:
  L1: import React, { useEffect, useRef } from 'react';
Exports:
  L119: export default ParticleSphere;

## FILE: src\components\TodayHeadlines.tsx
Lines: 99
Imports/Requires:
  L1: import React, { useState, useEffect } from 'react';
  L2: import { Map, Sliders, RefreshCw } from 'lucide-react';
  L3: import type { DashboardData } from '../lib/dashboard';
Exports:
  L99: export default TodayHeadlines;

## FILE: src\components\Transcript.tsx
Lines: 75
Imports/Requires:
  L2: import React, { useEffect, useRef } from 'react';
  L3: import { Message } from '../types';
Exports:
  L75: export default Transcript;

## FILE: src\components\ui\HolographicCard.tsx
Lines: 58
Imports/Requires:
  L1: import React from 'react';
Exports:
  L58: export default HolographicCard;

## FILE: src\components\ui\NeonButton.tsx
Lines: 49
Imports/Requires:
  L1: import React from 'react';
  L2: import { useAudio } from '../../hooks/useAudio';
Exports:
  L49: export default NeonButton;

## FILE: src\components\voice\AICore.tsx
Lines: 59
Imports/Requires:
  L1: import React from 'react';
  L2: import DotGlobe from '../DotGlobe';
  L4: import { ConnectionStatus } from '../../types';
Exports:
  L59: export default AICore;

## FILE: src\components\voice\TranscriptTerminal.tsx
Lines: 70
Imports/Requires:
  L1: import React, { useEffect, useRef } from 'react';
  L2: import { Terminal, Cpu } from 'lucide-react';
  L3: import { Message } from '../../types';
Exports:
  L70: export default TranscriptTerminal;

## FILE: src\components\VoiceOrb.tsx
Lines: 126
Imports/Requires:
  L2: import React, { useEffect, useRef, useState } from 'react';
Exports:
  L126: export default VoiceOrb;

## FILE: src\config\gemini-config.ts
Lines: 439
Imports/Requires: none
Exports:
  L1: export const tools = [
  L302: export const getSystemInstruction = (
Any usage:
  L9: type: 'OBJECT' as any,
  L11: command: { type: 'STRING' as any, description: 'The shell command to execute.' }
  L20: type: 'OBJECT' as any,
  L22: operation: { type: 'STRING' as any, enum: ['read-dir', 'create-dir', 'write-file', 'read-file', 'delete', 'exists'] },
  L23: path: { type: 'STRING' as any, description: 'The absolute path to the file or folder.' },
  L24: content: { type: 'STRING' as any, description: 'Content to write (for write-file only).' }
  L33: type: 'OBJECT' as any,
  L35: target: { type: 'STRING' as any, description: 'The path to the file/app or the URL to open.' }
  L44: type: 'OBJECT' as any,
  L47: type: 'STRING' as any,
  L51: type: 'STRING' as any,
  L62: type: 'OBJECT' as any,
  L65: type: 'STRING' as any,
  L69: type: 'STRING' as any,
  L80: type: 'OBJECT' as any,
  L88: type: 'OBJECT' as any,
  L91: type: 'ARRAY' as any,
  L92: items: { type: 'STRING' as any },
  L96: type: 'OBJECT' as any,
  L98: today: { type: 'STRING' as any, description: 'Summary for today, e.g., "72°F, Clear"' },
  L99: tomorrow: { type: 'STRING' as any, description: 'Summary for tomorrow' },
  L100: dayAfter: { type: 'STRING' as any, description: 'Summary for day after tomorrow' }
  L112: type: 'OBJECT' as any,
  L120: type: 'OBJECT' as any,
  L122: text: { type: 'STRING' as any, description: 'Text to copy to clipboard' },
  L123: html: { type: 'STRING' as any, description: 'HTML content to copy (optional)' }
  L132: type: 'OBJECT' as any,
  L140: type: 'OBJECT' as any,
  L142: title: { type: 'STRING' as any, description: 'Notification title' },
  L143: body: { type: 'STRING' as any, description: 'Notification message body' }
  L152: type: 'OBJECT' as any,
  L154: url: { type: 'STRING' as any, description: 'The URL to request' },
  L155: method: { type: 'STRING' as any, description: 'HTTP method (GET, POST, PUT, DELETE)' },
  L156: headers: { type: 'OBJECT' as any, description: 'Request headers as key-value object' },
  L157: body: { type: 'STRING' as any, description: 'Request body (for POST/PUT)' }
  L166: type: 'OBJECT' as any,
  L174: type: 'OBJECT' as any,
  L182: type: 'OBJECT' as any,
  L184: pid: { type: 'NUMBER' as any, description: 'Process ID to terminate' }
  L193: type: 'OBJECT' as any,
  L195: action: { type: 'STRING' as any, enum: ["minimize", "maximize", "close", "fullscreen"], description: 'Window action to perform' }
  L204: type: 'OBJECT' as any,
  L207: type: 'STRING' as any,
  L218: type: 'OBJECT' as any,
  L220: text: { type: 'STRING' as any, description: 'Text to type' },
  L221: pressEnter: { type: 'BOOLEAN' as any, description: 'If true, presses Enter after typing' }
  L230: type: 'OBJECT' as any,
  L232: query: { type: 'STRING' as any, description: 'The name of the song or video to search for.' }
  L241: type: 'OBJECT' as any,
  L249: type: 'OBJECT' as any,
  L251: contactName: { type: 'STRING' as any, description: 'The EXACT name of the contact as saved in WhatsApp (e.g., "Zeeshan Khan", "Ami").' },
  L252: message: { type: 'STRING' as any, description: 'The message content to send.' }
  L261: type: 'OBJECT' as any,
  L263: title: { type: 'STRING' as any, description: 'Title of the note.' },
  L264: content: { type: 'STRING' as any, description: 'The main content/body of the note.' },
  L265: category: { type: 'STRING' as any, description: 'Category (e.g., Work, Personal, Ideas).' }
  L274: type: 'OBJECT' as any,
  L276: query: { type: 'STRING' as any, description: 'Optional keyword to filter notes.' }
  L284: type: 'OBJECT' as any,
  L286: filter: { type: 'STRING' as any, enum: ['all', 'pending', 'completed', 'high'], description: 'Filter tasks by status or priority. Defaults to "pending".' }
  L294: type: 'OBJECT' as any,
  L303: userProfile: any,
  L304: vaultInfo: any,
  L305: initialHistory: any[]
  L356: • Any destructive action
  L416: ${vaultInfo?.folders?.map((f: any) => `• ${f.name}: ${f.path}`).join('\n') || 'No folders imported yet.'}

## FILE: src\hooks\useAudio.ts
Lines: 23
Imports/Requires:
  L1: import { useCallback } from 'react';
Exports:
  L3: export const useAudio = () => {

## FILE: src\hooks\useGeminiLive.ts
Lines: 636
Imports/Requires:
  L1: import { useState, useRef, useCallback, useEffect } from 'react';
  L2: import { GoogleGenAI, Modality, LiveServerMessage, StartSensitivity, EndSensitivity } from '@google/genai';
  L3: import { decode, decodeAudioData, createBlob } from '../lib/audio-helpers';
  L4: import { Message, ConnectionStatus } from '../types';
  L5: import { SystemLog, UseGeminiLiveProps } from '../types/gemini-live';
  L6: import { tools, getSystemInstruction } from '../config/gemini-config';
  L7: import { handleToolCalls } from '../lib/gemini-tool-runner';
Exports:
  L12: export const useGeminiLive = ({
Any usage:
  L10: const electronAPI = (window as any).electronAPI;
  L57: const addLog = useCallback((type: SystemLog['type'], message: string, details?: any) => {
  L85: const sessionRef = useRef<any>(null);
  L129: const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  L130: const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  L173: tools: tools as any,
  L429: } catch (err: any) {
  L497: const parts: any[] = [];
  L541: } catch (err: any) {
  L569: const parts: any[] = [];
  L600: } catch (err: any) {

## FILE: src\hooks\useZoom.ts
Lines: 66
Imports/Requires:
  L1: import { useEffect, useState, useRef } from 'react';
Exports:
  L5: export const useZoom = () => {
Any usage:
  L3: const electronAPI = (window as any).electronAPI;
  L45: const current = (window as any).electronAPI.getZoomFactor();
  L46: (window as any).electronAPI.setZoomFactor(Math.min(current + 0.1, 2.5));
  L49: const current = (window as any).electronAPI.getZoomFactor();
  L50: (window as any).electronAPI.setZoomFactor(Math.max(current - 0.1, 0.4));

## FILE: src\index.css
Lines: 223
Imports/Requires: none
Exports: none

## FILE: src\lib\audio-helpers.ts
Lines: 50
Imports/Requires: none
Exports:
  L2: export function encode(bytes: Uint8Array): string {
  L11: export function decode(base64: string): Uint8Array {
  L21: export async function decodeAudioData(
  L40: export function createBlob(data: Float32Array): { data: string; mimeType: string } {

## FILE: src\lib\audio-player.ts
Lines: 139
Imports/Requires: none
Exports:
  L7: export class AudioPlayer {
Any usage:
  L14: this.context = new (window.AudioContext || (window as any).webkitAudioContext)({

## FILE: src\lib\audio-utils.ts
Lines: 93
Imports/Requires: none
Exports:
  L6: export const PCM_SAMPLE_RATE = 16000;
  L8: export class AudioProcessor {
  L91: export const sanitizeInput = (text: string) => {
Any usage:
  L15: this.context = new (window.AudioContext || (window as any).webkitAudioContext)({

## FILE: src\lib\dashboard.ts
Lines: 71
Imports/Requires:
  L1: import { GoogleGenAI } from "@google/genai";
Exports:
  L3: export interface DashboardData {
  L16: export const fetchDashboardData = async (
Any usage:
  L47: const result = await (ai as any).models.generateContent({
  L50: tools: [{ googleSearch: {} } as any]
  L67: } catch (error: any) {

## FILE: src\lib\gemini-tool-runner.ts
Lines: 636
Imports/Requires:
  L1: import { generateImage } from './genai';
  L2: import { SystemLog } from '../types/gemini-live';
Exports:
  L4: export interface ToolExecutionContext {
  L20: export const handleToolCalls = async (
Any usage:
  L5: addLog: (type: SystemLog['type'], message: string, details?: any) => void;
  L9: onMemoriesUpdated?: (memories: any[]) => void;
  L10: onDashboardUpdated?: (data: { headlines: string[], weather: any }) => void;
  L11: onNotesUpdated?: (notes: any[]) => void;
  L12: onTasksUpdated?: (tasks: any[]) => void;
  L13: electronAPI: any;
  L16: getAttachedFiles?: () => any[];
  L21: toolCalls: any[],
  L22: session: any,
  L42: const { prompt } = call.args as any;
  L66: } catch (err: any) {
  L71: const { code, type } = call.args as any;
  L86: const { content, category } = call.args as any;
  L128: const { contactName, message } = call.args as any;
  L188: const { title, content, category } = call.args as any;
  L215: } catch (err: any) {
  L219: const { text, priority } = call.args as any;
  L246: } catch (err: any) {
  L250: const { query } = call.args as any;
  L259: filteredNotes = notes.filter((n: any) =>
  L279: } catch (err: any) {
  L283: const { filter } = call.args as any;
  L291: filteredTasks = tasks.filter((t: any) => !t.completed);
  L293: filteredTasks = tasks.filter((t: any) => t.completed);
  L295: filteredTasks = tasks.filter((t: any) => !t.completed && t.priority === 'high');
  L309: } catch (err: any) {
  L335: const filesContent = await Promise.all(attachedFiles.map(async (file: any, idx: number) => {
  L343: } catch (e: any) {
  L378: } catch (err: any) {
  L405: const { command } = call.args as any;
  L417: const { operation, path, content } = call.args as any;
  L429: } catch (err: any) {
  L439: const { target } = call.args as any;
  L451: const { headlines, weather } = call.args as any;
  L476: const { text, html } = call.args as any;
  L503: const { title, body } = call.args as any;
  L514: const { url, method, headers, body } = call.args as any;
  L545: const { pid } = call.args as any;
  L556: const { action } = call.args as any;
  L567: const { key } = call.args as any;
  L578: const { text, pressEnter } = call.args as any;
  L589: const { query } = call.args as any;
  L624: } catch (err: any) {

## FILE: src\lib\genai.ts
Lines: 69
Imports/Requires:
  L1: import { GoogleGenAI } from "@google/genai";
Exports:
  L7: export const generateImage = async (prompt: string, apiKey: string, retryCount = 0): Promise<string | null> => {
Any usage:
  L14: const response = await (ai as any).models.generateContent({
  L28: const imagePart = candidate.content.parts.find((part: any) => part.inlineData);
  L40: } catch (error: any) {
  L55: const retryInfo = error.details.find((d: any) => d['@type']?.includes('RetryInfo'));

## FILE: src\main.tsx
Lines: 8
Imports/Requires:
  L1: import React from 'react'
  L2: import ReactDOM from 'react-dom/client'
  L3: import App from './App'
  L4: import './index.css'
Exports: none

## FILE: src\types.ts
Lines: 21
Imports/Requires: none
Exports:
  L2: export interface Message {
  L11: export enum ConnectionStatus {
  L18: export interface AudioConfig {

## FILE: src\types\gemini-live.ts
Lines: 26
Imports/Requires:
  L1: import { Message } from '../types';
Exports:
  L3: export interface SystemLog {
  L11: export interface UseGeminiLiveProps {
Any usage:
  L8: details?: any;
  L14: memories?: any[];
  L15: onMemoriesUpdated?: (memories: any[]) => void;
  L16: userProfile?: any;
  L19: vaultInfo?: any;
  L20: initialHistory?: any[];
  L21: onDashboardUpdated?: (data: { headlines: string[], weather: any }) => void;
  L22: onNotesUpdated?: (notes: any[]) => void;
  L23: onTasksUpdated?: (tasks: any[]) => void;

## FILE: src\vite-env.d.ts
Lines: 10
Imports/Requires: none
Exports: none

## FILE: stt_test.py
Lines: 36
Imports/Requires:
  L1: import speech_recognition as sr
Exports: none

## FILE: supabase\.temp\cli-latest
Lines: 1
Imports/Requires: none
Exports: none

## FILE: supabase\config.toml
Lines: 395
Imports/Requires: none
Exports: none
Any usage:
  L201: # If enabled, a user will be required to confirm any email change on both the old, and new email
  L309: # or any other third-party OIDC providers.
  L373: # Experimental features may be deprecated any time

## FILE: supabase\functions\openai-proxy\.npmrc
Lines: 3
Imports/Requires: none
Exports: none

## FILE: supabase\functions\openai-proxy\deno.json
Lines: 3
Imports/Requires: none
Exports: none

## FILE: supabase\functions\openai-proxy\index.ts
Lines: 58
Imports/Requires:
  L6: import "jsr:@supabase/functions-js/edge-runtime.d.ts"
Exports: none

## FILE: system_log_23A.log
Lines: 1
Imports/Requires: none
Exports: none

## FILE: tailwind.config.js
Lines: 100
Imports/Requires: none
Exports:
  L2: module.exports = {

## FILE: temp_data_B.tmp
Lines: 1
Imports/Requires: none
Exports: none

## FILE: test_simple.spec
Lines: 38
Imports/Requires: none
Exports: none

## FILE: tsconfig.json
Lines: 25
Imports/Requires: none
Exports: none

## FILE: tsconfig.node.json
Lines: 9
Imports/Requires: none
Exports: none

## FILE: vite.config.ts
Lines: 19
Imports/Requires:
  L1: import { defineConfig } from 'vite'
  L2: import react from '@vitejs/plugin-react'
  L3: import path from 'path'
Exports:
  L6: export default defineConfig({

## FILE: wake_word_bg.py
Lines: 59
Imports/Requires:
  L1: import speech_recognition as sr
  L2: import sys
  L3: import json
Exports: none

