const fs = require('fs');

const files = [
  'src/components/AreaManagement.tsx',
  'src/components/GeofencingManagementSystem.tsx',
  'src/components/OSMInteractiveMap.tsx',
  'src/components/WorkspaceDashboard.tsx',
  'src/components/geofencing/GeofencingZoneConfigPanel.tsx'
];

for (const file of files) {
  let text = fs.readFileSync(file, 'utf8');
  if (!text.includes('fetchWrapper')) continue;
  if (!text.includes('import { fetchWrapper }') && !text.includes('import { getApiUrl, fetchWrapper }')) {
    // Add import statement at the top. Find the last import.
    text = `import { fetchWrapper } from "../lib/api";\n` + text.replace(/import { fetchWrapper } from "\.\.\/lib\/api";\n/, '');
  }
  fs.writeFileSync(file, text);
}
console.log("Imports added");
