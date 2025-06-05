import { IExecuteFunctions, NodeApiError } from 'n8n-workflow';
import { ImapFlow } from 'imapflow';
import { IImapOperation } from '../utils/types';
import { ParameterValidator } from '../utils/helpers';

export class CreateMailboxOperation implements IImapOperation {
	async execute(
		executeFunctions: IExecuteFunctions,
		client: ImapFlow,
		itemIndex: number,
	): Promise<any> {
		const mailboxName = executeFunctions.getNodeParameter('mailboxName', itemIndex) as string;

		ParameterValidator.validateMailbox(mailboxName);

		try {
			const result = await client.mailboxCreate(mailboxName);

			return {
				success: true,
				message: `Mailbox '${mailboxName}' created successfully`,
				mailbox: mailboxName,
				result,
			};
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to create mailbox '${mailboxName}': ${(error as Error).message}`,
			});
		}
	}
}
