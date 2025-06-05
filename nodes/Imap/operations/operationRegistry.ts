import { IImapOperation } from '../utils/types';
import { ListEmailsOperation } from './listEmails';
import { GetEmailOperation } from './getEmail';
import { SearchEmailsOperation } from './searchEmails';
import { MoveEmailOperation } from './moveEmail';
import { MarkEmailOperation } from './markEmail';
import { DeleteEmailOperation } from './deleteEmail';
import { ListMailboxesOperation } from './listMailboxes';
import { CreateMailboxOperation } from './createMailbox';
import { DownloadAttachmentOperation } from './downloadAttachment';

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
