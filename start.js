require('dotenv').config(); // โหลดค่าจาก .env ไฟล์

const fs = require('fs');
const { Client } = require('pg');
const { WebhookClient } = require('discord.js');

const lastCheckedUserIdFile = 'lastCheckedUserId.json';
let invalidIdsAlreadyNotified = false; // ตัวแปรเพื่อตรวจสอบว่า webhook ถูกส่งไปแล้วหรือไม่

let lastCheckedUserId;
try {
    lastCheckedUserId = require(`./${lastCheckedUserIdFile}`);
} catch (err) {
    console.error('Failed to load last checked user ID file:', err.message);
}

const pgClient = new Client({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

const webhookClient = new WebhookClient({
    id: process.env.WEBHOOK_ID,
    token: process.env.WEBHOOK_TOKEN,
});

pgClient.connect((err) => {
    if (err) {
        console.error('Failed to connect to PostgreSQL database:', err.stack);
        return;
    }
    console.log('Connected to PostgreSQL database successfully');

    // เรียกใช้ checkForSubmit() และ validateJsonIds() เพื่อให้ทำงานอย่างต่อเนื่อง
    setInterval(() => {
        checkForSubmit();
        validateJsonIds();
    }, 1000); 
});

async function getTotalIdsInDatabase() {
    try {
        const result = await pgClient.query('SELECT COUNT(*) FROM "User"');
        return result.rows[0].count;
    } catch (error) {
        console.error('Error fetching total IDs in database:', error);
        throw error;
    }
}

async function checkForSubmit() {
    try {
        const totalIdsInDatabase = await getTotalIdsInDatabase();

        const result = await pgClient.query('SELECT id FROM "User" WHERE is_registered = TRUE');

        const newSubmissions = result.rows.filter(user => !lastCheckedUserId.includes(user.id));

        const currentApplicants = result.rows.length;

        if (newSubmissions.length > 0) {
            const peopleNotSubmitted = totalIdsInDatabase - lastCheckedUserId.length - 1;

            const message = newSubmissions.map(user => {
                return `
**   **
** ID : ${user.id} **

Number of current applicants : ${currentApplicants}
not submitted yet: ${peopleNotSubmitted}
Total number of IDs: ${totalIdsInDatabase}

Information may be inaccurate +- 3 people.
`;
            }).join('\n');

            webhookClient.send({
                embeds: [{
                    color: 0x00FF00, // Green color
                    title: "🎉 New Submissions",
                    description: message
                }]
            });

            lastCheckedUserId.push(...newSubmissions.map(user => user.id));

            fs.writeFileSync(lastCheckedUserIdFile, JSON.stringify(lastCheckedUserId, null, 2));

            await validateJsonIds();
        }
    } catch (error) {
        console.error('Error checking for submit:', error);
    }
}




async function validateJsonIds() {
    try {
        // Load JSON data from the file
        const jsonData = require(`./${lastCheckedUserIdFile}`);

        // Fetch valid IDs from the PostgreSQL database
        const result = await pgClient.query('SELECT id FROM "User" WHERE is_registered = TRUE');
        const validIds = result.rows.map(row => row.id);

        // Filter out invalid IDs from the loaded JSON data
        const filteredIds = jsonData.filter(id => validIds.includes(id));

        // Find invalid IDs (IDs in JSON that are not in the database)
        const invalidIds = jsonData.filter(id => !validIds.includes(id));

        // If there are invalid IDs, send a Discord webhook message
        if (invalidIds.length > 0) {
            const message = invalidIds.map(id => {
                return `
** ID : ${id} **
Deleted Submissions!!
`;
            }).join('\n');

            // Check if webhook has been sent before sending a new one
            if (!invalidIdsAlreadyNotified) {
                webhookClient.send({
                    embeds: [{
                        color: 0xFF0000, // Red color
                        title: "🗑️ Deleted Submissions",
                        description: message
                    }]
                });
                invalidIdsAlreadyNotified = true; // Mark as notified
            }

            // Write back the filtered IDs to the JSON file
            fs.writeFileSync(lastCheckedUserIdFile, JSON.stringify(filteredIds, null, 2));
        } else {
            invalidIdsAlreadyNotified = false; // Reset the flag
        }

    } catch (err) {
        console.error('Error validating JSON IDs:', err.message);
    }
}
