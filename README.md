# MyProject

## 💡 Description
MyProject is a program used to check user registrations within a system. It queries data from a PostgreSQL database and sends notifications through Discord webhooks when new registrations are detected or existing registrations are deleted.

## 🚀 Usage
1. Before starting the program, install dependencies using `npm install`.
2. Create a `.env` file and specify necessary values such as PostgreSQL credentials and Discord webhook credentials.
3. Run the program using `node start.js` or `npm start`.

OR

1. Create a `.env` file and specify necessary values such as PostgreSQL credentials and Discord webhook credentials.
2. Run the setup.bat file for the first time to install dependencies:
   ```sh
   setup.bat
   ```
   After setup, from now on click to open file:
   ```sh
   start.bat
   ```

## 🛠️ System Requirements
- Node.js version 12 or higher.
- PostgreSQL server.
- Discord webhook URL.

## 📁 File Structure
- `start.js`: Main file of the program.
- `lastCheckedUserId.json`: File storing the list of checked user IDs.
- `.env`: File storing important variables such as credentials.

The `.env` file should include the following variables:

```plaintext
PG_USER=       # PostgreSQL username
PG_HOST=       # PostgreSQL host
PG_DATABASE=   # PostgreSQL database name
PG_PASSWORD=   # PostgreSQL password
PG_PORT=5432   # PostgreSQL port (default is 5432)

WEBHOOK_ID=    # Discord webhook ID
WEBHOOK_TOKEN= # Discord webhook token
```

## ⚠️ Precautions
- Avoid exposing the `.env` file or credential data directly in the code.
- Validate the correctness of data in the `.env` file before running the program.

## 📝 How It Works
How does MyProject work? Here's the workflow:

1. **Connect to PostgreSQL Database**: The project starts by connecting to the PostgreSQL database using login data specified in the `.env` file to retrieve information about registered users.

2. **Check for New Members**: The program queries the database to find new members who have registered but have not yet been checked. If new members are found, the program sends a notification message through Discord webhook to inform the administrators.

3. **Update Checked Member List**: After checking for new members, the program updates the list of members who have been checked to avoid duplicating the check in the future.

4. **Validate Member List**: The program checks the correctness of the list of members stored in the `lastCheckedUserId.json` file by comparing it with data in the PostgreSQL database to ensure that there have been no changes or deletions of members from the system.

## 📢 User Feedback
For any errors or suggestions regarding the MyProject project, please contact us at tik.jedsdp@gmail.com
