const fs = require('fs');

const files = [
  'src/components/DeliveryDispatchModule.tsx',
  'src/components/OrderManagementModule.tsx',
  'src/components/RiderManagementModule.tsx'
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');

  // Replace all text-gray-300 and text-gray-400 without a dark: variant to have the dark variant and be darker by default
  content = content.replace(/(?<!dark:)text-gray-300(?! dark:)/g, 'text-gray-700 dark:text-gray-300');
  content = content.replace(/(?<!dark:)text-gray-400(?! dark:)/g, 'text-gray-700 dark:text-gray-400');
  content = content.replace(/(?<!dark:)text-gray-450(?! dark:)/g, 'text-gray-700 dark:text-gray-400');
  
  content = content.replace(/(?<!dark:)text-stone-300(?! dark:)/g, 'text-stone-700 dark:text-stone-300');
  content = content.replace(/(?<!dark:)text-stone-400(?! dark:)/g, 'text-stone-700 dark:text-stone-400');
  
  // Specific order ID in DeliveryDispatchModule
  content = content.replace(/text-rose-500 text-\[11px\]/g, 'text-rose-600 dark:text-rose-500 text-[11px]');
  // Also order list
  content = content.replace(/text-gray-600 dark:text-gray-400/g, 'text-gray-700 dark:text-gray-400');

  // And in OrderManagement
  content = content.replace(/text-gray-600 dark:text-gray-400 font-normal/g, 'text-gray-800 dark:text-gray-400 font-medium');

  fs.writeFileSync(f, content);
}
console.log('Fixed visibility!');
