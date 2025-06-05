import { ImapFlow } from 'imapflow';
import { IExecuteFunctions, INodeExecutionData, NodeApiError } from 'n8n-workflow';
import { ParameterValidator } from '../utils/helpers';
import { IImapOperation } from '../utils/types';

export class SearchEmailsOperation implements IImapOperation {
	async execute(
		executeFunctions: IExecuteFunctions,
		client: ImapFlow,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		const mailboxParam = executeFunctions.getNodeParameter('mailbox', itemIndex) as string | { mode: string; value: string };
		const mailbox = ParameterValidator.extractMailboxName(mailboxParam);
		const limit = executeFunctions.getNodeParameter('limit', itemIndex) as number;
		const searchMode = executeFunctions.getNodeParameter('searchMode', itemIndex) as string;

		ParameterValidator.validateMailbox(mailboxParam);
		const validatedLimit = Math.max(1, Math.min(limit, 1000));

		try {
			await client.mailboxOpen(mailbox);
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to open mailbox ${mailbox}: ${(error as Error).message}`,
			});
		}

		let searchCriteria: any = {};
		let searchDisplayText = '';

		// Build search criteria based on mode
		if (searchMode === 'simple') {
			const quickFilter = executeFunctions.getNodeParameter('quickFilter', itemIndex) as string;
			const simpleSearchText = executeFunctions.getNodeParameter('simpleSearchText', itemIndex) as string;

			searchCriteria = this.buildSimpleSearchCriteria(quickFilter, simpleSearchText);
			searchDisplayText = this.buildSimpleSearchDisplay(quickFilter, simpleSearchText);
		} else {
			// Advanced mode
			const advancedCriteria = executeFunctions.getNodeParameter('advancedCriteria', itemIndex) as any;
			const result = this.buildAdvancedSearchCriteria(advancedCriteria);
			searchCriteria = result.criteria;
			searchDisplayText = result.display;
		}

		console.log('Search criteria:', JSON.stringify(searchCriteria, null, 2));
		console.log('Search display:', searchDisplayText);

		let searchResults: number[] = [];

		try {
			// Use IMAP SEARCH command for server-side filtering
			searchResults = await client.search(searchCriteria);
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Server-side search failed: ${(error as Error).message}. Query: ${searchDisplayText}`,
			});
		}

		console.log(`Server-side search completed. Found ${searchResults.length} UIDs matching criteria`);

		if (searchResults.length === 0) {
			return [
				{
					json: {
						searchSummary: {
							totalFound: 0,
							returned: 0,
							query: searchDisplayText,
							criteria: searchCriteria,
							folder: mailbox,
						},
						uids: [],
						firstUID: null,
					},
				},
			];
		}

		// Limit results and sort by UID (newest first)
		const sortedResults = searchResults.sort((a, b) => b - a);
		const limitedResults = sortedResults.slice(0, validatedLimit);

		console.log(`Returning ${limitedResults.length} UIDs (limited from ${searchResults.length} found)`);

		// Get the actual UIDs of the found emails by fetching them
		// This ensures we have the correct UIDs, not sequence numbers or stale data
		let actualUIDs: number[] = [];

		try {
			console.log(`Fetching actual UIDs for ${limitedResults.length} found emails...`);

			// Use FETCH to get the actual UIDs of the found messages
			for (const result of limitedResults) {
				try {
					// Fetch by sequence number or UID to get the actual UID
					const messageGenerator = client.fetch(result.toString(), {
						uid: true,
					}, { uid: true });

					for await (const msg of messageGenerator) {
						if (msg.uid) {
							actualUIDs.push(msg.uid);
							console.log(`Found actual UID: ${msg.uid} for search result: ${result}`);
						}
						break; // Only need the first message
					}
				} catch (error) {
					console.warn(`Failed to get UID for search result ${result}:`, error);
					continue;
				}
			}

			console.log(`Got ${actualUIDs.length} actual UIDs from ${limitedResults.length} search results`);

			// Sort UIDs by newest first
			actualUIDs.sort((a, b) => b - a);

		} catch (error) {
			console.error('Failed to fetch actual UIDs:', error);
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to get email UIDs: ${(error as Error).message}`,
			});
		}

		// If no valid UIDs found, return empty result
		if (actualUIDs.length === 0) {
			return [
				{
					json: {
						searchSummary: {
							totalFound: searchResults.length,
							returned: 0,
							query: searchDisplayText,
							criteria: searchCriteria,
							folder: mailbox,
							note: "No valid emails found matching criteria",
						},
						uids: [],
						firstUID: null,
					},
				},
			];
		}

		const result = {
			json: {
				searchSummary: {
					totalFound: searchResults.length,
					returned: actualUIDs.length,
					query: searchDisplayText,
					criteria: searchCriteria,
					folder: mailbox,
				},
				uids: actualUIDs, // Actual UIDs from FETCH operation
				// Convenience: return first UID separately
				firstUID: actualUIDs.length > 0 ? actualUIDs[0] : null,
			},
		};

		return [result];
	}

	private buildSimpleSearchCriteria(quickFilter: string, searchText: string): any {
		const criteria: any = {};

		// Apply quick filter
		switch (quickFilter) {
			case 'unseen':
				criteria.unseen = true;
				break;
			case 'seen':
				criteria.seen = true;
				break;
			case 'today':
				criteria.since = new Date(new Date().setHours(0, 0, 0, 0));
				break;
			case 'thisWeek':
				const weekStart = new Date();
				weekStart.setDate(weekStart.getDate() - weekStart.getDay());
				weekStart.setHours(0, 0, 0, 0);
				criteria.since = weekStart;
				break;
			case 'thisMonth':
				const monthStart = new Date();
				monthStart.setDate(1);
				monthStart.setHours(0, 0, 0, 0);
				criteria.since = monthStart;
				break;
			case 'flagged':
				criteria.flagged = true;
				break;
			case 'all':
			default:
				// No additional criteria for 'all'
				break;
		}

		// Apply text search if provided
		if (searchText && searchText.trim()) {
			// Search in subject, from, to, and body
			const text = searchText.trim();

			// Check if it looks like an email address
			if (text.includes('@')) {
				criteria.or = [
					{ from: text },
					{ to: text },
					{ cc: text },
				];
			} else {
				// General text search in multiple fields
				criteria.or = [
					{ subject: text },
					{ from: text },
					{ body: text },
				];
			}
		}

		return criteria;
	}

	private buildSimpleSearchDisplay(quickFilter: string, searchText: string): string {
		const parts: string[] = [];

		switch (quickFilter) {
			case 'unseen':
				parts.push('unread emails');
				break;
			case 'seen':
				parts.push('read emails');
				break;
			case 'today':
				parts.push('emails from today');
				break;
			case 'thisWeek':
				parts.push('emails from this week');
				break;
			case 'thisMonth':
				parts.push('emails from this month');
				break;
			case 'flagged':
				parts.push('flagged emails');
				break;
			case 'all':
			default:
				parts.push('all emails');
				break;
		}

		if (searchText && searchText.trim()) {
			if (searchText.includes('@')) {
				parts.push(`from/to: ${searchText}`);
			} else {
				parts.push(`containing: ${searchText}`);
			}
		}

		return parts.join(' ');
	}

	private buildAdvancedSearchCriteria(advancedCriteria: any): { criteria: any; display: string } {
		const criteria: any = {};
		const displayParts: string[] = [];

		// Subject
		if (advancedCriteria.subject) {
			criteria.subject = advancedCriteria.subject;
			displayParts.push(`subject: ${advancedCriteria.subject}`);
		}

		// From
		if (advancedCriteria.from) {
			criteria.from = advancedCriteria.from;
			displayParts.push(`from: ${advancedCriteria.from}`);
		}

		// To
		if (advancedCriteria.to) {
			criteria.to = advancedCriteria.to;
			displayParts.push(`to: ${advancedCriteria.to}`);
		}

		// Body
		if (advancedCriteria.body) {
			criteria.body = advancedCriteria.body;
			displayParts.push(`body: ${advancedCriteria.body}`);
		}

		// Flags
		if (advancedCriteria.seen !== undefined) {
			if (advancedCriteria.seen) {
				criteria.seen = true;
				displayParts.push('read');
			} else {
				criteria.unseen = true;
				displayParts.push('unread');
			}
		}

		if (advancedCriteria.flagged) {
			criteria.flagged = true;
			displayParts.push('flagged');
		}

		// Date filters
		this.applyDateFilters(criteria, advancedCriteria, displayParts);

		return {
			criteria,
			display: displayParts.length > 0 ? displayParts.join(', ') : 'all emails',
		};
	}

	private applyDateFilters(criteria: any, advancedCriteria: any, displayParts: string[]): void {
		// Quick date filter
		if (advancedCriteria.quickDate && advancedCriteria.quickDate !== 'none') {
			const dateRange = this.getQuickDateRange(advancedCriteria.quickDate);
			Object.assign(criteria, dateRange);
			displayParts.push(`date: ${advancedCriteria.quickDate}`);
		}

		// Custom date range
		if (advancedCriteria.dateFrom) {
			criteria.since = new Date(advancedCriteria.dateFrom);
			displayParts.push(`since: ${advancedCriteria.dateFrom}`);
		}

		if (advancedCriteria.dateTo) {
			criteria.before = new Date(advancedCriteria.dateTo);
			displayParts.push(`before: ${advancedCriteria.dateTo}`);
		}
	}

	private getQuickDateRange(quickDate: string): { since?: Date; before?: Date } {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		switch (quickDate) {
			case 'today':
				return { since: today };
			case 'yesterday':
				const yesterday = new Date(today);
				yesterday.setDate(yesterday.getDate() - 1);
				return { since: yesterday, before: today };
			case 'thisWeek':
				const weekStart = new Date(today);
				weekStart.setDate(today.getDate() - today.getDay());
				return { since: weekStart };
			case 'lastWeek':
				const lastWeekEnd = new Date(today);
				lastWeekEnd.setDate(today.getDate() - today.getDay());
				const lastWeekStart = new Date(lastWeekEnd);
				lastWeekStart.setDate(lastWeekEnd.getDate() - 7);
				return { since: lastWeekStart, before: lastWeekEnd };
			case 'thisMonth':
				const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
				return { since: monthStart };
			case 'lastMonth':
				const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
				const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 1);
				return { since: lastMonthStart, before: lastMonthEnd };
			default:
				return {};
		}
	}
}
