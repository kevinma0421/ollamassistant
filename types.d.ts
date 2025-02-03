// types.d.ts
export {};

declare global {
	interface Window {
		electron: {
			on: (channel: string, listener: (...args: any[]) => void) => void;
			send: (channel: string, data: any) => void;
		};
	}
}
