import {
  LATEST_MANIFEST_OBJECT_KEY,
  RELEASE_MANIFEST_CONTENT_TYPE,
} from "@finta/cli-distribution";

import { serveReleaseObject } from "@/lib/cli-release-storage";

export async function GET() {
  return await serveReleaseObject(
    LATEST_MANIFEST_OBJECT_KEY,
    RELEASE_MANIFEST_CONTENT_TYPE,
  );
}
