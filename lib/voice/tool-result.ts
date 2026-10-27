export type ToolCallEvent = {
  type?: string;
  call_id?: string;
  tool_call_id?: string;
  name?: string;
  arguments?: unknown;
};

export function toolCallIdentity(event: ToolCallEvent) {
  if (typeof event.call_id === "string" && event.call_id) {
    return { key: "call_id" as const, id: event.call_id };
  }
  if (typeof event.tool_call_id === "string" && event.tool_call_id) {
    return { key: "tool_call_id" as const, id: event.tool_call_id };
  }
  return null;
}

export function buildToolResult(
  event: ToolCallEvent,
  result: unknown,
  isError = false,
) {
  const identity = toolCallIdentity(event);
  if (!identity) {
    throw new Error("Tool call is missing an id.");
  }
  const failed =
    isError ||
    (typeof result === "object" && result !== null && "ok" in result && (result as { ok?: boolean }).ok === false);
  return {
    type: "tool.result" as const,
    [identity.key]: identity.id,
    result: JSON.stringify(result),
    is_error: failed,
  };
}
