export const enum Color {
	DiscordEmbedBackground = 0x2f3136,
	DiscordSuccess = 0x57f287,
	DiscordDanger = 0xed4245,
	DiscordWarning = 0xfee75c,
	DiscordPrimary = 0x5865f2,
	DiscordGem = 0xeb459e,
	LogsMessageDelete = 0xb75cff,
	LogsMessageUpdate = 0x5c6cff,
}

export const enum ThreatLevelColor {
	Level0 = 0x7ef31f,
	Level1 = 0x80f31f,
	Level2 = 0xa5de0b,
	Level3 = 0xc7c101,
	Level4 = 0xe39e03,
	Level5 = 0xf6780f,
	Level6 = 0xfe5326,
	Level7 = 0xfb3244,
}

export const OP_DELIMITER = "-";

export const CASE_REASON_MAX_LENGTH = 500;
export const CASE_REASON_MIN_LENGTH = 3;

export const MAX_TRUST_ACCOUNT_AGE = 1_000 * 60 * 60 * 24 * 7 * 4;
export const SPAM_THRESHOLD = 4;
export const SPAM_EXPIRE_SECONDS = 30;
export const MENTION_THRESHOLD = 10;
export const MENTION_EXPIRE_SECONDS = 60;
export const SCAM_THRESHOLD = 3;
export const SCAM_EXPIRE_SECONDS = 5 * 60;
export const ANTI_RAID_NUKE_COLLECTOR_TIMEOUT_SECONDS = 60;
export const ANTI_RAID_NUKE_SAFETY_LOCK_RELEASE_SECONDS = 5 * 60;

export const AUDIT_LOG_WAIT_SECONDS = 2.5;

export const HISTORY_DESCRIPTION_MAX_LENGTH = 80;
export const REPORT_REASON_MAX_LENGTH = 1_500;
export const REPORT_REASON_MIN_LENGTH = 10;

export const REPORT_DUPLICATE_PRE_EXPIRE_SECONDS = 3;
export const REPORT_DUPLICATE_EXPIRE_SECONDS = 15 * 60;
export const REPORT_MESSAGE_CONTEXT_LIMIT = 20;

export const DATE_FORMAT_LOGFILE = "YYYY-MM-DD_HH-mm-ss";
export const DATE_FORMAT_WITH_SECONDS = "YYYY/MM/DD HH:mm:ss";

export const AUTOCOMPLETE_REASON_FOCUSED_FIELD_NAME = "reason";

export const TRUST_AND_SAFETY_URL_BASE = "https://support.discord.com/hc/en-us/requests/new";

export const DiscordLocales: { [key: string]: string } = {
	"es-ES": "es",
	"zh-CN": "zh-tw",
};
