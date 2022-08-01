import process from 'node:process';
import type { Redis } from 'ioredis';
import { container } from 'tsyringe';
import { request as fetch, type Dispatcher } from 'undici';
import { logger } from '../../logger.js';
import { kRedis } from '../../tokens.js';

export const scamURLEnvs = ['SCAM_DOMAIN_URL', 'SCAM_DOMAIN_DISCORD_URL'] as const;
export enum ScamRedisKeys {
	SCAM_DOMAIN_URL = 'scamdomains',
	SCAM_DOMAIN_DISCORD_URL = 'scamdomains_discord',
}

export interface ScamDomainRefreshData {
	envVar: string;
	redisKey: string;
	lastRefresh: number;
	before: number;
	after: number;
}

export function checkResponse(response: Dispatcher.ResponseData) {
	if (response.statusCode >= 200 && response.statusCode < 300) {
		return response;
	}

	logger.warn({ response }, 'Fetching scam domains returned a non 2xx response code.');

	return null;
}

export const scamDomainRequestHeaders = {
	SCAM_DOMAIN_URL: {
		'X-Identity': 'Naval-Base/yuudachi',
	},
	SCAM_DOMAIN_DISCORD_URL: {},
} as const;

export async function refreshScamDomains(redis?: Redis) {
	if (!redis) {
		redis = container.resolve<Redis>(kRedis);
	}
	const res: ScamDomainRefreshData[] = [];

	for (const urlEnv of scamURLEnvs) {
		const url = process.env[urlEnv];

		if (!url) {
			logger.warn(`Missing env var: ${urlEnv}`);
			continue;
		}

		const response = await fetch(process.env[urlEnv]!, {
			headers: scamDomainRequestHeaders[urlEnv],
		});
		const checkedResponse = checkResponse(response);

		if (!checkedResponse) {
			continue;
		}

		const list = (await checkedResponse.body.json()) as string[];

		switch (urlEnv) {
			case 'SCAM_DOMAIN_DISCORD_URL':
			case 'SCAM_DOMAIN_URL': {
				const key = ScamRedisKeys[urlEnv];
				// @ts-expect-error
				const [[, lastRefresh], [, before], , , [, after]] = await redis
					.multi()
					.get(`${key}:refresh`)
					.scard(key)
					.del(key)
					.sadd(key, ...list)
					.scard(key)
					.set(`${key}:refresh`, Date.now())
					.exec();

				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				const lastRefreshTimestamp = parseInt(lastRefresh, 10);

				logger.info({
					msg: 'refreshd scam domains',
					envVar: urlEnv,
					redisKey: key,
					lastRefresh: lastRefreshTimestamp,
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					before,
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					after,
				});

				res.push({
					envVar: urlEnv,
					redisKey: key,
					lastRefresh: lastRefreshTimestamp,
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					before,
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					after,
				});
				break;
			}
		}
	}

	return res;
}
