import { DashboardActivityService } from "@finta/dashboard";
import { createApplicationError } from "@finta/shared-kernel";
import { z } from "zod";

import type { AppEnv } from "../../../app-env";
import { requireAuth } from "../../../lib/auth";
import { parseJsonRequest } from "../../../lib/http";
import { D1UserActivityEventRepository } from "../../dashboard/d1-user-activity-event-repository";

import { parseAuthenticatedUserId } from "../shared";

const recordSearchRequestSchema = z
  .object({
    query: z.string().trim().min(1),
    type: z.enum(["stock", "crypto"]),
  })
  .strict();

function parseRecordSearchRequest(input: unknown) {
  const parsed = recordSearchRequestSchema.safeParse(input);

  if (parsed.success) {
    return parsed.data;
  }

  throw createApplicationError(
    422,
    "VALIDATION_ERROR",
    "Corpo da requisição inválido",
    {
      fieldErrors: parsed.error.flatten().fieldErrors,
    },
  );
}

export async function handleRecordSearchActivity(
  request: Request,
  env: AppEnv,
): Promise<Response> {
  const auth = await requireAuth(request, env.JWT_SECRET);
  const payload = parseRecordSearchRequest(await parseJsonRequest(request));
  const userId = parseAuthenticatedUserId(auth.sub);
  const service = new DashboardActivityService({
    activityEventRepository: new D1UserActivityEventRepository(env.DB),
  });

  await service.recordSearch({
    userId,
    assetType: payload.type,
    query: payload.query,
  });

  return new Response(null, { status: 204 });
}
