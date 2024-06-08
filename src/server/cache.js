import { Redis } from 'ioredis';
import { constants } from '@utils';

class Cache
{
	// Default 86400 = 24 hours
	// All keys - except version - are prefixed with version, so each 'release'
	// will have a clear cache.
	// Works with environments with no redis.
	constructor(client)
	{
		this.cache = client;

		if (this.cache == null)
		{
			console.log(`info: [Cache] Client not started: REDISCLOUD_URL is not set`);
		}
		else
		{
			console.log(`info: [Cache] Client starting. Adapters: [ioredis]`);

			this.checkVersion();
		}
	}

	async get(key, callback, ttl = 86400)
	{
		const useKey = `${constants.version}_${key}`;

		let value = null, exists = false;

		if (this.cache)
		{
			try
			{
				exists = await this.cache.exists(useKey);
			}
			catch (error)
			{
				console.error(`error: [Cache] Redis exists ${useKey}: ${error}`);
			}
		}

		if (exists)
		{
			console.log(`info: [Cache] Redis hit: ${useKey}`);

			try
			{
				value = await this.cache.get(useKey);
			}
			catch (error)
			{
				console.error(`error: [Cache] Redis get ${useKey}: ${error}`);
			}
		}

		// if getting it from cache fails for any reason (key doesn't exist OR
		// connections start failing)
		if (!value)
		{
			if (!callback)
			{
				// by splitting it, inserting into redis is smaller which means a
				// smaller redis plan to pay for.
				// it also reduces the memory footprint; we aren't assigning (in API
				// calls) the whole thing to a variable, just the game's category
				// that reduces memory usage as more users hit the same call
				// could still run out of memory, but it reduces the threshold
				let switchKey = key, keys = [];

				if (key.includes('_'))
				{
					keys = key.split('_');
					switchKey = keys[0];
				}

				// we load AC data here as a 'global' spot for all the different places that call it
				if (Object.values(constants.cacheKeysACData).includes(switchKey))
				{
					if (this.cache)
					{
						console.log(`info: [Cache] Cache miss: ${useKey}, regenerating`);
					}

					switch (switchKey)
					{
						case constants.cacheKeys.sortedAcGameCategories:
							value = ((await import('./data/catalog/data.js')).sortedAcGameCategories)[keys[1]][keys[2]][keys[3]];
							break;
						case constants.cacheKeys.sortedCategories:
							value = (await import('./data/catalog/data.js')).sortedCategories;
							break;
						case constants.cacheKeys.residents:
							value = (await import('./data/catalog/residents.js')).residents;
							break;
						case constants.cacheKeys.creatures:
							value = (await import('./data/catalog/creatures.js')).creatures;
							break;
						case constants.cacheKeys.events:
							value = (await import('./data/catalog/events.js')).events;
							break;
						case constants.cacheKeys.years:
							value = (await import('./data/catalog/events.js')).years;
							break;
						case constants.cacheKeys.alphabeticalAvatarBackgrounds:
							value = (await import('./data/avatar/avatars.js')).alphabeticalAvatarBackgrounds;
							break;
						case constants.cacheKeys.alphabeticalAvatarCharacters:
							value = (await import('./data/avatar/avatars.js')).alphabeticalAvatarCharacters;
							break;
						case constants.cacheKeys.alphabeticalAvatarColorations:
							value = (await import('./data/avatar/avatars.js')).alphabeticalAvatarColorations;
							break;
						case constants.cacheKeys.alphabeticalAvatarAccents:
							value = (await import('./data/avatar/avatars.js')).alphabeticalAvatarAccents;
							break;
						case constants.cacheKeys.avatarTags:
							value = (await import('./data/avatar/avatars.js')).avatarTags;
							break;
						case constants.cacheKeys.sortedBellShopItems:
							value = (await import('./data/catalog/info.js')).sortedBellShopItems;
							break;
						case constants.cacheKeys.bellShopCategories:
							value = (await import('./data/catalog/info.js')).bellShopCategories;
							break;
						case constants.cacheKeys.pwps:
							value = (await import('./data/catalog/info.js')).pwps;
							break;
						case constants.cacheKeys.indexedAvatarAccents:
							value = (await import('./data/avatar/avatars.js')).indexedAvatarAccents;
							break;
						case constants.cacheKeys.indexedAvatarBackgrounds:
							value = (await import('./data/avatar/avatars.js')).indexedAvatarBackgrounds;
							break;
						case constants.cacheKeys.indexedAvatarCharacters:
							value = (await import('./data/avatar/avatars.js')).indexedAvatarCharacters;
							break;
						case constants.cacheKeys.indexedAvatarColorations:
							value = (await import('./data/avatar/avatars.js')).indexedAvatarColorations;
							break;
						default:
							console.error(`Unknown cache key: ${key}`);
							break;
					}

					await this.set(key, value, null);
				}
				else if (this.cache)
				{
					console.log(`info: [Cache] Cache miss: ${useKey}, continuing`);
				}

				return value;
			}
			else
			{
				if (this.cache)
				{
					console.log(`info: [Cache] Cache miss: ${useKey}`);
				}

				value = await callback();

				await this.set(key, value, ttl);

				return value;
			}
		}

		try
		{
			return JSON.parse(value);
		}
		catch (error)
		{
			return value;
		}
	}

