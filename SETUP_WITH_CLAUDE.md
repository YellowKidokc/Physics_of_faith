# Deploy Your Own POF 2828 Dashboard

## What this is
A personal productivity app — clipboard, notes, tasks, bookmarks, AI chat.
Works on your phone and computer. Free to run.

## What you need
- A computer (Windows, Mac, or Linux)
- A Google account (for sign-in)
- Claude Code (the CLI tool you're reading this in)

## Instructions
Paste everything below the line into Claude Code. Then just approve each step when it asks.

---

## PASTE THIS INTO CLAUDE CODE:

I want you to deploy my own copy of the POF 2828 Dashboard. This is a
personal productivity PWA (clipboard, notes, tasks, bookmarks, AI chat)
hosted on Firebase for free with Google Sign-In.

Do everything for me. I will approve each step. I have never programmed
before so explain anything you need from me in plain English.

Here is what you need to do, in order:

### Phase 1: Install tools (if not already installed)

1. Check if Node.js v18+ is installed. If not, download and install it.
   - Windows: use winget or download from https://nodejs.org
   - Mac: use brew install node
2. Check if Firebase CLI is installed. If not: `npm install -g firebase-tools`
3. Run `firebase login` — this will open my browser to sign in with Google.
   Tell me when to click approve in my browser.

### Phase 2: Get the app code

4. Pick a good location on my computer (like my home folder or Desktop).
5. Clone the repo: `git clone https://github.com/YellowKidokc/pof2828-dashboard.git`
6. `cd pof2828-dashboard`
7. `npm install`

### Phase 3: Create Firebase project

8. Tell me to go to https://console.firebase.google.com in my browser.
9. Walk me through clicking "Add project" — I should:
   - Name it something like "my-dashboard" (or whatever I want)
   - Disable Google Analytics when asked (not needed)
   - Wait for it to create
10. Walk me through registering a web app:
    - Click the web icon (looks like </>) on the project overview page
    - Name it "dashboard"
    - Do NOT check "Firebase Hosting" yet
    - Click Register
    - A code block will appear with `firebaseConfig = { ... }`
    - Tell me to copy that entire config block and paste it to you

### Phase 4: Enable Firebase services

11. Tell me to go to Authentication in the left sidebar:
    - Click "Get started"
    - Click "Google" under sign-in providers
    - Toggle the Enable switch ON
    - Pick my email as the support email
    - Click Save
12. Tell me to go to Firestore Database in the left sidebar:
    - Click "Create database"
    - Pick the location closest to me
    - Select "Start in production mode"
    - Click Create

### Phase 5: Configure the app

13. Create a `.env` file in the project folder with these contents
    (fill in the values from the firebaseConfig I pasted to you):
    ```
    VITE_BACKEND=firebase
    VITE_FIREBASE_API_KEY=<from config>
    VITE_FIREBASE_AUTH_DOMAIN=<from config>
    VITE_FIREBASE_PROJECT_ID=<from config>
    VITE_FIREBASE_STORAGE_BUCKET=<from config>
    VITE_FIREBASE_MESSAGING_SENDER_ID=<from config>
    VITE_FIREBASE_APP_ID=<from config>
    ```

### Phase 6: Set up security rules

14. Run `firebase init firestore` in the project folder:
    - When asked for project, select the one I just created
    - Accept default filenames
15. Replace the content of `firestore.rules` with:
    ```
    rules_version = '2';
    service cloud.firestore {
      match /databases/{database}/documents {
        match /users/{userId}/{document=**} {
          allow read, write: if request.auth != null
                             && request.auth.uid == userId;
        }
      }
    }
    ```
16. Deploy rules: `firebase deploy --only firestore:rules`

### Phase 7: Build and deploy

17. Build the app: `npm run build`
18. Run `firebase init hosting`:
    - Public directory: `dist`
    - Single-page app: Yes
    - Do NOT overwrite index.html
19. Deploy: `firebase deploy --only hosting`
20. Firebase will print a URL like `https://my-dashboard.web.app`
    — tell me that URL, that's my dashboard!

### Phase 8: Test it

21. Tell me to open that URL in my browser.
22. I should see a "Sign in with Google" button — tell me to click it.
23. Once signed in, walk me through:
    - Adding a clipboard item
    - Creating a note
    - Adding a task
    - Show me it works on my phone too (just open the same URL)
    - Show me how to install it as an app (Add to Home Screen)

### If something goes wrong
- If a command fails, read the error and fix it for me.
- If I need to do something in the Firebase Console, give me
  step-by-step instructions with exactly what to click.
- Never assume I know what a terminal, directory, or config file is.
  Explain in plain language.

That's it. Start with Phase 1.
