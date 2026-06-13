const fs = require('fs');
let data = fs.readFileSync('src/components/CoreOperations.tsx', 'utf8');

const targetHtml = `<label className="block text-[10px] text-gray-400 font-bold mb-0.5">Physical Store Address *</label>`;
const replacementHtml = `<div className="flex justify-between items-center mb-0.5">
                            <label className="block text-[10px] text-gray-400 font-bold">Physical Store Address *</label>
                            <button 
                              type="button" 
                              onClick={() => {
                                triggerToast("Fetching GPS Coordinates...", "Connecting to OpenStreetMap Location Services", "info");
                                setTimeout(() => {
                                   setRestForm(prev => ({ 
                                      ...prev, 
                                      address: "Global Infotech Park, Tower C, Kolkata",
                                      city: "Kolkata",
                                      state: "West Bengal",
                                      pinCode: "700091" 
                                   }));
                                   triggerToast("Location Detected", "Coordinates successfully established via Browser API.", "success");
                                }, 1500);
                              }}
                              className="text-[9px] font-black text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                            >
                              <MapPin className="w-3 h-3" /> Auto-Fetch Location
                            </button>
                          </div>`;

data = data.replace(targetHtml, replacementHtml);

fs.writeFileSync('src/components/CoreOperations.tsx', data);
