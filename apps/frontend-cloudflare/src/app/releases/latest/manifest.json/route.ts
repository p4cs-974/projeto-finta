import { latestReleaseManifest } from "@finta/cli-distribution";

export async function GET() {
  return Response.json(latestReleaseManifest, {
    status: 200,
    headers: {
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
