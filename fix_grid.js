const fs = require('fs');
let code = fs.readFileSync('src/components/modules/DashboardGrid.tsx', 'utf8');

code = code.replace(/const electronAPI = \(window as any\)\.electronAPI;/g, 'const electronAPI = window.electronAPI;');
code = code.replace(/userProfile: any;/g, 'userProfile: import("../../types").UserProfile;');
code = code.replace(/dashboardSettings: any;/g, 'dashboardSettings: import("../../types").DashboardSettings;');
code = code.replace(/dashboardData: any;/g, 'dashboardData: import("../../types").DashboardData | null;');
code = code.replace(/raw: any/g, 'raw: unknown');
code = code.replace(/useRef<any>/g, 'useRef<unknown>');
code = code.replace(/catch \(error: any\)/g, 'catch (err) { const error = err as Error;');
code = code.replace(/filter as any/g, 'filter as "all" | "my-field" | "global" | "markets"');

fs.writeFileSync('src/components/modules/DashboardGrid.tsx', code);
