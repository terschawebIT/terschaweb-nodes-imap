import { IResourceDef } from "../../utils/CommonDefinitions";
import { resourceMailbox } from "./ResourceName";
import { createMailboxOperation } from "./functions/MailboxCreate";
import { deleteMailboxOperation } from "./functions/MailboxDelete";
import { getMailboxListOperation } from "./functions/MailboxGetList";
import {getMailboxQuotaOperation} from "./functions/MailboxGetQuota";
import { getMailboxStatusOperation } from "./functions/MailboxGetStatus";
import { moveMailboxOperation } from "./functions/MailboxMove";
import { renameMailboxOperation } from "./functions/MailboxRename";
import { subscribeMailboxOperation } from "./functions/MailboxSubscribe";

export const mailboxResourceDefinitions: IResourceDef = {
  resource: resourceMailbox,
  operationDefs: [
    // Alphabetically sorted for better organization
    createMailboxOperation,
    deleteMailboxOperation, // Now AI-safe with confirmation requirement
    getMailboxListOperation,
    getMailboxQuotaOperation,
    getMailboxStatusOperation,
    moveMailboxOperation,
    renameMailboxOperation,
    subscribeMailboxOperation,
  ],
};


