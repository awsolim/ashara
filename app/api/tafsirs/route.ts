import { NextResponse } from "next/server";

async function getAccessToken() {
  if (
    !process.env.QF_AUTH_URL ||
    !process.env.QF_CLIENT_ID ||
    !process.env.QF_CLIENT_SECRET
  ) {
    throw new Error("Missing Quran Foundation auth env vars");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "content",
  });

  const basicAuth = Buffer.from(
    `${process.env.QF_CLIENT_ID}:${process.env.QF_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch(process.env.QF_AUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basicAuth}`,
    },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data.access_token as string;
}

export async function GET() {
  const token = await getAccessToken();

  const res = await fetch(`${process.env.QF_BASE_URL}/resources/tafsirs`, {
    headers: token
      ? {
          "x-auth-token": token,
          "x-client-id": process.env.QF_CLIENT_ID ?? "",
        }
      : undefined,
    cache: "no-store",
  });

  const data = await res.json();

  return NextResponse.json(data);
}