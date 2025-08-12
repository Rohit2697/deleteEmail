# Gmail Auto-Delete Script

This Node.js script connects to the Gmail API to **automatically delete emails matching specific search queries**.  
The primary goal is to **optimize Google storage usage** by cleaning up unwanted messages from multiple Gmail accounts.  

---

## 📌 Features  
- Supports **multiple Gmail accounts** via credentials list.  
- Uses **OAuth2 with refresh tokens** to avoid re-authentication each run.  
- Deletes messages in bulk based on **custom search queries**.  
- Runs asynchronously for all accounts using `Promise.all`.  
- Can be automated via **Windows Task Scheduler**, **cron jobs**, or manual runs.  

---

## 🛠️ Prerequisites  

- **Node.js** (v18 or higher recommended)  
- **npm** or **yarn**  
- A **Google Cloud Project** with Gmail API enabled  
- Gmail account(s) for which you want to delete emails  

---

## 📂 Setup Steps  

### 1. **Create a Google Cloud Project & Enable Gmail API**  
1. Go to [Google Cloud Console](https://console.cloud.google.com/).  
2. Create a **new project** (or use an existing one).  
3. Navigate to **APIs & Services → Library**.  
4. Search for **Gmail API** and click **Enable**.  

---

### 2. **Create OAuth2 Credentials**  
1. Go to **APIs & Services → Credentials**.  
2. Click **Create Credentials → OAuth client ID**.  
3. Choose **Desktop app** as the application type.  
4. Save the **Client ID** and **Client Secret**.  

---

### 3. **Generate a Refresh Token**  
Since this script is automated, we need a refresh token to avoid logging in each time.  

You can use a quick script like this:  

\`\`\`ts
import { google } from 'googleapis';

const SCOPES = ['https://mail.google.com/'];

async function getRefreshToken() {
  const oauth2Client = new google.auth.OAuth2(
    'YOUR_CLIENT_ID',
    'YOUR_CLIENT_SECRET',
    'YOUR_REDIRECT_URI' // e.g. http://localhost
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authUrl);
}

getRefreshToken();
\`\`\`

- Visit the URL printed in your console.  
- Log in and copy the code from the redirect URL.  
- Exchange that code for tokens:  

\`\`\`ts
const { tokens } = await oauth2Client.getToken('AUTH_CODE');
console.log(tokens);
\`\`\`

- Save the \`refresh_token\`.  

---

### 4. **Environment Variables**  
Create a `.env` file in your project root:  

\`\`\`env
# Array of Gmail account credentials in JSON format
GMAIL_CREDENTIALS=[{
  "gmail_email_id": "youremail@gmail.com",
  "gmail_client_id": "YOUR_CLIENT_ID",
  "gmail_client_secret": "YOUR_CLIENT_SECRET",
  "gmail_refresh_token": "YOUR_REFRESH_TOKEN"
}]

# Array of Gmail search queries (Gmail search syntax)
QUERIES=["older_than:2y", "label:spam", "from:noreply@example.com"]
\`\`\`

---

### 5. **Install Dependencies**  
\`\`\`sh
npm install googleapis dotenv
\`\`\`

---

### 6. **Run the Script**  
\`\`\`sh
npx ts-node src/deleteEmails.ts
\`\`\`

---

## ⚙️ How the Code Works  

1. **Loads environment variables** from `.env`.  
2. **Parses multiple account credentials** from `GMAIL_CREDENTIALS`.  
3. **Creates a Gmail API client** for each account using OAuth2.  
4. For each query in `QUERIES`:
   - Searches for matching emails.  
   - Deletes all found messages (up to 100 at a time).  
5. Runs all accounts **in parallel** using `Promise.all`.  

---

## 📅 Automation Options  

### **Windows Task Scheduler**  
1. Open **Task Scheduler**.  
2. Create a new task.  
3. Set a **trigger** (e.g., daily at 2 AM).  
4. Set an **action**:
   \`\`\`
   Program: node
   Arguments: D:\deleteGmail\dist\deleteEmails.js
   Start in: D:\deleteGmail
   \`\`\`
5. Save and enable the task.  

### **Linux/macOS (Cron Job)**  
\`\`\`sh
0 2 * * * /usr/bin/node /path/to/deleteEmails.js
\`\`\`

---

## 📌 Notes  
- Gmail’s API has **rate limits**. If you process many accounts or emails, you may need delays.  
- Always **test your queries** in Gmail search before running.  
- Deleted emails are moved to **Trash** and permanently removed after 30 days (or sooner if emptied).  

---

## 📜 License  
MIT License.  
