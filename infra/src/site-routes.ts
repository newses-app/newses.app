/**
 * CloudFront viewer-request function: other hosts (`www`, the distribution's own domain) redirect
 * to `domainName` without their query; clean URLs serve their page (`/guide/x` → `/guide/x.html`),
 * and folders their `index.html`.
 */
export const siteRoutes = (domainName: string) => `function handler(event) {
  var request = event.request;
  var host = request.headers.host ? request.headers.host.value : '';
  if (host !== ${JSON.stringify(domainName)}) {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: ${JSON.stringify(`https://${domainName}`)} + request.uri } },
    };
  }
  if (request.uri.endsWith('/')) request.uri += 'index.html';
  else if (!/\\.[A-Za-z0-9]+$/.test(request.uri)) request.uri += '.html';
  return request;
}`;
