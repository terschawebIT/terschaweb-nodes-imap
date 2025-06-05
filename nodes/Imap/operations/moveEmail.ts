import { ImapFlow } from 'imapflow';
import { IExecuteFunctions, NodeApiError } from 'n8n-workflow';
import { ParameterValidator } from '../utils/helpers';
import { IImapOperation } from '../utils/types';

export class MoveEmailOperation implements IImapOperation {
	async execute(
		executeFunctions: IExecuteFunctions,
		client: ImapFlow,
		itemIndex: number,
	): Promise<any> {
		const mailbox = executeFunctions.getNodeParameter('mailbox', itemIndex) as string;
		const emailUid = executeFunctions.getNodeParameter('emailUid', itemIndex) as string;
		const targetMailbox = executeFunctions.getNodeParameter('targetMailbox', itemIndex) as string;

		ParameterValidator.validateMailbox(mailbox);
		ParameterValidator.validateUid(emailUid);
		ParameterValidator.validateMailbox(targetMailbox);

		try {
			await client.mailboxOpen(mailbox);
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to open mailbox ${mailbox}: ${(error as Error).message}`,
			});
		}

		try {
			const result = await client.messageMove(emailUid, targetMailbox);

			return {
				success: true,
				message: `Email moved from ${mailbox} to ${targetMailbox}`,
				uid: emailUid,
				destination: result?.destination || null,
			};
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to move email: ${(error as Error).message}`,
			});
		}
	}
}
