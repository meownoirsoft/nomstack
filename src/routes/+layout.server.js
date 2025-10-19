import { json } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';

export async function load({ url }) {
  // For now, we'll handle authentication on the client side
  // The server will just check if we're on auth pages or shared pages
  const isAuthPage = url.pathname === '/login' || url.pathname === '/signup';
  const isSharedPage = url.pathname.startsWith('/shared/');
  
  let title = "nomStack";
  let pageTitle = '';
  
  if (isSharedPage) {
    title = "Shared List - nomStack";
    pageTitle = "Shared List";
  }
  
  return { 
    title, 
    pageTitle,
    isAuthPage,
    isSharedPage
  };
}
