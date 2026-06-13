const fs = require('fs');

function patchCoreOperations() {
  let data = fs.readFileSync('src/components/CoreOperations.tsx', 'utf8');

  // We find the blocks and replace them.
  // There are several such documents.
  const fields = [
    { targetUrlField: 'kycDocumentUrl', label: 'FSSAI License PDF *', isImage: false, pattern: /\{\/\* FSSAI License File \*\/\}.*?(?=\{\/\* Aadhaar Front \*\/\})/s },
    { targetUrlField: 'aadhaarFrontUrl', label: 'Aadhaar Front Image *', isImage: true, pattern: /\{\/\* Aadhaar Front \*\/\}.*?(?=\{\/\* Aadhaar Back \*\/\})/s },
    { targetUrlField: 'aadhaarBackUrl', label: 'Aadhaar Back Image *', isImage: true, pattern: /\{\/\* Aadhaar Back \*\/\}.*?(?=\{\/\* PAN Card \*\/\})/s },
    { targetUrlField: 'panCardUrl', label: 'PAN Card Attachment *', isImage: true, pattern: /\{\/\* PAN Card \*\/\}.*?(?=\{\/\* Business Registration \*\/\})/s },
    { targetUrlField: 'businessRegUrl', label: 'Business Registration Certificate', isImage: false, pattern: /\{\/\* Business Registration \*\/\}.*?(?=\{\/\* GSTIN Verification \*\/\})/s },
    { targetUrlField: 'gstUrl', label: 'GST Number Verification', isImage: false, pattern: /\{\/\* GSTIN Verification \*\/\}.*?(?=\{\/\* Proof of Trade Address \*\/\})/s },
    { targetUrlField: 'addressProofUrl', label: 'Proof of Trade Address', isImage: false, pattern: /\{\/\* Proof of Trade Address \*\/\}.*?(?=<\/div>\s*<\/div>\s*\{\/\* Contact \/ Authorised Person Info \*\/\})/s },
    { targetUrlField: 'cancelledChequeUrl', label: 'Cancelled Cheque Photo Document *', isImage: true, pattern: /\{\/\* Cancelled cheque upload \*\/\}.*?(?=<\/div>\s*<\/div>\s*<div className="flex gap-3 justify-end mt-8">)/s }
  ];

  fields.forEach(f => {
    const replacement = `
{/* ${f.label.replace(' *', '')} */}
<div className="border border-gray-200 p-3 rounded-2xl bg-white space-y-2">
  <div className="flex justify-between items-center">
    <span className="font-bold text-gray-800 text-[11px] block">${f.label}</span>
    {restForm.${f.targetUrlField} && (
      <button 
        type="button"
        onClick={(e) => { e.stopPropagation(); setRestForm(prev => ({ ...prev, ${f.targetUrlField}: "" })); }}
        className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-0.5 rounded border border-red-100 bg-red-50"
      >Delete</button>
    )}
  </div>
  {restForm.${f.targetUrlField} ? (
    <div className="relative border border-gray-100 rounded-xl overflow-hidden h-24 flex items-center justify-center bg-gray-50">
      ${f.isImage 
        ? `<img src={restForm.${f.targetUrlField}.startsWith('/') || restForm.${f.targetUrlField}.startsWith('http') ? restForm.${f.targetUrlField} : 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=100&q=80'} alt="${f.label}" className="h-full object-cover" />`
        : `<div className="flex flex-col items-center justify-center text-gray-500"><FileText className="w-8 h-8 mb-1" /><span className="text-[10px] font-bold">Document Uploaded</span><span className="text-[9px] truncate max-w-[120px]">{restForm.${f.targetUrlField}}</span></div>` 
      }
    </div>
  ) : (
    <div 
      onClick={() => { (window as any).uploadTarget = "${f.targetUrlField}"; document.getElementById("global-file-upload")?.click(); setRestForm(prev => ({ ...prev, ${f.targetUrlField}: "/kyc/${f.targetUrlField}_verified.png" }));
        triggerToast("${f.label.replace(' *', '')} Added", "Document attached successfully", "success");
      }}
      className="border border-dashed border-gray-200 hover:border-[#E23744] p-4 text-center rounded-xl cursor-pointer bg-gray-50 hover:bg-red-50/10 transition-colors h-24 flex flex-col justify-center"
    >
      <Upload className="w-5 h-5 mx-auto text-gray-400 mb-1" />
      <span className="text-[10px] text-gray-500 font-semibold block">Click to Browse</span>
      <span className="text-[8.5px] text-gray-400 leading-tight block mt-0.5 font-mono">Max: 10MB</span>
    </div>
  )}
</div>
`;
    data = data.replace(f.pattern, replacement);
  });

  // add import of FileText if missing
  if (!data.includes('FileText')) {
    data = data.replace(/import \{ (.*?) \} from "lucide-react";/, 'import { $1, FileText } from "lucide-react";');
  }

  fs.writeFileSync('src/components/CoreOperations.tsx', data);
  console.log('patched CoreOperations');
}

patchCoreOperations();
