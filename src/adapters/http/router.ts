import {
  HTTP_NOT_FOUND,
  isRecord,
  type HttpHandler,
  type HttpResponse,
} from "@/adapters/http/http";

export type RouteRequest = Readonly<{
  method: string;
  path: string;
  body: unknown;
}>;

export type RouterHandlers = Readonly<{
  submit: HttpHandler;
  approve: HttpHandler;
  reject: HttpHandler;
}>;

const notFound: HttpResponse = { status: HTTP_NOT_FOUND, body: { error: "route_not_found" } };

// POST /expenses, POST /expenses/:id/approve, POST /expenses/:id/reject
export class Router {
  constructor(private readonly handlers: RouterHandlers) {}

  async handle(request: RouteRequest): Promise<HttpResponse> {
    const [resource, id, action, ...rest] = request.path.split("/").filter(Boolean);

    if (request.method !== "POST" || resource !== "expenses" || rest.length > 0) {
      return notFound;
    }

    if (id === undefined) {
      return this.handlers.submit.handle({ body: request.body });
    }

    const body = { ...(isRecord(request.body) ? request.body : {}), expenseId: decodeURIComponent(id) };

    switch (action) {
      case "approve":
        return this.handlers.approve.handle({ body });
      case "reject":
        return this.handlers.reject.handle({ body });
      default:
        return notFound;
    }
  }
}
