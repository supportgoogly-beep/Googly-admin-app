import React from "react";

export default function LoginBackground() {
  return (
    <div id="login-background-container" className="absolute inset-0 w-full h-full select-none z-0 overflow-hidden bg-slate-50">
      {/* Soft geometric abstract background */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-orange-50 to-transparent mix-blend-multiply" />
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-orange-100/30 to-transparent" />
      
      {/* Decorative blobs */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-orange-200/40 rounded-full filter blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-20 right-20 w-72 h-72 bg-blue-200/40 rounded-full filter blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: "2s" }} />
      
      {/* Subtle mesh grid */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
    </div>
  );
}
