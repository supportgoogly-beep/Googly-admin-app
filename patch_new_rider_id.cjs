const fs = require('fs');

let rmdContent = fs.readFileSync('src/components/RiderManagementModule.tsx', 'utf8');
rmdContent = rmdContent.replace(/const generatedId = `RD-\$\{.*?\}`;/, `const generateAlphanumericId = (l: number = 6) => Array.from({length: l}, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(Math.floor(Math.random() * 36))).join('');
    const generatedId = generateAlphanumericId(6);`);
fs.writeFileSync('src/components/RiderManagementModule.tsx', rmdContent);
console.log('Fixed newly created Rider IDs in RiderManagementModule.');
