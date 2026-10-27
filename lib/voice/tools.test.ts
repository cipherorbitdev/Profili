import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertRegisteredToolSchemas,
  buildVoiceTools,
  leaveMessageTool,
} from "./tools.ts";

test("leave_message_for_owner schema is a valid function tool", () => {
  const tool = leaveMessageTool("Ada Lovelace");
  assert.equal(tool.type, "function");
  assert.equal(tool.parameters.type, "object");
  assert.equal(tool.parameters.additionalProperties, false);
  assert.deepEqual(tool.parameters.required, ["message"]);
  assert.match(tool.description, /Ada Lovelace/);
  assert.equal(tool.execution_mode, "interactive");
  assert.equal(tool.timeout_seconds, 15);
  assertRegisteredToolSchemas([tool]);
});

test("only leave_message_for_owner is registered", () => {
  const tools = buildVoiceTools({ fullName: "Ada" });
  assert.deepEqual(
    tools.map((tool) => tool.name),
    ["leave_message_for_owner"],
  );
  assertRegisteredToolSchemas(tools);
});
