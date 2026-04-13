import {
  RELEASE_BINARY_CONTENT_TYPE,
  getReleaseArtifactObjectKey,
  type SupportedTargetKey,
} from "@finta/cli-distribution";

import { serveReleaseObject } from "@/lib/cli-release-storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ version: string; artifact: string }> },
) {
  const { version, artifact } = await context.params;
  const targetKey = artifact.replace(/^finta-/, "") as SupportedTargetKey;

  if (!artifact.startsWith("finta-")) {
    return new Response("Not found", { status: 404 });
  }

  try {
    return await serveReleaseObject(
      getReleaseArtifactObjectKey(version, targetKey),
      RELEASE_BINARY_CONTENT_TYPE,
    );
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
