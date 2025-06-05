import { ImapFlow } from 'imapflow';
import { ParsedMail, simpleParser } from 'mailparser';
import { IExecuteFunctions, NodeApiError } from 'n8n-workflow';
import { ParameterValidator } from '../utils/helpers';
import { IEmailData, IImapOperation } from '../utils/types';

export class GetEmailOperation implements IImapOperation {
	async execute(
		executeFunctions: IExecuteFunctions,
		client: ImapFlow,
		itemIndex: number,
	): Promise<IEmailData> {
		const mailboxParam = executeFunctions.getNodeParameter('mailbox', itemIndex) as string | { mode: string; value: string };
		const mailbox = ParameterValidator.extractMailboxName(mailboxParam);
		const emailUid = executeFunctions.getNodeParameter('emailUid', itemIndex) as string;
		const downloadAttachments = executeFunctions.getNodeParameter('downloadAttachments', itemIndex, false) as boolean;

		ParameterValidator.validateMailbox(mailboxParam);
		ParameterValidator.validateUid(emailUid);

		try {
			await client.mailboxOpen(mailbox);
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to open folder ${mailbox}: ${(error as Error).message}`,
			});
		}

												let message: any;
		try {
			// First, search for the specific UID to verify it exists
			const searchResults = await client.search({ uid: emailUid.toString() });
			if (searchResults.length === 0) {
				throw new NodeApiError(executeFunctions.getNode(), {
					message: `Email with UID ${emailUid} not found in ${mailbox}`,
				});
			}

			// Use the most basic UID FETCH with minimal parameters
			const messageGenerator = client.fetch(emailUid.toString(), {
				source: true,
				uid: true,
				flags: true,
				size: true
			}, { uid: true });

			// Get the first (and only) message from the generator
			for await (const msg of messageGenerator) {
				message = msg;
				break;
			}

			if (!message) {
				throw new Error(`No message data received for UID ${emailUid}`);
			}
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to fetch email with UID ${emailUid}: ${(error as Error).message}`,
			});
		}

		if (!message) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Email with UID ${emailUid} not found in ${mailbox}`,
			});
		}

		if (!message.source) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Email source not available for UID ${emailUid}`,
			});
		}

		let parsed: ParsedMail;
		try {
			parsed = await simpleParser(message.source);
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to parse email content: ${(error as Error).message}`,
			});
		}

		// Helper function to normalize address objects to arrays
		const normalizeAddresses = (addresses: any): any[] => {
			if (!addresses) return [];
			return Array.isArray(addresses) ? addresses : [addresses];
		};

		const emailData: IEmailData = {
			uid: message.uid,
			subject: parsed.subject || '',
			from: parsed.from || {},
			to: normalizeAddresses(parsed.to),
			cc: normalizeAddresses(parsed.cc),
			bcc: normalizeAddresses(parsed.bcc),
			date: parsed.date || null,
			text: parsed.text || '',
			html: parsed.html || '',
			attachments:
				parsed.attachments?.map((att) => ({
					filename: att.filename,
					contentType: att.contentType,
					size: att.size,
				})) || [],
			flags: message.flags || new Set(),
			seen: message.flags?.has('\\Seen') || false,
			size: message.size,
		};

		// Download attachments as binary if requested
		if (downloadAttachments && parsed.attachments && parsed.attachments.length > 0) {
			emailData.binaryAttachments = [];

			for (let i = 0; i < parsed.attachments.length; i++) {
				const attachment = parsed.attachments[i];
				if (attachment.content) {
					emailData.binaryAttachments.push({
						filename: attachment.filename || `attachment_${i}`,
						contentType: attachment.contentType || 'application/octet-stream',
						data: attachment.content,
						size: attachment.size || attachment.content.length,
					});
				}
			}
		}

		return emailData;
	}
}
