import 'reflect-metadata';
import { readFile } from 'node:fs/promises';
import process from 'node:process';
import { URL, fileURLToPath, pathToFileURL } from 'node:url';
import { Backend } from '@skyra/i18next-backend';
import { GatewayIntentBits, Options, Partials } from 'discord.js';
import i18next from 'i18next';
import readdirp from 'readdirp';
import { container } from 'tsyringe';
import { type Command, commandInfo } from './Command.js';
import type { Event } from './Event.js';
import { scamDomainRequestHeaders } from './functions/anti-scam/refreshScamDomains.js';
import type { CommandPayload } from './interactions/ArgumentsOf.js';
import { logger } from './logger.js';
import { createBree } from './util/bree.js';
import { createClient } from './util/client.js';
import { createCommands } from './util/commands.js';
import { dynamicImport } from './util/dynamicImport.js';
import { createPostgres } from './util/postgres.js';
import { createRedis } from './util/redis.js';
import { createWebhooks } from './util/webhooks.js';
import { WebSocketConnection } from './websocket/WebSocketConnection.js';

createPostgres();
const redis = createRedis();
createBree();

const client = createClient({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildBans,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent,
	],
	partials: [Partials.GuildMember],
	makeCache: Options.cacheWithLimits({
		MessageManager: 100,
		StageInstanceManager: 10,
		VoiceStateManager: 10,
	}),
});

const commands = createCommands();
createWebhooks();

const commandFiles = readdirp(fileURLToPath(new URL('./commands', import.meta.url)), {
	fileFilter: '*.js',
	directoryFilter: '!sub',
});

const eventFiles = readdirp(fileURLToPath(new URL('./events', import.meta.url)), {
	fileFilter: '*.js',
});

try {
	const shorteners = JSON.parse(
		(await readFile(fileURLToPath(new URL('../linkshorteners.json', import.meta.url).href))).toString(),
	) as string[];
	await redis.sadd('linkshorteners', ...shorteners);

	await i18next.use(Backend).init({
		backend: {
			paths: [new URL('./locales/{{lng}}/{{ns}}.json', import.meta.url)],
		},
		cleanCode: true,
		preload: ['en-US', 'en-GB', 'de', 'es-ES', 'ja', 'ko', 'pl', 'zh-CH', 'zh-TW'],
		supportedLngs: ['en-US', 'en-GB', 'de', 'es-ES', 'ja', 'ko', 'pl', 'zh-CH', 'zh-TW'],
		fallbackLng: ['en-US'],
		returnNull: false,
		returnEmptyString: false,
	});

	for await (const dir of commandFiles) {
		const cmdInfo = commandInfo(dir.path);

		if (!cmdInfo) {
			continue;
		}

		const dynamic = await dynamicImport<new () => Command<CommandPayload>>(
			() => import(pathToFileURL(dir.fullPath).href),
		);
		const command = container.resolve<Command<CommandPayload>>((await dynamic()).default);
		logger.info(
			{ command: { name: command.name?.join(', ') ?? cmdInfo.name } },
			`Registering command: ${command.name?.join(', ') ?? cmdInfo.name}`,
		);

		command.name?.forEach((name) => (commands.has(name) ? null : commands.set(name.toLowerCase(), command))) ??
			commands.set(cmdInfo.name, command);
	}

	for await (const dir of eventFiles) {
		const dynamic = await dynamicImport<new () => Event>(() => import(pathToFileURL(dir.fullPath).href));
		const event_ = container.resolve<Event>((await dynamic()).default);
		logger.info({ event: { name: event_.name, event: event_.event } }, `Registering event: ${event_.name}`);

		if (event_.disabled) {
			continue;
		}
		void event_.execute();
	}

	await client.login();

	const wsURL = process.env.SCAM_DOMAIN_WS;

	if (wsURL) {
		new WebSocketConnection(process.env.SCAM_DOMAIN_WS!, scamDomainRequestHeaders['SCAM_DOMAIN_URL'], redis);
	} else {
		logger.info(`Missing env var 'SCAM_DOMAIN_WS`);
	}
} catch (e) {
	const error = e as Error;
	logger.error(error, error.message);
}