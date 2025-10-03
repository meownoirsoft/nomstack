import { writable } from 'svelte/store';

// Store for restaurant search query (separate from meal search)
export const restaurantSearchTerm = writable('');

export function setRestaurantSearchTerm(term) {
    restaurantSearchTerm.set(term);
}

export function clearRestaurantSearchTerm() {
    restaurantSearchTerm.set('');
}
