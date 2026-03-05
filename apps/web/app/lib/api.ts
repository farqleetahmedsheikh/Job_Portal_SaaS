/** @format */

export const api = async <T = unknown>(
  endpoint: string,
  method: "POST" | "GET" = "POST",
  body?: unknown,
): Promise<T> => {
  const res = await fetch(endpoint, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};
