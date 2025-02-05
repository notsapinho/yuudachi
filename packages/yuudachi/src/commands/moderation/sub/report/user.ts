import { container, createMessageActionRow, ellipsis, createButton, kRedis, logger } from "@yuudachi/framework";
import type { ArgsParam, InteractionParam } from "@yuudachi/framework/types";
import {
	type APIEmbed,
	type ModalSubmitInteraction,
	type GuildMember,
	ButtonStyle,
	ComponentType,
	hyperlink,
} from "discord.js";
import i18next from "i18next";
import type { Redis } from "ioredis";
import { nanoid } from "nanoid";
import {
	Color,
	REPORT_REASON_MAX_LENGTH,
	REPORT_DUPLICATE_EXPIRE_SECONDS,
	REPORT_DUPLICATE_PRE_EXPIRE_SECONDS,
} from "../../../../Constants.js";
import { upsertReportLog } from "../../../../functions/logging/upsertReportLog.js";
import { createReport, ReportType } from "../../../../functions/reports/createReport.js";
import type { ReportCommand } from "../../../../interactions/index.js";
import { resolveGuildCommand, chatInputApplicationCommandMention } from "../../../../util/commandUtils.js";
import { localeTrustAndSafety } from "../../../../util/localizeTrustAndSafety.js";

type MemberAssuredReportArgs = ArgsParam<typeof ReportCommand>["user"] & { user: { member: GuildMember } };

export async function user(
	interaction: InteractionParam | ModalSubmitInteraction<"cached">,
	args: ArgsParam<typeof ReportCommand>["user"],
	locale: string,
) {
	const redis = container.resolve<Redis>(kRedis);
	const key = `guild:${interaction.guildId}:report:user:${args.user.user.id}`;

	const {
		user: { member },
		reason,
		attachment,
	} = args as MemberAssuredReportArgs;
	const trimmedReason = reason.trim();

	if (attachment) {
		const attachmentIsImage = attachment.contentType === "image/jpeg" || attachment.contentType === "image/png";

		if (!attachmentIsImage) {
			throw new Error(i18next.t("command.utility.report.common.errors.invalid_attachment", { lng: locale }));
		}
	}

	const reportKey = nanoid();
	const cancelKey = nanoid();

	const reportButton = createButton({
		customId: reportKey,
		label: i18next.t("command.utility.report.common.buttons.execute", { lng: locale }),
		style: ButtonStyle.Danger,
	});
	const cancelButton = createButton({
		customId: cancelKey,
		label: i18next.t("command.utility.report.common.buttons.cancel", { lng: locale }),
		style: ButtonStyle.Secondary,
	});
	const trustAndSafetyButton = createButton({
		label: i18next.t("command.utility.report.common.buttons.discord_report", { lng: locale }),
		url: localeTrustAndSafety(locale),
		style: ButtonStyle.Link,
	});

	const contentParts = [
		i18next.t("command.utility.report.user.pending", {
			user: `${member.user.toString()} - \`${member.user.tag}\` (${member.user.id})`,
			reason: ellipsis(trimmedReason, REPORT_REASON_MAX_LENGTH),
			lng: locale,
		}),
		"",
	];

	if (!attachment) {
		const reportCommand = !interaction.isChatInputCommand() && (await resolveGuildCommand(interaction.guild, "report"));

		contentParts.push(
			i18next.t("command.utility.report.user.attachment_upsell.base", {
				report_command: reportCommand
					? i18next.t("command.utility.report.user.attachment_upsell.mention", {
							report_command: chatInputApplicationCommandMention("report user", reportCommand.id),
							lng: locale,
					  })
					: i18next.t("command.utility.report.user.attachment_upsell.option", { lng: locale }),
				lng: locale,
			}),
			"",
		);
	}

	contentParts.push(
		i18next.t("command.utility.report.common.warnings", {
			trust_and_safety: hyperlink(
				i18next.t("command.utility.report.common.trust_and_safety_sub", { lng: locale }),
				localeTrustAndSafety(locale),
			),
			lng: locale,
		}),
	);

	const embed: APIEmbed = {
		author: {
			name: `${member.user.tag} (${member.user.id})`,
			icon_url: member.user.displayAvatarURL(),
		},
		color: Color.DiscordEmbedBackground,
	};

	const reply = await interaction.editReply({
		content: contentParts.join("\n"),
		embeds: [
			{
				...embed,
				image: attachment ? { url: attachment.url } : undefined,
			},
		],
		components: [createMessageActionRow([cancelButton, reportButton, trustAndSafetyButton])],
	});

	const collectedInteraction = await reply
		.awaitMessageComponent({
			componentType: ComponentType.Button,
			filter: (collected) => collected.user.id === interaction.user.id,
			time: 120_000,
		})
		.catch(async () => {
			try {
				await interaction.editReply({
					content: i18next.t("command.utility.report.common.errors.timed_out", { lng: locale }),
					components: [],
				});
			} catch (error_) {
				const error = error_ as Error;
				logger.error(error, error.message);
			}

			return undefined;
		});

	if (collectedInteraction?.customId === cancelKey) {
		await collectedInteraction.update({
			content: i18next.t("command.utility.report.user.cancel", {
				lng: locale,
			}),
			embeds: [],
			components: [],
		});
	} else if (collectedInteraction?.customId === reportKey) {
		await collectedInteraction.deferUpdate();

		if (await redis.exists(key)) {
			await collectedInteraction.editReply({
				content: i18next.t("command.utility.report.common.errors.recently_reported.user", { lng: locale }),
				embeds: [],
				components: [],
			});

			return;
		}

		await redis.setex(key, REPORT_DUPLICATE_PRE_EXPIRE_SECONDS, "");

		const report = await createReport({
			guildId: interaction.guildId,
			authorId: interaction.user.id,
			authorTag: interaction.user.tag,
			reason: trimmedReason,
			targetId: member.id,
			targetTag: member.user.tag,
			attachmentUrl: attachment?.proxyURL,
			type: ReportType.User,
		});

		await upsertReportLog(interaction.guild, report);
		await redis.setex(key, REPORT_DUPLICATE_EXPIRE_SECONDS, "");

		await collectedInteraction.editReply({
			content: i18next.t("command.utility.report.user.success", { lng: locale }),
			embeds: [embed],
			components: [createMessageActionRow([trustAndSafetyButton])],
		});
	}
}
