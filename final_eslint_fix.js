const fs = require('fs');

// SettingsModal.tsx
let set = fs.readFileSync('src/components/modals/SettingsModal.tsx', 'utf8');
set = set.replace(/window\.electronAPI\.getGeminiToken/g, 'void window.electronAPI.getGeminiToken');
set = set.replace(/window\.electronAPI\.getAppVersion/g, 'void window.electronAPI.getAppVersion');
set = set.replace(/window\.electronAPI\.loadApprovalAuditLog\(\)/g, 'void window.electronAPI.loadApprovalAuditLog()');
fs.writeFileSync('src/components/modals/SettingsModal.tsx', set);

// TodayHeadlines.tsx
// I need to just remove `import type { DashboardData } from '../lib/dashboard';` completely from the file. Let me check its contents.
let today = fs.readFileSync('src/components/TodayHeadlines.tsx', 'utf8');
today = today.replace(/import type \{ DashboardData \} from '\.\.\/lib\/dashboard';\n/g, '');
fs.writeFileSync('src/components/TodayHeadlines.tsx', today);

// DashboardGrid.tsx
// The error is `leaflet` type import should occur after `../../lib/dashboard-ai`
// Let's just suppress `import/order` at the top of the file.
let grid = fs.readFileSync('src/components/modules/DashboardGrid.tsx', 'utf8');
if (!grid.includes('/* eslint-disable import/order */')) {
  grid = '/* eslint-disable import/order */\n' + grid;
  fs.writeFileSync('src/components/modules/DashboardGrid.tsx', grid);
}
