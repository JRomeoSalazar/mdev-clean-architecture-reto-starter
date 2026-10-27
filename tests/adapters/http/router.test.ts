import { describe, expect, test } from "bun:test";
import type { HttpHandler, HttpRequest, HttpResponse } from "@/adapters/http/http";
import { Router } from "@/adapters/http/router";

class RecordingHandler implements HttpHandler {
  readonly requests: HttpRequest[] = [];

  constructor(private readonly name: string) {}

  async handle(request: HttpRequest): Promise<HttpResponse> {
    this.requests.push(request);
    return { status: 200, body: { handledBy: this.name } };
  }
}

function setup() {
  const handlers = {
    submit: new RecordingHandler("submit"),
    approve: new RecordingHandler("approve"),
    reject: new RecordingHandler("reject"),
  };

  return { handlers, router: new Router(handlers) };
}

describe("Router", () => {
  test("routes POST /expenses to submit with the body untouched", async () => {
    const { router, handlers } = setup();

    const response = await router.handle({ method: "POST", path: "/expenses", body: { amount: 1 } });

    expect(response.body).toEqual({ handledBy: "submit" });
    expect(handlers.submit.requests).toEqual([{ body: { amount: 1 } }]);
  });

  test.each(["approve", "reject"] as const)("routes POST /expenses/:id/%s and adds the id to the body", async (action) => {
    const { router, handlers } = setup();

    const response = await router.handle({ method: "POST", path: `/expenses/e%201/${action}`, body: { actorId: "marta" } });

    expect(response.body).toEqual({ handledBy: action });
    expect(handlers[action].requests).toEqual([{ body: { actorId: "marta", expenseId: "e 1" } }]);
  });

  test("the path id wins over an expenseId sent in the body", async () => {
    const { router, handlers } = setup();

    await router.handle({ method: "POST", path: "/expenses/real/approve", body: { expenseId: "spoofed", actorId: "marta" } });

    expect(handlers.approve.requests).toEqual([{ body: { expenseId: "real", actorId: "marta" } }]);
  });

  test("still routes when the body is not an object so the controller can reject it", async () => {
    const { router, handlers } = setup();

    await router.handle({ method: "POST", path: "/expenses/e1/approve", body: undefined });

    expect(handlers.approve.requests).toEqual([{ body: { expenseId: "e1" } }]);
  });

  test.each([
    ["GET", "/expenses"],
    ["POST", "/other"],
    ["POST", "/expenses/e1"],
    ["POST", "/expenses/e1/unknown"],
    ["POST", "/expenses/e1/approve/extra"],
  ])("returns 404 for %s %s", async (method, path) => {
    const { router } = setup();

    const response = await router.handle({ method, path, body: {} });

    expect(response).toEqual({ status: 404, body: { error: "route_not_found" } });
  });
});
