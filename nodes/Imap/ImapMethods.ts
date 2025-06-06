import { ILoadOptionsFunctions, INodePropertyOptions, NodeApiError, INodeListSearchResult } from 'n8n-workflow';
import { ImapFlow } from 'imapflow';

export const ImapMethods = {
	loadOptions: {
		async getMailboxes(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
			console.log('getMailboxes loadOptions method called');
			const credentials = await this.getCredentials('imap');
			console.log('Credentials obtained');

			// Create IMAP client with timeouts
			const client = new ImapFlow({
				host: credentials.host as string,
				port: credentials.port as number,
				secure: credentials.secure as boolean,
				auth: {
					user: credentials.user as string,
					pass: credentials.password as string,
				},
				socketTimeout: 10 * 60 * 1000, // 10 minutes for large email downloads
				connectionTimeout: 15 * 1000, // 15 seconds connection timeout
				greetingTimeout: 10 * 1000, // 10 seconds greeting timeout
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
	listSearch: {
		async getMailboxes(this: ILoadOptionsFunctions, filter?: string): Promise<INodeListSearchResult> {
			console.log('getMailboxes listSearch method called with filter:', filter);
			const credentials = await this.getCredentials('imap');

			// Create IMAP client with timeouts
			const client = new ImapFlow({
				host: credentials.host as string,
				port: credentials.port as number,
				secure: credentials.secure as boolean,
				auth: {
					user: credentials.user as string,
					pass: credentials.password as string,
				},
				socketTimeout: 10 * 60 * 1000, // 10 minutes for large email downloads
				connectionTimeout: 15 * 1000, // 15 seconds connection timeout
				greetingTimeout: 10 * 1000, // 10 seconds greeting timeout
			});

			try {
				await client.connect();
				const mailboxes = await client.list();

				let filteredMailboxes = mailboxes.filter(mailbox => !mailbox.flags?.has('\\Noselect'));

				// Apply filter if provided
				if (filter) {
					filteredMailboxes = filteredMailboxes.filter(mailbox =>
						mailbox.name.toLowerCase().includes(filter.toLowerCase())
					);
				}

				const results = filteredMailboxes
					.map(mailbox => ({
						name: mailbox.name,
						value: mailbox.name,
					}))
					.sort((a, b) => a.name.localeCompare(b.name));

				return {
					results,
				};
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
