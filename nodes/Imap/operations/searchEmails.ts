import { IExecuteFunctions, INodeExecutionData, NodeApiError } from 'n8n-workflow';
import { ImapFlow } from 'imapflow';
import { IImapOperation } from '../utils/types';
import { ParameterValidator, SearchQueryParser } from '../utils/helpers';

export class SearchEmailsOperation implements IImapOperation {
	async execute(
		executeFunctions: IExecuteFunctions,
		client: ImapFlow,
		itemIndex: number,
	): Promise<INodeExecutionData[]> {
		const mailbox = executeFunctions.getNodeParameter('mailbox', itemIndex) as string;
		const searchQuery = executeFunctions.getNodeParameter('searchQuery', itemIndex) as string;
		const limit = executeFunctions.getNodeParameter('limit', itemIndex) as number;

		ParameterValidator.validateMailbox(mailbox);
		const validatedLimit = ParameterValidator.validateLimit(limit);

		try {
			await client.mailboxOpen(mailbox);
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Failed to open folder ${mailbox}: ${(error as Error).message}`,
			});
		}

		// Parse search query into IMAP search criteria
		const searchCriteria = SearchQueryParser.parse(searchQuery);

		// Perform server-side search
		let searchResults: number[];
		try {
			// Use IMAP SEARCH command for server-side filtering
			searchResults = await client.search(searchCriteria);
		} catch (error) {
			throw new NodeApiError(executeFunctions.getNode(), {
				message: `Server-side search failed: ${(error as Error).message}. Query: ${searchQuery}`,
			});
		}

		if (searchResults.length === 0) {
			return [{
				json: {
					message: `No emails found matching criteria: ${searchQuery}`,
					totalFound: 0,
					folder: mailbox,
				}
			}];
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
							searchQuery: searchQuery,
							searchCriteria: searchCriteria,
						}
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
						query: searchQuery,
						totalFound: searchResults.length,
						returned: messages.length - 1, // Exclude this summary
						folder: mailbox,
						serverSideSearch: true,
					}
				}
			});
		}

		return messages;
	}
}
