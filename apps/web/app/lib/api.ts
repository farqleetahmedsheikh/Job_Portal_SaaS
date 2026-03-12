/** @format */

export const api = async <T = unknown>(
  endpoint: string,
  method: "POST" | "GET" | "PATCH" = "POST",
  body?: unknown,
): Promise<T> => {
  const res = await fetch(endpoint, {
    method,
    credentials:"include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data;
};
