const fs = require('fs');

function patch(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  content = content.replace(/import \{ getApiUrl \} from "\.\/lib\/api";/g, 'import { getApiUrl, fetchWrapper } from "./lib/api";');
  content = content.replace(/import \{ getApiUrl \} from "\.\.\/lib\/api";/g, 'import { getApiUrl, fetchWrapper } from "../lib/api";');
  content = content.replace(/await fetch\(/g, 'await fetchWrapper(');
  fs.writeFileSync(filePath, content);
}

patch('src/App.tsx');
patch('src/components/RbacSettingsDashboard.tsx');
patch('src/components/GeofencingManagementSystem.tsx');
patch('src/components/OSMInteractiveMap.tsx');
patch('src/components/WorkspaceDashboard.tsx');
patch('src/components/geofencing/GeofencingZoneConfigPanel.tsx');
patch('src/components/AreaManagement.tsx');

console.log("Patched");
