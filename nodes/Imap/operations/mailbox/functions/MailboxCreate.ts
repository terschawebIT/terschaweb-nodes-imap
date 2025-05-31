import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ImapFlow, MailboxCreateResponse } from 'imapflow';
import { IResourceOperationDef } from '../../../utils/CommonDefinitions';
import { getMailboxPathFromNodeParameter, parameterSelectMailbox } from '../../../utils/SearchFieldParameters';

export const createMailboxOperation: IResourceOperationDef = {
  operation: {
    name: 'Create',
    value: 'createMailbox',
    description: 'Create new mailbox folders for email organization. Perfect for AI agents to automatically create folders based on senders, subjects, or categories for intelligent email sorting.',
  },
  parameters: [
    {
      displayName: 'Top Level Mailbox',
      name: 'topLevelMailbox',
      type: 'boolean',
      default: false,
      description: 'Whether the mailbox is a top level mailbox or a child mailbox. AI can decide based on organizational structure.',
      required: true,
    },
    {
      ...parameterSelectMailbox,
      description: 'Parent mailbox where the new mailbox will be created. AI agents can specify existing folders like: INBOX, Archive, Projects, etc.',
      required: false,
      displayOptions: {
        show: {
          topLevelMailbox: [false],
        },
      },
    },
    {
      displayName: 'Mailbox Name',
      name: 'mailboxName',
      type: 'string',
      default: "={{ $fromAI('folder_name', 'Name of the new mailbox/folder to create') }}",
      description: 'Name of the mailbox to create. AI can generate names based on email content, senders, or categories.',
      placeholder: 'Invoices | Support-Tickets | Project-Alpha | Client-Reports',
      required: true,
    },
  ],
  async executeImapAction(context: IExecuteFunctions, itemIndex: number, client: ImapFlow): Promise<INodeExecutionData[] | null> {
    var returnData: INodeExecutionData[] = [];
    const mailboxPath = getMailboxPathFromNodeParameter(context, itemIndex);
    const mailboxName = context.getNodeParameter('mailboxName', itemIndex) as string;
    var resultPath;
    // if mailboxPath is empty, then we are creating a top level mailbox
    if (mailboxPath) {
      resultPath = [mailboxPath, mailboxName];
    } else {
      resultPath = mailboxName;
    }
    context.logger?.info(`Creating mailbox "${resultPath}"`);

    const mailboxCreateResp : MailboxCreateResponse = await client.mailboxCreate(resultPath);
    var item_json = JSON.parse(JSON.stringify(mailboxCreateResp));

    // Add enhanced metadata for AI agents
    item_json.operation = 'createMailbox';
    item_json.mailboxName = mailboxName;
    item_json.parentMailbox = mailboxPath || 'root';
    item_json.fullPath = resultPath;
    item_json.success = true;
    item_json.createdAt = new Date().toISOString();

    returnData.push({
      json: item_json,
    });
    return returnData;
  },
};
