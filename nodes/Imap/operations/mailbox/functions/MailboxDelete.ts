import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ImapFlow, MailboxDeleteResponse } from 'imapflow';
import { IResourceOperationDef } from '../../../utils/CommonDefinitions';
import { getMailboxPathFromNodeParameter, parameterSelectMailbox } from '../../../utils/SearchFieldParameters';
import { NodeApiError } from 'n8n-workflow';

export const deleteMailboxOperation: IResourceOperationDef = {
  operation: {
    name: 'Delete',
    value: 'deleteMailbox',
    description: 'Delete empty mailbox folders for cleanup and organization. Perfect for AI agents to automatically remove obsolete folders, clean up temporary directories, or maintain organized folder structures.',
  },
  parameters: [
    {
      ...parameterSelectMailbox,
      description: 'Select the mailbox to delete. AI agents can specify folders like: Old-Projects, Temp, Archive-2023, or other obsolete folders.',
      default: "={{ $fromAI('folder_to_delete', 'Name of the mailbox/folder to delete') }}",
    },
    // enhanced warning notice
    {
      displayName: '⚠️ CRITICAL WARNING: This operation will permanently delete the selected mailbox and ALL its contents. This action CANNOT be undone. AI agents should verify folder is empty or backed up before deletion.',
      name: 'warning',
      type: 'notice',
      default: '',
    },
    {
      displayName: 'Confirm Deletion',
      name: 'confirmDeletion',
      type: 'boolean',
      default: false,
      description: 'Whether to confirm that the mailbox should be permanently deleted. AI must explicitly confirm deletion.',
      required: true,
    },
  ],
  async executeImapAction(context: IExecuteFunctions, itemIndex: number, client: ImapFlow): Promise<INodeExecutionData[] | null> {
    var returnData: INodeExecutionData[] = [];
    const mailboxPath = getMailboxPathFromNodeParameter(context, itemIndex);
    const confirmDeletion = context.getNodeParameter('confirmDeletion', itemIndex) as boolean;

    // Safety check: require explicit confirmation
    if (!confirmDeletion) {
      throw new NodeApiError(context.getNode(), {}, {
        message: `Mailbox deletion cancelled: confirmation required. Set confirmDeletion to true to delete mailbox "${mailboxPath}".`,
      });
    }

    context.logger?.info(`Deleting mailbox "${mailboxPath}"`);

    const imapResp : MailboxDeleteResponse = await client.mailboxDelete(mailboxPath);
    var item_json = JSON.parse(JSON.stringify(imapResp));

    // Add enhanced metadata for AI agents
    item_json.operation = 'deleteMailbox';
    item_json.deletedMailbox = mailboxPath;
    item_json.success = true;
    item_json.deletedAt = new Date().toISOString();
    item_json.warning = 'Mailbox and all contents permanently deleted';

    returnData.push({
      json: item_json,
    });
    return returnData;
  },
};
