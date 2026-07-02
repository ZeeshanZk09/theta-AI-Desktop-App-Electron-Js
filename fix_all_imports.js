const fs = require('fs');

// MemoryModal.tsx
let mm = fs.readFileSync('src/components/modals/MemoryModal.tsx', 'utf8');
mm = mm.replace('import { useAudio } from "../../hooks/useAudio";', 'import { useAudio } from "../../hooks/useAudio";\nimport type { Memory } from "../../types/index";');
mm = mm.replace(/memories: \{[\s\S]*?\}\[\];/g, 'memories: Memory[];');
fs.writeFileSync('src/components/modals/MemoryModal.tsx', mm);

// SidebarRight.tsx
let sr = fs.readFileSync('src/components/modules/SidebarRight.tsx', 'utf8');
if (!sr.includes('import type { Message }')) {
  sr = sr.replace("import { ConnectionStatus } from '../../types';", "import { ConnectionStatus } from '../../types';\nimport type { Message } from '../../types/index';\nimport type { SystemLog } from '../../App';");
}
sr = sr.replace(/messages: import\('\.\.\/\.\.\/types'\)\.Message\[\];/g, 'messages: Message[];');
sr = sr.replace(/logs: import\('\.\.\/\.\.\/App'\)\.SystemLog\[\];/g, 'logs: SystemLog[];');
fs.writeFileSync('src/components/modules/SidebarRight.tsx', sr);

// SidebarLeft.tsx
let sl = fs.readFileSync('src/components/modules/SidebarLeft.tsx', 'utf8');
if (!sl.includes('import type { DashboardData }')) {
  sl = sl.replace("import { useAudio } from '../../hooks/useAudio';", "import { useAudio } from '../../hooks/useAudio';\nimport type { DashboardData } from '../../types/index';");
}
sl = sl.replace(/dashboardData: import\('\.\.\/\.\.\/types\/index'\)\.DashboardData \| null;/g, 'dashboardData: DashboardData | null;');
fs.writeFileSync('src/components/modules/SidebarLeft.tsx', sl);

// DashboardGrid.tsx
let grid = fs.readFileSync('src/components/modules/DashboardGrid.tsx', 'utf8');
if (!grid.includes('import type { UserProfile')) {
  grid = grid.replace("import 'leaflet/dist/leaflet.css';", "import 'leaflet/dist/leaflet.css';\nimport type { UserProfile, DashboardSettings, DashboardData } from '../../types/index';\nimport type { Map as LeafletMap, LayerGroup } from 'leaflet';\nimport type { Window as GlobalWindow } from '../../types/global';");
}

grid = grid.replace(/userProfile: import\("\.\.\/\.\.\/types\/index"\)\.UserProfile;/g, 'userProfile: UserProfile;');
grid = grid.replace(/dashboardSettings: import\("\.\.\/\.\.\/types\/index"\)\.DashboardSettings;/g, 'dashboardSettings: DashboardSettings;');
grid = grid.replace(/dashboardData: import\("\.\.\/\.\.\/types\/index"\)\.DashboardData \| null;/g, 'dashboardData: DashboardData | null;');

grid = grid.replace(/const mapRef = useRef<import\("leaflet"\)\.Map \| null>\(null\);/g, 'const mapRef = useRef<LeafletMap | null>(null);');
grid = grid.replace(/const markerLayerRef = useRef<import\("leaflet"\)\.LayerGroup \| null>\(null\);/g, 'const markerLayerRef = useRef<LayerGroup | null>(null);');

grid = grid.replace(/const electronAPI = \(window as unknown as \{ electronAPI: NonNullable<import\("\.\.\/\.\.\/types\/global"\)\.Window\["electronAPI"\]> \}\)\.electronAPI;/g, 'const electronAPI = (window as unknown as { electronAPI: NonNullable<GlobalWindow["electronAPI"]> }).electronAPI;');

grid = grid.replace(/as import\("\.\.\/\.\.\/lib\/dashboard-ai"\)\.BusinessIdea\[\]/g, 'as BusinessIdea[]');
grid = grid.replace(/as import\("\.\.\/\.\.\/lib\/dashboard-ai"\)\.WorldEvent\[\]/g, 'as WorldEvent[]');
grid = grid.replace(/as import\("\.\.\/\.\.\/lib\/dashboard-ai"\)\.NewsStory\[\]/g, 'as NewsStory[]');
grid = grid.replace(/as import\("\.\.\/\.\.\/lib\/dashboard-ai"\)\.MarketTrend\[\]/g, 'as MarketTrend[]');
grid = grid.replace(/as import\("\.\.\/\.\.\/lib\/dashboard-ai"\)\.LinkedInDraft\[\]/g, 'as LinkedInDraft[]');
grid = grid.replace(/typeof import\("leaflet"\)/g, 'any'); // Leaflet L object

fs.writeFileSync('src/components/modules/DashboardGrid.tsx', grid);

