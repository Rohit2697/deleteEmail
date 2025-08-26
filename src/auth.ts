import fs from 'fs';
import path from 'path';
import { authenticate } from '@google-cloud/local-auth';

const SCOPES = ['https://mail.google.com/'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

export interface GoogleOAuthCredentials {
  installed: {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

export interface GoogleAuthToken {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: 'Bearer' | string;
  refresh_token_expires_in: number; // in seconds
  expiry_date: number; // timestamp (ms since epoch)
}

export interface TokenJSON {
  [key: string]: GoogleAuthToken & {
    refresh_token_expires_date: number;
  };
}

export async function checkAuth(emailId: string) {
  console.log(`Checking Authentication for ${emailId}...`);
  let tokenJson: Partial<TokenJSON> = {};
  const CREDENTIALS_PATH = path.join(
    process.cwd(),
    `credentials_${emailId.split('@')[0]}.json`
  );

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.log(` credential file not exists 
        credential_path: ${CREDENTIALS_PATH}
        `);
    return null;
  }

  const credentialJSON = JSON.parse(
    fs.readFileSync(CREDENTIALS_PATH, 'utf-8')
  ) as GoogleOAuthCredentials;
  if (fs.existsSync(TOKEN_PATH)) {
    tokenJson = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8')) as TokenJSON;
  }
  if (
    !fs.existsSync(TOKEN_PATH) ||
    !tokenJson[emailId] ||
    Date.now() > tokenJson[emailId].refresh_token_expires_date
  ) {
    try {
      const auth = await authenticate({
        keyfilePath: CREDENTIALS_PATH,
        scopes: SCOPES,
      });
      const receivedToken = auth.credentials as GoogleAuthToken;

      const newToken = {
        ...receivedToken,
        refresh_token_expires_date:
          Date.now() + receivedToken.refresh_token_expires_in * 1000,
      };

      tokenJson[emailId] = newToken;

      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokenJson), 'utf-8');
      console.log('Token saved to', TOKEN_PATH);
    } catch (err) {
      console.log(`Unable to Authenticate ${emailId}, ${err}`);
      return null;
    }
  }
  return {
    gmail_client_id: credentialJSON.installed.client_id,
    gmail_client_secret: credentialJSON.installed.client_secret,
    gmail_refresh_token: tokenJson[emailId].refresh_token,
    gmail_email_id: emailId,
  };
}

//main().catch(console.error);
