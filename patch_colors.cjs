const fs = require('fs');

const files = fs.readdirSync('src/components/').filter(f => f.endsWith('.tsx')).map(f => 'src/components/' + f);
files.push('src/App.tsx');

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');

  // Replace invalid shades using regex
  content = content.replace(/(text|bg|border|ring)-(gray|slate|stone|red|rose|amber|emerald|indigo|blue|sky|purple)-[1-9]50(\/?[0-9]*)/g, (match, prefix, color, suffix) => {
    // suffix will be 50, 150, 250, etc.
    const numPartStr = match.match(/-([0-9]{3})/);
    if (!numPartStr) return match;
    let num = parseInt(numPartStr[1]);
    
    // Nearest valid Tailwind color: round 150 -> 200, 250 -> 300, 450 -> 500, 750 -> 800, 850 -> 900
    // Wait, let's just make X50 map to X00 if X<5 else (X+1)00
    if (num === 150) num = 200;
    else if (num === 250) num = 300;
    else if (num === 350) num = 400;
    else if (num === 450) num = 500;
    else if (num === 550) num = 600;
    else if (num === 650) num = 700;
    else if (num === 750) num = 800;
    else if (num === 850) num = 900;
    else if (num === 950) num = 900;
    else return match;

    const remainder = match.split('-' + numPartStr[1])[1] || '';
    return `${prefix}-${color}-${num}${remainder}`;
  });

  // text-slate-105 -> text-slate-100
  content = content.replace(/(text|bg|border|ring)-(gray|slate|stone|red|rose|amber|emerald|indigo|blue|sky|purple)-([0-9]*)5(\/?[0-9]*)/g, (match, prefix, color, numPart, remainder) => {
    if (numPart === '10' || numPart === '20' || numPart === '30' || numPart === '40' || numPart === '50' || numPart === '60' || numPart === '70' || numPart === '80' || numPart === '90') {
      return `${prefix}-${color}-${numPart}0${remainder}`;
    }
    return match;
  });
  
  // also specifically fix 'text-indigo-750' which was found
  // It should be mostly caught.

  fs.writeFileSync(f, content);
}
console.log('Fixed Tailwind colors');