	async set(key, value, ttl = 86400)
	{
		if (this.cache)
		{
			const useKey = `${constants.version}_${key}`;

			console.log(`info: [Cache] Cache set: ${useKey}`);

			let storeValue;

			try
			{
				storeValue = JSON.stringify(value);
			}
			catch (error)
			{
				storeValue = value;
			}

			try
			{
				if (ttl === null)
				{
					await this.cache.set(useKey, storeValue);
				}
				else
				{
					await this.cache.set(useKey, storeValue, 'EX', ttl);
				}
			}
			catch (error)
			{
				console.error(`error: [Cache] Redis set ${useKey}: ${error}`);
			}
		}
	}

	pipelineSet(pipeline, key, value, ttl = 86400)
	{
		const useKey = `${constants.version}_${key}`;

		console.log(`info: [Cache] Cache pipelineSet: ${useKey}`);

		let storeValue;

		try
		{
			storeValue = JSON.stringify(value);
		}
		catch (error)
		{
			storeValue = value;
		}

		try
		{
			if (ttl === null)
			{
				pipeline.set(useKey, storeValue);
			}
			else
			{
				pipeline.set(useKey, storeValue, 'EX', ttl);
			}
		}
		catch (error)
		{
			console.error(`error: [Cache] Redis pipelineSet ${useKey}: ${error}`);
		}
	}

	async deleteMatch(match)
	{
		if (this.cache)
		{
			console.log(`info: [Cache] Cache delete by pattern ${match}`);

			try
			{
				const keys = await this.cache.keys(`${constants.version}_${match}*`);

				if (keys.length > 0)
				{
					await this.cache.del(keys);
				}
			}
			catch (error)
			{
				console.error(`error: [Cache] Redis deleteMatch ${match}: ${error}`);
			}
		}
	}

	async flush()
	{
		if (this.cache)
		{
			console.log(`info: [Cache] Cache flush`);

			try
			{
				await this.cache.flushall();
			}
			catch (error)
			{
				console.error(`error: [Cache] Redis flushall: ${error}`);
			}
		}
	}

	async checkVersion()
	{
		if (this.cache)
		{
			console.log(`info: [Cache] Cache checkVersion`);

			const cacheKey = 'version';

			let exists = false, version = null;

			try
			{
				exists = await this.cache.exists(cacheKey);
			}
			catch (error)
			{
				console.error(`error: [Cache] Redis checkVersion exists ${cacheKey}: ${error}`);
			}

			if (exists)
			{
				try
				{
					version = await this.cache.get(cacheKey);
				}
				catch (error)
				{
					console.error(`error: [Cache] Redis checkVersion get ${cacheKey}: ${error}`);
				}
			}

			console.log(`info: [Cache] Cache version: ${version}`);

			if (version !== null && version != constants.version)
			{
				try
				{
					console.log(`info: [Cache] Cache clearing old version`);

					const keys = await this.cache.keys(`${version}*`);

					if (keys.length > 0)
					{
						await this.cache.del(keys);
					}
				}
				catch (error)
				{
					console.error(`error: [Cache] Redis checkVersion delete ${version}: ${error}`);
				}
			}

			if (version === null || (version !== null && version != constants.version))
			{
				try
				{
					console.log(`info: [Cache] Cache setting version`);

					await this.cache.set(cacheKey, constants.version);
				}
				catch (error)
				{
					console.error(`error: [Cache] Redis checkVersion set ${cacheKey}: ${error}`);
				}

				console.log(`info: [Cache] Cache prewarming AC data`);

				// pre-warm some AC data
				const acData = await import('./data/catalog/data.js');

				const pipeline = this.cache.pipeline();

				this.pipelineSet(pipeline, constants.cacheKeys.sortedCategories, acData.sortedCategories, null);

				for (var gameId in acData.sortedAcGameCategories)
				{
					for (var categoryName in acData.sortedAcGameCategories[gameId])
					{
						for (var sortBy in acData.sortedAcGameCategories[gameId][categoryName])
						{
							this.pipelineSet(pipeline, `${constants.cacheKeys.sortedAcGameCategories}_${gameId}_${categoryName}_${sortBy}`, acData.sortedAcGameCategories[gameId][categoryName][sortBy], null);
						}
					}
				}

				await pipeline.exec();
			}
		}
	}
}

const ACCCache = new Cache(
	process.env.REDISCLOUD_URL ? new Redis(process.env.REDISCLOUD_URL) : null,
);

export {
	ACCCache
};