import {
  RELEASE_MANIFEST_CONTENT_TYPE,
  getVersionManifestObjectKey,
} from "@finta/cli-distribution";

import { serveReleaseObject } from "@/lib/cli-release-storage";

export async function GET(
  _request: Request,
  context: { params: Promise<{ version: string }> },
) {
  const { version } = await context.params;

  try {
    return await serveReleaseObject(
      getVersionManifestObjectKey(version),
      RELEASE_MANIFEST_CONTENT_TYPE,
    );
  } catch (err) {
    return new Response("Not found", { status: 404 });
  }
}
