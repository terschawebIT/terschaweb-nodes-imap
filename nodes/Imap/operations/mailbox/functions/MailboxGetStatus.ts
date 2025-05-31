import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ImapFlow, StatusObject } from 'imapflow';
import { IResourceOperationDef } from '../../../utils/CommonDefinitions';
import { getMailboxPathFromNodeParameter, parameterSelectMailbox } from '../../../utils/SearchFieldParameters';

export const getMailboxStatusOperation: IResourceOperationDef = {
  operation: {
    name: 'Get Status',
    value: 'getMailboxStatus',
    description: 'Get detailed status information for a specific mailbox including message counts and flags. Perfect for AI agents to monitor folder activity, find busy folders, or check for new messages.',
  },
  parameters: [
    {
      ...parameterSelectMailbox,
      description: 'Select the mailbox to get status for. AI agents can monitor specific folders for activity and message counts.',
    },
  ],
  async executeImapAction(context: IExecuteFunctions, itemIndex: number, client: ImapFlow): Promise<INodeExecutionData[] | null> {
    var returnData: INodeExecutionData[] = [];
    var statusQuery = {
      messages: true,
      recent: true,
      unseen: true,
      uidNext: true,
      uidValidity: true,
      highestModseq: true,
    };
    const mailboxPath = getMailboxPathFromNodeParameter(context, itemIndex);

    const mailbox : StatusObject = await client.status(mailboxPath, statusQuery);
    var item_json = JSON.parse(JSON.stringify(mailbox));

    // Add enhanced metadata for AI agents
    item_json.operation = 'getMailboxStatus';
    item_json.mailboxPath = mailboxPath;
    item_json.retrievedAt = new Date().toISOString();

    // Calculate useful metrics for AI agents
    item_json.hasNewMessages = (mailbox.unseen || 0) > 0;
    item_json.hasRecentMessages = (mailbox.recent || 0) > 0;
    item_json.isEmpty = (mailbox.messages || 0) === 0;
    item_json.messageDistribution = {
      total: mailbox.messages || 0,
      unseen: mailbox.unseen || 0,
      recent: mailbox.recent || 0,
      seen: (mailbox.messages || 0) - (mailbox.unseen || 0),
    };
    item_json.activityLevel = mailbox.recent && mailbox.recent > 5 ? 'high' :
                             mailbox.recent && mailbox.recent > 0 ? 'medium' : 'low';

    returnData.push({
      json: item_json,
    });
    return returnData;
  },
};
