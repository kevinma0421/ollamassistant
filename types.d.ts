// types.d.ts
export {};

declare global {
	interface Window {
		electron: {
			on: (
				channel: string,
				listener: (event: any, ...args: any[]) => void
			) => void;
			send: (channel: string, data: any) => void;
			pasteText: (callback: (text: string) => void) => void;
		};
	}
}
