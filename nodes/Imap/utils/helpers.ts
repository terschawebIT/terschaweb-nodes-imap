import { ISearchCriteria } from './types';

export class SearchQueryParser {
	static parse(query: string): any {
		if (!query.trim()) {
			// Return "ALL" for empty queries (IMAP standard)
			return { all: true };
		}

		// Advanced parser for IMAP search criteria
		const trimmedQuery = query.trim().toLowerCase();

		// Handle multiple criteria (space-separated)
		if (trimmedQuery.includes(' and ') || trimmedQuery.includes(' & ')) {
			return this.parseMultipleCriteria(query, 'AND');
		}

		if (trimmedQuery.includes(' or ') || trimmedQuery.includes(' | ')) {
			return this.parseMultipleCriteria(query, 'OR');
		}

		// Handle single criteria with proper IMAP syntax
		if (trimmedQuery.startsWith('from:')) {
			return { from: query.substring(5).trim() };
		}

		if (trimmedQuery.startsWith('to:')) {
			return { to: query.substring(3).trim() };
		}

		if (trimmedQuery.startsWith('subject:')) {
			return { subject: query.substring(8).trim() };
		}

		if (trimmedQuery.startsWith('body:')) {
			return { body: query.substring(5).trim() };
		}

		if (trimmedQuery.startsWith('text:')) {
			return { text: query.substring(5).trim() };
		}

		// Date-based searches
		if (trimmedQuery.startsWith('since:')) {
			const dateStr = query.substring(6).trim();
			const date = this.parseDate(dateStr);
			return date ? { since: date } : { subject: query };
		}

		if (trimmedQuery.startsWith('before:')) {
			const dateStr = query.substring(7).trim();
			const date = this.parseDate(dateStr);
			return date ? { before: date } : { subject: query };
		}

		// Flag-based searches
		if (trimmedQuery === 'unread' || trimmedQuery === 'unseen') {
			return { unseen: true };
		}

		if (trimmedQuery === 'read' || trimmedQuery === 'seen') {
			return { seen: true };
		}

		if (trimmedQuery === 'flagged' || trimmedQuery === 'important') {
			return { flagged: true };
		}

		if (trimmedQuery === 'unflagged') {
			return { unflagged: true };
		}

		if (trimmedQuery === 'answered' || trimmedQuery === 'replied') {
			return { answered: true };
		}

		if (trimmedQuery === 'unanswered') {
			return { unanswered: true };
		}

		// Size-based searches
		if (trimmedQuery.startsWith('larger:')) {
			const size = Number.parseInt(query.substring(7).trim());
			return !isNaN(size) ? { larger: size } : { subject: query };
		}

		if (trimmedQuery.startsWith('smaller:')) {
			const size = Number.parseInt(query.substring(8).trim());
			return !isNaN(size) ? { smaller: size } : { subject: query };
		}

		// Default to text search (searches in subject, from, and body)
		return { text: query.trim() };
	}

	private static parseMultipleCriteria(query: string, operator: 'AND' | 'OR'): any {
		const separator =
			operator === 'AND'
				? query.includes(' and ')
					? ' and '
					: ' & '
				: query.includes(' or ')
					? ' or '
					: ' | ';

		const parts = query.split(separator).map((part) => part.trim());
		const criteria = parts.map((part) => this.parse(part));

		// Return proper IMAP compound search
		if (operator === 'AND') {
			return { and: criteria };
		} else {
			return { or: criteria };
		}
	}

	private static parseDate(dateStr: string): Date | null {
		// Handle various date formats
		const cleanDateStr = dateStr.trim();

		// Relative dates
		if (cleanDateStr === 'today') {
			return new Date();
		}

		if (cleanDateStr === 'yesterday') {
			const date = new Date();
			date.setDate(date.getDate() - 1);
			return date;
		}

		// Handle hours
		if (cleanDateStr.endsWith('h') || cleanDateStr.endsWith('hours')) {
			const hours = Number.parseInt(cleanDateStr);
			if (!isNaN(hours)) {
				const date = new Date();
				date.setTime(date.getTime() - (hours * 60 * 60 * 1000));
				return date;
			}
		}

		// Handle minutes
		if (cleanDateStr.endsWith('m') || cleanDateStr.endsWith('min') || cleanDateStr.endsWith('minutes')) {
			const minutes = Number.parseInt(cleanDateStr);
			if (!isNaN(minutes)) {
				const date = new Date();
				date.setTime(date.getTime() - (minutes * 60 * 1000));
				return date;
			}
		}

		// Handle days
		if (cleanDateStr.endsWith('d') || cleanDateStr.endsWith('days')) {
			const days = Number.parseInt(cleanDateStr);
			if (!isNaN(days)) {
				const date = new Date();
				date.setDate(date.getDate() - days);
				return date;
			}
		}

		// Standard date formats
		const date = new Date(cleanDateStr);
		return isNaN(date.getTime()) ? null : date;
	}
}

export class ImapConnectionManager {
	static async ensureConnection(client: any): Promise<void> {
		if (!client.usable) {
			await client.connect();
		}
	}

	static async safeClose(client: any): Promise<void> {
		try {
			if (client.usable) {
				await client.logout();
			}
		} catch (error) {
			// Ignore close errors
		}
	}
}

export class ParameterValidator {
	static validateUid(uid: string): void {
		if (!uid || uid.trim() === '') {
			throw new Error('Email UID is required and cannot be empty');
		}
	}

	static validateMailbox(mailbox: string | { mode: string; value: string }): void {
		const mailboxName = this.extractMailboxName(mailbox);
		if (!mailboxName || mailboxName.trim() === '') {
			throw new Error('Folder name is required and cannot be empty');
		}
	}

	static extractMailboxName(mailbox: string | { mode: string; value: string }): string {
		if (typeof mailbox === 'string') {
			return mailbox;
		}

		// Handle resource locator
		if (mailbox && typeof mailbox === 'object' && mailbox.value) {
			return mailbox.value;
		}

		throw new Error('Invalid mailbox parameter format');
	}

	static validateLimit(limit: number): number {
		if (limit < 1) {
			return 50; // Default limit
		}
		if (limit > 1000) {
			return 1000; // Max limit
		}
		return limit;
	}

	static validateSearchQuery(query: string): void {
		if (query && query.length > 1000) {
			throw new Error('Search query is too long (max 1000 characters)');
		}
	}
}
