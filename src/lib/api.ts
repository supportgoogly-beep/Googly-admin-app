/**
 * API route resolver to support cross-origin deployments (e.g. static hosting on Netlify)
 * pointing back to the Cloud Run backend wrapper.
 */

export function getApiUrl(path: string): string {
  // Use VITE_API_URL env variable if provided, else fallback to the known Cloud Run URL
  const prodApiUrl = import.meta.env.VITE_API_URL || "https://ais-pre-rhqrguoybgr5243m5p63jr-713419666152.asia-southeast1.run.app";
  
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    
    // Check if the app is loaded on a static hosting domain like netlify, github, etc.
    const isStaticDeployHost = 
      hostname.includes("netlify.app") || 
      hostname.includes("netlify.com") || 
      hostname.includes("github.io") || 
      (hostname !== "localhost" && !hostname.includes("run.app") && !hostname.includes("aistudio.google"));

    if (isStaticDeployHost) {
      // Ensure there are no double slashes when joining
      const cleanBase = prodApiUrl.endsWith("/") ? prodApiUrl.slice(0, -1) : prodApiUrl;
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      return `${cleanBase}${cleanPath}`;
    }
  }
  return path;
}
