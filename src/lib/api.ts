
export async function fetchData() {
  const res = await fetchWrapper("/api/data/load");
  return res.json();
}

export async function publishEvent(event: string, table: string, row: any, rowId: string) {
  await fetchWrapper("/api/realtime/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, table, row, rowId, origin: "client" }),
  });
}

export const getApiUrl = (url: string) => url;

export const fetchWrapper = async (url: string, options?: RequestInit) => {
  const res = await fetch(url, options);
  const contentType = res.headers.get("content-type") || "";
  
  if (contentType.includes("text/html")) {
    const textSnapshot = await res.text();
    console.error("[API_ERROR] Expected JSON response but received HTML:", textSnapshot.substring(0, 300));
    throw new Error(
      `System Blocked: Received HTML response (code ${res.status}). This often means Netlify routing fell back to index.html due to an incorrect API route or cold start. Preview snippet: ${textSnapshot.substring(0, 150)}`
    );
  }

  // Bind and safely intercept the .json() method
  const originalJson = res.json.bind(res);
  res.json = async () => {
    try {
      return await originalJson();
    } catch (e: any) {
      // In case the body isn't actually JSON despite content-type header
      const textFallback = await res.text().catch(() => "");
      throw new Error(`Failed to parse response as JSON. Error: ${e.message}. Content snippet: ${textFallback.substring(0, 150)}`);
    }
  };

  return res;
};
