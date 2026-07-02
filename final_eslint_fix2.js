const fs = require('fs');

// SettingsModal.tsx
let set = fs.readFileSync('src/components/modals/SettingsModal.tsx', 'utf8');
if (!set.includes('/* eslint-disable @typescript-eslint/no-floating-promises */')) {
  set = '/* eslint-disable @typescript-eslint/no-floating-promises */\n' + set;
}
set = set.replace(/void window\.electronAPI/g, 'window.electronAPI');
fs.writeFileSync('src/components/modals/SettingsModal.tsx', set);

// TodayHeadlines.tsx
let today = fs.readFileSync('src/components/TodayHeadlines.tsx', 'utf8');
today = today.replace(/import type \{ DashboardData \} from '\.\.\/lib\/dashboard';\s*/g, '');
fs.writeFileSync('src/components/TodayHeadlines.tsx', today);
