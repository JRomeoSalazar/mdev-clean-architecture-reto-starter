import type { ResolutionError } from "@/domain/expense";

export const HTTP_OK = 200;
export const HTTP_CREATED = 201;
export const HTTP_BAD_REQUEST = 400;
export const HTTP_FORBIDDEN = 403;
export const HTTP_NOT_FOUND = 404;
export const HTTP_CONFLICT = 409;
export const HTTP_UNPROCESSABLE_ENTITY = 422;

export type HttpRequest = Readonly<{ body: unknown }>;
export type HttpResponse = Readonly<{ status: number; body: unknown }>;

export interface HttpHandler {
  handle(request: HttpRequest): Promise<HttpResponse>;
}

export const invalidRequest: HttpResponse = {
  status: HTTP_BAD_REQUEST,
  body: { error: "invalid_request" },
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export type ResolveFailureReason =
  | "actor_not_found"
  | "expense_not_found"
  | ResolutionError;

export function resolveFailureStatus(reason: ResolveFailureReason): number {
  switch (reason) {
    case "actor_not_found":
    case "expense_not_found":
      return HTTP_NOT_FOUND;
    case "own_request":
    case "forbidden_role":
      return HTTP_FORBIDDEN;
    case "already_resolved":
      return HTTP_CONFLICT;
    case "reason_required":
      return HTTP_UNPROCESSABLE_ENTITY;
  }
}
