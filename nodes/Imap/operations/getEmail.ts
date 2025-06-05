import { IExecuteFunctions, NodeApiError } from 'n8n-workflow';
import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import { IImapOperation, IEmailData } from '../utils/types';
import { ParameterValidator } from '../utils/helpers';

export class GetEmailOperation implements IImapOperation {
	async execute(
		executeFunctions: IExecuteFunctions,
		client: ImapFlow,
		itemIndex: number,
	): Promise<IEmailData> {
		const mailbox = executeFunctions.getNodeParameter('mailbox', itemIndex) as string;
		const emailUid = executeFunctions.getNodeParameter('emailUid', itemIndex) as string;

		ParameterValidator.validateMailbox(mailbox);
		ParameterValidator.validateUid(emailUid);

		try {
			await client.mailboxOpen(mailbox);
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to open folder ${mailbox}: ${(error as Error).message}`,
			});
		}

		let message;
		try {
			message = await client.fetchOne(emailUid, {
				source: true,
				envelope: true,
				flags: true,
			});
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

		return {
			uid: message.uid,
			subject: parsed.subject || '',
			from: parsed.from || {},
			to: normalizeAddresses(parsed.to),
			cc: normalizeAddresses(parsed.cc),
			bcc: normalizeAddresses(parsed.bcc),
			date: parsed.date || null,
			text: parsed.text || '',
			html: parsed.html || '',
			attachments: parsed.attachments?.map(att => ({
				filename: att.filename,
				contentType: att.contentType,
				size: att.size,
			})) || [],
			flags: message.flags || new Set(),
			seen: message.flags?.has('\\Seen') || false,
			size: message.size,
		};
	}
}
