import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import {ImapFlow} from 'imapflow';
import { IResourceOperationDef } from '../../../utils/CommonDefinitions';
import { getMailboxPathFromNodeParameter, parameterSelectMailbox } from '../../../utils/SearchFieldParameters';

export const getMailboxQuotaOperation: IResourceOperationDef = {
  operation: {
    name: 'Get Quota',
    value: 'getMailboxQuota',
    description: 'Get storage quota and space usage information for email accounts. Perfect for AI agents to monitor storage limits, plan cleanup operations, or warn about quota issues.',
  },
  parameters: [
    {
      ...parameterSelectMailbox,
      description: 'Select the mailbox to check quota for. AI agents typically use INBOX unless provider supports per-folder quotas.',
      hint: "Leave as INBOX unless your email provider supports per-folder quotas",
    },
  ],
  async executeImapAction(context: IExecuteFunctions, itemIndex: number, client: ImapFlow): Promise<INodeExecutionData[] | null> {
		let returnData: INodeExecutionData[] = [];
		const mailboxPath = getMailboxPathFromNodeParameter(context, itemIndex);

    let info = await client.getQuota(mailboxPath);
		if (info === false || info === undefined) {
			// Return empty quota info for AI agents
			returnData.push({
				json: {
					operation: 'getMailboxQuota',
					mailbox: mailboxPath,
					quotaSupported: false,
					message: 'Quota information not available for this mailbox',
					retrievedAt: new Date().toISOString(),
				},
			});
		} else {
			let item_json = JSON.parse(JSON.stringify(info));

			// Add enhanced metadata for AI agents
			item_json.operation = 'getMailboxQuota';
			item_json.mailbox = mailboxPath;
			item_json.quotaSupported = true;
			item_json.retrievedAt = new Date().toISOString();

			// Calculate usage percentage if storage info is available
			if (item_json.storage && item_json.storage.used && item_json.storage.limit) {
				item_json.storageUsagePercent = Math.round((item_json.storage.used / item_json.storage.limit) * 100);
				item_json.storageAvailable = item_json.storage.limit - item_json.storage.used;
				item_json.storageWarning = item_json.storageUsagePercent > 80;
				item_json.storageCritical = item_json.storageUsagePercent > 95;
			}

			returnData.push({
				json: item_json,
			});
		}
    return returnData;
  },
};
