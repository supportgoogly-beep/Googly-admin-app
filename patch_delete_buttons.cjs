const fs = require('fs');

let data = fs.readFileSync('src/components/CoreOperations.tsx', 'utf8');

// For logoUrl and bannerUrl
data = data.replace(
  /<div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-2 rounded-xl text-\[10px\] font-semibold border border-emerald-100 font-sans">\s*<Check className="w-3\.5 h-3\.5 shrink-0" \/> Selected Logo Active Mock\s*<\/div>/g,
  `<div className="flex items-center justify-between gap-2 bg-emerald-50 text-emerald-700 p-2 rounded-xl text-[10px] font-semibold border border-emerald-100 font-sans">
    <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 shrink-0" /> Selected Logo Active Mock</div>
    <button type="button" onClick={(e) => { e.stopPropagation(); setRestForm(prev => ({...prev, logoUrl: ""})); triggerToast("Deleted", "Logo image removed", "info"); }} className="text-rose-500 hover:text-rose-700 px-2 py-0.5 border border-rose-300 rounded cursor-pointer">Delete</button>
  </div>`
);

data = data.replace(
  /<div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-2 rounded-xl text-\[10px\] font-semibold border border-emerald-100 font-sans">\s*<Check className="w-3\.5 h-3\.5 shrink-0" \/> Promo Banner Active Mock\s*<\/div>/g,
  `<div className="flex items-center justify-between gap-2 bg-emerald-50 text-emerald-700 p-2 rounded-xl text-[10px] font-semibold border border-emerald-100 font-sans">
    <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 shrink-0" /> Promo Banner Active Mock</div>
    <button type="button" onClick={(e) => { e.stopPropagation(); setRestForm(prev => ({...prev, bannerUrl: ""})); triggerToast("Deleted", "Banner image removed", "info"); }} className="text-rose-500 hover:text-rose-700 px-2 py-0.5 border border-rose-300 rounded cursor-pointer">Delete</button>
  </div>`
);

// For ownerPhotoUrl
data = data.replace(
  /<div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-2 rounded-xl text-\[10px\] font-semibold border border-emerald-100 font-sans">\s*<Check className="w-3\.5 h-3\.5 shrink-0" \/> Photograph Captured \[Img_491\.jpg\]\s*<\/div>/g,
  `<div className="flex items-center justify-between gap-2 bg-emerald-50 text-emerald-700 p-2 rounded-xl text-[10px] font-semibold border border-emerald-100 font-sans">
    <div className="flex items-center gap-2"><Check className="w-3.5 h-3.5 shrink-0" /> Photograph Captured</div>
    <button type="button" onClick={(e) => { e.stopPropagation(); setRestForm(prev => ({...prev, ownerPhotoUrl: ""})); triggerToast("Deleted", "Photo removed", "info"); }} className="text-rose-500 hover:text-rose-700 px-2 py-0.5 border border-rose-300 rounded cursor-pointer">Delete</button>
  </div>`
);

// For document uploads (they have a standard format)
const docFields = [
  { field: 'kycDocumentUrl', name: 'fssai_cert_59021.pdf' },
  { field: 'aadhaarFrontUrl', name: 'aadhaar_front_scan.jpg' },
  { field: 'aadhaarBackUrl', name: 'aadhaar_back_scan.jpg' },
  { field: 'panCardUrl', name: 'pan_card_copy.pdf' },
  { field: 'businessRegUrl', name: 'mca_incorporation.pdf' },
];

docFields.forEach(({field, name}) => {
  const regex = new RegExp(`\\{restForm\\.${field} \\? \\(\\s*<div className="p-1\\.5 bg-emerald-50 text-emerald-850 text-\\[9px\\] font-semibold rounded-lg truncate text-center">\\s*Attach: ${name.replace(/\./g, '\\.')}\\s*<\\/div>\\s*\\) : \\(`, 'g');
  data = data.replace(regex, `{restForm.${field} ? (
                          <div className="flex items-center justify-between p-1.5 bg-emerald-50 text-emerald-850 text-[9px] font-semibold rounded-lg">
                            <span className="truncate">Attach: ${name}</span>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setRestForm(prev => ({...prev, ${field}: ""})); triggerToast("Deleted", "Document removed", "info"); }} className="text-rose-500 hover:text-rose-700 ml-2 px-1.5 py-0.5 border border-rose-300 rounded cursor-pointer">Delete</button>
                          </div>
                      ) : (`);
});

