import { ImapFlow } from 'imapflow';
import { IExecuteFunctions, NodeApiError } from 'n8n-workflow';
import { ParameterValidator } from '../utils/helpers';
import { IImapOperation } from '../utils/types';

export class MarkEmailOperation implements IImapOperation {
	async execute(
		executeFunctions: IExecuteFunctions,
		client: ImapFlow,
		itemIndex: number,
	): Promise<any> {
		const mailboxParam = executeFunctions.getNodeParameter('mailbox', itemIndex) as string | { mode: string; value: string };
		const mailbox = ParameterValidator.extractMailboxName(mailboxParam);
		const emailUid = executeFunctions.getNodeParameter('emailUid', itemIndex) as string;
		const markAs = executeFunctions.getNodeParameter('markAs', itemIndex) as string;

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
			if (markAs === 'read') {
				await client.messageFlagsAdd(emailUid, ['\\Seen']);
			} else {
				await client.messageFlagsRemove(emailUid, ['\\Seen']);
			}

			return {
				success: true,
				message: `Email marked as ${markAs}`,
				uid: emailUid,
			};
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to mark email: ${(error as Error).message}`,
			});
		}
	}
}
