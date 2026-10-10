import test from "node:test";
import assert from "node:assert/strict";
import { createSarvamClient, reviewMappings } from "../server/advisor.js";

const plans = [
  {
    id: 1,
    headers: ["purchase_ref", "unit_price"],
    rules: [
      { target: "price_cents", source: "unit_price", operation: "needs_unit" },
    ],
    rows: [{ purchase_ref: "PRIVATE-ORDER", unit_price: "991.45" }],
  },
];
const reply = {
  summary: "Price units need operator confirmation.",
  suggestions: [],
};

function mockClient(
  capture,
  content = JSON.stringify(reply),
  finish = "stop",
  status = 200,
) {
  return createSarvamClient({
    apiKey: "sarvam-test-only",
    fetch: async (url, init) => {
      capture.push({
        url: String(url),
        headers: new Headers(init.headers),
        body: JSON.parse(init.body),
      });
      return new Response(
        JSON.stringify({
          id: "test-completion",
          object: "chat.completion",
          model: "sarvam-105b",
          choices: [
            {
              index: 0,
              finish_reason: finish,
              message: { role: "assistant", content },
            },
          ],
        }),
        { status, headers: { "Content-Type": "application/json" } },
      );
    },
  });
}

test("Sarvam advisor uses its own endpoint/key and excludes source records", async () => {
  const calls = [];
  const result = await reviewMappings(mockClient(calls), plans);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://api.sarvam.ai/v1/chat/completions");
  assert.equal(
    calls[0].headers.get("api-subscription-key"),
    "sarvam-test-only",
  );
  assert.equal(calls[0].body.model, "sarvam-105b");
  assert.deepEqual(JSON.parse(calls[0].body.messages[1].content), [
    {
      segment: 1,
      headers: plans[0].headers,
      unresolved: [{ target: "price_cents", source: "unit_price" }],
    },
  ]);
  assert.deepEqual(result, { mode: "model", ...reply });
});

test("incomplete or invalid Sarvam suggestions never become a successful review", async () => {
  await assert.rejects(
    reviewMappings(mockClient([], JSON.stringify(reply), "length"), plans),
    /incomplete/,
  );
  await assert.rejects(
    reviewMappings(
      mockClient([], '{"summary":"bad","suggestions":[{"operation":"eval"}]}'),
      plans,
    ),
  );
  await assert.rejects(reviewMappings(mockClient([], "not JSON"), plans));
});

test("provider failures are not silently retried or replaced with local success", async () => {
  const calls = [];
  await assert.rejects(
    reviewMappings(mockClient(calls, "", "stop", 429), plans),
  );
  assert.equal(calls.length, 1);
  assert.equal(createSarvamClient(), null);
  assert.equal((await reviewMappings(null, plans)).mode, "local");
});

test("a model's unit guess is withheld even when its JSON is valid", async () => {
  const unsafe = {
    summary: "Assume price means dollars based on magnitude.",
    suggestions: [
      {
        segment: 1,
        source: "unit_price",
        target: "price_cents",
        operation: "dollars_to_cents",
        reason: "The most common unit.",
      },
    ],
  };
  const result = await reviewMappings(
    mockClient([], JSON.stringify(unsafe)),
    plans,
  );
  assert.deepEqual(result.suggestions, []);
  assert.match(result.summary, /withheld/);
  assert.doesNotMatch(result.summary, /Assume/);
});
