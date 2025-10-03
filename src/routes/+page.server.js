export async function load({ url }) {
  const search = url.searchParams.get('search') ?? '';
  const pathname = url.pathname;
  
  // Data will be loaded on the client side with authentication
  return { search, pathname };
}
