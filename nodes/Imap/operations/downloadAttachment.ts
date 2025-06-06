import { ImapFlow } from 'imapflow';
import { simpleParser } from 'mailparser';
import { IExecuteFunctions, NodeApiError } from 'n8n-workflow';
import { ParameterValidator } from '../utils/helpers';
import { IImapOperation } from '../utils/types';

export class DownloadAttachmentOperation implements IImapOperation {
	async execute(
		executeFunctions: IExecuteFunctions,
		client: ImapFlow,
		itemIndex: number,
	): Promise<any> {
		const mailboxParam = executeFunctions.getNodeParameter('mailbox', itemIndex) as string | { mode: string; value: string };
		const mailbox = ParameterValidator.extractMailboxName(mailboxParam);
		const emailUid = executeFunctions.getNodeParameter('emailUid', itemIndex) as string;
		const attachmentIndex = executeFunctions.getNodeParameter(
			'attachmentIndex',
			itemIndex,
		) as number;

		ParameterValidator.validateMailbox(mailboxParam);
		ParameterValidator.validateUid(emailUid);

		try {
			await client.mailboxOpen(mailbox);
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to open mailbox ${mailbox}: ${(error as Error).message}`,
			});
		}

						let message: any;
		try {
			// First verify the UID exists
			const searchResults = await client.search({ uid: emailUid.toString() });
			if (searchResults.length === 0) {
				throw new NodeApiError(executeFunctions.getNode(), {
					message: `Email with UID ${emailUid} not found in ${mailbox}`,
				});
			}

			// Use basic UID FETCH without range syntax
			const messageGenerator = client.fetch(emailUid.toString(), {
				source: true,
				uid: true,
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

		if (!message || !message.source) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Email with UID ${emailUid} not found`,
			});
		}

		                let parsed: any;
                try {
                        parsed = await simpleParser(message.source);
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to parse email: ${(error as Error).message}`,
			});
		}

		if (!parsed.attachments || parsed.attachments.length === 0) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: 'No attachments found in this email',
			});
		}

		if (attachmentIndex >= parsed.attachments.length) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Attachment index ${attachmentIndex} not found. Email has ${parsed.attachments.length} attachments.`,
			});
		}

		const attachment = parsed.attachments[attachmentIndex];

		return {
			filename: attachment.filename,
			contentType: attachment.contentType,
			size: attachment.size,
			content: attachment.content.toString('base64'),
		};
	}
}
