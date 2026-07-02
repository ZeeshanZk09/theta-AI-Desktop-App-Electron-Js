const fs = require('fs');

// Fix DashboardGrid.tsx
let grid = fs.readFileSync('src/components/modules/DashboardGrid.tsx', 'utf8');

// Use proper types for refs without using any
grid = grid.replace(/const mapRef = useRef<LeafletMap \| null>\(null\);/g, 'const mapRef = useRef<Record<string, unknown> | null>(null);');
grid = grid.replace(/const markerLayerRef = useRef<LayerGroup \| null>\(null\);/g, 'const markerLayerRef = useRef<Record<string, unknown> | null>(null);');

grid = grid.replace(/const electronAPI = \(window as unknown as \{ electronAPI: NonNullable<GlobalWindow\["electronAPI"\]> \}\)\.electronAPI;/g, 'const electronAPI = (window as unknown as { electronAPI: Record<string, unknown> }).electronAPI;');

grid = grid.replace(/electronAPI\.sendNotification/g, '(electronAPI.sendNotification as (payload: unknown) => Promise<void>)');
grid = grid.replace(/electronAPI\.saveDashboardModulesState/g, '(electronAPI.saveDashboardModulesState as (payload: unknown) => Promise<void>)');
grid = grid.replace(/electronAPI\.saveLinkedInQueue/g, '(electronAPI.saveLinkedInQueue as (payload: unknown) => Promise<void>)');
grid = grid.replace(/electronAPI\.saveLinkedInHistory/g, '(electronAPI.saveLinkedInHistory as (payload: unknown) => Promise<void>)');

grid = grid.replace(/electronAPI\.loadDashboardModulesState\(\)/g, '(electronAPI.loadDashboardModulesState as () => Promise<Record<string, unknown> | null>)()');
grid = grid.replace(/electronAPI\.loadLinkedInQueue\(\)/g, '(electronAPI.loadLinkedInQueue as () => Promise<LinkedInQueueItem[]>)()');
grid = grid.replace(/electronAPI\.loadLinkedInHistory\(\)/g, '(electronAPI.loadLinkedInHistory as () => Promise<LinkedInHistoryItem[]>)()');

grid = grid.replace(/electronAPI\.httpFetch/g, '(electronAPI.httpFetch as (url: string, opts: unknown) => Promise<{data: unknown}>)');
grid = grid.replace(/electronAPI\.requestActionApproval/g, '(electronAPI.requestActionApproval as (payload: unknown) => Promise<boolean>)');
grid = grid.replace(/electronAPI\.keyboardType/g, '(electronAPI.keyboardType as (payload: unknown) => Promise<void>)');
grid = grid.replace(/electronAPI\.keyboardPress/g, '(electronAPI.keyboardPress as (payload: unknown) => Promise<void>)');
grid = grid.replace(/electronAPI\.writeClipboard/g, '(electronAPI.writeClipboard as (payload: unknown) => Promise<void>)');

// Map fixes
grid = grid.replace(/mapRef\.current\?\.hasLayer/g, '(mapRef.current as Record<string, unknown>)?.hasLayer');
grid = grid.replace(/mapRef\.current\?\.removeLayer/g, '(mapRef.current as Record<string, unknown>)?.removeLayer');
grid = grid.replace(/\(window as unknown as \{ L: any \}\)\.L\.map/g, '(window as unknown as { L: { map: unknown } }).L.map');
grid = grid.replace(/markerLayerRef\.current\?\.clearLayers/g, '(markerLayerRef.current as Record<string, unknown>)?.clearLayers');

fs.writeFileSync('src/components/modules/DashboardGrid.tsx', grid);

// Fix SidebarRight.tsx
let sr = fs.readFileSync('src/components/modules/SidebarRight.tsx', 'utf8');
sr = sr.replace(/logs: SystemLog\[\];/g, 'logs: { id?: string; timestamp: string | number; type: "info" | "warn" | "error" | "user" | "ai" | "tool"; message: string }[];');
sr = sr.replace(/attachedFiles: \{ name: string; data: string; mimeType: string; path\?: string; \}\[\];/g, 'attachedFiles: { name: string; type?: string; mimeType?: string; size?: number; content?: string; data?: string; path?: string }[];');
fs.writeFileSync('src/components/modules/SidebarRight.tsx', sr);

// Fix SidebarLeft.tsx
let sl = fs.readFileSync('src/components/modules/SidebarLeft.tsx', 'utf8');
sl = sl.replace(/headlines: string\[\];/g, 'headlines?: string[];');
fs.writeFileSync('src/components/modules/SidebarLeft.tsx', sl);

// Fix App.tsx memory timestamp
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/timestamp: number;/g, 'timestamp: number | string;');
app = app.replace(/interface SystemLog/g, 'export interface SystemLog'); // reverting back just in case
fs.writeFileSync('src/App.tsx', app);
