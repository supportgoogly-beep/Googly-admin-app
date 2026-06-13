const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');

appContent = appContent.replace(/getStoredData\("users",/g, 'getStoredData("users_v2",');
appContent = appContent.replace(/saveStoredData\("users",/g, 'saveStoredData("users_v2",');

appContent = appContent.replace(/getStoredData\("orders",/g, 'getStoredData("orders_v4",');
appContent = appContent.replace(/saveStoredData\("orders",/g, 'saveStoredData("orders_v4",');

// Wait, I did replace "riders_v3" with "riders" earlier which I shouldn't have? Let's just do v4 for all to be clean
appContent = appContent.replace(/getStoredData\("riders",/g, 'getStoredData("riders_v4",');
appContent = appContent.replace(/saveStoredData\("riders",/g, 'saveStoredData("riders_v4",');

fs.writeFileSync('src/App.tsx', appContent);
console.log('App.tsx keys patched.');
