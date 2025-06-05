import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeApiError,
	NodeConnectionType,
} from 'n8n-workflow';

import { ImapFlow } from 'imapflow';
import { OperationRegistry } from './operations/operationRegistry';

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
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'List Emails',
						value: 'listEmails',
						description: 'Get a list of emails from a folder',
						action: 'List emails from folder',
					},
					{
						name: 'Get Email',
						value: 'getEmail',
						description: 'Get a specific email with full content',
						action: 'Get email content',
					},
					{
						name: 'Search Emails',
						value: 'searchEmails',
						description: 'Search for emails using server-side criteria',
						action: 'Search emails',
					},
					{
						name: 'Move Email',
						value: 'moveEmail',
						description: 'Move an email to another folder',
						action: 'Move email',
					},
					{
						name: 'Mark as Read/Unread',
						value: 'markEmail',
						description: 'Mark an email as read or unread',
						action: 'Mark email',
					},
					{
						name: 'Delete Email',
						value: 'deleteEmail',
						description: 'Delete an email',
						action: 'Delete email',
					},
					{
						name: 'List Folders',
						value: 'listMailboxes',
						description: 'Get a list of all email folders',
						action: 'List folders',
					},
					{
						name: 'Create Folder',
						value: 'createMailbox',
						description: 'Create a new email folder',
						action: 'Create folder',
					},
					{
						name: 'Download Attachment',
						value: 'downloadAttachment',
						description: 'Download an email attachment',
						action: 'Download attachment',
					},
				],
				default: 'listEmails',
			},
			// Folder field (used by most operations)
			{
				displayName: 'Folder',
				name: 'mailbox',
				type: 'string',
				default: 'INBOX',
				description: 'The email folder to work with (e.g., INBOX, Sent, Draft)',
				displayOptions: {
					show: {
						operation: [
							'listEmails',
							'getEmail',
							'searchEmails',
							'moveEmail',
							'markEmail',
							'deleteEmail',
							'downloadAttachment',
						],
					},
				},
			},
			// Email ID/UID field
			{
				displayName: 'Email UID',
				name: 'emailUid',
				type: 'string',
				default: '',
				required: true,
				description: 'The unique identifier of the email',
				displayOptions: {
					show: {
						operation: ['getEmail', 'moveEmail', 'markEmail', 'deleteEmail', 'downloadAttachment'],
					},
				},
			},
			// Target folder for move operation
			{
				displayName: 'Target Folder',
				name: 'targetMailbox',
				type: 'string',
				default: '',
				required: true,
				description: 'The folder to move the email to',
				displayOptions: {
					show: {
						operation: ['moveEmail'],
					},
				},
			},
			// Mark as read/unread option
			{
				displayName: 'Mark As',
				name: 'markAs',
				type: 'options',
				options: [
					{
						name: 'Read',
						value: 'read',
					},
					{
						name: 'Unread',
						value: 'unread',
					},
				],
				default: 'read',
				displayOptions: {
					show: {
						operation: ['markEmail'],
					},
				},
			},
			// Search criteria
			{
				displayName: 'Search Query',
				name: 'searchQuery',
				type: 'string',
				default: '',
				description: 'Search query (e.g., "from:example@email.com", "subject:important")',
				displayOptions: {
					show: {
						operation: ['searchEmails'],
					},
				},
			},
			// Limit for list operations
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				description: 'Maximum number of emails to return',
				displayOptions: {
					show: {
						operation: ['listEmails', 'searchEmails'],
					},
				},
			},
			// New folder name
			{
				displayName: 'Folder Name',
				name: 'mailboxName',
				type: 'string',
				default: '',
				required: true,
				description: 'Name of the new folder to create',
				displayOptions: {
					show: {
						operation: ['createMailbox'],
					},
				},
			},
			// Attachment index
			{
				displayName: 'Attachment Index',
				name: 'attachmentIndex',
				type: 'number',
				default: 0,
				description: 'Index of the attachment to download (starting from 0)',
				displayOptions: {
					show: {
						operation: ['downloadAttachment'],
					},
				},
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Get credentials
		const credentials = await this.getCredentials('imap');

		// Create IMAP client
		const client = new ImapFlow({
			host: credentials.host as string,
			port: credentials.port as number,
			secure: credentials.secure as boolean,
			auth: {
				user: credentials.user as string,
				pass: credentials.password as string,
			},
		});

		try {
			// Connect to IMAP server
			await client.connect();

			for (let i = 0; i < items.length; i++) {
				const operation = this.getNodeParameter('operation', i) as string;

				try {
					// Get the operation handler from registry
					const operationHandler = OperationRegistry.getOperation(operation);

					// Execute the operation
					const result = await operationHandler.execute(this, client, i);

					// Process the result
					if (Array.isArray(result)) {
						returnData.push(...result);
					} else {
						returnData.push({ json: result });
					}
				} catch (error) {
					if (this.continueOnFail()) {
						returnData.push({
							json: { error: (error as Error).message },
							pairedItem: { item: i },
						});
					} else {
						throw error;
					}
				}
			}
		} finally {
			// Always close the connection
			try {
				await client.logout();
			} catch (error) {
				// Ignore close errors
			}
		}

		return [returnData];
	}
}
