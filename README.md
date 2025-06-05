# n8n IMAP Node

Eine n8n Community Node für IMAP Email-Operationen mit erweiterten Such- und Verwaltungsfunktionen.

## Installation

```bash
npm install n8n-nodes-imap-ai
```

Alternativ über die n8n Community Nodes GUI: `n8n-nodes-imap-ai`

## Funktionen

### Email-Operationen

**List Emails**
- Listet Emails in einem Mailbox-Ordner auf
- Konfigurierbare Anzahl (Limit)
- Sortierung nach UID (neueste zuerst)

**Get Email**
- Ruft eine einzelne Email mit vollständigem Inhalt ab
- Unterstützt Text- und HTML-Inhalte
- Parst Email-Headers und Metadaten

**Search Emails**
- Zwei Modi: Simple Search und Advanced Search
- Server-seitige IMAP SEARCH für Performance
- Kombinierbare Suchkriterien im Advanced Mode

**Move Email**
- Verschiebt Emails zwischen Mailbox-Ordnern
- Verwendet IMAP MOVE Kommando

**Mark Email**
- Markiert Emails als gelesen oder ungelesen
- Ändert IMAP Flags entsprechend

**Delete Email**
- Markiert Emails zur Löschung
- Verwendet IMAP STORE mit \Deleted Flag

**Download Attachment**
- Lädt Email-Anhänge herunter
- Unterstützt verschiedene Attachment-Typen

### Mailbox-Operationen

**List Mailboxes**
- Listet alle verfügbaren IMAP-Ordner auf
- Unterstützt hierarchische Ordnerstrukturen

**Create Mailbox**
- Erstellt neue IMAP-Ordner
- Validiert Ordnernamen

### Draft-Operationen

**Create Draft**
- Erstellt Email-Entwürfe
- Unterstützt Text- und HTML-Format
- Konfigurierbare Empfänger, Betreff und Inhalt

## Email-Suche

### Simple Search Mode

Bietet vordefinierte Filter:
- All Emails
- Unread Emails  
- Read Emails
- Today's Emails
- This Week's Emails

Optional mit Textsuche die gleichzeitig Subject, From und Body durchsucht.

### Advanced Search Mode

Kombinierbare Kriterien:

**Content-Filter:**
- From (Sender): Email-Adresse oder Name
- To (Empfänger): Ziel-Email-Adresse
- Subject Contains: Text im Betreff
- Body Contains: Text im Email-Inhalt

**Status-Filter:**
- Read Status: Any/Unread Only/Read Only
- Has Attachments: Any/With Attachments/Without Attachments

**Date-Filter:**
- Quick Date Presets: Last Hour, Today, Yesterday, This Week, Last Week, This Month, Last Month
- Custom Date Range: Von/Bis Datum

**Size-Filter:**
- Email Size: Larger than/Smaller than X KB

## Konfiguration

### IMAP-Verbindung

Erforderliche Credential-Parameter:
- Host (z.B. `imap.gmail.com`)
- Port (z.B. `993`)
- Username/Email-Adresse
- Password/App-Password
- Secure (SSL/TLS aktiviert)

### Parameter-Validierung

Die Node validiert alle Eingabeparameter:
- Mailbox-Namen werden auf Gültigkeit geprüft
- Email-UIDs müssen numerisch sein
- Limits werden auf 1-1000 begrenzt
- Verbindungsparameter werden vor Ausführung validiert

## Technische Details

### Architektur

**Modular aufgebaut:**
- Hauptnode-Klasse (`Imap.node.ts`)
- Separate Operation-Klassen (`operations/`)
- Geteilte Utilities (`utils/`)
- Zentrale Property-Definitionen (`ImapNodeProperties.ts`)

**Operations Registry Pattern:**
- Jede Operation implementiert `IImapOperation` Interface
- Dynamische Registrierung neuer Operationen möglich
- Saubere Trennung der Geschäftslogik

### Performance-Optimierungen

**Connection Management:**
- Promise.race() Timeouts für robuste Verbindungsabwicklung
- Automatische Connection-Cleanup
- Fehlerbehandlung mit Fallback-Mechanismen

**Search Performance:**
- Server-seitige IMAP SEARCH statt Client-seitiges Filtern
- Optimierte Fetch-Operationen für Metadaten
- Begrenzte Ergebnismengen zur Performance-Schonung

### Error Handling

**Robuste Fehlerbehandlung:**
- NodeApiError für konsistente n8n-Integration
- Detaillierte Fehlermeldungen mit Kontext
- Graceful Degradation bei Teilausfällen

**Validation:**
- Parameter-Validierung vor IMAP-Operationen
- Mailbox-Existenz-Prüfung
- Email-UID Validierung

## Verwendungsbeispiele

### Einfache Email-Suche

```javascript
// Simple Mode: Heute's Emails mit Text-Filter
{
  "operation": "searchEmails",
  "searchMode": "simple", 
  "quickFilter": "today",
  "simpleSearchText": "invoice"
}
```

### Erweiterte Email-Suche

```javascript
// Advanced Mode: Mehrere Kriterien kombiniert
{
  "operation": "searchEmails",
  "searchMode": "advanced",
  "advancedCriteria": {
    "from": "billing@company.com",
    "subject": "payment", 
    "readStatus": "unread",
    "quickDate": "thisWeek",
    "hasAttachments": "yes"
  }
}
```

### Email-Management

```javascript
// Email abrufen
{
  "operation": "getEmail",
  "mailbox": "INBOX",
  "emailUid": "12345"
}

// Email verschieben  
{
  "operation": "moveEmail",
  "mailbox": "INBOX",
  "emailUid": "12345", 
  "targetMailbox": "Archive"
}
```

## Kompatibilität

**Getestete IMAP-Server:**
- Gmail (imap.gmail.com)
- Outlook/Exchange
- Standard IMAP-konforme Server

**Voraussetzungen:**
- n8n Version >= 0.190.0
- Node.js >= 16
- IMAP-Server mit SSL/TLS Unterstützung

## Bekannte Limitationen

- OAuth2-Authentifizierung noch nicht implementiert
- Attachment-Suche nutzt Content-Type Workaround (IMAP-Standard-Limitation)
- Große Email-Attachments können Memory-intensiv sein

## Entwicklung

### Neue Operationen hinzufügen

1. Operation-Klasse in `operations/` erstellen
2. `IImapOperation` Interface implementieren  
3. In `operationRegistry.ts` registrieren
4. UI-Parameter in `ImapNodeProperties.ts` definieren

### Build & Test

```bash
npm run build
npm test
```

## Changelog

**v2.3.0**
- Neue Multi-Criteria Search UI
- Simple vs Advanced Search Modi
- Erweiterte Date/Size/Attachment Filter

**v2.2.4** 
- Promise.race() Timeout Fix für IMAP logout
- Verbesserte Connection-Stabilität

**v2.2.0**
- Modulare Architektur-Refactoring
- Operations Registry Pattern
- Verbesserte Error Handling

## Support

- GitHub Issues: [Repository Issues](https://github.com/terschawebIT/terschaweb-nodes-imap/issues)
- Email: support@terschaweb.de

## Lizenz

MIT License

