const fs = require('fs');

// Fix DashboardGrid.tsx
let grid = fs.readFileSync('src/components/modules/DashboardGrid.tsx', 'utf8');

grid = grid.replace(/raw: unknown/g, 'raw: Record<string, unknown> | null');
grid = grid.replace(/const mapRef = useRef<unknown>\(null\);/g, 'const mapRef = useRef<import("leaflet").Map | null>(null);');
grid = grid.replace(/const markerLayerRef = useRef<unknown>\(null\);/g, 'const markerLayerRef = useRef<import("leaflet").LayerGroup | null>(null);');
grid = grid.replace(/const electronAPI = window\.electronAPI;/g, 'const electronAPI = (window as unknown as { electronAPI: NonNullable<import("../../types/global").Window["electronAPI"]> }).electronAPI;');

grid = grid.replace(/Array.isArray\(raw\?\.businessIdeas\?\.ideas\)/g, 'Array.isArray((raw?.businessIdeas as Record<string, unknown>)?.ideas)');
grid = grid.replace(/raw\.businessIdeas\.ideas/g, '((raw.businessIdeas as Record<string, unknown>).ideas as import("../../lib/dashboard-ai").BusinessIdea[])');
grid = grid.replace(/Array.isArray\(raw\?\.worldIntelligence\?\.events\)/g, 'Array.isArray((raw?.worldIntelligence as Record<string, unknown>)?.events)');
grid = grid.replace(/raw\.worldIntelligence\.events/g, '((raw.worldIntelligence as Record<string, unknown>).events as import("../../lib/dashboard-ai").WorldEvent[])');
grid = grid.replace(/Array.isArray\(raw\?\.worldIntelligence\?\.stories\)/g, 'Array.isArray((raw?.worldIntelligence as Record<string, unknown>)?.stories)');
grid = grid.replace(/raw\.worldIntelligence\.stories/g, '((raw.worldIntelligence as Record<string, unknown>).stories as import("../../lib/dashboard-ai").NewsStory[])');
grid = grid.replace(/Array.isArray\(raw\?\.worldIntelligence\?\.trends\)/g, 'Array.isArray((raw?.worldIntelligence as Record<string, unknown>)?.trends)');
grid = grid.replace(/raw\.worldIntelligence\.trends/g, '((raw.worldIntelligence as Record<string, unknown>).trends as import("../../lib/dashboard-ai").MarketTrend[])');
grid = grid.replace(/Array.isArray\(raw\?\.linkedinDrafts\?\.drafts\)/g, 'Array.isArray((raw?.linkedinDrafts as Record<string, unknown>)?.drafts)');
grid = grid.replace(/raw\.linkedinDrafts\.drafts\.map/g, '((raw.linkedinDrafts as Record<string, unknown>).drafts as import("../../lib/dashboard-ai").LinkedInDraft[]).map');

// Fix Map errors
grid = grid.replace(/mapRef\.current\.hasLayer/g, 'mapRef.current?.hasLayer');
grid = grid.replace(/mapRef\.current\.removeLayer/g, 'mapRef.current?.removeLayer');
grid = grid.replace(/L\.map/g, '(window as unknown as { L: import("leaflet") }).L.map');
grid = grid.replace(/markerLayerRef\.current\.clearLayers/g, 'markerLayerRef.current?.clearLayers');

fs.writeFileSync('src/components/modules/DashboardGrid.tsx', grid);

// Fix SidebarRight.tsx
let sr = fs.readFileSync('src/components/modules/SidebarRight.tsx', 'utf8');
sr = sr.replace(/logs: \{ timestamp: string, type: 'info' \| 'warn' \| 'error' \| 'user' \| 'ai' \| 'tool', message: string \} \[\];/g, 'logs: import("../../App").SystemLog[];');
sr = sr.replace(/attachedFiles: \{ name: string, type: string, size\?: number, content\?: string \} \[\];/g, 'attachedFiles: { name: string; data: string; mimeType: string; path?: string; }[];');
fs.writeFileSync('src/components/modules/SidebarRight.tsx', sr);

// Fix SidebarLeft.tsx
let sl = fs.readFileSync('src/components/modules/SidebarLeft.tsx', 'utf8');
sl = sl.replace(/dashboardData: unknown \| null;/g, 'dashboardData: import("../../types/index").DashboardData | null;');
fs.writeFileSync('src/components/modules/SidebarLeft.tsx', sl);

// Fix App.tsx memory timestamp
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/export interface Memory \{/g, 'export interface Memory {'); 
fs.writeFileSync('src/App.tsx', app);
