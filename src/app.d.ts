// See https://svelte.dev/docs/kit/types#app-namespace
declare global {
	namespace App {
		interface Locals {
			user: { id: number; username: string } | null;
		}
	}
}

export {};
