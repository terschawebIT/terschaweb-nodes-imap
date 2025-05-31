import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ImapFlow } from 'imapflow';
import { IResourceOperationDef } from '../../../utils/CommonDefinitions';
import { getMailboxPathFromNodeParameter, parameterSelectMailbox } from '../../../utils/SearchFieldParameters';

export const subscribeMailboxOperation: IResourceOperationDef = {
  operation: {
    name: 'Subscribe',
    value: 'subscribeMailbox',
    description: 'Subscribe or unsubscribe from mailbox folders to control which folders are visible in email clients. Perfect for AI agents to manage folder visibility and organize email client interfaces.',
  },
  parameters: [
    {
      displayName: 'Action',
      name: 'action',
      type: 'options',
      default: "={{ $fromAI('subscription_action', 'Whether to subscribe or unsubscribe from the mailbox') }}",
      description: 'Choose to subscribe (show folder) or unsubscribe (hide folder) from the mailbox.',
      options: [
        {
          name: 'Subscribe',
          value: 'subscribe',
          description: 'Subscribe to mailbox (make it visible in email clients)',
        },
        {
          name: 'Unsubscribe',
          value: 'unsubscribe',
          description: 'Unsubscribe from mailbox (hide it from email clients)',
        },
      ],
      required: true,
    },
    {
      ...parameterSelectMailbox,
      description: 'Select the mailbox to subscribe/unsubscribe. AI agents can manage folder visibility to keep interfaces clean.',
    },
  ],
  async executeImapAction(context: IExecuteFunctions, itemIndex: number, client: ImapFlow): Promise<INodeExecutionData[] | null> {
    var returnData: INodeExecutionData[] = [];
    const mailboxPath = getMailboxPathFromNodeParameter(context, itemIndex);
    const action = context.getNodeParameter('action', itemIndex) as string;

    context.logger?.info(`${action === 'subscribe' ? 'Subscribing to' : 'Unsubscribing from'} mailbox "${mailboxPath}"`);

    let result;
    if (action === 'subscribe') {
      result = await client.mailboxSubscribe(mailboxPath);
    } else {
      result = await client.mailboxUnsubscribe(mailboxPath);
    }

    var item_json: any = {
      operation: 'subscribeMailbox',
      action: action,
      mailboxPath: mailboxPath,
      success: true,
      actionedAt: new Date().toISOString(),
      message: `Successfully ${action}d ${action === 'subscribe' ? 'to' : 'from'} mailbox "${mailboxPath}"`,
      visibleInClients: action === 'subscribe',
    };

    // Add server response if available
    if (result) {
      item_json.serverResponse = result;
    }

    returnData.push({
      json: item_json,
    });
    return returnData;
  },
};
