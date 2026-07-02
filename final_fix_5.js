const fs = require('fs');

// Fix DashboardGrid.tsx
let grid = fs.readFileSync('src/components/modules/DashboardGrid.tsx', 'utf8');
grid = grid.replace(/if \(!approval\?\.approved\) \{/g, 'if (!approval) {');
fs.writeFileSync('src/components/modules/DashboardGrid.tsx', grid);

// Fix TodayHeadlines.tsx
let th = fs.readFileSync('src/components/TodayHeadlines.tsx', 'utf8');
th = th.replace(/data: import\("\.\.\/types"\)\.DashboardData \| null;/g, 'data: {\n        headlines?: string[];\n        weather?: {\n            today?: string;\n            tomorrow?: string;\n            dayAfter?: string;\n        };\n    } | null;');
// We also have error TS7006: Parameter 'headline' implicitly has an 'any' type.
th = th.replace(/headlines\.map\(\(headline, idx\) => \(/g, 'headlines.map((headline: string, idx: number) => (');
th = th.replace(/data\?\.headlines\?\.map\(\(headline, idx\) => \(/g, '(data?.headlines || []).map((headline: string, idx: number) => (');
fs.writeFileSync('src/components/TodayHeadlines.tsx', th);
