const fs = require('fs');

const path = 'src/components/DeliveryDispatchModule.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace(/text-gray-700 dark:text-gray-700 dark:text-gray-300/g, 'text-gray-700 dark:text-gray-300');
fs.writeFileSync(path, content);
console.log('Fixed double dark text classes.');
