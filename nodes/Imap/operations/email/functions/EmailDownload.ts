import { FetchQueryObject, ImapFlow } from "imapflow";
import { IBinaryKeyData, IDataObject, IExecuteFunctions, INodeExecutionData } from "n8n-workflow";
import { IResourceOperationDef } from "../../../utils/CommonDefinitions";
import { getMailboxPathFromNodeParameter, parameterSelectMailbox } from "../../../utils/SearchFieldParameters";
import { NodeApiError } from "n8n-workflow";

export const downloadOperation: IResourceOperationDef = {
  operation: {
    name: 'Download as EML',
    value: 'downloadEml',
    description: 'Download complete email as EML file format for processing, archiving, or analysis. Perfect for AI agents to extract attachments, parse headers, or backup emails for further processing.',
  },
  parameters: [
    {
      ...parameterSelectMailbox,
      description: 'Select the mailbox containing the email to download. AI agents can specify: INBOX, Sent, Archive, or custom folder names.',
    },
    {
      displayName: 'Email UID',
      name: 'emailUid',
      type: 'string',
      default: "={{ $fromAI('email_uid', 'UID of the email to download as EML file') }}",
      description: 'UID of the email to download. AI can specify this based on search results or workflow context.',
      placeholder: '123',
    },
    {
      displayName: 'Output to Binary Data',
      name: 'outputToBinary',
      type: 'boolean',
      default: false,
      description: 'Whether to output the email as binary data or JSON as text',
      hint: 'If true, the email will be output as binary data. If false, the email will be output as JSON as text.',
    },
    {
      displayName: 'Put Output File in Field',
      name: 'binaryPropertyName',
      type: 'string',
      default: "={{ $fromAI('binary_field_name', 'Name of the binary field to store the downloaded email file', 'data') }}",
      required: true,
      placeholder: 'e.g data',
      hint: 'The name of the output binary field to put the file in',
      displayOptions: {
        show: {
          outputToBinary: [true],
        },
      },
    },

  ],
  async executeImapAction(context: IExecuteFunctions, itemIndex: number, client: ImapFlow): Promise<INodeExecutionData[] | null> {
    const mailboxPath = getMailboxPathFromNodeParameter(context, itemIndex);

    await client.mailboxOpen(mailboxPath, { readOnly: true });

    const emailUid = context.getNodeParameter('emailUid', itemIndex) as string;
    const outputToBinary = context.getNodeParameter('outputToBinary', itemIndex, true) as boolean;
    const binaryPropertyName = context.getNodeParameter('binaryPropertyName', itemIndex, 'data',) as string;

    // get source from the email
    const emailInfo = await client.download(emailUid, undefined, {
      uid: true,
    }) as any;

    if (!emailInfo || !emailInfo.content) {
      throw new NodeApiError(context.getNode(), {}, {
        message: `Unable to download email with UID "${emailUid}": No source data available`,
      });
    }

    const emailSource = emailInfo.content;

    let binaryFields: IBinaryKeyData | undefined = undefined;
    let jsonData: IDataObject = {};

    if (outputToBinary) {
      // output to binary data
      const binaryData = await context.helpers.prepareBinaryData(emailSource, mailboxPath + '_' + emailUid + '.eml', 'message/rfc822');
      binaryFields = {
        [binaryPropertyName]: binaryData,
      };
    } else {
      // output to JSON as text
      jsonData = {
        ...jsonData,
        emlContent: emailSource.toString(),
        operation: 'downloadEml',
        emailUid: emailUid,
        mailboxPath: mailboxPath,
        downloadedAt: new Date().toISOString(),
        success: true,
      };
    }

    const newItem: INodeExecutionData = {
      json: jsonData,
      binary: binaryFields,
      pairedItem: {
        item: itemIndex,
      },
    };
    return [newItem];
  },
};
