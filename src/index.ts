import { createServer } from 'node:http';
import {
	populateAbortErrorResponse,
	populateGeneralErrorResponse,
	populateRatelimitErrorResponse,
} from '@discordjs/proxy';
import {
	type RouteLike,
	type RequestMethod,
	REST,
	DiscordAPIError,
	HTTPError,
	RateLimitError,
	parseResponse,
} from '@discordjs/rest';
import { populateSuccessfulResponse } from './populateSuccessfulResponse';
import type { CacheGetter } from './types';

if (!process.env.DISCORD_TOKEN) {
	throw new Error('A DISCORD_TOKEN env var is required');
}

const cache = (await import('./cache')) as unknown as { retrieve: CacheGetter };
if (!('retrieve' in cache)) {
	throw new Error('Expected retrieve to be exported');
}

const api = new REST({ rejectOnRateLimit: () => true, retries: 0 }).setToken(process.env.DISCORD_TOKEN);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
const server = createServer(async (req, res) => {
	const { method, url } = req as { method: RequestMethod; url: string };
	const fullRoute = new URL(url, 'http://noop').pathname.replace(/^\/api(\/v\d+)?/, '') as RouteLike;

	const cacheHit = await cache.retrieve(fullRoute);
	if (cacheHit.cached) {
		if (cacheHit.ok) {
			populateSuccessfulResponse(res, cacheHit.discordResponse);
			return res.end(JSON.stringify(cacheHit.value));
		}

		populateGeneralErrorResponse(res, cacheHit.error);
		return res.end();
	}

	try {
		const discordResponse = await api.raw({
			body: req,
			fullRoute,
			method,
			passThroughBody: true,
		});

		populateSuccessfulResponse(res, discordResponse);
		const data = await parseResponse(discordResponse);
		res.write(JSON.stringify(data));

		await cacheHit.set(fullRoute, { ok: true, discordResponse, value: data });
	} catch (error) {
		if (error instanceof DiscordAPIError || error instanceof HTTPError) {
			if (error.status === 404) {
				void cacheHit.set(fullRoute, { ok: false, error });
			}

			populateGeneralErrorResponse(res, error);
		} else if (error instanceof RateLimitError) {
			populateRatelimitErrorResponse(res, error);
		} else if (error instanceof Error && error.name === 'AbortError') {
			populateAbortErrorResponse(res);
		} else {
			throw error;
		}
	} finally {
		res.end();
	}
});

const port = parseInt(process.env.PORT ?? '8080', 10);
server.listen(port, () => console.log(`Listening on port ${port}`));
