const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(/currentTab === "riders_v3"/g, 'currentTab === "riders"');
appContent = appContent.replace(/setCurrentTab\("riders_v3"\)/g, 'setCurrentTab("riders")');
appContent = appContent.replace(/"riders_v3", "dispatch"/g, '"riders", "dispatch"');

appContent = appContent.replace(/currentTab === "orders_v3"/g, 'currentTab === "orders"');
appContent = appContent.replace(/setCurrentTab\("orders_v3"\)/g, 'setCurrentTab("orders")');
appContent = appContent.replace(/"orders_v3", "restaurants"/g, '"orders", "restaurants"');

fs.writeFileSync('src/App.tsx', appContent);
