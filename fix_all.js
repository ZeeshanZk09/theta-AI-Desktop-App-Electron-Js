const fs = require('fs');

let grid = fs.readFileSync('src/components/modules/DashboardGrid.tsx', 'utf8');
grid = grid.replace(/const electronAPI = \(window as any\)\.electronAPI;/g, 'const electronAPI = (window as unknown as { electronAPI: NonNullable<import("../../types/global").Window["electronAPI"]> }).electronAPI;');
grid = grid.replace(/userProfile: any;/g, 'userProfile: import("../../types/index").UserProfile;');
grid = grid.replace(/dashboardSettings: any;/g, 'dashboardSettings: import("../../types/index").DashboardSettings;');
grid = grid.replace(/dashboardData: any;/g, 'dashboardData: import("../../types/index").DashboardData | null;');

grid = grid.replace(/const normalizeState = \(raw: any\): DashboardModulesState => \{/g, 'const normalizeState = (raw: Record<string, unknown> | null): DashboardModulesState => {');

grid = grid.replace(/Array\.isArray\(raw\?\.businessIdeas\?\.ideas\)/g, 'Array.isArray((raw?.businessIdeas as Record<string, unknown>)?.ideas)');
grid = grid.replace(/raw\.businessIdeas\.ideas/g, '((raw.businessIdeas as Record<string, unknown>).ideas as import("../../lib/dashboard-ai").BusinessIdea[])');

grid = grid.replace(/Array\.isArray\(raw\?\.worldIntelligence\?\.events\)/g, 'Array.isArray((raw?.worldIntelligence as Record<string, unknown>)?.events)');
grid = grid.replace(/raw\.worldIntelligence\.events/g, '((raw.worldIntelligence as Record<string, unknown>).events as import("../../lib/dashboard-ai").WorldEvent[])');

grid = grid.replace(/Array\.isArray\(raw\?\.worldIntelligence\?\.stories\)/g, 'Array.isArray((raw?.worldIntelligence as Record<string, unknown>)?.stories)');
grid = grid.replace(/raw\.worldIntelligence\.stories/g, '((raw.worldIntelligence as Record<string, unknown>).stories as import("../../lib/dashboard-ai").NewsStory[])');

grid = grid.replace(/Array\.isArray\(raw\?\.worldIntelligence\?\.trends\)/g, 'Array.isArray((raw?.worldIntelligence as Record<string, unknown>)?.trends)');
grid = grid.replace(/raw\.worldIntelligence\.trends/g, '((raw.worldIntelligence as Record<string, unknown>).trends as import("../../lib/dashboard-ai").MarketTrend[])');

grid = grid.replace(/Array\.isArray\(raw\?\.linkedinDrafts\?\.drafts\)/g, 'Array.isArray((raw?.linkedinDrafts as Record<string, unknown>)?.drafts)');
grid = grid.replace(/raw\.linkedinDrafts\.drafts\.map/g, '((raw.linkedinDrafts as Record<string, unknown>).drafts as import("../../lib/dashboard-ai").LinkedInDraft[]).map');

grid = grid.replace(/const mapRef = useRef<any>\(null\);/g, 'const mapRef = useRef<import("leaflet").Map | null>(null);');
grid = grid.replace(/const markerLayerRef = useRef<any>\(null\);/g, 'const markerLayerRef = useRef<import("leaflet").LayerGroup | null>(null);');

grid = grid.replace(/catch \(error: any\)/g, 'catch (err) { const error = err as Error;');
grid = grid.replace(/onClick=\{\(\) => setNewsFilter\(filter as any\)\}/g, 'onClick={() => setNewsFilter(filter as "all" | "my-field" | "global" | "markets")}');

grid = grid.replace(/mapRef\.current\.hasLayer/g, 'mapRef.current?.hasLayer');
grid = grid.replace(/mapRef\.current\.removeLayer/g, 'mapRef.current?.removeLayer');
grid = grid.replace(/L\.map/g, '(window as unknown as { L: typeof import("leaflet") }).L.map');
grid = grid.replace(/markerLayerRef\.current\.clearLayers/g, 'markerLayerRef.current?.clearLayers');

fs.writeFileSync('src/components/modules/DashboardGrid.tsx', grid);

let sr = fs.readFileSync('src/components/modules/SidebarRight.tsx', 'utf8');
sr = sr.replace(/logs: \{ timestamp: string, type: 'info' \| 'warn' \| 'error' \| 'user' \| 'ai' \| 'tool', message: string \} \[\];/g, 'logs: import("../../App").SystemLog[];');
sr = sr.replace(/attachedFiles: \{ name: string, type: string, size\?: number, content\?: string \} \[\];/g, 'attachedFiles: { name: string; data: string; mimeType: string; path?: string; }[];');
fs.writeFileSync('src/components/modules/SidebarRight.tsx', sr);

let sl = fs.readFileSync('src/components/modules/SidebarLeft.tsx', 'utf8');
sl = sl.replace(/dashboardData: unknown \| null;/g, 'dashboardData: import("../../types/index").DashboardData | null;');
fs.writeFileSync('src/components/modules/SidebarLeft.tsx', sl);

let indexTS = fs.readFileSync('src/types/index.ts', 'utf8');
indexTS = indexTS.replace(/timestamp\?: number;/g, 'timestamp: number;'); // For Memory
fs.writeFileSync('src/types/index.ts', indexTS);
