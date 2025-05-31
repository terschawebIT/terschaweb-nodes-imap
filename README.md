# 🤖 n8n-nodes-imap-ai

**AI-Agent Ready IMAP Node for n8n with Enhanced Automation Capabilities & AI Tool Support**

This is an advanced, AI-agent optimized IMAP node for [n8n](https://n8n.io) that provides comprehensive email and mailbox management with intelligent `$fromAI()` integration and full **AI Tool support** for n8n AI Agents.

> **🙏 Built upon the excellent foundation of [n8n-nodes-imap](https://github.com/umanamente/n8n-nodes-imap) by [Vasily Maslyukov](https://github.com/umanamente)**

## 🌟 Features

### 🤖 **NEW: AI Tool Support** 
**Full compatibility with n8n AI Agents as intelligent tools!**

- ✅ **`usableAsTool: true`** - Automatically available as AI Agent Tool
- ✅ **`aiEnabled: true`** - Enhanced AI integration 
- ✅ **Two Node Variants**: 
  - **IMAP AI**: Classic node with `$fromAI()` support
  - **IMAP Tool**: Optimized for AI Agent tool usage
- ✅ **Intelligent Parameter Descriptions**: AI-friendly field explanations for tool usage
- ✅ **Auto-Discovery**: AI Agents can automatically discover and use IMAP operations

### ✅ Complete Email Operations (7 AI-Ready Operations)
- **EmailGetList**: Intelligent email search with AI-generated queries
- **EmailSetFlags**: AI-driven flag management with bulk operations
- **EmailMove**: Smart email organization and routing
- **EmailDownload**: AI-controlled email archiving with flexible output
- **EmailCopy**: Intelligent email duplication and backup
- **EmailDownloadAttachment**: Automatic attachment management
- **EmailCreateDraft**: AI-based draft creation with intelligent content

### ✅ Complete Mailbox Operations (8 AI-Ready Operations)
- **MailboxCreate**: Intelligent folder creation with AI parameters
- **MailboxDelete**: AI-safe deletion with mandatory confirmation
- **MailboxGetList**: Enhanced folder analysis with statistics
- **MailboxGetQuota**: Intelligent storage monitoring with analytics
- **MailboxGetStatus**: Advanced folder monitoring with activity metrics
- **MailboxRename**: AI-driven folder standardization
- **MailboxSubscribe**: Intelligent folder visibility management
- **MailboxMove**: Advanced folder reorganization and hierarchy restructuring

## 🚀 AI-Agent Integration

### 🔧 Using as AI Tool

AI Agents can automatically discover and use the **IMAP Tool** node for:

- **📧 Automated Email Processing**: AI agents can read, search, and organize emails
- **🗂️ Intelligent Folder Management**: Create, rename, and organize mailbox folders
- **🔍 Smart Email Search**: AI-driven email discovery and filtering
- **📋 Email Analytics**: Get mailbox statistics and quota information
- **🏷️ Flag Management**: Automatically mark emails as read, important, etc.

**Example AI Agent Usage:**
```
AI Agent: "Check my inbox for urgent emails from the last 24 hours"
→ Uses IMAP Tool with EmailGetList operation
→ Automatically applies search criteria and time filters
→ Returns structured email data for further processing
```

### 💡 Traditional $fromAI() Integration

Every operation includes **`$fromAI()` integration** for manual AI-agent automation:

```javascript
// Example: AI-driven email search
{
  "searchQuery": "={{ $fromAI('search_query', 'Email search criteria') }}",
  "mailboxPath": "={{ $fromAI('target_folder', 'Mailbox to search in') }}"
}
```

### Enhanced Features for AI Workflows:
- **Intelligent Parameter Descriptions**: AI-friendly field explanations
- **Enhanced Metadata**: Rich response data for AI decision-making
- **Safety Mechanisms**: Confirmation requirements for destructive operations
- **Bulk Operations**: Efficient mass email processing
- **Error Handling**: Clear error messages for AI debugging

## 📦 Installation

### Via n8n Community Nodes

1. Open your n8n instance
2. Go to **Settings** → **Community Nodes**
3. Install: `n8n-nodes-imap-ai`
4. Restart n8n

### Via npm

```bash
npm install n8n-nodes-imap-ai
```

## 🔧 Configuration

1. **Create IMAP Credentials**:
   - Host: Your IMAP server (e.g., `imap.gmail.com`)
   - Port: Usually `993` for SSL
   - Username: Your email address
   - Password: Your email password or app-specific password
   - SSL: Enable for secure connection

2. **Use in Workflows**:
   - Add "IMAP AI" node to your workflow
   - Select your IMAP credentials
   - Choose operation (Email or Mailbox)
   - Configure AI-enhanced parameters

## 🤖 AI-Agent Examples

### Smart Email Organization
```javascript
// AI automatically categorizes and moves emails
{
  "operation": "move",
  "emailIds": "={{ $fromAI('email_ids', 'IDs of emails to organize') }}",
  "targetFolder": "={{ $fromAI('target_folder', 'Destination folder based on email content') }}"
}
```

### Intelligent Folder Management
```javascript
// AI creates folders based on email patterns
{
  "operation": "createMailbox",
  "mailboxName": "={{ $fromAI('folder_name', 'Folder name based on email categorization') }}",
  "topLevelMailbox": "={{ $fromAI('is_top_level', 'Whether to create as top-level folder') }}"
}
```

### Automated Cleanup
```javascript
// AI identifies and archives old emails
{
  "operation": "downloadAndArchive", 
  "searchCriteria": "={{ $fromAI('cleanup_criteria', 'Criteria for emails to archive') }}",
  "outputFormat": "eml"
}
```

## 📊 Use Cases

- **Email Automation**: Automated email processing and routing
- **Content Analysis**: AI-driven email categorization and insights
- **Backup & Archiving**: Intelligent email backup strategies
- **Cleanup Operations**: Smart mailbox maintenance and organization
- **Integration Workflows**: Connect email data with other systems

## 🛡️ Security Features

- **Safe Deletion**: Mandatory confirmation for destructive operations
- **Credential Protection**: Secure IMAP authentication
- **Error Handling**: Comprehensive error reporting
- **Audit Trail**: Enhanced logging for operations

## 🙏 Acknowledgments

This project is built upon the excellent foundation of the original [n8n-nodes-imap](https://github.com/umanamente/n8n-nodes-imap) by **Vasily Maslyukov**. 

### What's New in the AI-Enhanced Version:
- ✅ Complete `$fromAI()` integration across all 15 operations
- ✅ 2 new mailbox operations (MailboxSubscribe, MailboxMove)
- ✅ Enhanced metadata for AI decision-making
- ✅ Improved safety mechanisms and error handling
- ✅ AI-friendly parameter descriptions and placeholders
- ✅ Modular architecture with shared utilities

### Original Project:
- **Original Author**: [Vasily Maslyukov](https://github.com/umanamente)
- **Original Repository**: [n8n-nodes-imap](https://github.com/umanamente/n8n-nodes-imap)
- **Original npm Package**: [n8n-nodes-imap](https://www.npmjs.com/package/n8n-nodes-imap)

## 🔗 Links

- **This Repository**: [GitHub](https://github.com/terschawebIT/terschaweb-nodes-imap)
- **npm Package**: [n8n-nodes-imap-ai](https://www.npmjs.com/package/n8n-nodes-imap-ai)
- **Original Project**: [n8n-nodes-imap](https://github.com/umanamente/n8n-nodes-imap)
- **Author**: [Niko Terschawetz](https://terschaweb.de)

## 📝 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

---

**Made with ❤️ for the n8n and AI automation community**  
**Special thanks to Vasily Maslyukov for the original foundation! 🙏**

