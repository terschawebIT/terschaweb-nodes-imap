import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ImapFlow, MailboxRenameResponse } from 'imapflow';
import { IResourceOperationDef } from '../../../utils/CommonDefinitions';
import { getMailboxPathFromNodeParameter, parameterSelectMailbox } from '../../../utils/SearchFieldParameters';

export const renameMailboxOperation: IResourceOperationDef = {
  operation: {
    name: 'Rename',
    value: 'renameMailbox',
    description: 'Rename mailbox folders for better organization and naming conventions. Perfect for AI agents to standardize folder names, apply naming patterns, or reorganize folder structures.',
  },
  parameters: [
    {
      displayName: 'New Mailbox Name',
      name: 'newMailboxName',
      type: 'string',
      default: "={{ $fromAI('new_folder_name', 'New name for the mailbox/folder') }}",
      description: 'New name of the mailbox. AI can generate standardized names based on content, patterns, or organizational rules.',
      placeholder: 'Invoices-2024 | Support-High-Priority | Project-Alpha-Archive',
      required: true,
    },
    {
      ...parameterSelectMailbox,
      description: 'Select the mailbox to rename. AI agents can specify existing folders to standardize or reorganize.',
    },
  ],
  async executeImapAction(context: IExecuteFunctions, itemIndex: number, client: ImapFlow): Promise<INodeExecutionData[] | null> {
    var returnData: INodeExecutionData[] = [];
    const mailboxPath = getMailboxPathFromNodeParameter(context, itemIndex);
    const newMailboxName = context.getNodeParameter('newMailboxName', itemIndex) as string;

    context.logger?.info(`Renaming mailbox "${mailboxPath}" to "${newMailboxName}"`);

    const imapResp : MailboxRenameResponse = await client.mailboxRename(mailboxPath, newMailboxName);
    context.logger?.info(JSON.stringify(imapResp));
    var item_json = JSON.parse(JSON.stringify(imapResp));

    // Add enhanced metadata for AI agents
    item_json.operation = 'renameMailbox';
    item_json.oldName = mailboxPath;
    item_json.newName = newMailboxName;
    item_json.success = true;
    item_json.renamedAt = new Date().toISOString();

    returnData.push({
      json: item_json,
    });
    return returnData;
  },
};
