
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
  const contentType = res.headers.get("content-type");
  
  return res;
};
