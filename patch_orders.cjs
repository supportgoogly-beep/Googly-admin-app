const fs = require('fs');

let data = fs.readFileSync('src/data/mockData.ts', 'utf8');

data = data.replace(
  /orderTime:/g, 
  'paymentMethod: "UPI",\n    paymentStatus: "Paid",\n    deliveryType: "Standard Delivery",\n    currentTrackerIndex: 2,\n    orderTime:'
);

fs.writeFileSync('src/data/mockData.ts', data);
