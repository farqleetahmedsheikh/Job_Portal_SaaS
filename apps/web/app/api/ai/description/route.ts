/** @format */
/* eslint-disable turbo/no-undeclared-env-vars */

import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1000 },
      }),
    },
  );

  return new Response(res.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
