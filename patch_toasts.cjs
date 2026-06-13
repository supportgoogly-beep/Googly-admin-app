const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src/components');

function removeNoisyToasts() {
  const files = fs.readdirSync(directoryPath).filter(f => f.endsWith('.tsx'));
  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Removing various noisy toasts that appear on simple tab switching/loading
    content = content.replace(/triggerToast\(\"(Tab Switched|Tax Configurations Opened|Invoice Customizer Opened|Invoice Reports Loaded|Audit logs Loaded|Reports Focused|Full Tracking Screen Launched|Promotions Focused|Coupons Loaded|Campaigns Activated|Preference Tab Rendered|Panel Opened|Analytics Graph Refreshed|System Refresh Pulled)\"[^)]*\);?/g, '');
    
    fs.writeFileSync(filePath, content);
  }
  console.log("Removed noisy toasts.");
}

removeNoisyToasts();
