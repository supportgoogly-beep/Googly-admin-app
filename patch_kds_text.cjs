const fs = require('fs');
let data = fs.readFileSync('src/components/KitchenDisplaySystemCRM.tsx', 'utf8');

data = data.replace(/<span className="font-bold text-stone-800">/g, '<span className="font-bold text-stone-800 dark:text-stone-200">');

fs.writeFileSync('src/components/KitchenDisplaySystemCRM.tsx', data);
