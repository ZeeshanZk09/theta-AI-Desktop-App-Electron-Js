const fs = require('fs');
let code = fs.readFileSync('src/components/modules/DashboardGrid.tsx', 'utf8');

code = code.replace(/const electronAPI = \(window as any\)\.electronAPI;/g, 'const electronAPI = (window as unknown as { electronAPI: any }).electronAPI; // Wait, any is not allowed! const electronAPI = window.electronAPI;');
// Let's use window.electronAPI directly.
code = code.replace(/const electronAPI = \(window as any\)\.electronAPI;/g, 'const electronAPI = window.electronAPI;');

code = code.replace(/userProfile: any;/g, 'userProfile: import("../../types/index").UserProfile;');
code = code.replace(/dashboardSettings: any;/g, 'dashboardSettings: import("../../types/index").DashboardSettings;');
code = code.replace(/dashboardData: any;/g, 'dashboardData: import("../../types/index").DashboardData | null;');

code = code.replace(/const normalizeState = \(raw: any\): DashboardModulesState => \{/g, 'const normalizeState = (raw: Record<string, unknown> | null): DashboardModulesState => {');

code = code.replace(/const mapRef = useRef<any>\(null\);/g, 'const mapRef = useRef<import("leaflet").Map | null>(null);');
code = code.replace(/const markerLayerRef = useRef<any>\(null\);/g, 'const markerLayerRef = useRef<import("leaflet").LayerGroup | null>(null);');

code = code.replace(/catch \(error: any\)/g, 'catch (err) { const error = err as Error;');

code = code.replace(/onClick=\{\(\) => setNewsFilter\(filter as any\)\}/g, 'onClick={() => setNewsFilter(filter as "all" | "my-field" | "global" | "markets")}');

fs.writeFileSync('src/components/modules/DashboardGrid.tsx', code);
