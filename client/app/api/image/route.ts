const ALLOWED_HOST = "localhost:5000";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) return new Response("Missing URL", { status: 400 });

  const parsed = new URL(url);

  if (parsed.host !== ALLOWED_HOST) {
    return new Response("Forbidden", { status: 403 });
  }

  const res = await fetch(url);
  const buffer = await res.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "image/jpeg",
    },
  });
}
