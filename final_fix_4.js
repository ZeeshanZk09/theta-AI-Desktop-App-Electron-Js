const fs = require('fs');

// TodayHeadlines.tsx
let th = fs.readFileSync('src/components/TodayHeadlines.tsx', 'utf8');
th = th.replace(/data: \{\s*headlines\?: string\[\];\s*weather: \{\s*today: string;\s*tomorrow: string;\s*dayAfter: string;\s*\};\s*\} \| null;/g, 'data: import("../types").DashboardData | null;'); // Note: inline import works here for typing, but I should use standard imports.
// Let's replace the whole interface definition
th = th.replace(/interface TodayHeadlinesProps \{[\s\S]*?\}\s*\} \| null;/g, 'interface TodayHeadlinesProps {\n    data: import("../types").DashboardData | null;');
// Wait, no inline imports.
th = th.replace(/interface TodayHeadlinesProps \{[\s\S]*?\} \| null;/g, 'interface TodayHeadlinesProps {\n    data: {\n        headlines?: string[];\n        weather?: {\n            today?: string;\n            tomorrow?: string;\n            dayAfter?: string;\n        };\n    } | null;');
th = th.replace(/data\.headlines\.length/g, '(data?.headlines?.length || 0)');
th = th.replace(/data\.headlines\[/g, '(data?.headlines || [])[');
fs.writeFileSync('src/components/TodayHeadlines.tsx', th);

// DashboardGrid.tsx
let grid = fs.readFileSync('src/components/modules/DashboardGrid.tsx', 'utf8');
grid = grid.replace(/\.addTo\(markerLayerRef\.current\);/g, '.addTo(markerLayerRef.current!);');
grid = grid.replace(/if \(error\.approved === false \|\| error\.message\.includes\("declined"\)\) \{/g, 'if (error.message.includes("declined")) {');
fs.writeFileSync('src/components/modules/DashboardGrid.tsx', grid);

