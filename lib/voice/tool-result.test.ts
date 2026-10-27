import assert from "node:assert/strict";
import { test } from "node:test";
import { buildToolResult } from "./tool-result.ts";

test("tool.result uses call_id and a JSON string result", () => {
  const message = buildToolResult(
    { type: "tool.call", call_id: "call_abc", name: "leave_message_for_owner" },
    { ok: true, message: "Saved." },
  );
  assert.equal(message.type, "tool.result");
  assert.equal(message.call_id, "call_abc");
  assert.equal(typeof message.result, "string");
  assert.equal(JSON.parse(message.result).ok, true);
  assert.equal(message.is_error, false);
});

test("tool.result echoes tool_call_id when that is the id key", () => {
  const message = buildToolResult(
    { type: "tool.call", tool_call_id: "tool_1", name: "leave_message_for_owner" },
    { ok: false, message: "already sent" },
  );
  assert.equal(message.tool_call_id, "tool_1");
  assert.equal("call_id" in message, false);
  assert.equal(message.is_error, true);
});
