const fs = require('fs');
let data = fs.readFileSync('src/components/OSMInteractiveMap.tsx', 'utf8');

const customerSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 text-white"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';

const merchantSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 text-white"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>'; // Standard store/building

const bikeSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 text-white inline"><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/><path d="M15 6h2v6.5"/><path d="m11.5 9 1.5-3h4"/><path d="m5 14-.5-1.5L9 9"/><path d="M11 16h3"/></svg>';

data = data.replace(
  /<svg class="w-2\.5 h-2\.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"[^>]*><\/svg>/g,
  customerSvg
);

data = data.replace(
  /<svg class="w-2\.5 h-2\.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"[^>]*><\/svg>/g,
  merchantSvg
);

data = data.replace(
  /<svg class="w-2\.5 h-2\.5 fill-white inline" viewBox="0 0 24 24"><path d="M12 2C8\.13 2 5 5\.13 5 9c0 5\.25 7 13 7 13s7-7\.75 7-13c0-3\.87-3\.13-7-7-7zm0 9\.5c-1\.38 0-2\.5-1\.12-2\.5-2\.5s1\.12-2\.5 2\.5-2\.5 2\.5 1\.12 2\.5 2\.5-1\.12 2\.5-2\.5 2\.5z"\/><\/svg>/g,
  bikeSvg
);

fs.writeFileSync('src/components/OSMInteractiveMap.tsx', data);
