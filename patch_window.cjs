const fs = require('fs');
let data = fs.readFileSync('src/components/CoreOperations.tsx', 'utf8');

data = data.replace(/window\.uploadTarget/g, '(window as any).uploadTarget');

fs.writeFileSync('src/components/CoreOperations.tsx', data);
