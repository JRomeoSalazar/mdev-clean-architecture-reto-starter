import { afterAll, beforeAll, expect, test } from "bun:test";
import { startServer } from "@/adapters/http/bun-server";
import type { HttpHandler, HttpRequest } from "@/adapters/http/http";
import { Router } from "@/adapters/http/router";

const received: HttpRequest[] = [];
const echo: HttpHandler = {
  async handle(request) {
    received.push(request);
    return { status: 201, body: { ok: true } };
  },
};

let server: ReturnType<typeof startServer>;

beforeAll(() => {
  server = startServer(new Router({ submit: echo, approve: echo, reject: echo }), 0);
});

afterAll(() => {
  server.stop(true);
});

test("translates a real HTTP request into a router call and back", async () => {
  const response = await fetch(`http://localhost:${server.port}/expenses`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount: 100 }),
  });

  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ ok: true });
  expect(received.at(-1)).toEqual({ body: { amount: 100 } });
});

test("passes an unparsable body as undefined", async () => {
  await fetch(`http://localhost:${server.port}/expenses`, { method: "POST", body: "not json" });

  expect(received.at(-1)).toEqual({ body: undefined });
});

test("answers 404 for unknown routes", async () => {
  const response = await fetch(`http://localhost:${server.port}/nope`, { method: "POST" });

  expect(response.status).toBe(404);
});
