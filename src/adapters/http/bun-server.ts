import type { Router } from "@/adapters/http/router";

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export function startServer(router: Router, port: number) {
  return Bun.serve({
    port,
    async fetch(request) {
      const response = await router.handle({
        method: request.method,
        path: new URL(request.url).pathname,
        body: await readJson(request),
      });

      return Response.json(response.body, { status: response.status });
    },
  });
}
