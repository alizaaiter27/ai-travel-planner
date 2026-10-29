import { describe, expect, it } from "vitest";
import { readJsonBody } from "@/lib/api/read-json";

function post(body: string, headers: Record<string, string> = {}) {
  return new Request("http://test/api", { method: "POST", body, headers });
}

describe("readJsonBody", () => {
  it("parses a small JSON body", async () => {
    expect(await readJsonBody(post('{"a":1}'), 100)).toEqual({ data: { a: 1 } });
  });

  it("rejects invalid JSON with 400", async () => {
    const result = await readJsonBody(post("{not json"), 100);
    expect("errorResponse" in result && result.errorResponse.status).toBe(400);
  });

  it("rejects a body larger than the limit with 413", async () => {
    const result = await readJsonBody(post(JSON.stringify({ text: "x".repeat(200) })), 100);
    expect("errorResponse" in result && result.errorResponse.status).toBe(413);
  });

  it("rejects early when Content-Length already says it's too large", async () => {
    const result = await readJsonBody(post("{}", { "content-length": "5000000" }), 100);
    expect("errorResponse" in result && result.errorResponse.status).toBe(413);
  });

  it("counts bytes, not characters (emoji are 4 bytes)", async () => {
    const body = JSON.stringify({ e: "😀".repeat(30) }); // ~130 bytes, ~70 characters
    const result = await readJsonBody(post(body), 100);
    expect("errorResponse" in result && result.errorResponse.status).toBe(413);
  });
});
