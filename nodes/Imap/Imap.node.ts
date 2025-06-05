import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

import { ImapNodeProperties } from './ImapNodeProperties';
import { ImapMethods } from './ImapMethods';
import { ImapExecuteHandler } from './ImapExecuteHandler';

export class Imap implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'IMAP',
		name: 'imap',
		icon: 'file:imap.svg',
		group: ['communication'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Connect to IMAP servers to manage emails and mailboxes',
		defaults: {
			name: 'IMAP',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		credentials: [
			{
				name: 'imap',
				required: true,
			},
		],
		properties: ImapNodeProperties,
	};

	methods = ImapMethods;

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		return ImapExecuteHandler.execute(this);
	}
}
