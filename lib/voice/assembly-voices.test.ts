import assert from "node:assert/strict";
import { test } from "node:test";
import { assemblyVoiceId, DEFAULT_ASSEMBLY_VOICE } from "./assembly-voices.ts";

test("stored AssemblyAI ids pass through", () => {
  assert.equal(assemblyVoiceId("eve"), "eve");
  assert.equal(assemblyVoiceId("Charles"), "charles");
});

test("legacy UI names map onto real Voice Agent ids", () => {
  assert.equal(assemblyVoiceId("Alex"), "alba");
  assert.equal(assemblyVoiceId("Daniel"), "michael");
  assert.equal(assemblyVoiceId(""), DEFAULT_ASSEMBLY_VOICE);
  assert.equal(assemblyVoiceId("not-a-voice"), DEFAULT_ASSEMBLY_VOICE);
});
