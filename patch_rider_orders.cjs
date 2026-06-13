const fs = require('fs');

let data = fs.readFileSync('src/components/RiderManagementModule.tsx', 'utf8');

const regex = /\{\/\* Active Deliveries count \*\/\}\s*<td className="p-4 text-center">\s*\{riderAssignedOrders\.length > 0 \? \(\s*<span className="text-\[10px\] text-blue-800 bg-blue-100 font-extrabold px-2 py-0\.5 rounded-full inline-block animate-pulse">\s*\{riderAssignedOrders\.length\} active\s*<\/span>\s*\) : \(\s*<span className="text-gray-400 font-semibold">0 active<\/span>\s*\)\}\s*<\/td>/g;

const replacement = `{/* Active Deliveries count */}
                        <td className="p-4 text-center">
                          {riderAssignedOrders.length > 0 ? (
                            <div className="flex flex-col gap-1 items-center">
                              <span className="text-[10px] text-blue-800 bg-blue-100 font-extrabold px-2 py-0.5 rounded-full inline-block mb-1">
                                {riderAssignedOrders.length} active
                              </span>
                              {riderAssignedOrders.map(o => (
                                 <span key={o.id} className="text-[9px] font-mono text-gray-700 dark:text-gray-300 block bg-gray-100 dark:bg-gray-800 px-1 rounded">{o.id}</span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 font-semibold">0 active</span>
                          )}
                        </td>`;

data = data.replace(regex, replacement);

fs.writeFileSync('src/components/RiderManagementModule.tsx', data);
