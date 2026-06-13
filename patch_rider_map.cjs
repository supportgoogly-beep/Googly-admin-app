const fs = require('fs');

let content = fs.readFileSync('src/components/RiderManagementModule.tsx', 'utf8');

// 1. Add Import
if (!content.includes('import OSMInteractiveMap')) {
  content = content.replace(
    'import { Rider, Order, ExtendedRider } from "../types";',
    'import { Rider, Order, ExtendedRider } from "../types";\nimport OSMInteractiveMap from "./OSMInteractiveMap";'
  );
}

// 2. Reduce modal size to something more visually appealing
content = content.replace(
  'className="bg-white dark:bg-[#1E1E22] w-full max-w-4xl h-[650px] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row text-left border border-gray-200"',
  'className="bg-white dark:bg-[#1E1E22] w-full max-w-3xl h-[550px] sm:h-[500px] rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row text-left border border-gray-200"'
);

// 3. Replace the mock map block
const mockMapBlockRegex = /\{\/\* MOCK MAP GRAPHICS CANVAS WITH STREET CHANNELS \*\/\}.*?\{\/\* Map Zoom \/ options footer controls \*\/\}\s*<div className="p-3 bg-white\/70.*?<\/div>\s*<\/div>/s;

const newMapBlock = `
              {/* REAL OPENSTREETMAP TRACKING VIEW */}
              <div className="flex-1 w-full relative z-0 flex flex-col">
                <OSMInteractiveMap
                  mode="tracking"
                  riders={[trackingRider]}
                  orders={orders}
                  selectedId={orders.find(o => o.riderId === trackingRider.id && o.status !== "Delivered" && o.status !== "Cancelled")?.id || null}
                  triggerToast={triggerToast}
                  isDarkMode={themeMode === 'dark'}
                  height="100%"
                />
              </div>
            </div>
`;

content = content.replace(mockMapBlockRegex, newMapBlock);

fs.writeFileSync('src/components/RiderManagementModule.tsx', content);
console.log('Patched RiderManagementModule.tsx');
