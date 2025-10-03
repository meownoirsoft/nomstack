export async function load({ url }) {
  const pathname = url.pathname;
  return { pathname };
}
