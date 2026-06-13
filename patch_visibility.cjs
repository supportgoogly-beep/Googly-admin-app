const fs = require('fs');
let data = fs.readFileSync('src/components/DeliveryDispatchModule.tsx', 'utf8');

data = data.replace(/<td className="p-3 font-bold text-gray-300 dark:text-slate-100">/g, '<td className="p-3 font-bold text-gray-800 dark:text-slate-100">');
data = data.replace(/<td className="p-3 text-gray-300 font-mono">/g, '<td className="p-3 text-gray-800 dark:text-gray-300 font-mono">');
data = data.replace(/<td className="p-3 text-gray-400 font-mono">/g, '<td className="p-3 text-gray-600 dark:text-gray-400 font-mono">');

fs.writeFileSync('src/components/DeliveryDispatchModule.tsx', data);
