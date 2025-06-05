import { ImapFlow } from 'imapflow';
import { IExecuteFunctions, INodeExecutionData, NodeApiError } from 'n8n-workflow';
import { IImapOperation } from '../utils/types';

export class ListMailboxesOperation implements IImapOperation {
	async execute(
		executeFunctions: IExecuteFunctions,
		client: ImapFlow,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		try {
			const mailboxes = await client.list();

			return mailboxes.map((mailbox) => ({
				json: {
					name: mailbox.name,
					path: mailbox.path,
					delimiter: mailbox.delimiter,
					flags: mailbox.flags,
					subscribed: mailbox.subscribed,
					hasChildren: mailbox.flags?.has('\\HasChildren') || false,
					noSelect: mailbox.flags?.has('\\Noselect') || false,
				},
			}));
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to list mailboxes: ${(error as Error).message}`,
			});
		}
	}
}
