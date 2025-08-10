import fs from 'fs';
import path from 'path';
import { authenticate } from '@google-cloud/local-auth';


const SCOPES = ['https://mail.google.com/'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function main() {
  const auth = await authenticate({
    keyfilePath: CREDENTIALS_PATH,
    scopes: SCOPES,
  });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(auth.credentials));
  console.log('Token saved to', TOKEN_PATH);
}

main().catch(console.error);
