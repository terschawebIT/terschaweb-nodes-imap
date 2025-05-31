import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { ImapFlow } from 'imapflow';
import { IResourceOperationDef } from '../../../utils/CommonDefinitions';
import { getMailboxPathFromNodeParameter, parameterSelectMailbox } from '../../../utils/SearchFieldParameters';

export const moveMailboxOperation: IResourceOperationDef = {
  operation: {
    name: 'Move',
    value: 'moveMailbox',
    description: 'Move mailbox folders to reorganize folder structure and improve email organization. Perfect for AI agents to restructure folders, group related folders, or implement new organizational hierarchies.',
  },
  parameters: [
    {
      displayName: 'New Parent Folder',
      name: 'newParentFolder',
      type: 'string',
      default: "={{ $fromAI('new_parent_folder', 'Path of the new parent folder where the mailbox should be moved') }}",
      description: 'Specify the new parent folder path. AI agents can reorganize folders into logical hierarchies.',
      placeholder: 'Projects | Archive | Clients | Support',
      required: true,
    },
    {
      ...parameterSelectMailbox,
      description: 'Select the mailbox to move. AI agents can restructure folder hierarchies for better organization.',
    },
  ],
  async executeImapAction(context: IExecuteFunctions, itemIndex: number, client: ImapFlow): Promise<INodeExecutionData[] | null> {
    var returnData: INodeExecutionData[] = [];
    const currentMailboxPath = getMailboxPathFromNodeParameter(context, itemIndex);
    const newParentFolder = context.getNodeParameter('newParentFolder', itemIndex) as string;

    // Extract the folder name from current path
    const folderName = currentMailboxPath.split('/').pop() || currentMailboxPath;
    const newMailboxPath = newParentFolder ? `${newParentFolder}/${folderName}` : folderName;

    context.logger?.info(`Moving mailbox from "${currentMailboxPath}" to "${newMailboxPath}"`);

    // Use rename operation to move the folder
    const result = await client.mailboxRename(currentMailboxPath, newMailboxPath);

    var item_json = {
      operation: 'moveMailbox',
      originalPath: currentMailboxPath,
      newPath: newMailboxPath,
      newParentFolder: newParentFolder,
      folderName: folderName,
      success: true,
      movedAt: new Date().toISOString(),
      message: `Successfully moved mailbox from "${currentMailboxPath}" to "${newMailboxPath}"`,
    };

    // Add server response if available
    if (result) {
      Object.assign(item_json, { serverResponse: result });
    }

    returnData.push({
      json: item_json,
    });
    return returnData;
  },
};
