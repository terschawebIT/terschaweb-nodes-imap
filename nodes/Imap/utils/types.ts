import { ImapFlow } from 'imapflow';
import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

export interface IImapOperation {
	execute(
		executeFunctions: IExecuteFunctions,
		client: ImapFlow,
		itemIndex: number,
	): Promise<INodeExecutionData[] | any>;
}

export interface IEmailData {
	uid: number;
	subject: string;
	from: any;
	to: any[];
	cc?: any[];
	bcc?: any[];
	date: Date | null;
	text?: string;
	html?: string;
	attachments?: IAttachmentData[];
	flags: Set<string>;
	seen: boolean;
	size?: number;
}

export interface IAttachmentData {
	filename?: string;
	contentType: string;
	size: number;
	content?: string;
}

export interface IMailboxData {
	name: string;
	path: string;
	delimiter: string;
	flags: string[];
	subscribed: boolean;
	hasChildren: boolean;
	noSelect: boolean;
}

export interface ISearchCriteria {
	from?: string;
	to?: string;
	subject?: string;
	text?: string;
	since?: Date;
	before?: Date;
}