// For GST
data = data.replace(
  /\{restForm\.gstUrl && \(\s*<div className="mt-2 flex items-center justify-between p-1\.5 bg-emerald-50 border border-emerald-100 rounded-lg">\s*<div className="flex items-center gap-2 text-\[10px\] font-semibold text-emerald-800">\s*<CheckSquare className="w-3\.5 h-3\.5" \/> gst_number_verified\.pdf\s*<\/div>\s*<span className="text-emerald-600 font-bold text-\[9px\]">SECURE<\/span>\s*<\/div>\s*\)\}/g,
  `{restForm.gstUrl && (
                          <div className="mt-2 flex items-center justify-between p-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                            <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-800">
                              <CheckSquare className="w-3.5 h-3.5" /> gst_number_verified.pdf
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-600 font-bold text-[9px]">SECURE</span>
                              <button type="button" onClick={(e) => { e.stopPropagation(); setRestForm(prev => ({...prev, gstUrl: ""})); triggerToast("Deleted", "Document removed", "info"); }} className="text-rose-500 hover:text-rose-700 px-1.5 border border-rose-300 rounded cursor-pointer text-[9px]">Delete</button>
                            </div>
                          </div>
                        )}`
);

// For Address Proof
data = data.replace(
  /\{restForm\.addressProofUrl && \(\s*<div className="mt-2 flex items-center justify-between p-1\.5 bg-emerald-50 border border-emerald-100 rounded-lg">\s*<div className="flex items-center gap-2 text-\[10px\] font-semibold text-emerald-800">\s*<CheckSquare className="w-3\.5 h-3\.5" \/> address_proof_utility_verified\.pdf\s*<\/div>\s*<span className="text-emerald-600 font-bold text-\[9px\]">VERIFIED<\/span>\s*<\/div>\s*\)\}/g,
  `{restForm.addressProofUrl && (
                          <div className="mt-2 flex items-center justify-between p-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
                            <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-800">
                              <CheckSquare className="w-3.5 h-3.5" /> address_proof_utility_verified.pdf
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-600 font-bold text-[9px]">VERIFIED</span>
                              <button type="button" onClick={(e) => { e.stopPropagation(); setRestForm(prev => ({...prev, addressProofUrl: ""})); triggerToast("Deleted", "Document removed", "info"); }} className="text-rose-500 hover:text-rose-700 px-1.5 border border-rose-300 rounded cursor-pointer text-[9px]">Delete</button>
                            </div>
                          </div>
                        )}`
);

// For Cancelled Cheque
data = data.replace(
  /<div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-2 rounded-xl text-\[10px\] font-semibold border border-emerald-100 font-sans">\s*<CheckSquare className="w-3\.5 h-3\.5 shrink-0" \/> bank_cheque_scan_uploaded\.pdf\s*<\/div>/g,
  `<div className="flex items-center justify-between gap-2 bg-emerald-50 text-emerald-700 p-2 rounded-xl text-[10px] font-semibold border border-emerald-100 font-sans">
    <div className="flex items-center gap-2"><CheckSquare className="w-3.5 h-3.5 shrink-0" /> bank_cheque_scan_uploaded.pdf</div>
    <button type="button" onClick={(e) => { e.stopPropagation(); setRestForm(prev => ({...prev, cancelledChequeUrl: ""})); triggerToast("Deleted", "Document removed", "info"); }} className="text-rose-500 hover:text-rose-700 px-2 py-0.5 border border-rose-300 rounded cursor-pointer">Delete</button>
  </div>`
);


fs.writeFileSync('src/components/CoreOperations.tsx', data);
