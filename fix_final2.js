const fs = require('fs');

let grid = fs.readFileSync('src/components/modules/DashboardGrid.tsx', 'utf8');

// Ensure leaflet imports are at the top without inline types
if (!grid.includes('import type { Map as LeafletMap, LayerGroup }')) {
  grid = grid.replace("import 'leaflet/dist/leaflet.css';", "import 'leaflet/dist/leaflet.css';\nimport type { Map as LeafletMap, LayerGroup } from 'leaflet';\nimport type { BusinessIdea, WorldEvent, NewsStory, MarketTrend, LinkedInDraft } from '../../lib/dashboard-ai';\nimport type { LinkedInQueueItem, LinkedInHistoryItem } from '../../types';");
}

grid = grid.replace(/const mapRef = useRef<Record<string, unknown> \| null>\(null\);/g, 'const mapRef = useRef<LeafletMap | null>(null);');
grid = grid.replace(/const markerLayerRef = useRef<Record<string, unknown> \| null>\(null\);/g, 'const markerLayerRef = useRef<LayerGroup | null>(null);');

// Fix raw? access
grid = grid.replace(/\(\(raw \|\| \{\}\)\?\.businessIdeas as Record<string, unknown>\)\?\.ideas/g, '((raw || {}) as { businessIdeas?: { ideas?: BusinessIdea[] } })?.businessIdeas?.ideas');
grid = grid.replace(/\(\(raw \|\| \{\}\)\.businessIdeas as Record<string, unknown>\)\.ideas as BusinessIdea\[\]/g, '((raw || {}) as { businessIdeas: { ideas: BusinessIdea[] } }).businessIdeas.ideas');

grid = grid.replace(/\(\(raw \|\| \{\}\)\?\.worldIntelligence as Record<string, unknown>\)\?\.events/g, '((raw || {}) as { worldIntelligence?: { events?: WorldEvent[] } })?.worldIntelligence?.events');
grid = grid.replace(/\(\(raw \|\| \{\}\)\.worldIntelligence as Record<string, unknown>\)\.events as WorldEvent\[\]/g, '((raw || {}) as { worldIntelligence: { events: WorldEvent[] } }).worldIntelligence.events');

grid = grid.replace(/\(\(raw \|\| \{\}\)\?\.worldIntelligence as Record<string, unknown>\)\?\.stories/g, '((raw || {}) as { worldIntelligence?: { stories?: NewsStory[] } })?.worldIntelligence?.stories');
grid = grid.replace(/\(\(raw \|\| \{\}\)\.worldIntelligence as Record<string, unknown>\)\.stories as NewsStory\[\]/g, '((raw || {}) as { worldIntelligence: { stories: NewsStory[] } }).worldIntelligence.stories');

grid = grid.replace(/\(\(raw \|\| \{\}\)\?\.worldIntelligence as Record<string, unknown>\)\?\.trends/g, '((raw || {}) as { worldIntelligence?: { trends?: MarketTrend[] } })?.worldIntelligence?.trends');
grid = grid.replace(/\(\(raw \|\| \{\}\)\.worldIntelligence as Record<string, unknown>\)\.trends as MarketTrend\[\]/g, '((raw || {}) as { worldIntelligence: { trends: MarketTrend[] } }).worldIntelligence.trends');

grid = grid.replace(/\(\(raw \|\| \{\}\)\?\.linkedinDrafts as Record<string, unknown>\)\?\.drafts/g, '((raw || {}) as { linkedinDrafts?: { drafts?: LinkedInDraft[] } })?.linkedinDrafts?.drafts');
grid = grid.replace(/\(\(raw \|\| \{\}\)\.linkedinDrafts as Record<string, unknown>\)\.drafts as LinkedInDraft\[\]\)\.map/g, '((raw || {}) as { linkedinDrafts: { drafts: LinkedInDraft[] } }).linkedinDrafts.drafts).map');

// Fix Map errors
grid = grid.replace(/\(mapRef\.current as Record<string, unknown>\)\?\.hasLayer/g, 'mapRef.current?.hasLayer');
grid = grid.replace(/\(mapRef\.current as Record<string, unknown>\)\?\.removeLayer/g, 'mapRef.current?.removeLayer');
grid = grid.replace(/\(window as unknown as \{ L: \{ map: unknown \} \}\)\.L\.map/g, '(window as unknown as { L: { map: (el: HTMLElement, opts: unknown) => LeafletMap } }).L.map');
grid = grid.replace(/\(markerLayerRef\.current as Record<string, unknown>\)\?\.clearLayers/g, 'markerLayerRef.current?.clearLayers');

// Fix electronAPI argument types
grid = grid.replace(/electronAPI\.httpFetch as \(url: string, opts: unknown\) => Promise<\{data: unknown\}>/g, 'electronAPI.httpFetch as (url: string, opts?: unknown) => Promise<{data: unknown}>');

grid = grid.replace(/\(electronAPI\.sendNotification as \(payload: unknown\)/g, '(electronAPI.sendNotification as (payload: {title: string; body: string})');
grid = grid.replace(/\(electronAPI\.saveDashboardModulesState as \(payload: unknown\)/g, '(electronAPI.saveDashboardModulesState as (payload: Record<string, unknown>)');
grid = grid.replace(/\(electronAPI\.saveLinkedInQueue as \(payload: unknown\)/g, '(electronAPI.saveLinkedInQueue as (payload: LinkedInQueueItem[])');
grid = grid.replace(/\(electronAPI\.saveLinkedInHistory as \(payload: unknown\)/g, '(electronAPI.saveLinkedInHistory as (payload: LinkedInHistoryItem[])');

grid = grid.replace(/\(electronAPI\.requestActionApproval as \(payload: unknown\)/g, '(electronAPI.requestActionApproval as (payload: { id: string; action: string; details: string; risk: "green" | "yellow" | "red" })');
grid = grid.replace(/\(electronAPI\.keyboardType as \(payload: unknown\)/g, '(electronAPI.keyboardType as (payload: { text: string; pressEnter?: boolean })');
grid = grid.replace(/\(electronAPI\.keyboardPress as \(payload: unknown\)/g, '(electronAPI.keyboardPress as (payload: { key: string })');
grid = grid.replace(/\(electronAPI\.writeClipboard as \(payload: unknown\)/g, '(electronAPI.writeClipboard as (payload: { text: string })');

fs.writeFileSync('src/components/modules/DashboardGrid.tsx', grid);

// Fix App.tsx memory timestamp
let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/export interface Memory \{/g, 'export interface Memory {\n  id: string;\n  content: string;\n  timestamp: number | string;\n  category?: string;'); 
// It might duplicate so let's revert App.tsx and fix it correctly
app = app.replace(/timestamp: number \| string;\n  category\?: string;/g, 'timestamp: number | string;\n  category?: string;'); 
fs.writeFileSync('src/App.tsx', app);
