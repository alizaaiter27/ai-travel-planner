// Reads a JSON request body, refusing anything larger than `maxBytes`.
// Next.js doesn't limit Route Handler body size, so without this anyone could
// send megabytes of data that we'd parse and validate for nothing.
export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<{ data: unknown } | { errorResponse: Response }> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) return { errorResponse: tooLarge() };

  let text: string;
  try {
    text = await request.text();
  } catch {
    return { errorResponse: invalidJson() };
  }
  // The header can be missing or wrong, so check the real size too.
  if (new TextEncoder().encode(text).length > maxBytes) return { errorResponse: tooLarge() };

  try {
    return { data: JSON.parse(text) };
  } catch {
    return { errorResponse: invalidJson() };
  }
}

function tooLarge(): Response {
  return Response.json({ error: "Request is too large." }, { status: 413 });
}

function invalidJson(): Response {
  return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
}
