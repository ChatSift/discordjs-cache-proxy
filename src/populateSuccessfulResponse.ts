import type { ServerResponse } from 'node:http';
import type { Dispatcher } from 'undici';

export function populateSuccessfulResponse(res: ServerResponse, data: Dispatcher.ResponseData): void {
	res.statusCode = data.statusCode;

	for (const header of Object.keys(data.headers)) {
		// Strip ratelimit headers
		if (header.startsWith('x-ratelimit')) {
			continue;
		}

		res.setHeader(header, data.headers[header]!);
	}
}
