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
				console.log(`Fetching email metadata for UID: ${uid}`);

				// Use basic UID FETCH without range syntax
				const messageGenerator = client.fetch(uid.toString(), {
					envelope: true,
					flags: true,
					size: true,
					uid: true,
				}, { uid: true });

				let message: any = null;
				let messageCount = 0;

				for await (const msg of messageGenerator) {
					messageCount++;
					console.log(`Message ${messageCount} received for UID ${uid}:`, {
						hasEnvelope: !!msg.envelope,
						hasFlags: !!msg.flags,
						hasSize: !!msg.size,
						uid: msg.uid
					});
					message = msg;
					// Don't break - process all messages in case there are multiple chunks
				}

				console.log(`Total messages received for UID ${uid}: ${messageCount}`);

				if (message && message.envelope) {
					console.log(`Processing email UID ${uid}:`, {
						subject: message.envelope.subject,
						from: message.envelope.from?.[0]?.address || 'unknown'
					});

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
				} else {
					console.warn(`No valid message data for UID ${uid}:`, {
						hasMessage: !!message,
						hasEnvelope: message?.envelope ? true : false,
						messageKeys: message ? Object.keys(message) : 'none'
					});
				}
			} catch (error) {
				// Log but continue with other emails
				console.error(`Failed to fetch email UID ${uid}:`, {
					error: (error as Error).message,
					stack: (error as Error).stack
				});
				continue;
			}
		}

		console.log(`Search completed. Found ${searchResults.length} emails, processed ${limitedResults.length}, returned ${messages.length} messages`);

		// Return results even if no emails found, but include summary
		if (searchResults.length > 0) {
			// Add summary information at the beginning
			const summaryData = {
				json: {
					searchSummary: {
						query: searchDisplayText,
						totalFound: searchResults.length,
						returned: messages.length,
						folder: mailbox,
						serverSideSearch: true,
						searchMode: searchMode,
					},
				},
			};
			messages.unshift(summaryData);
		} else {
			// Return a message indicating no results found
			return [
				{
					json: {
						message: `No emails found matching criteria: ${searchDisplayText}`,
						totalFound: 0,
						folder: mailbox,
						searchQuery: searchDisplayText,
						searchMode: searchMode,
					},
				},
			];
		}

		return messages;
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
			case 'all':
			default:
				// No additional criteria
				break;
		}

		// Apply text search if provided
		if (searchText && searchText.trim()) {
			criteria.or = [
				{ subject: searchText.trim() },
				{ from: searchText.trim() },
				{ body: searchText.trim() },
			];
		}

		return criteria;
	}

	private buildSimpleSearchDisplay(quickFilter: string, searchText: string): string {
		const parts: string[] = [];

		switch (quickFilter) {
			case 'unseen':
				parts.push('Unread emails');
				break;
			case 'seen':
				parts.push('Read emails');
				break;
			case 'today':
				parts.push('Today\'s emails');
				break;
			case 'thisWeek':
				parts.push('This week\'s emails');
				break;
			case 'all':
			default:
				parts.push('All emails');
				break;
		}

		if (searchText && searchText.trim()) {
			parts.push(`containing "${searchText.trim()}"`);
		}

		return parts.join(' ');
	}

	private buildAdvancedSearchCriteria(advancedCriteria: any): { criteria: any; display: string } {
		const criteria: any = {};
		const displayParts: string[] = [];

		// From filter
		if (advancedCriteria.from) {
			criteria.from = advancedCriteria.from;
			displayParts.push(`from: ${advancedCriteria.from}`);
		}

		// To filter
		if (advancedCriteria.to) {
			criteria.to = advancedCriteria.to;
			displayParts.push(`to: ${advancedCriteria.to}`);
		}

		// Subject filter
		if (advancedCriteria.subject) {
			criteria.subject = advancedCriteria.subject;
			displayParts.push(`subject: ${advancedCriteria.subject}`);
		}

		// Body filter
		if (advancedCriteria.body) {
			criteria.body = advancedCriteria.body;
			displayParts.push(`body: ${advancedCriteria.body}`);
		}

		// Read status filter
		if (advancedCriteria.readStatus) {
			switch (advancedCriteria.readStatus) {
				case 'unread':
					criteria.unseen = true;
					displayParts.push('unread');
					break;
				case 'read':
					criteria.seen = true;
					displayParts.push('read');
					break;
				case 'any':
				default:
					// No filter
					break;
			}
		}

		// Date filters
		this.applyDateFilters(criteria, advancedCriteria, displayParts);

		// Size filters
		if (advancedCriteria.sizeFilter?.size) {
			const sizeFilter = advancedCriteria.sizeFilter.size;
			const sizeBytes = sizeFilter.sizeKB * 1024;

			if (sizeFilter.condition === 'larger') {
				criteria.larger = sizeBytes;
				displayParts.push(`larger than ${sizeFilter.sizeKB}KB`);
			} else {
				criteria.smaller = sizeBytes;
				displayParts.push(`smaller than ${sizeFilter.sizeKB}KB`);
			}
		}

		// Attachment filter (Note: IMAP doesn't have direct attachment search,
		// so we'll use a workaround with content-type)
		if (advancedCriteria.hasAttachments === 'yes') {
			criteria.header = ['content-type', 'multipart/mixed'];
			displayParts.push('with attachments');
		}

		const display = displayParts.length > 0 ? displayParts.join(', ') : 'all emails';

		return { criteria, display };
	}

	private applyDateFilters(criteria: any, advancedCriteria: any, displayParts: string[]): void {
		// Quick date filter takes precedence
		if (advancedCriteria.quickDate && advancedCriteria.quickDate !== 'none') {
			const dateRange = this.getQuickDateRange(advancedCriteria.quickDate);
			if (dateRange.since) {
				criteria.since = dateRange.since;
				displayParts.push(`since ${dateRange.since.toLocaleDateString()}`);
			}
			if (dateRange.before) {
				criteria.before = dateRange.before;
				displayParts.push(`before ${dateRange.before.toLocaleDateString()}`);
			}
			return;
		}

		// Custom date range
		if (advancedCriteria.dateRange?.range) {
			const range = advancedCriteria.dateRange.range;
			if (range.from) {
				criteria.since = new Date(range.from);
				displayParts.push(`since ${new Date(range.from).toLocaleDateString()}`);
			}
			if (range.to) {
				criteria.before = new Date(range.to);
				displayParts.push(`before ${new Date(range.to).toLocaleDateString()}`);
			}
		}
	}

	private getQuickDateRange(quickDate: string): { since?: Date; before?: Date } {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		switch (quickDate) {
			case 'lastHour':
				return { since: new Date(now.getTime() - 60 * 60 * 1000) };
			case 'today':
				return { since: today };
			case 'yesterday':
				const yesterday = new Date(today);
				yesterday.setDate(yesterday.getDate() - 1);
				return { since: yesterday, before: today };
			case 'thisWeek':
				const weekStart = new Date(today);
				weekStart.setDate(weekStart.getDate() - weekStart.getDay());
				return { since: weekStart };
			case 'lastWeek':
				const lastWeekEnd = new Date(today);
				lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay());
				const lastWeekStart = new Date(lastWeekEnd);
				lastWeekStart.setDate(lastWeekStart.getDate() - 7);
				return { since: lastWeekStart, before: lastWeekEnd };
			case 'thisMonth':
				return { since: new Date(now.getFullYear(), now.getMonth(), 1) };
			case 'lastMonth':
				const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
				const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
				return { since: lastMonthStart, before: lastMonthEnd };
			default:
				return {};
		}
	}
}
