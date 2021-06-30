function instabot() {
    global.fs = require('fs');
    global.Api = require('instagram-private-api');
    global.login = require('./login');
    global.antiBan = require('./antiBan');
    global.likeId = require('./likeId');
    global.getUserInfo = require('./getUserInfo');
    global.deleteCookie = require('./deleteCookie');
    global.regenSession = require('./regenSession');
    global.getTimelineFeed = require('./getTimelineFeed');
    global.viewStoryOfId = require('./viewStoryOfId');
    global.viewStoryOfUser = require('./viewStoryOfUser');
    global.sleep = require('../utils/sleep');
};

module.exports = instabot();