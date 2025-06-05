import { ImapFlow } from 'imapflow';
import { IExecuteFunctions, NodeApiError } from 'n8n-workflow';
import { ParameterValidator } from '../utils/helpers';
import { IImapOperation } from '../utils/types';

export class DeleteEmailOperation implements IImapOperation {
	async execute(
		executeFunctions: IExecuteFunctions,
		client: ImapFlow,
		itemIndex: number,
	): Promise<any> {
		const mailboxParam = executeFunctions.getNodeParameter('mailbox', itemIndex) as string | { mode: string; value: string };
		const mailbox = ParameterValidator.extractMailboxName(mailboxParam);
		const emailUid = executeFunctions.getNodeParameter('emailUid', itemIndex) as string;

		ParameterValidator.validateMailbox(mailboxParam);
		ParameterValidator.validateUid(emailUid);

		try {
			await client.mailboxOpen(mailbox);
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to open mailbox ${mailbox}: ${(error as Error).message}`,
			});
		}

		try {
			await client.messageFlagsAdd(emailUid, ['\\Deleted']);
			// Note: Some IMAP servers auto-expunge, others require manual expunge
			// For now, we just mark as deleted - actual deletion depends on server settings

			return {
				success: true,
				message: `Email marked as deleted in ${mailbox}`,
				uid: emailUid,
				note: 'Email marked as deleted. Actual removal depends on server settings.',
			};
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to delete email: ${(error as Error).message}`,
			});
		}
	}
}
