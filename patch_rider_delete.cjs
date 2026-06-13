const fs = require('fs');
let data = fs.readFileSync('src/components/RiderManagementModule.tsx', 'utf8');

data = data.replace(
  /\{wizardForm\.rcBookUrl \? "✓ Bound" : "Simulate RC Upload"\}/,
  '{wizardForm.rcBookUrl ? "Delete Attached Form" : "Simulate RC Upload"}'
);
data = data.replace(
  /onClick=\{\(\) => \{\n\s*setWizardForm\(\{ \.\.\.wizardForm, rcBookUrl: "uploaded_rc_draft\.pdf" \}\);\n\s*triggerToast\("Bluebook RC Attached", "Registration file bind completed\.", "success"\);\n\s*\}\}/,
  `onClick={() => {
    if (wizardForm.rcBookUrl) {
      setWizardForm({ ...wizardForm, rcBookUrl: "" });
    } else {
      setWizardForm({ ...wizardForm, rcBookUrl: "uploaded_rc_draft.pdf" });
      triggerToast("Bluebook RC Attached", "Registration file bind completed.", "success");
    }
  }}`
);
data = data.replace(
  /\{wizardForm\.drivingLicenseUrl \? "✓ Bound" : "Simulate DL Upload"\}/,
  '{wizardForm.drivingLicenseUrl ? "Delete Attached Form" : "Simulate DL Upload"}'
);
data = data.replace(
  /onClick=\{\(\) => \{\n\s*setWizardForm\(\{ \.\.\.wizardForm, drivingLicenseUrl: "uploaded_lic_draft\.pdf" \}\);\n\s*triggerToast\("Driving License Attached", "DL file bind completed\.", "success"\);\n\s*\}\}/,
  `onClick={() => {
    if (wizardForm.drivingLicenseUrl) {
      setWizardForm({ ...wizardForm, drivingLicenseUrl: "" });
    } else {
      setWizardForm({ ...wizardForm, drivingLicenseUrl: "uploaded_lic_draft.pdf" });
      triggerToast("Driving License Attached", "DL file bind completed.", "success");
    }
  }}`
);

fs.writeFileSync('src/components/RiderManagementModule.tsx', data);
