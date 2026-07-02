const fs = require('fs');
let code = fs.readFileSync('src/components/modules/DashboardGrid.tsx', 'utf8');

code = code.replace(/catch \(error: any\) \{/g, 'catch (err) { const error = err as Error;');

fs.writeFileSync('src/components/modules/DashboardGrid.tsx', code);
