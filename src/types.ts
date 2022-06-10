import type { DiscordAPIError, HTTPError } from '@discordjs/rest';
import type { Dispatcher } from 'undici';

type Awaitable<T> = T | Promise<T>;

interface OkCachedResponse {
	cached: true;
	ok: true;
	discordResponse: Dispatcher.ResponseData;
	value: unknown;
}

interface ErrorCachedResponse {
	cached: true;
	ok: false;
	error: DiscordAPIError | HTTPError;
}

interface UncachedResponse {
	cached: false;
	set: CacheSetter;
}

type CacheResult = OkCachedResponse | ErrorCachedResponse | UncachedResponse;
export type CacheData = Omit<OkCachedResponse, 'cached'> | Omit<ErrorCachedResponse, 'cached'>;
export type CacheSetter = (fullRoute: string, data: CacheData) => Awaitable<void>;
export type CacheGetter = (fullRoute: string) => Awaitable<CacheResult>;
