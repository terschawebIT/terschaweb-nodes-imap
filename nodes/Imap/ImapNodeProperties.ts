import { INodeProperties } from 'n8n-workflow';

export const ImapNodeProperties: INodeProperties[] = [
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
		description: 'Whether to mark the email as read or unread',
		displayOptions: {
			show: {
				operation: ['markEmail'],
			},
		},
	},
	// Limit for list operations
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 10,
		description: 'Maximum number of emails to return',
		displayOptions: {
			show: {
				operation: ['listEmails', 'searchEmails'],
			},
		},
	},
	// Search criteria for search operation - IMPROVED MULTI-CRITERIA SEARCH
	{
		displayName: 'Search Mode',
		name: 'searchMode',
		type: 'options',
		options: [
			{
				name: 'Simple Search',
				value: 'simple',
				description: 'Quick search with basic filters',
			},
			{
				name: 'Advanced Search',
				value: 'advanced',
				description: 'Combine multiple search criteria',
			},
		],
		default: 'simple',
		description: 'Choose search complexity level',
		displayOptions: {
			show: {
				operation: ['searchEmails'],
			},
		},
	},

	// === SIMPLE SEARCH MODE ===
	{
		displayName: 'Quick Filter',
		name: 'quickFilter',
		type: 'options',
		options: [
			{
				name: 'All Emails',
				value: 'all',
				description: 'Get all emails',
			},
			{
				name: 'Unread Emails',
				value: 'unseen',
				description: 'Get only unread emails',
			},
			{
				name: 'Read Emails',
				value: 'seen',
				description: 'Get only read emails',
			},
			{
				name: 'Today\'s Emails',
				value: 'today',
				description: 'Emails received today',
			},
			{
				name: 'This Week\'s Emails',
				value: 'thisWeek',
				description: 'Emails received this week',
			},
		],
		default: 'all',
		description: 'Quick pre-defined filters',
		displayOptions: {
			show: {
				operation: ['searchEmails'],
				searchMode: ['simple'],
			},
		},
	},
	{
		displayName: 'Search Text (Optional)',
		name: 'simpleSearchText',
		type: 'string',
		default: '',
		placeholder: 'Search in subject, from, or body...',
		description: 'Text to search for in emails (searches subject, sender, and body)',
		displayOptions: {
			show: {
				operation: ['searchEmails'],
				searchMode: ['simple'],
			},
		},
	},

	// === ADVANCED SEARCH MODE ===
	{
		displayName: 'Search Criteria',
		name: 'advancedCriteria',
		type: 'collection',
		placeholder: 'Add Search Criterion',
		default: {},
		description: 'Combine multiple search criteria',
		displayOptions: {
			show: {
				operation: ['searchEmails'],
				searchMode: ['advanced'],
			},
		},
		options: [
			// Sender criteria
			{
				displayName: 'From (Sender)',
				name: 'from',
				type: 'string',
				default: '',
				placeholder: 'sender@example.com or "John Doe"',
				description: 'Search emails from specific sender (email address or name)',
			},
			// Recipient criteria
			{
				displayName: 'To (Recipient)',
				name: 'to',
				type: 'string',
				default: '',
				placeholder: 'recipient@example.com',
				description: 'Search emails sent to specific recipient',
			},
			// Subject criteria
			{
				displayName: 'Subject Contains',
				name: 'subject',
				type: 'string',
				default: '',
				placeholder: 'Meeting, Invoice, etc.',
				description: 'Text that must be in the email subject',
			},
			// Body criteria
			{
				displayName: 'Body Contains',
				name: 'body',
				type: 'string',
				default: '',
				placeholder: 'Important keywords...',
				description: 'Text that must be in the email body',
			},
			// Read status
			{
				displayName: 'Read Status',
				name: 'readStatus',
				type: 'options',
				options: [
					{
						name: 'Any (Read + Unread)',
						value: 'any',
						description: 'Include both read and unread emails',
					},
					{
						name: 'Unread Only',
						value: 'unread',
						description: 'Only unread emails',
					},
					{
						name: 'Read Only',
						value: 'read',
						description: 'Only read emails',
					},
				],
				default: 'any',
				description: 'Filter by read status',
			},
			// Date range
			{
				displayName: 'Date Range',
				name: 'dateRange',
				type: 'fixedCollection',
				default: {},
				description: 'Filter emails by date',
				options: [
					{
						name: 'range',
						displayName: 'Date Range',
						values: [
							{
								displayName: 'From Date',
								name: 'from',
								type: 'dateTime',
								default: '',
								description: 'Start date (emails on or after this date)',
							},
							{
								displayName: 'To Date',
								name: 'to',
								type: 'dateTime',
								default: '',
								description: 'End date (emails before or on this date)',
							},
						],
					},
				],
			},
			// Quick date presets
			{
				displayName: 'Quick Date Filter',
				name: 'quickDate',
				type: 'options',
				options: [
					{
						name: 'None',
						value: 'none',
						description: 'No date filtering',
					},
					{
						name: 'Last Hour',
						value: 'lastHour',
						description: 'Emails from the last hour',
					},
					{
						name: 'Today',
						value: 'today',
						description: 'Emails from today',
					},
					{
						name: 'Yesterday',
						value: 'yesterday',
						description: 'Emails from yesterday',
					},
					{
						name: 'This Week',
						value: 'thisWeek',
						description: 'Emails from this week',
					},
					{
						name: 'Last Week',
						value: 'lastWeek',
						description: 'Emails from last week',
					},
					{
						name: 'This Month',
						value: 'thisMonth',
						description: 'Emails from this month',
					},
					{
						name: 'Last Month',
						value: 'lastMonth',
						description: 'Emails from last month',
					},
				],
				default: 'none',
				description: 'Quick date range presets (overrides custom date range)',
			},
			// Size filter
			{
				displayName: 'Email Size',
				name: 'sizeFilter',
				type: 'fixedCollection',
				default: {},
				description: 'Filter emails by size',
				options: [
					{
						name: 'size',
						displayName: 'Size Filter',
						values: [
							{
								displayName: 'Condition',
								name: 'condition',
								type: 'options',
								options: [
									{
										name: 'Larger than',
										value: 'larger',
										description: 'Emails larger than specified size',
									},
									{
										name: 'Smaller than',
										value: 'smaller',
										description: 'Emails smaller than specified size',
									},
								],
								default: 'larger',
							},
							{
								displayName: 'Size (KB)',
								name: 'sizeKB',
								type: 'number',
								default: 100,
								description: 'Size threshold in kilobytes',
							},
						],
					},
				],
			},
			// Has attachments
			{
				displayName: 'Has Attachments',
				name: 'hasAttachments',
				type: 'options',
				options: [
					{
						name: 'Any',
						value: 'any',
						description: 'Emails with or without attachments',
					},
					{
						name: 'With Attachments',
						value: 'yes',
						description: 'Only emails with attachments',
					},
					{
						name: 'Without Attachments',
						value: 'no',
						description: 'Only emails without attachments',
					},
				],
				default: 'any',
				description: 'Filter by attachment presence',
			},
		],
	},
	// Folder name for create operation
	{
		displayName: 'Folder Name',
		name: 'folderName',
		type: 'string',
		default: '',
		required: true,
		description: 'The name of the folder to create',
		displayOptions: {
			show: {
				operation: ['createMailbox'],
			},
		},
	},
	// Draft creation fields
	{
		displayName: 'To',
		name: 'to',
		type: 'string',
		default: '',
		required: true,
		description: 'Email addresses of recipients, separated by commas',
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
				description: 'Plain text message',
			},
			{
				name: 'HTML',
				value: 'html',
				description: 'HTML formatted message',
			},
			{
				name: 'Both',
				value: 'both',
				description: 'Both text and HTML versions',
			},
		],
		default: 'text',
		description: 'Format of the message body',
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
];
