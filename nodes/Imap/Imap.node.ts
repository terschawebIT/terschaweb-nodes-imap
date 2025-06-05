import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeConnectionType,
} from 'n8n-workflow';

import { ImapFlow } from 'imapflow';
import { OperationRegistry } from './operations/operationRegistry';
import { ImapNodeProperties } from './ImapNodeProperties';
import { ImapMethods } from './ImapMethods';

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
		properties: ImapNodeProperties,
	};

	methods = ImapMethods;

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Get credentials
		const credentials = await this.getCredentials('imap');

		// Create IMAP client with optimized timeouts for large emails
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
			// Connect to IMAP server
			await client.connect();

			for (let i = 0; i < items.length; i++) {
				const operation = this.getNodeParameter('operation', i) as string;

				try {
					// Get the operation handler from registry
					const operationHandler = OperationRegistry.getOperation(operation);

					// Execute the operation
					console.log(`Executing operation: ${operation}`);
					const result = await operationHandler.execute(this, client, i);
					console.log('Operation result received:', typeof result, Array.isArray(result) ? 'Array' : 'Object');

					// Process the result
					if (Array.isArray(result)) {
						console.log('Processing array result, length:', result.length);
						returnData.push(...result);
					} else {
						console.log('Processing single result:', Object.keys(result).slice(0, 5));
						returnData.push({ json: result });
					}
					console.log('Total returnData items:', returnData.length);
					console.log('Final returnData structure:', returnData.map(item => ({
						hasJson: !!item.json,
						jsonKeys: item.json ? Object.keys(item.json).slice(0, 5) : []
					})));
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
			console.log('Starting client cleanup...');
			try {
				// Add timeout to logout to prevent hanging
				const logoutPromise = client.logout();
				const timeoutPromise = new Promise<void>((_, reject) => {
					setTimeout(() => reject(new Error('Logout timeout')), 5000);
				});

				await Promise.race([logoutPromise, timeoutPromise]);
				console.log('Client logout completed');
			} catch (error) {
				console.log('Client logout error/timeout (forcing close):', (error as Error).message);
				try {
					// Force close if logout fails/hangs
					await client.close();
					console.log('Client force closed');
				} catch (closeError) {
					console.log('Client force close error (ignored):', (closeError as Error).message);
				}
			}
			console.log('Finally block completed');
		}

		console.log('Returning from execute method with items:', returnData.length);
		return [returnData];
	}
}
