import { IImapOperation } from '../utils/types';
import { CreateMailboxOperation } from './createMailbox';
import { DeleteEmailOperation } from './deleteEmail';
import { DownloadAttachmentOperation } from './downloadAttachment';
import { GetEmailOperation } from './getEmail';
import { ListEmailsOperation } from './listEmails';
import { ListMailboxesOperation } from './listMailboxes';
import { MarkEmailOperation } from './markEmail';
import { MoveEmailOperation } from './moveEmail';
import { SearchEmailsOperation } from './searchEmails';

export class OperationRegistry {
	private static operations: Map<string, IImapOperation> = new Map([
		['listEmails', new ListEmailsOperation()],
		['getEmail', new GetEmailOperation()],
		['searchEmails', new SearchEmailsOperation()],
		['moveEmail', new MoveEmailOperation()],
		['markEmail', new MarkEmailOperation()],
		['deleteEmail', new DeleteEmailOperation()],
		['listMailboxes', new ListMailboxesOperation()],
		['createMailbox', new CreateMailboxOperation()],
		['downloadAttachment', new DownloadAttachmentOperation()],
	]);

	static getOperation(operationName: string): IImapOperation {
		const operation = this.operations.get(operationName);
		if (!operation) {
			throw new Error(`Unknown operation: ${operationName}`);
		}
		return operation;
	}

	static getAllOperationNames(): string[] {
		return Array.from(this.operations.keys());
	}
}
