import { google, gmail_v1 } from 'googleapis';
import dotenv from 'dotenv';
import { checkAuth } from './auth';
dotenv.config();

class DeleteGmail {
  private clientId: string | undefined;
  private clientSecret: string | undefined;
  private refreshToken: string | undefined;
  private queriesJSON: string;
  private gmail_email_id: string;
  constructor(gmail_email_id: string) {
    // this.clientId = gmail_cred.gmail_client_id!;
    // this.clientSecret = gmail_cred.gmail_client_secret!;
    // this.refreshToken = gmail_cred.gmail_refresh_token!;
    this.gmail_email_id = gmail_email_id;

    this.queriesJSON = process.env.QUERIES || '';
  }

  async main() {
    console.log(`setting up gmail for: ${this.gmail_email_id}...`);
    const tokenObj = await checkAuth(this.gmail_email_id);
    if (!tokenObj) {
      console.log(
        `Can not perform the delete gmail operation for ${this.gmail_email_id}`
      );
      return;
    }
    this.clientId = tokenObj.gmail_client_id;
    this.clientSecret = tokenObj.gmail_client_secret;
    this.refreshToken = tokenObj.gmail_refresh_token;
    const oauth2Client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret
    );
    oauth2Client.setCredentials({ refresh_token: this.refreshToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const queries = JSON.parse(this.queriesJSON);

    for (const query of queries) {
      let allMessages: any[] = [];
      let pageToken: string | null | undefined = undefined;
      do {
        const res: gmail_v1.Schema$ListMessagesResponse = (
          await gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults: 500,
            pageToken,
          })
        ).data;
        const messages = res.messages || [];
        allMessages = allMessages.concat(messages);
        pageToken = res.nextPageToken;
      } while (pageToken);

      if (allMessages.length === 0) {
        console.log(`Query: ${query} No matching emails found.`);
        continue;
      }

      console.log(
        `Query: ${query} Found ${allMessages.length} emails. Deleting...`
      );

      const BATCH_LIMIT = 1000;
      for (let i = 0; i < allMessages.length; i += BATCH_LIMIT) {
        const batch = allMessages.slice(i, i + BATCH_LIMIT);
        const ids = batch.map((msg) => msg.id!).filter(Boolean);

        if (ids.length > 0) {
          await gmail.users.messages.batchDelete({
            userId: 'me',
            requestBody: { ids },
          });
          console.log(
            `email: ${this.gmail_email_id} Deleted ${ids.length} messages in batch.`
          );
        }
      }

      console.log(`Cleanup Done for ${this.gmail_email_id}.`);
    }
  }
}

const gmail_IdsJSON = process.env.GMAIL_IDS || '';
const gmail_ids: string[] = JSON.parse(gmail_IdsJSON) || [];
const deleteGamilOperation = async () => {
  for (const gmail_id of gmail_ids) {
    try {
      const gmailClient = new DeleteGmail(gmail_id);
      await gmailClient.main();
    } catch (err) {
      console.log(`Cleanup failed for ${gmail_id}`, err);
    }
  }
  console.log(`Clean up operation done for all accounts.`);
};

deleteGamilOperation();
