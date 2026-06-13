const fs = require('fs');

let data = fs.readFileSync('src/components/CoreOperations.tsx', 'utf8');

// Add a hidden general file input just after the modal header
const inputHtml = `
                    <input 
                      type="file" 
                      id="global-file-upload" 
                      className="hidden" 
                      onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                            // Find which field we are uploading to based on window.uploadTarget
                            const target = window.uploadTarget || "kycDocumentUrl";
                            const url = URL.createObjectURL(file);
                            setRestForm(prev => ({ ...prev, [target]: url }));
                            triggerToast("File Added", file.name + " securely attached.", "success");
                         }
                      }} 
                    />
`;

data = data.replace(
  '{restWizardStep === 1 && (',
  inputHtml + '\n                {restWizardStep === 1 && ('
);

// We need to inject window.uploadTarget before the mock state
data = data.replace(/onClick=\{\(\) => \{\n\s+setRestForm\(prev => \(\{ \.\.\.prev, logoUrl/g, 'onClick={() => { window.uploadTarget = "logoUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, logoUrl');
data = data.replace(/onClick=\{\(\) => \{\n\s+setRestForm\(prev => \(\{ \.\.\.prev, bannerUrl/g, 'onClick={() => { window.uploadTarget = "bannerUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, bannerUrl');
data = data.replace(/onClick=\{\(\) => \{\n\s+setRestForm\(prev => \(\{ \.\.\.prev, ownerPhotoUrl/g, 'onClick={() => { window.uploadTarget = "ownerPhotoUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, ownerPhotoUrl');
data = data.replace(/onClick=\{\(\) => \{\n\s+setRestForm\(prev => \(\{ \.\.\.prev, kycDocumentUrl/g, 'onClick={() => { window.uploadTarget = "kycDocumentUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, kycDocumentUrl');
data = data.replace(/onClick=\{\(\) => \{\n\s+setRestForm\(prev => \(\{ \.\.\.prev, aadhaarFrontUrl/g, 'onClick={() => { window.uploadTarget = "aadhaarFrontUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, aadhaarFrontUrl');
data = data.replace(/onClick=\{\(\) => \{\n\s+setRestForm\(prev => \(\{ \.\.\.prev, aadhaarBackUrl/g, 'onClick={() => { window.uploadTarget = "aadhaarBackUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, aadhaarBackUrl');
data = data.replace(/onClick=\{\(\) => \{\n\s+setRestForm\(prev => \(\{ \.\.\.prev, panCardUrl/g, 'onClick={() => { window.uploadTarget = "panCardUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, panCardUrl');
data = data.replace(/onClick=\{\(\) => \{\n\s+setRestForm\(prev => \(\{ \.\.\.prev, businessRegUrl/g, 'onClick={() => { window.uploadTarget = "businessRegUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, businessRegUrl');
data = data.replace(/onClick=\{\(\) => \{\n\s+setRestForm\(prev => \(\{ \.\.\.prev, gstUrl/g, 'onClick={() => { window.uploadTarget = "gstUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, gstUrl');
data = data.replace(/onClick=\{\(\) => \{\n\s+setRestForm\(prev => \(\{ \.\.\.prev, addressProofUrl/g, 'onClick={() => { window.uploadTarget = "addressProofUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, addressProofUrl');
data = data.replace(/onClick=\{\(\) => \{\n\s+setRestForm\(prev => \(\{ \.\.\.prev, cancelledChequeUrl/g, 'onClick={() => { window.uploadTarget = "cancelledChequeUrl"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, cancelledChequeUrl');

fs.writeFileSync('src/components/CoreOperations.tsx', data);
