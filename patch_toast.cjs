const fs = require('fs');

let data = fs.readFileSync('src/App.tsx', 'utf8');

const newToast = `const triggerToast = (title: string, message: string, type: Toast["type"]) => {
    // Suppress general navigation notifications
    const navWords = ["Opened", "Focused", "Filtered", "Loaded", "View", "Switched", "Navigated", "Displayed", "Screen"];
    if (navWords.some(w => title.toLowerCase().includes(w.toLowerCase()))) {
      // allow exports
      if (!title.toLowerCase().includes("export")) return;
    }
    
    // Suppress simple "info" toasts for clicks, unless they are document uploads/updates
    if (type === "info") {
      const allowedInfo = ["upload", "attach", "inject", "detect", "sync", "save", "log"];
      if (!allowedInfo.some(w => title.toLowerCase().includes(w) || message.toLowerCase().includes(w))) {
        return;
      }
    }

    const nextToast = { id: \`toast-\${Date.now()}\`, title, message, type };
    setToasts(prev => [nextToast, ...prev]);
    // Dismiss toast after 4s
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== nextToast.id));
    }, 4000);
  };`;

data = data.replace(/const triggerToast = \(title: string, message: string, type: Toast\["type"\]\) => \{[\s\S]*?\}, 4000\);\n  \};/m, newToast);

fs.writeFileSync('src/App.tsx', data);
