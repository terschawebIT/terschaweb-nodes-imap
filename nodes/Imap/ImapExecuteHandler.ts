import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ImapFlow } from 'imapflow';
import { OperationRegistry } from './operations/operationRegistry';

export class ImapExecuteHandler {
	static async execute(executeFunctions: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = executeFunctions.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Get credentials
		const credentials = await executeFunctions.getCredentials('imap');

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
				const operation = executeFunctions.getNodeParameter('operation', i) as string;

				try {
					// Get the operation handler from registry
					const operationHandler = OperationRegistry.getOperation(operation);

					// Execute the operation
					console.log(`Executing operation: ${operation}`);
					const result = await operationHandler.execute(executeFunctions, client, i);
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
				} catch (error) {
					if (executeFunctions.continueOnFail()) {
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
