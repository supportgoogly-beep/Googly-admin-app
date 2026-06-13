const fs = require('fs');

let data = fs.readFileSync('src/components/CoreOperations.tsx', 'utf8');

// replace the logo mock text with actual image tag
data = data.replace(
  /<Check className="w-3\.5 h-3\.5 shrink-0" \/> Selected Logo Active Mock/g,
  `<Check className="w-3.5 h-3.5 shrink-0" />
   <div className="flex items-center gap-2">
     <img src={restForm.logoUrl} alt="Logo" className="w-6 h-6 object-cover rounded shadow-sm bg-white" />
     <span>Selected Logo Active</span>
   </div>`
);

data = data.replace(
  /<Check className="w-3\.5 h-3\.5 shrink-0" \/> Promo Banner Active Mock/g,
  `<Check className="w-3.5 h-3.5 shrink-0" />
   <div className="flex items-center gap-2">
     <img src={restForm.bannerUrl} alt="Banner" className="w-10 h-6 object-cover rounded shadow-sm bg-white" />
     <span>Promo Banner Active</span>
   </div>`
);

data = data.replace(
  /<Check className="w-3\.5 h-3\.5 shrink-0" \/> Photograph Captured/g,
  `<Check className="w-3.5 h-3.5 shrink-0" />
   <div className="flex items-center gap-2">
     <img src={restForm.ownerPhotoUrl} alt="Owner" className="w-6 h-6 object-cover rounded-full shadow-sm bg-white" />
     <span>Photograph Uploaded</span>
   </div>`
);

// and also the docs if they are not images we can't show img tag, but if they are we can try. 
// for simplicity let's leave docs as "Attach: name" because they might be pdfs.

fs.writeFileSync('src/components/CoreOperations.tsx', data);
