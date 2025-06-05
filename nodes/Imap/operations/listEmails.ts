import { IExecuteFunctions, INodeExecutionData, NodeApiError } from 'n8n-workflow';
import { ImapFlow } from 'imapflow';
import { IImapOperation } from '../utils/types';
import { ParameterValidator } from '../utils/helpers';

export class ListEmailsOperation implements IImapOperation {
	async execute(
		executeFunctions: IExecuteFunctions,
		client: ImapFlow,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		const mailbox = executeFunctions.getNodeParameter('mailbox', itemIndex) as string;
		const limit = executeFunctions.getNodeParameter('limit', itemIndex) as number;

		ParameterValidator.validateMailbox(mailbox);
		const validatedLimit = ParameterValidator.validateLimit(limit);

		try {
			await client.mailboxOpen(mailbox);
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to open folder ${mailbox}: ${(error as Error).message}`,
			});
		}

		// Get folder status to know total message count
		let folderStatus;
		try {
			folderStatus = await client.status(mailbox, { messages: true, recent: true, unseen: true });
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to get folder status: ${(error as Error).message}`,
			});
		}

		const totalMessages = folderStatus.messages || 0;

		if (totalMessages === 0) {
			return [{
				json: {
					message: `No emails found in folder: ${mailbox}`,
					totalMessages: 0,
					folder: mailbox,
				}
			}];
		}

		// Calculate range to fetch (newest emails first)
		const startSeq = Math.max(1, totalMessages - validatedLimit + 1);
		const endSeq = totalMessages;
		const fetchRange = `${startSeq}:${endSeq}`;

		const messages: INodeExecutionData[] = [];

		try {
			// Fetch only the newest emails efficiently
			for await (const message of client.fetch(fetchRange, {
				envelope: true,
				flags: true,
				size: true,
				uid: true,
			})) {
				messages.push({
					json: {
						uid: message.uid,
						sequence: message.seq,
						subject: message.envelope?.subject || '',
						from: message.envelope?.from?.[0] || {},
						to: message.envelope?.to || [],
						date: message.envelope?.date || null,
						size: message.size,
						flags: Array.from(message.flags || []),
						seen: message.flags?.has('\\Seen') || false,
					}
				});
			}

			// Sort by UID descending (newest first)
			messages.sort((a, b) => (b.json.uid as number) - (a.json.uid as number));

			// Add folder summary as first item
			messages.unshift({
				json: {
					folderSummary: {
						folder: mailbox,
						totalMessages: totalMessages,
						returned: messages.length - 1, // Exclude this summary
						recentMessages: folderStatus.recent || 0,
						unseenMessages: folderStatus.unseen || 0,
						fetchRange: fetchRange,
					}
				}
			});

		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to fetch emails from ${mailbox}: ${(error as Error).message}`,
			});
		}

		return messages;
	}
}
