import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();
const SCOPES = ['https://mail.google.com/'];
interface GmailCred {
  gmail_email_id: string;
  gmail_client_id: string;
  gmail_client_secret: string;
  gmail_refresh_token: string;
}
class DeleteGmail {
  private clientId: string | undefined;
  private clientSecret: string | undefined;
  private refreshToken: string | undefined;
  private queriesJSON: string;
  private gmail_email_id: string;
  constructor(gmail_cred: GmailCred) {
    this.clientId = gmail_cred.gmail_client_id!;
    this.clientSecret = gmail_cred.gmail_client_secret!;
    this.refreshToken = gmail_cred.gmail_refresh_token!;
    this.gmail_email_id = gmail_cred.gmail_email_id;
    this.queriesJSON = process.env.QUERIES || '';
  }

  async main() {
    console.log(`setting up gmail for: ${this.gmail_email_id}...`);

    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret
    );
    oauth2Client.setCredentials({ refresh_token: this.refreshToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const queries = JSON.parse(this.queriesJSON);

    for (const query of queries) {
      console.log(query);
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 500,
      });

      const messages = res.data.messages || [];
      if (messages.length === 0) {
        console.log('No matching emails found.');
        continue;
      }

      console.log(
        `Query: ${query} Found ${messages.length} emails. Deleting...`
      );

      for (const msg of messages) {
        if (msg.id) {
          await gmail.users.messages.delete({ userId: 'me', id: msg.id });
          console.log(`Deleted: ${msg.id}`);
        }
      }

      console.log(`Cleanup Done for ${this.gmail_email_id}.`);
    }
  }
}

const gmail_credsJSON = process.env.GMAIL_CREDENTIALS || '';

const gmail_creds: GmailCred[] = JSON.parse(gmail_credsJSON) || [];
const callingPromises = gmail_creds.map((gmail_cred) => {
  const gmailClient = new DeleteGmail(gmail_cred);
  return Promise.resolve()
    .then(() => gmailClient.main()) // ensures sync throws become rejected promises
    .catch((err) => {
      console.error(
        `Error processing account: ${gmail_cred.gmail_email_id}`,
        err
      );
    });
});

Promise.all(callingPromises).then(() => {
  console.log('All accounts processed');
});
