import { renderInstallScript } from "@finta/cli-distribution";

export async function GET() {
  return new Response(renderInstallScript(), {
    status: 200,
    headers: {
      "content-type": "text/x-shellscript; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
