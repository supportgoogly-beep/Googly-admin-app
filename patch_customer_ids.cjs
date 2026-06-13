const fs = require('fs');
let content = fs.readFileSync('src/data/mockData.ts', 'utf8');

// Replace remaining "user-1", "user-2", "user-3", "user-4"
content = content.replace(/user-1/g, '1234567');
content = content.replace(/user-2/g, '2345678');
content = content.replace(/user-3/g, '3456789');
content = content.replace(/user-4/g, '4567890');

fs.writeFileSync('src/data/mockData.ts', content);

// Also look up UserManagementModule to see if any ID is mocked there
let ummContent = fs.readFileSync('src/components/UserManagementModule.tsx', 'utf8');
ummContent = ummContent.replace(/user-1/g, '1234567');
ummContent = ummContent.replace(/user-2/g, '2345678');
ummContent = ummContent.replace(/user-3/g, '3456789');
ummContent = ummContent.replace(/user-4/g, '4567890');

// Replace "Generate unique UID" logic if it generates something else.
ummContent = ummContent.replace(/const generatedId = `user-\$\{.*?\}`;/, 'const generatedId = `${Math.floor(1000000 + Math.random() * 9000000)}`;');

fs.writeFileSync('src/components/UserManagementModule.tsx', ummContent);

console.log('Customer IDs patched everywhere.');
