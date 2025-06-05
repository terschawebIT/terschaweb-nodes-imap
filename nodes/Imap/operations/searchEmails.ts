import { ImapFlow } from 'imapflow';
import { IExecuteFunctions, INodeExecutionData, NodeApiError } from 'n8n-workflow';
import { ParameterValidator, SearchQueryParser } from '../utils/helpers';
import { IImapOperation } from '../utils/types';

export class SearchEmailsOperation implements IImapOperation {
	async execute(
		executeFunctions: IExecuteFunctions,
		client: ImapFlow,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		const mailboxParam = executeFunctions.getNodeParameter('mailbox', itemIndex) as string | { mode: string; value: string };
		const mailbox = ParameterValidator.extractMailboxName(mailboxParam);
		const searchMode = executeFunctions.getNodeParameter('searchMode', itemIndex, 'simple') as string;
		const limit = executeFunctions.getNodeParameter('limit', itemIndex) as number;

		ParameterValidator.validateMailbox(mailboxParam);
		const validatedLimit = ParameterValidator.validateLimit(limit);

		// Build search criteria based on mode
		let searchCriteria: any;
		let searchDisplayText: string;

		if (searchMode === 'simple') {
			const searchQuery = executeFunctions.getNodeParameter('searchQuery', itemIndex) as string;
			ParameterValidator.validateSearchQuery(searchQuery);
			searchCriteria = SearchQueryParser.parse(searchQuery);
			searchDisplayText = searchQuery;
		} else {
			// Advanced mode - build criteria from individual fields
			const result = this.buildAdvancedSearchCriteria(executeFunctions, itemIndex);
			searchCriteria = result.criteria;
			searchDisplayText = result.displayText;
		}

		try {
			await client.mailboxOpen(mailbox);
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to open folder ${mailbox}: ${(error as Error).message}`,
			});
		}

		// Perform server-side search
		let searchResults: number[];
		try {
			// Use IMAP SEARCH command for server-side filtering
			searchResults = await client.search(searchCriteria);
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Server-side search failed: ${(error as Error).message}. Query: ${searchDisplayText}`,
			});
		}

		if (searchResults.length === 0) {
			return [
				{
					json: {
						message: `No emails found matching criteria: ${searchDisplayText}`,
						totalFound: 0,
						folder: mailbox,
					},
				},
			];
		}

		// Limit results and sort by UID (newest first)
		const sortedResults = searchResults.sort((a, b) => b - a);
		const limitedResults = sortedResults.slice(0, validatedLimit);

		const messages: INodeExecutionData[] = [];

		// Fetch only the metadata for found emails (efficient)
		for (const uid of limitedResults) {
			try {
				const message = await client.fetchOne(uid.toString(), {
					envelope: true,
					flags: true,
					size: true,
					uid: true,
				});

				if (message) {
					messages.push({
						json: {
							uid: message.uid,
							subject: message.envelope?.subject || '',
							from: message.envelope?.from?.[0] || {},
							to: message.envelope?.to || [],
							date: message.envelope?.date || null,
							size: message.size,
							flags: Array.from(message.flags || []),
							seen: message.flags?.has('\\Seen') || false,
							// Add search context
							searchQuery: searchDisplayText,
							searchCriteria: searchCriteria,
						},
					});
				}
			} catch (error) {
				// Log but continue with other emails
				console.warn(`Failed to fetch email UID ${uid}: ${(error as Error).message}`);
				continue;
			}
		}

		// Add summary information
		if (messages.length > 0) {
			messages.unshift({
				json: {
					searchSummary: {
						query: searchDisplayText,
						totalFound: searchResults.length,
						returned: messages.length - 1, // Exclude this summary
						folder: mailbox,
						serverSideSearch: true,
					},
				},
			});
		}

		return messages;
	}

	private buildAdvancedSearchCriteria(executeFunctions: IExecuteFunctions, itemIndex: number): { criteria: any; displayText: string } {
		const criteria: any = {};
		const displayParts: string[] = [];

		// From filter
		const fromEmail = executeFunctions.getNodeParameter('fromEmail', itemIndex, '') as string;
		if (fromEmail.trim()) {
			criteria.from = fromEmail.trim();
			displayParts.push(`from:${fromEmail.trim()}`);
		}

		// To filter
		const toEmail = executeFunctions.getNodeParameter('toEmail', itemIndex, '') as string;
		if (toEmail.trim()) {
			criteria.to = toEmail.trim();
			displayParts.push(`to:${toEmail.trim()}`);
		}

		// Subject filter
		const subjectFilter = executeFunctions.getNodeParameter('subjectFilter', itemIndex, '') as string;
		if (subjectFilter.trim()) {
			criteria.subject = subjectFilter.trim();
			displayParts.push(`subject:${subjectFilter.trim()}`);
		}

		// Body text filter
		const bodyText = executeFunctions.getNodeParameter('bodyText', itemIndex, '') as string;
		if (bodyText.trim()) {
			criteria.body = bodyText.trim();
			displayParts.push(`body:${bodyText.trim()}`);
		}

		// Read status
		const readStatus = executeFunctions.getNodeParameter('readStatus', itemIndex, 'all') as string;
		if (readStatus === 'read') {
			criteria.seen = true;
			displayParts.push('read');
		} else if (readStatus === 'unread') {
			criteria.unseen = true;
			displayParts.push('unread');
		}

		// Flagged status
		const flaggedStatus = executeFunctions.getNodeParameter('flaggedStatus', itemIndex, 'all') as string;
		if (flaggedStatus === 'flagged') {
			criteria.flagged = true;
			displayParts.push('flagged');
		} else if (flaggedStatus === 'unflagged') {
			criteria.unflagged = true;
			displayParts.push('unflagged');
		}

		// Date range
		const dateRange = executeFunctions.getNodeParameter('dateRange', itemIndex, 'all') as string;
		const now = new Date();

		switch (dateRange) {
			case 'hour':
				const hourAgo = new Date(now.getTime() - (60 * 60 * 1000));
				criteria.since = hourAgo;
				displayParts.push('since:1h');
				break;
			case '6hours':
				const sixHoursAgo = new Date(now.getTime() - (6 * 60 * 60 * 1000));
				criteria.since = sixHoursAgo;
				displayParts.push('since:6h');
				break;
			case '12hours':
				const twelveHoursAgo = new Date(now.getTime() - (12 * 60 * 60 * 1000));
				criteria.since = twelveHoursAgo;
				displayParts.push('since:12h');
				break;
			case 'today':
				criteria.since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				displayParts.push('since:today');
				break;
			case 'yesterday':
				const yesterday = new Date(now);
				yesterday.setDate(yesterday.getDate() - 1);
				criteria.since = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
				criteria.before = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				displayParts.push('since:yesterday');
				break;
			case '3days':
				const threeDaysAgo = new Date(now);
				threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
				criteria.since = threeDaysAgo;
				displayParts.push('since:3d');
				break;
			case 'week':
				const weekAgo = new Date(now);
				weekAgo.setDate(weekAgo.getDate() - 7);
				criteria.since = weekAgo;
				displayParts.push('since:7d');
				break;
			case 'month':
				const monthAgo = new Date(now);
				monthAgo.setDate(monthAgo.getDate() - 30);
				criteria.since = monthAgo;
				displayParts.push('since:30d');
				break;
			case 'custom':
				const sinceDate = executeFunctions.getNodeParameter('sinceDate', itemIndex, '') as string;
				const beforeDate = executeFunctions.getNodeParameter('beforeDate', itemIndex, '') as string;

				if (sinceDate) {
					criteria.since = new Date(sinceDate);
					displayParts.push(`since:${sinceDate}`);
				}
				if (beforeDate) {
					criteria.before = new Date(beforeDate);
					displayParts.push(`before:${beforeDate}`);
				}
				break;
		}

		// Has attachments (Note: IMAP doesn't have direct attachment search, we approximate with size)
		const hasAttachments = executeFunctions.getNodeParameter('hasAttachments', itemIndex, 'all') as string;
		if (hasAttachments === 'yes') {
			criteria.larger = 50000; // Assume emails > 50KB likely have attachments
			displayParts.push('larger:50000');
		}

		// If no criteria specified, search all
		if (Object.keys(criteria).length === 0) {
			criteria.all = true;
			return { criteria, displayText: 'all emails' };
		}

		return {
			criteria,
			displayText: displayParts.length > 0 ? displayParts.join(' AND ') : 'advanced search'
		};
	}
}
