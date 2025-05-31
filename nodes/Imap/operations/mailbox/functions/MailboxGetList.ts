import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ImapFlow } from 'imapflow';
import { IResourceOperationDef } from '../../../utils/CommonDefinitions';

enum MailboxListStatusFields {
  includeMessageCount = 'includeMessageCount',
  includeRecentCount = 'includeRecentCount',
  includeUnseenCount = 'includeUnseenCount',
  includeUidNext = 'includeUidNext',
  includeUidValidity = 'includeUidValidity',
  includeHighestModseq = 'includeHighestModseq',
};

export const getMailboxListOperation: IResourceOperationDef = {
  operation: {
    name: 'Get Many',
    value: 'loadMailboxList',
    description: 'Get comprehensive list of all mailbox folders with statistics. Perfect for AI agents to analyze folder structures, find specific mailboxes, or monitor email organization.',
  },
  parameters: [
    {
      displayName: 'Include Status Fields',
      name: 'includeStatusFields',
      type: 'multiOptions',
      default: "={{ $fromAI('status_fields', 'Array of status fields to include in the mailbox list response') }}",
      description: 'Select which status fields to include. AI agents can choose specific fields based on their analysis needs.',
      // eslint-disable-next-line n8n-nodes-base/node-param-multi-options-type-unsorted-items
      options: [
        {
          name: 'Highest Modseq',
          value: MailboxListStatusFields.includeHighestModseq,
        },
        {
          name: 'Message Count',
          value: MailboxListStatusFields.includeMessageCount,
        },
        {
          name: 'Recent Count',
          value: MailboxListStatusFields.includeRecentCount,
        },
        {
          name: 'UID Next',
          value: MailboxListStatusFields.includeUidNext,
        },
        {
          name: 'UID Validity',
          value: MailboxListStatusFields.includeUidValidity,
        },
        {
          name: 'Unseen Count',
          value: MailboxListStatusFields.includeUnseenCount,
        },
      ],
    },
    {
      displayName: 'Performance Notice',
      name: 'noticeSlowResponse',
      type: 'notice',
      default: '',
      description: '💡 Including status fields might slow down the response. AI agents should only request needed fields for optimal performance.',
    },
  ],
  async executeImapAction(context: IExecuteFunctions, itemIndex: number, client: ImapFlow): Promise<INodeExecutionData[] | null> {
    var returnData: INodeExecutionData[] = [];
    context.logger?.info("includeStatusFields: " + context.getNodeParameter('includeStatusFields', itemIndex) as string);
    const includeStatusFields = context.getNodeParameter('includeStatusFields', itemIndex) as string[];
    var statusQuery = {
      messages: includeStatusFields.includes(MailboxListStatusFields.includeMessageCount),
      recent: includeStatusFields.includes(MailboxListStatusFields.includeRecentCount),
      unseen: includeStatusFields.includes(MailboxListStatusFields.includeUnseenCount),
      uidnext: includeStatusFields.includes(MailboxListStatusFields.includeUidNext),
      uidvalidity: includeStatusFields.includes(MailboxListStatusFields.includeUidValidity),
      highestmodseq: includeStatusFields.includes(MailboxListStatusFields.includeHighestModseq),
    };
    const mailboxes = await client.list({
      statusQuery: statusQuery,
    });

    let totalMailboxes = 0;
    let totalMessages = 0;
    let totalUnseen = 0;

    for (const mailbox of mailboxes) {
      context.logger?.info(`  ${mailbox.path}`);

      // Calculate totals for summary
      totalMailboxes++;
      if (mailbox.status?.messages) totalMessages += mailbox.status.messages;
      if (mailbox.status?.unseen) totalUnseen += mailbox.status.unseen;

      var item_json = {
        operation: 'getMailboxList',
        path: mailbox.path,
        name: mailbox.name,
        status: mailbox.status,
        // Enhanced metadata for AI agents
        hasMessages: mailbox.status?.messages ? mailbox.status.messages > 0 : false,
        hasUnseenMessages: mailbox.status?.unseen ? mailbox.status.unseen > 0 : false,
        isLeaf: !mailbox.subscribed, // Approximation for leaf folders
        level: mailbox.path.split('/').length - 1, // Folder depth
      };
      context.logger?.info(`  ${JSON.stringify(item_json)}`);
      returnData.push({
        json: item_json,
      });
    }

    // Add summary item for AI agents
    returnData.push({
      json: {
        operation: 'getMailboxList',
        summary: true,
        totalMailboxes,
        totalMessages,
        totalUnseen,
        retrievedAt: new Date().toISOString(),
        statusFieldsIncluded: includeStatusFields,
      },
    });

    return returnData;
  },
};
