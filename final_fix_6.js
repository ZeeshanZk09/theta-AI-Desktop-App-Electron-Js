const fs = require('fs');

let th = fs.readFileSync('src/components/TodayHeadlines.tsx', 'utf8');

// Fix data.headlines
th = th.replace(/data\.headlines\.map/g, '(data.headlines || []).map');
th = th.replace(/data\.weather\.today/g, 'data.weather?.today');
th = th.replace(/data\.weather\.tomorrow/g, 'data.weather?.tomorrow');
th = th.replace(/data\.weather\.dayAfter/g, 'data.weather?.dayAfter');

fs.writeFileSync('src/components/TodayHeadlines.tsx', th);
