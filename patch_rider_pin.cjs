const fs = require('fs');

let rmdContent = fs.readFileSync('src/components/RiderManagementModule.tsx', 'utf8');
rmdContent = rmdContent.replace(/riders=\{\[trackingRider\]\}/, 'riders={trackingRider ? [{...trackingRider, x: mapMovingPin.x, y: mapMovingPin.y}] : []}');
fs.writeFileSync('src/components/RiderManagementModule.tsx', rmdContent);
console.log('Fixed dynamic tracking rider pin.');
