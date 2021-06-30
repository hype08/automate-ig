// PM2 -> CRON -> BOTS

module.exports = {
    apps: [
        {
            name: 'timelineCron',
            script: 'cron/timelineCron.js',
            instances: 1,
            autorestart: false,
            watch: false
        },
        {
            name: 'storyCron',
            script: 'cron/storyCron.js',
            instances: 1,
            autorestart: false,
            watch: false
        }
    ]

}


