require('dotenv').config(); // โหลดค่าจาก .env ไฟล์

const fs = require('fs');
const { Client } = require('pg');
const { WebhookClient } = require('discord.js');

const lastCheckedUserIdFile = 'lastCheckedUserId.json';

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

    checkForSubmit();
});

async function checkForSubmit() {
    try {
        const result = await pgClient.query('SELECT id FROM "User" WHERE is_registered = TRUE');

        const newSubmissions = result.rows.filter(user => !lastCheckedUserId.includes(user.id));

        if (newSubmissions.length > 0) {
            const message = newSubmissions.map(user => {
                return `
** ID : ${user.id} **
Number of current applicants : ${lastCheckedUserId.length}
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

            fs.writeFileSync(lastCheckedUserIdFile, JSON.stringify(lastCheckedUserId));

            await validateJsonIds();
        }
    } catch (error) {
        console.error('Error checking for submit:', error);
    }
}

async function validateJsonIds() {
    try {
        const jsonData = require(`./${lastCheckedUserIdFile}`);

        const result = await pgClient.query('SELECT id FROM "User" WHERE is_registered = TRUE');
        const validIds = result.rows.map(row => row.id);

        const filteredIds = jsonData.filter(id => validIds.includes(id));

        fs.writeFileSync(lastCheckedUserIdFile, JSON.stringify(filteredIds));

        const invalidIds = jsonData.filter(id => !validIds.includes(id));
        if (invalidIds.length > 0) {
            const message = invalidIds.map(id => {
                return `
** ID : ${id} **
Deleted Submissions!!
`;
            }).join('\n');
            webhookClient.send({
                embeds: [{
                    color: 0xFF0000, // Red color
                    title: "🗑️ Deleted Submissions",
                    description: message
                }]
            });
        }
    } catch (err) {
        console.error('Error validating JSON IDs:', err.message);
    }
}

setInterval(checkForSubmit, 1000);
