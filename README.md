# Simplified IMAP Node for n8n

A clean, modular IMAP node for n8n that provides essential email management functionality with AI-agent support.

## 🎯 Simplified Design

This project has been **drastically simplified** from the original complex structure to focus on core IMAP functionality:

- **Single IMAP Node** with all essential operations
- **Modular Architecture** for easy maintenance and extension
- **AI-Agent Optimized** with clear, simple parameters
- **English Interface** for international compatibility

## 📋 Operations

### Email Operations
- **List Emails** - Get emails from a mailbox
- **Get Email** - Retrieve full email content with attachments
- **Search Emails** - Search emails with simple queries
- **Move Email** - Move emails between mailboxes
- **Mark as Read/Unread** - Change email read status
- **Delete Email** - Mark emails as deleted

### Mailbox Operations
- **List Mailboxes** - Get all available mailboxes
- **Create Mailbox** - Create new mailboxes

### Attachment Operations
- **Download Attachment** - Download email attachments

## 🏗️ Modular Structure

```
nodes/Imap/
├── Imap.node.ts              # Main node file
├── imap.svg                  # Node icon
├── operations/               # Individual operation modules
│   ├── operationRegistry.ts  # Registry pattern
│   ├── listEmails.ts
│   ├── getEmail.ts
│   ├── searchEmails.ts
│   ├── moveEmail.ts
│   ├── markEmail.ts
│   ├── deleteEmail.ts
│   ├── listMailboxes.ts
│   ├── createMailbox.ts
│   └── downloadAttachment.ts
└── utils/                    # Shared utilities
    ├── types.ts              # TypeScript interfaces
    └── helpers.ts            # Validation & parsing
```

## 🤖 AI Agent Support

Each operation provides:
- **Clear parameter names** (mailbox, emailUid, searchQuery, etc.)
- **Simple validation** with helpful error messages
- **Consistent return formats** for easy parsing
- **Tool support** (`usableAsTool: true`)

## 🔧 Installation

```bash
npm install
npm run build
```

## 📝 Usage Examples

### List Recent Emails (Performance Optimized)
- Operation: `List Emails`
- Folder: `INBOX`
- Limit: `50`

*Now fetches only the newest emails efficiently instead of downloading all emails*

### Server-Side Email Search (NEW!)
- Operation: `Search Emails`
- Folder: `INBOX`
- Search Query Examples:
  - `from:john` - From anyone with "john" in sender (partial)
  - `from:@company.com` - From specific domain
  - `subject:meeting` - Subject containing "meeting"
  - `unread` - All unread emails
  - `since:yesterday` - Emails from yesterday onwards
  - `from:boss and unread` - Complex criteria

*All searches run server-side for maximum performance*

### Get Full Email Content
- Operation: `Get Email`
- Folder: `INBOX`
- Email UID: `12345`

## 🔍 Advanced Search Features

The server-side search supports sophisticated queries:

### Basic Searches
- `from:john@example.com` - From specific sender (exact email)
- `from:john` - From anyone with "john" in sender (partial match)
- `from:@company.com` - From anyone at "company.com" domain
- `to:me@company.com` - To specific recipient
- `to:team` - To anyone with "team" in recipient  
- `subject:meeting` - Subject contains "meeting" (partial match)
- `body:urgent` - Body contains "urgent" (partial match)
- `text:project` - Anywhere in email (subject, from, body)

### Flag-Based Searches
- `unread` or `unseen` - Unread emails
- `read` or `seen` - Read emails
- `flagged` or `important` - Flagged/important emails
- `answered` or `replied` - Emails that have been replied to

### Date-Based Searches  
- `since:today` - Today's emails
- `since:yesterday` - Since yesterday
- `since:7d` - Last 7 days
- `before:2024-01-01` - Before specific date

### Size-Based Searches
- `larger:1000000` - Emails larger than 1MB
- `smaller:50000` - Emails smaller than 50KB

### Complex Queries
- `from:boss and unread` - Multiple criteria
- `subject:urgent or flagged` - Alternative criteria

### 💡 Practical Examples
- `from:noreply` - All automated emails
- `from:@github.com` - All GitHub notifications  
- `subject:invoice` - All invoices
- `from:team and since:today` - Today's team emails
- `subject:meeting and unread` - Unread meeting emails
- `from:@company.com and larger:1000000` - Large emails from company

*All searches run on the IMAP server for maximum performance*

## 🔐 Credentials

Uses standard IMAP credentials:
- Host (e.g., `imap.gmail.com`)
- Port (e.g., `993`)
- Username/Email
- Password
- Secure (SSL/TLS)

## 🎨 Key Improvements

✅ **Drastically simplified** from complex multi-node structure  
✅ **Modular operations** for easy maintenance  
✅ **AI-agent optimized** parameters  
✅ **Single interface** per operation  
✅ **Clean error handling** with validation  
✅ **English-only** interface  
✅ **Registry pattern** for operation management  
✅ **Performance optimized** - server-side search & efficient email fetching  
✅ **Folder terminology** instead of technical "mailbox" terms  

## 🔄 Migration from Complex Version

This version removes:
- ❌ Multiple interface modes
- ❌ Redundant AI-specific nodes
- ❌ Complex parameter structures
- ❌ German language mixing

And adds:
- ✅ Simple, direct operations
- ✅ Modular code structure
- ✅ Better error handling
- ✅ Cleaner AI integration

## 📚 Development

To add new operations:

1. Create operation class in `operations/[operationName].ts`
2. Implement `IImapOperation` interface
3. Register in `operationRegistry.ts`
4. Add UI parameters to main node file

## 🤝 Contributing

This simplified structure makes contributions much easier:
- Each operation is isolated
- Clear interfaces and types
- Consistent error handling patterns
- Simple registry for new operations

