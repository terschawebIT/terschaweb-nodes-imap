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
	// Search criteria for search operation
	{
		displayName: 'Search Criteria',
		name: 'searchCriteria',
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
				name: 'From Sender',
				value: 'from',
				description: 'Search emails from specific sender',
			},
			{
				name: 'To Recipient',
				value: 'to',
				description: 'Search emails to specific recipient',
			},
			{
				name: 'Subject Contains',
				value: 'subject',
				description: 'Search emails with specific text in subject',
			},
			{
				name: 'Body Contains',
				value: 'body',
				description: 'Search emails with specific text in body',
			},
			{
				name: 'Time Based',
				value: 'time',
				description: 'Search emails based on time criteria',
			},
		],
		default: 'all',
		description: 'The search criteria to use',
		displayOptions: {
			show: {
				operation: ['searchEmails'],
			},
		},
	},
	// Search value for specific search criteria
	{
		displayName: 'Search Value',
		name: 'searchValue',
		type: 'string',
		default: '',
		description: 'The value to search for (email address, text, etc.)',
		displayOptions: {
			show: {
				operation: ['searchEmails'],
				searchCriteria: ['from', 'to', 'subject', 'body'],
			},
		},
	},
	// Time criteria for time-based search
	{
		displayName: 'Time Criteria',
		name: 'timeCriteria',
		type: 'options',
		options: [
			{
				name: 'Last Hour',
				value: 'lastHour',
				description: 'Emails from the last hour',
			},
			{
				name: 'Last 6 Hours',
				value: 'last6Hours',
				description: 'Emails from the last 6 hours',
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
			{
				name: 'Since Date',
				value: 'since',
				description: 'Emails since a specific date',
			},
			{
				name: 'Before Date',
				value: 'before',
				description: 'Emails before a specific date',
			},
			{
				name: 'On Date',
				value: 'on',
				description: 'Emails on a specific date',
			},
		],
		default: 'today',
		description: 'Time-based search criteria',
		displayOptions: {
			show: {
				operation: ['searchEmails'],
				searchCriteria: ['time'],
			},
		},
	},
	// Date field for time-based search
	{
		displayName: 'Date',
		name: 'searchDate',
		type: 'dateTime',
		default: '',
		description: 'The date to search for (for since/before/on criteria)',
		displayOptions: {
			show: {
				operation: ['searchEmails'],
				searchCriteria: ['time'],
				timeCriteria: ['since', 'before', 'on'],
			},
		},
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
