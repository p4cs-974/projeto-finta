import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function serveReleaseObject(
  objectKey: string,
  fallbackContentType?: string,
) {
  const { env } = await getCloudflareContext({ async: true });
  const bucket = env.FINTA_RELEASES_BUCKET;

  if (!bucket) {
    throw new Error(
      "Missing Cloudflare R2 binding FINTA_RELEASES_BUCKET for CLI releases.",
    );
  }

  const object = await bucket.get(objectKey);

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
