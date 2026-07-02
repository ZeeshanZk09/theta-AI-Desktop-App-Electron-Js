const fs = require('fs');

// SidebarRight.tsx
let sr = fs.readFileSync('src/components/modules/SidebarRight.tsx', 'utf8');
sr = sr.replace(/import type \{ SystemLog \} from "\.\.\/\.\.\/App";/g, 'import type { SystemLog } from "../../types/gemini-live";');
sr = sr.replace(/attachedFiles: \{ name: string; data: string; mimeType: string; path\?: string \}\[\];/g, 'attachedFiles: { name: string; data?: string; mimeType?: string; path?: string; type?: string; size?: number; content?: string }[];');
fs.writeFileSync('src/components/modules/SidebarRight.tsx', sr);

// SidebarLeft.tsx
let sl = fs.readFileSync('src/components/modules/SidebarLeft.tsx', 'utf8');
sl = sl.replace(/headlines: string\[\];/g, 'headlines?: string[];');
fs.writeFileSync('src/components/modules/SidebarLeft.tsx', sl);

// App.tsx
// Make sure logs are properly handled. The error was: Type 'SystemLog[]' is not assignable to type '{ timestamp: string; type: "user" | ...'
// It is because SidebarRight was still using the inline object type `{ timestamp: string; type: "info" | "warn"... }` when I compiled last time!
// But I fixed that in fix_all_imports! Wait, fix_all_imports replaced the inline type with `SystemLog[]`, but earlier TS error still complained.
// If SidebarRight has `logs: SystemLog[]`, then the error in App.tsx shouldn't happen, as App.tsx passes `logs` which is `SystemLog[]` from `useGeminiLive`.

// Let's ensure SidebarRight has `logs: SystemLog[];`
if (sr.includes('logs: {')) {
  sr = sr.replace(/logs: \{[\s\S]*?\}\[\];/g, 'logs: SystemLog[];');
  fs.writeFileSync('src/components/modules/SidebarRight.tsx', sr);
}

// DashboardGrid.tsx (Leaflet fixes)
let grid = fs.readFileSync('src/components/modules/DashboardGrid.tsx', 'utf8');
grid = grid.replace(/import type \{ BusinessIdea/g, "import type { Map as LeafletMap, LayerGroup } from 'leaflet';\nimport type { BusinessIdea");
grid = grid.replace(/interface LeafletMarker/g, ''); // cleanup if any
const markerInterface = `
interface LeafletMarker {
  bindPopup: (html: string) => LeafletMarker;
  addTo: (layer: LayerGroup) => LeafletMarker;
  on: (event: string, callback: () => void) => LeafletMarker;
}
`;
if (!grid.includes('interface LeafletMarker')) {
  grid = grid.replace("import type { LinkedInQueueItem", "import type { LinkedInQueueItem" + markerInterface);
}

// Fix mapRef L
grid = grid.replace(/L: \{ circleMarker: \([^)]*\) => \{ bindPopup: \([^)]*\) => \{ addTo: \([^)]*\) => void \} \} \}/g, 'L: { circleMarker: (pos: [number, number], opts: Record<string, unknown>) => LeafletMarker }');
fs.writeFileSync('src/components/modules/DashboardGrid.tsx', grid);

