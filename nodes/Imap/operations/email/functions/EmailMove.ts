import { CopyResponseObject, ImapFlow } from "imapflow";
import { IExecuteFunctions, INodeExecutionData, NodeApiError } from "n8n-workflow";
import { IResourceOperationDef } from "../../../utils/CommonDefinitions";
import { getMailboxPathFromNodeParameter, parameterSelectMailbox } from '../../../utils/SearchFieldParameters';



const PARAM_NAME_SOURCE_MAILBOX = 'sourceMailbox';
const PARAM_NAME_DESTINATION_MAILBOX = 'destinationMailbox';

export const moveEmailOperation: IResourceOperationDef = {
  operation: {
    name: 'Move',
    value: 'moveEmail',
    description: 'Move emails from one mailbox to another. Perfect for AI agents to organize emails automatically, archive processed messages, sort by category, or implement email workflows.',
  },
  parameters: [
    {
      ...parameterSelectMailbox,
      displayName: 'Source Mailbox',
      description: 'Select the source mailbox where emails are currently located. AI agents can specify: INBOX, Sent, Drafts, or custom folder names.',
      name: PARAM_NAME_SOURCE_MAILBOX,
    },
    {
      displayName: 'Email UID',
      name: 'emailUid',
      type: 'string',
      default: "={{ $fromAI('email_uid', 'UID of the email or comma-separated list of email UIDs to move') }}",
      description: 'UID of the email to move. AI can specify single UID or comma-separated list for bulk operations.',
      placeholder: '123 or 123,456,789',
      hint: 'You can use comma separated list of UIDs to move multiple emails at once',
    },
    {
      ...parameterSelectMailbox,
      displayName: 'Destination Mailbox',
      description: 'Select the destination mailbox where emails will be moved. AI agents can specify target folders like: Archive, Processed, Spam, or custom categories.',
      name: PARAM_NAME_DESTINATION_MAILBOX,
    },
  ],
  async executeImapAction(context: IExecuteFunctions, itemIndex: number, client: ImapFlow): Promise<INodeExecutionData[] | null> {
    var returnData: INodeExecutionData[] = [];

    const sourceMailboxPath = getMailboxPathFromNodeParameter(context, itemIndex, PARAM_NAME_SOURCE_MAILBOX);
    const destinationMailboxPath = getMailboxPathFromNodeParameter(context, itemIndex, PARAM_NAME_DESTINATION_MAILBOX);

    const emailUid = context.getNodeParameter('emailUid', itemIndex) as string;

    context.logger?.info(`Moving email "${emailUid}" from "${sourceMailboxPath}" to "${destinationMailboxPath}"`);

    await client.mailboxOpen(sourceMailboxPath, { readOnly: false });

    const resp : CopyResponseObject = await client.messageMove(emailUid, destinationMailboxPath, {
      uid: true,
    });

    if (!resp) {
      throw new NodeApiError(context.getNode(), {}, {
        message: `Unable to move email UID ${emailUid} from ${sourceMailboxPath} to ${destinationMailboxPath}`,
      });
    }

    var item_json = JSON.parse(JSON.stringify(resp));

    // Add enhanced metadata for AI agents
    item_json.operation = 'moveEmail';
    item_json.sourceMailbox = sourceMailboxPath;
    item_json.destinationMailbox = destinationMailboxPath;
    item_json.emailUid = emailUid;
    item_json.success = true;

    returnData.push({
      json: item_json,
    });

    return returnData;
  },
};
