import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function serveReleaseObject(
  objectKey: string,
  fallbackContentType?: string,
) {
  console.log("[cli-release-storage] objectKey:", objectKey);
  const { env } = await getCloudflareContext({ async: true });
  console.log("[cli-release-storage] env keys:", Object.keys(env));
  const bucket = env.FINTA_RELEASES_BUCKET;
  console.log("[cli-release-storage] bucket exists:", !!bucket);

  if (!bucket) {
    throw new Error(
      "Missing Cloudflare R2 binding FINTA_RELEASES_BUCKET for CLI releases.",
    );
  }

  const object = await bucket.get(objectKey);
  console.log("[cli-release-storage] object:", object ? "found" : "null", "key:", objectKey);

  if (!object?.body) {
    return new Response("Not found", {
      status: 404,
      headers: {
        "cache-control": "no-store",
      },
    });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("content-length", object.size.toString());

  if (fallbackContentType && !headers.has("content-type")) {
    headers.set("content-type", fallbackContentType);
  }

  return new Response(object.body, {
    status: 200,
    headers,
  });
}
