const fs = require('fs');

let content = fs.readFileSync('src/data/mockData.ts', 'utf8');

// Replace order IDs
content = content.replace(/#00-34822/g, 'AK9P2X');
content = content.replace(/#00-34901/g, 'B7F3M1');
content = content.replace(/#00-35012/g, 'C8R2Y5');
content = content.replace(/#00-35109/g, 'D4T1Z9');
content = content.replace(/#00-35221/g, 'K9L0P3');

// Replace rider IDs
content = content.replace(/id: "729104"/g, 'id: "V8K3A2"');
content = content.replace(/id: "582109"/g, 'id: "M9X4R1"');
content = content.replace(/id: "492015"/g, 'id: "P2Q7L8"');
content = content.replace(/id: "872210"/g, 'id: "Z3H6B9"');
content = content.replace(/id: "339102"/g, 'id: "F1D8C4"');

content = content.replace(/riderId: "729104"/g, 'riderId: "V8K3A2"');
content = content.replace(/riderId: "582109"/g, 'riderId: "M9X4R1"');
content = content.replace(/riderId: "492015"/g, 'riderId: "P2Q7L8"');
content = content.replace(/riderId: "872210"/g, 'riderId: "Z3H6B9"');
content = content.replace(/riderId: "339102"/g, 'riderId: "F1D8C4"');

fs.writeFileSync('src/data/mockData.ts', content);

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(/"riders"/g, '"riders_v3"');
appContent = appContent.replace(/"orders"/g, '"orders_v3"');
fs.writeFileSync('src/App.tsx', appContent);

let dispatchContent = fs.readFileSync('src/components/DeliveryDispatchModule.tsx', 'utf8');
dispatchContent = dispatchContent.replace(/ORD-9081/g, 'A9M2C4');
dispatchContent = dispatchContent.replace(/ORD-9076/g, 'X1P8L5');
dispatchContent = dispatchContent.replace(/ORD-9071/g, 'R7G3K9');
dispatchContent = dispatchContent.replace(/ORD-9064/g, 'D4T1Z9');
dispatchContent = dispatchContent.replace(/ORD-9055/g, 'B7F3M1');

dispatchContent = dispatchContent.replace(/rider-1/g, 'V8K3A2');
dispatchContent = dispatchContent.replace(/rider-2/g, 'M9X4R1');
dispatchContent = dispatchContent.replace(/rider-3/g, 'P2Q7L8');
dispatchContent = dispatchContent.replace(/rider-4/g, 'Z3H6B9');
dispatchContent = dispatchContent.replace(/rider-5/g, 'F1D8C4');
fs.writeFileSync('src/components/DeliveryDispatchModule.tsx', dispatchContent);

let payoutContent = fs.readFileSync('src/components/PayoutsManagementCRM.tsx', 'utf8');
payoutContent = payoutContent.replace(/RIDER-901/g, 'M9X4R1');
payoutContent = payoutContent.replace(/RIDER-902/g, 'V8K3A2');
payoutContent = payoutContent.replace(/RIDER-903/g, 'Y7N2W6');
payoutContent = payoutContent.replace(/RIDER-904/g, 'H5J8Q1');
payoutContent = payoutContent.replace(/RIDER-905/g, 'K3V9C4');
payoutContent = payoutContent.replace(/RIDER-906/g, 'G2X1L8');
fs.writeFileSync('src/components/PayoutsManagementCRM.tsx', payoutContent);

let orderContent = fs.readFileSync('src/components/OrderManagementModule.tsx', 'utf8');
orderContent = orderContent.replace(/RIDER-941/g, 'B9X2Z4'); // Some random string for placeholder
fs.writeFileSync('src/components/OrderManagementModule.tsx', orderContent);

console.log('IDs patched.');
