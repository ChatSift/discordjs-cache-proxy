import { setTimeout } from 'node:timers';
// This would be your own types file with the same contents
import type { CacheData, CacheSetter, CacheGetter } from '../src/types';
const CACHE = new Map<string, CacheData>();

const setter: CacheSetter = (fullRoute, data) => {
	CACHE.set(fullRoute, data);
	// Note how you are responsible for cleaning up unused cache entries.
	// You can do that using a timeout as shown below.
	// Alternatively, making a top level setInterval to sweep is also valid

	// You could compute the time for dynamically based off of the path,
	// but this is a simple example
	setTimeout(() => CACHE.delete(fullRoute), 15_000).unref();
};

// Using a const arrow function to make use of CacheGetter
export const retrieve: CacheGetter = (fullRoute) => {
	const cacheHit = CACHE.get(fullRoute);
	if (cacheHit) {
		return {
			cached: true,
			...cacheHit,
		};
	}

	return { cached: false, set: setter };
};
