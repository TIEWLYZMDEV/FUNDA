const backendOrigin =
  process.env.BACKEND_ORIGIN ||
  "http://rtrs-alb-1142412083.ap-southeast-1.elb.amazonaws.com";

export default {
  async fetch(request) {
    const incomingUrl = new URL(request.url);
    const targetUrl = new URL(
      `${incomingUrl.pathname}${incomingUrl.search}`,
      backendOrigin
    );

    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.set("x-forwarded-host", incomingUrl.host);
    headers.set("x-forwarded-proto", "https");

    const init = {
      method: request.method,
      headers,
      redirect: "manual",
    };

    if (!["GET", "HEAD"].includes(request.method)) {
      init.body = await request.arrayBuffer();
    }

    const upstreamResponse = await fetch(targetUrl, init);
    const responseHeaders = new Headers(upstreamResponse.headers);

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  },
};
