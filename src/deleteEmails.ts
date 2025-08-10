import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();
const SCOPES = ['https://mail.google.com/'];

async function main() {
  const clientId = process.env.GMAIL_CLIENT_ID!;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET!;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN!;
  const queriesJSON = process.env.QUERIES || '';

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  
  const queries = JSON.parse(queriesJSON);

  for (const query of queries) {
    console.log(query);
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 100,
    });

    const messages = res.data.messages || [];
    if (messages.length === 0) {
      console.log('No matching emails found.');
      continue;
    }

    console.log(`Query: ${query} Found ${messages.length} emails. Deleting...`);

    for (const msg of messages) {
      if (msg.id) {
        await gmail.users.messages.delete({ userId: 'me', id: msg.id });
        console.log(`Deleted: ${msg.id}`);
      }
    }

    console.log('Done.');
  }
}

main().catch((err) => {
  console.error('Error:', err);
});
