import assert from "node:assert/strict";
import { test } from "node:test";
import { safeNextPath } from "./safe-next.ts";

test("safeNextPath allows app routes and password reset only", () => {
  assert.equal(safeNextPath("/app"), "/app");
  assert.equal(safeNextPath("/app/dashboard"), "/app/dashboard");
  assert.equal(safeNextPath("/reset-password"), "/reset-password");
  assert.equal(safeNextPath("https://evil.example/app"), "/app");
  assert.equal(safeNextPath("//evil.example"), "/app");
  assert.equal(safeNextPath("/login"), "/app");
});
