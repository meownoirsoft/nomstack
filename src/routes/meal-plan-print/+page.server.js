export async function load({ url }) {
  const pathname = url.pathname;
  
  // Data will be loaded on the client side with authentication
  return { pathname };
}
