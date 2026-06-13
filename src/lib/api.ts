
export async function fetchData() {
  const res = await fetch("/api/data/load");
  return res.json();
}

export async function publishEvent(event: string, table: string, row: any, rowId: string) {
  await fetch("/api/realtime/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, table, row, rowId, origin: "client" }),
  });
}

export const getApiUrl = (url: string) => url;
