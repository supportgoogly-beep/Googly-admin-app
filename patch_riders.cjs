const fs = require('fs');

let data = fs.readFileSync('src/data/mockData.ts', 'utf8');

data = data.replace(/"rider-1"/g, '"729104"');
data = data.replace(/"rider-2"/g, '"582109"');
data = data.replace(/"rider-3"/g, '"492015"');
data = data.replace(/"rider-4"/g, '"392817"');

fs.writeFileSync('src/data/mockData.ts', data);
