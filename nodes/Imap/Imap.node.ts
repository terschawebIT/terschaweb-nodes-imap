import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
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
					name: 'Create Draft',
					value: 'createDraft',
					description: 'Create a new email draft',
					action: 'Create draft',
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
				type: 'resourceLocator',
				default: { mode: 'list', value: 'INBOX' },
				description: 'The email folder to work with',
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						placeholder: 'Select a folder...',
						typeOptions: {
							searchListMethod: 'getMailboxes',
							searchable: true,
						},
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						placeholder: 'e.g. INBOX',
					},
				],
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
				type: 'resourceLocator',
				default: { mode: 'list', value: '' },
				required: true,
				description: 'The folder to move the email to',
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						placeholder: 'Select a target folder...',
						typeOptions: {
							searchListMethod: 'getMailboxes',
							searchable: true,
						},
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						placeholder: 'e.g. Sent',
					},
				],
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
			// Search mode
			{
				displayName: 'Search Mode',
				name: 'searchMode',
				type: 'options',
				options: [
					{
						name: 'Simple Query',
						value: 'simple',
						description: 'Use text-based search query',
					},
					{
						name: 'Advanced Filters',
						value: 'advanced',
						description: 'Use detailed search filters',
					},
				],
				default: 'simple',
				displayOptions: {
					show: {
						operation: ['searchEmails'],
					},
				},
			},
			// Simple search query
			{
				displayName: 'Search Query',
				name: 'searchQuery',
				type: 'string',
				default: '',
				description: 'Search query (e.g., "from:example@email.com", "subject:important")',
				displayOptions: {
					show: {
						operation: ['searchEmails'],
						searchMode: ['simple'],
					},
				},
			},
			// Advanced search filters
			{
				displayName: 'From',
				name: 'fromEmail',
				type: 'string',
				default: '',
				description: 'Search emails from this sender',
				displayOptions: {
					show: {
						operation: ['searchEmails'],
						searchMode: ['advanced'],
					},
				},
			},
			{
				displayName: 'To',
				name: 'toEmail',
				type: 'string',
				default: '',
				description: 'Search emails sent to this recipient',
				displayOptions: {
					show: {
						operation: ['searchEmails'],
						searchMode: ['advanced'],
					},
				},
			},
			{
				displayName: 'Subject',
				name: 'subjectFilter',
				type: 'string',
				default: '',
				description: 'Search emails with this subject text',
				displayOptions: {
					show: {
						operation: ['searchEmails'],
						searchMode: ['advanced'],
					},
				},
			},
			{
				displayName: 'Body Text',
				name: 'bodyText',
				type: 'string',
				default: '',
				description: 'Search for text in email body',
				displayOptions: {
					show: {
						operation: ['searchEmails'],
						searchMode: ['advanced'],
					},
				},
			},
			{
				displayName: 'Read Status',
				name: 'readStatus',
				type: 'options',
				options: [
					{
						name: 'All',
						value: 'all',
					},
					{
						name: 'Read Only',
						value: 'read',
					},
					{
						name: 'Unread Only',
						value: 'unread',
					},
				],
				default: 'all',
				displayOptions: {
					show: {
						operation: ['searchEmails'],
						searchMode: ['advanced'],
					},
				},
			},
			{
				displayName: 'Flagged Status',
				name: 'flaggedStatus',
				type: 'options',
				options: [
					{
						name: 'All',
						value: 'all',
					},
					{
						name: 'Flagged Only',
						value: 'flagged',
					},
					{
						name: 'Unflagged Only',
						value: 'unflagged',
					},
				],
				default: 'all',
				displayOptions: {
					show: {
						operation: ['searchEmails'],
						searchMode: ['advanced'],
					},
				},
			},
			{
				displayName: 'Date Range',
				name: 'dateRange',
				type: 'options',
				options: [
					{
						name: 'All Time',
						value: 'all',
					},
					{
						name: 'Today',
						value: 'today',
					},
					{
						name: 'Yesterday',
						value: 'yesterday',
					},
					{
						name: 'Last 7 Days',
						value: 'week',
					},
					{
						name: 'Last 30 Days',
						value: 'month',
					},
					{
						name: 'Custom Date',
						value: 'custom',
					},
				],
				default: 'all',
				displayOptions: {
					show: {
						operation: ['searchEmails'],
						searchMode: ['advanced'],
					},
				},
			},
			{
				displayName: 'Since Date',
				name: 'sinceDate',
				type: 'dateTime',
				default: '',
				description: 'Search emails received since this date',
				displayOptions: {
					show: {
						operation: ['searchEmails'],
						searchMode: ['advanced'],
						dateRange: ['custom'],
					},
				},
			},
			{
				displayName: 'Before Date',
				name: 'beforeDate',
				type: 'dateTime',
				default: '',
				description: 'Search emails received before this date',
				displayOptions: {
					show: {
						operation: ['searchEmails'],
						searchMode: ['advanced'],
						dateRange: ['custom'],
					},
				},
			},
			{
				displayName: 'Has Attachments',
				name: 'hasAttachments',
				type: 'options',
				options: [
					{
						name: 'All',
						value: 'all',
					},
					{
						name: 'With Attachments',
						value: 'yes',
					},
					{
						name: 'Without Attachments',
						value: 'no',
					},
				],
				default: 'all',
				displayOptions: {
					show: {
						operation: ['searchEmails'],
						searchMode: ['advanced'],
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
			// Draft folder for createDraft
			{
				displayName: 'Draft Folder',
				name: 'draftFolder',
				type: 'resourceLocator',
				default: { mode: 'name', value: 'Drafts' },
				description: 'The folder to save the draft in',
				modes: [
					{
						displayName: 'From List',
						name: 'list',
						type: 'list',
						placeholder: 'Select a folder...',
						typeOptions: {
							searchListMethod: 'getMailboxes',
							searchable: true,
						},
					},
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						placeholder: 'e.g. Drafts',
					},
				],
				displayOptions: {
					show: {
						operation: ['createDraft'],
					},
				},
			},
			// Email fields for createDraft
			{
				displayName: 'To',
				name: 'to',
				type: 'string',
				default: '',
				required: true,
				description: 'Recipient email address(es), separated by commas',
				displayOptions: {
					show: {
						operation: ['createDraft'],
					},
				},
			},
			{
				displayName: 'Subject',
				name: 'subject',
				type: 'string',
				default: '',
				description: 'Email subject',
				displayOptions: {
					show: {
						operation: ['createDraft'],
					},
				},
			},
			{
				displayName: 'Message Format',
				name: 'messageFormat',
				type: 'options',
				options: [
					{
						name: 'Text',
						value: 'text',
					},
					{
						name: 'HTML',
						value: 'html',
					},
					{
						name: 'Both',
						value: 'both',
					},
				],
				default: 'text',
				displayOptions: {
					show: {
						operation: ['createDraft'],
					},
				},
			},
			{
				displayName: 'Text Body',
				name: 'textBody',
				type: 'string',
				typeOptions: {
					rows: 6,
				},
				default: '',
				description: 'Plain text message body',
				displayOptions: {
					show: {
						operation: ['createDraft'],
						messageFormat: ['text', 'both'],
					},
				},
			},
			{
				displayName: 'HTML Body',
				name: 'htmlBody',
				type: 'string',
				typeOptions: {
					rows: 6,
				},
				default: '',
				description: 'HTML message body',
				displayOptions: {
					show: {
						operation: ['createDraft'],
						messageFormat: ['html', 'both'],
					},
				},
			},
			{
				displayName: 'CC',
				name: 'cc',
				type: 'string',
				default: '',
				description: 'CC recipients, separated by commas',
				displayOptions: {
					show: {
						operation: ['createDraft'],
					},
				},
			},
			{
				displayName: 'BCC',
				name: 'bcc',
				type: 'string',
				default: '',
				description: 'BCC recipients, separated by commas',
				displayOptions: {
					show: {
						operation: ['createDraft'],
					},
				},
			},
			{
				displayName: 'From Name',
				name: 'fromName',
				type: 'string',
				default: '',
				description: 'Display name for sender (optional)',
				displayOptions: {
					show: {
						operation: ['createDraft'],
					},
				},
			},
			// Download attachments for getEmail
			{
				displayName: 'Download Attachments',
				name: 'downloadAttachments',
				type: 'boolean',
				default: false,
				description: 'Whether to download all attachments as binary data',
				displayOptions: {
					show: {
						operation: ['getEmail'],
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

	methods = {
		loadOptions: {
			async getMailboxes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
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
					await client.connect();
					const mailboxes = await client.list();

					return mailboxes
						.filter(mailbox => !mailbox.flags?.has('\\Noselect'))
						.map(mailbox => ({
							name: mailbox.name,
							value: mailbox.name,
						}))
						.sort((a, b) => a.name.localeCompare(b.name));
				} catch (error) {
					throw new NodeApiError(this.getNode(), {
						message: `Failed to load mailboxes: ${(error as Error).message}`,
					});
				} finally {
					try {
						await client.logout();
					} catch (error) {
						// Ignore close errors
					}
				}
			},
		},
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
