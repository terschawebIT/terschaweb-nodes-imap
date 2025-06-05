import { ImapFlow } from 'imapflow';
import { IExecuteFunctions, NodeApiError } from 'n8n-workflow';
import { ParameterValidator } from '../utils/helpers';
import { IImapOperation } from '../utils/types';

export class CreateDraftOperation implements IImapOperation {
	async execute(
		executeFunctions: IExecuteFunctions,
		client: ImapFlow,
		itemIndex: number,
	): Promise<any> {
		const draftFolderParam = executeFunctions.getNodeParameter('draftFolder', itemIndex) as string | { mode: string; value: string };
		const draftFolder = ParameterValidator.extractMailboxName(draftFolderParam);
		const to = executeFunctions.getNodeParameter('to', itemIndex) as string;
		const subject = executeFunctions.getNodeParameter('subject', itemIndex, '') as string;
		const messageFormat = executeFunctions.getNodeParameter('messageFormat', itemIndex, 'text') as string;
		const cc = executeFunctions.getNodeParameter('cc', itemIndex, '') as string;
		const bcc = executeFunctions.getNodeParameter('bcc', itemIndex, '') as string;
		const fromName = executeFunctions.getNodeParameter('fromName', itemIndex, '') as string;

		ParameterValidator.validateMailbox(draftFolderParam);

		if (!to.trim()) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: 'To field is required and cannot be empty',
			});
		}

		// Get message body based on format
		let textBody = '';
		let htmlBody = '';

		if (messageFormat === 'text' || messageFormat === 'both') {
			textBody = executeFunctions.getNodeParameter('textBody', itemIndex, '') as string;
		}

		if (messageFormat === 'html' || messageFormat === 'both') {
			htmlBody = executeFunctions.getNodeParameter('htmlBody', itemIndex, '') as string;
		}

		// Ensure draft folder exists
		try {
			await client.mailboxOpen(draftFolder);
		} catch (error) {
			// Try to create the folder if it doesn't exist
			try {
				await client.mailboxCreate(draftFolder);
				await client.mailboxOpen(draftFolder);
			} catch (createError) {
				throw new NodeApiError(executeFunctions.getNode(), {
					message: `Failed to access or create draft folder ${draftFolder}: ${(createError as Error).message}`,
				});
			}
		}

		// Build email message
		const messageLines: string[] = [];

		// Headers
		messageLines.push(`Date: ${new Date().toUTCString()}`);

		if (fromName.trim()) {
			// Get the actual from email from credentials
			const credentials = await executeFunctions.getCredentials('imap');
			const fromEmail = credentials.user as string;
			messageLines.push(`From: "${fromName.trim()}" <${fromEmail}>`);
		}

		messageLines.push(`To: ${to.trim()}`);

		if (cc.trim()) {
			messageLines.push(`CC: ${cc.trim()}`);
		}

		if (bcc.trim()) {
			messageLines.push(`BCC: ${bcc.trim()}`);
		}

		messageLines.push(`Subject: ${subject}`);
		messageLines.push('MIME-Version: 1.0');

		// Content based on format
		if (messageFormat === 'both' && textBody && htmlBody) {
			// Multipart message
			const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			messageLines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
			messageLines.push('');
			messageLines.push(`--${boundary}`);
			messageLines.push('Content-Type: text/plain; charset=utf-8');
			messageLines.push('Content-Transfer-Encoding: 8bit');
			messageLines.push('');
			messageLines.push(textBody);
			messageLines.push('');
			messageLines.push(`--${boundary}`);
			messageLines.push('Content-Type: text/html; charset=utf-8');
			messageLines.push('Content-Transfer-Encoding: 8bit');
			messageLines.push('');
			messageLines.push(htmlBody);
			messageLines.push('');
			messageLines.push(`--${boundary}--`);
		} else if (messageFormat === 'html' || (messageFormat === 'both' && htmlBody)) {
			// HTML only
			messageLines.push('Content-Type: text/html; charset=utf-8');
			messageLines.push('Content-Transfer-Encoding: 8bit');
			messageLines.push('');
			messageLines.push(htmlBody || textBody);
		} else {
			// Text only
			messageLines.push('Content-Type: text/plain; charset=utf-8');
			messageLines.push('Content-Transfer-Encoding: 8bit');
			messageLines.push('');
			messageLines.push(textBody);
		}

		const messageSource = messageLines.join('\r\n');

		try {
			// Append the draft to the draft folder
			const result = await client.append(draftFolder, messageSource, ['\\Draft']);

			return {
				success: true,
				message: `Draft created successfully in ${draftFolder}`,
				draftFolder: draftFolder,
				to: to,
				subject: subject,
				messageFormat: messageFormat,
				uid: result?.uid || null,
				size: messageSource.length,
				created: new Date().toISOString(),
			};
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to create draft: ${(error as Error).message}`,
			});
		}
	}
}
