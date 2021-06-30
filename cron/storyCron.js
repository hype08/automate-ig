const path = require('path');
const { spawn } = require('child_process');
const { DateTime } = require('luxon');
const cron = require('node-cron');

const cronExpression = '0 9,12,18,23 * * *';
const filePath = path.join(process.cwd(), '/bots/story.js');

console.info(DateTime.local().toISO());

cron.schedule(
    cronExpression,
    () => {
        const storyBot = spawn('node', [filePath]);
        storyBot.stdout.on('data', (data) => {
            console.info(`${data}`);
        });
        storyBot.stderr.on('data', (data) => {
            console.error(`${data}`);
        });
        storyBot.on('error', (error) => {
            console.error(`${error.message}`);
        });
        storyBot.on('close', (data) => {
            console.info('Storybot is done :)');
        });
    },
    {
        scheduled: true,
        timezone: process.env.TZ,
    }
);
