const path = require('path');
const { spawn } = require('child_process');
const { DateTime } = require('luxon');
const cron = require('node-cron');

const cronExpression = '0 8,11,17,22 * * *';
const filePath = path.join(process.cwd(), '/bots/timeline.js');

console.info(DateTime.local().toISO());

cron.schedule(
    cronExpression,
    () => {
        const timelineBot = spawn('node', [filePath]);
        timelineBot.stdout.on('data', (data) => {
            console.info(`${data}`);
        });
        timelineBot.stderr.on('data', (data) => {
            console.error(`${data}`);
        });
        timelineBot.on('error', (error) => {
            console.error(`${error.message}`);
        });
        timelineBot.on('close', (data) => {
            console.info('Timelinebot is done :)');
        });
    },
    {
        scheduled: true,
        timezone: process.env.TZ,
    }
);
