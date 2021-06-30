require('dotenv').config();
let fs = require('fs');
let Bluebird = require('bluebird');
let _ = require('lodash');
//let Api = null;
let MQTT = require('instagram_mqtt');
let {
    GraphQLSubscriptions,
} = require('instagram_mqtt/dist/realtime/subscriptions/graphql.subscription');
let {
    SkywalkerSubscriptions,
} = require('instagram_mqtt/dist/realtime/subscriptions/skywalker.subscription');
let ig = null;
let colors = require('colors');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const shortid = require('shortid');

function saveCookies(inputLogin, cookies, state) {
    let filename = 'Undefined';
    if (inputLogin == null || inputLogin == undefined) {
        filename = process.env.IG_USERNAME;
    } else {
        filename = inputLogin;
    }

    let cookiepath = 'cookies/' + filename.toLowerCase() + '.json';
    if (!fs.existsSync('cookies/')) {
        fs.mkdirSync('cookies/');
    }
    if (!fs.existsSync('db/')) {
        fs.mkdirSync('db/');
    }
    if (!fs.existsSync(cookiepath)) {
        fs.closeSync(fs.openSync(cookiepath, 'w'));
    } else {
    }
    cookies.state = state;
    cookies = JSON.stringify(cookies);
    fs.writeFileSync(cookiepath, cookies);
    return {
        cookies,
        state,
    };
}
async function loadCookies(inputLogin, silentMode = false) {
    let filename = 'Undefined';
    if (inputLogin == null || inputLogin == undefined) {
        filename = process.env.IG_USERNAME;
    } else {
        filename = inputLogin;
    }
    let cookiepath = 'cookies/' + filename.toLowerCase() + '.json';
    if (fs.existsSync(cookiepath)) {
        let cookies = fs.readFileSync(cookiepath).toString();
        await ig.state.deserializeCookieJar(cookies);
        cookies = JSON.parse(cookies);
        ig.state.deviceString = cookies.state.deviceString;
        ig.state.deviceId = cookies.state.deviceId;
        ig.state.uuid = cookies.state.uuid;
        ig.state.phoneId = cookies.state.phoneId;
        ig.state.adid = cookies.state.adid;
        ig.state.build = cookies.state.build;
        console.info('Cookies loaded'.cyan);
        return true;
    }
    if (!silentMode) console.info('No cookie found');
    return false;
}

if (!fs.existsSync('output/')) {
    fs.mkdirSync('output/');
}

async function login(args = {}) {
    let {
        inputLogin = null,
        inputPassword = null,
        inputProxy = null,
        verificationMode = null,
        silentMode = false,
        antiBanMode = false,
        showRealtimeNotifications = false,
        onlineMode = true,
    } = args;

    MQTT.IgApiClientRealtime = MQTT.withRealtime(new Api.IgApiClient());
    ig = MQTT.IgApiClientRealtime;

    if (inputLogin != null && inputPassword != null) {
        process.env.IG_USERNAME = inputLogin;
        process.env.IG_PASSWORD = inputPassword;
    }
    if (inputProxy != null || inputProxy != undefined) {
        process.env.IG_PROXY = inputProxy;
    }
    if (onlineMode != true) {
        process.env.ONLINE_MODE = onlineMode;
    } else if (process.env.ONLINE_MODE == undefined) {
        process.env.ONLINE_MODE = true;
    } else if (process.env.ONLINE_MODE != undefined) {
    }
    ig.state.generateDevice(process.env.IG_USERNAME);

    if (process.env.IG_VERIFICATION == 'sms') {
        process.env.IG_VERIFICATION = 1;
    } else if (process.env.IG_VERIFICATION == 'email') {
        process.env.IG_VERIFICATION = 2;
    } else if (process.env.IG_VERIFICATION == 'otp') {
        process.env.IG_VERIFICATION = 0;
    }
    if (verificationMode != null) {
        //1 = sms; 2 = email
        process.env.IG_VERIFICATION = verificationMode;
    }

    if (process.env.IG_PROXY && inputProxy != false) {
        if (!silentMode) console.info('Using proxy'.green);
    } else {
        if (!silentMode) {
            console.info('Not using proxy'.yellow);
            console.info('Proxy recommended'.yellow);
        }
    }
    if (inputProxy != false) ig.state.proxyUrl = process.env.IG_PROXY;
    if (!silentMode)
        console.info('Login attempt: '.cyan + process.env.IG_USERNAME.green);
    let hasCookies = await loadCookies(inputLogin, (mode = silentMode));

    ig.request.end$.subscribe(async () => {
        const cookies = await ig.state.serializeCookieJar();
        const state = {
            deviceString: ig.state.deviceString,
            deviceId: ig.state.deviceId,
            uuid: ig.state.uuid,
            phoneId: ig.state.phoneId,
            adid: ig.state.adid,
            build: ig.state.build,
        };
        saveCookies(inputLogin, cookies, state);
        await ig.state.deserializeCookieJar(JSON.stringify(cookies));
        ig.state.deviceString = state.deviceString;
        ig.state.deviceId = state.deviceId;
        ig.state.uuid = state.uuid;
        ig.state.phoneId = state.phoneId;
        ig.state.adid = state.adid;
        ig.state.build = state.build;
    });

    await ig.simulate.preLoginFlow();
    let result = await tryToLogin(
        inputLogin,
        inputPassword,
        inputProxy,
        verificationMode,
        hasCookies,
        silentMode
    );
    result.antiBanMode = antiBanMode;
    result.showRealtimeNotifications = showRealtimeNotifications;
    result.realtime = ig.realtime;

    const subToLiveComments = (broadcastId) =>
        result.realtime.graphQlSubscribe(
            GraphQLSubscriptions.getLiveRealtimeCommentsSubscription(
                broadcastId
            )
        );

    if (result.showRealtimeNotifications) {
        result.realtime.on('receive', (topic, messages) => {
            console.info('receive', topic, messages);
        });
        result.realtime.on('direct', logEvent('direct'));
        result.realtime.on('message', logEvent('messageWrapper'));
        result.realtime.on('realtimeSub', logEvent('realtimeSub'));
        result.realtime.on('error', console.error);
        result.realtime.on('close', () =>
            console.error('RealtimeClient closed')
        );
    }

    if (process.env.ONLINE_MODE == true || process.env.ONLINE_MODE == 'true') {
        console.info('Online Mode'.green);
        await result.realtime.connect({
            graphQlSubs: [
                GraphQLSubscriptions.getAppPresenceSubscription(),
                GraphQLSubscriptions.getZeroProvisionSubscription(
                    ig.state.phoneId
                ),
                GraphQLSubscriptions.getDirectStatusSubscription(),
                GraphQLSubscriptions.getDirectTypingSubscription(
                    ig.state.cookieUserId
                ),
                GraphQLSubscriptions.getAsyncAdSubscription(
                    ig.state.cookieUserId
                ),
            ],
            skywalkerSubs: [
                SkywalkerSubscriptions.directSub(ig.state.cookieUserId),
                SkywalkerSubscriptions.liveSub(ig.state.cookieUserId),
            ],
            irisData: await ig.feed.directInbox().request(),
        });
    } else {
        console.info('Online Mode disabled'.green);
    }

    return clone(result);
}

module.exports = login;

async function tryToLogin(
    inputLogin,
    inputPassword,
    inputProxy,
    verificationMode,
    hasCookies,
    silentMode
) {
    let result = await Bluebird.try(async () => {
        if (!hasCookies) {
            if (!silentMode) console.info('User not logged in, log in');
            let loggedInUser = await ig.account.login(
                process.env.IG_USERNAME,
                process.env.IG_PASSWORD
            );

            if (!silentMode) {
                console.info('Logged');
                console.info(loggedInUser);
            }
        }
        try {
            ig.loggedInUser = await ig.account.currentUser();

            if (!silentMode) console.info('Logged in'.green);
        } catch (e) {
            console.info(e);
            const message = `Login failed from cookie | Removing incorrect cookie | Trying to regenerate...`;
            console.info(message.red);

            // await postToSlack({
            //     text: unhandledError(message),
            // });

            //Simulate needed fields:

            /* ig.loggedInUser = new Object();
            ig.loggedInUser.username = inputLogin;
            ig.loggedInUser.inputLogin = inputLogin;
            ig.loggedInUser.inputPassword = inputPassword;
            ig.loggedInUser.inputProxy = inputProxy;
            ig.loggedInUser.verificationMode = verificationMode; */

            ig.loggedInUser = new Object();
            ig.loggedInUser.username = process.env.IG_USERNAME;
            ig.loggedInUser.inputLogin = process.env.IG_USERNAME;
            ig.loggedInUser.inputPassword = process.env.IG_PASSWORD;
            ig.loggedInUser.inputProxy = process.env.IG_PROXY;
            ig.loggedInUser.verificationMode = process.env.IG_VERIFICATION;
            return await regenSession(ig, (log = false)); //"deleteCookie";
        }
        //Inject other parameters for regenSession() cases
        ig.loggedInUser.inputLogin = inputLogin;
        ig.loggedInUser.inputPassword = inputPassword;
        ig.loggedInUser.inputProxy = inputProxy;
        ig.loggedInUser.verificationMode = verificationMode;

        //Open DB
        const adapter = new FileSync(
            './db/' + process.env.IG_USERNAME.toLowerCase() + '.json'
        );
        const db = low(adapter);
        db.defaults({
            likes: [],
            comments: [],
            mediaUploaded: [],
            follows: [],
            latestFollowers: [],
        }).write();
        ig.shortid = shortid;
        ig.db = db;

        return clone(ig);
    })
        // https://github.com/dilame/instagram-private-api/issues/1214
        .catch(Api.IgCheckpointError, async () => {
            if (process.env.IG_VERIFICATION == 2) {
                // await ig.challenge.selectVerifyMethod(2); //email old method
                await ig.challenge.auto(true); //Email quick fix, now Mode 2 is solved by automode
            } else if (process.env.IG_VERIFICATION == 1) {
                await ig.challenge.selectVerifyMethod(1); //sms
            } else if (process.env.IG_VERIFICATION == 0) {
                await ig.challenge.selectVerifyMethod(0); //otp
            } else {
                await ig.challenge.auto(true); //Sms it was me
            }

            console.info(ig.state.checkpoint); //Challenge info here
            console.info(
                'Recommended to not open the app during verification / do not answer "it was me" on the phone'
                    .yellow
            );

            // Code is an object, lets parse the content
            code = code.code;

            let sendCode = await ig.challenge.sendSecurityCode(code);
            console.info(sendCode);
            console.info(
                'Done! Restart me to start your new session! (Sometimes you need to delete the cookie again after adding the code)'
                    .green
            );
            process.exit();
        })
        .catch(Api.IgLoginRequiredError, () => {
            if (hasCookies) {
                console.info('Invalid cookies');
            } else {
                // This block is not supossed to be used never (IgLoginBadPasswordError) exists
                console.info('Incorrect password');
                return 'incorrectPassword';
            }
        })
        .catch(Api.IgLoginBadPasswordError, () => {
            console.info('Incorrect password');
            return 'incorrectPassword';
        })
        .catch(Api.IgResponseError, () => {
            console.info(
                'IgResponseError:Bad request // Is your phone number verified? // Did you recieved a Verify message on instagram?'
                    .yellow
            );
            console.info(
                'Press "r" key to retry after verify "It was me" or any other key to Exit'
                    .cyan
            );
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.on('data', function (buff) {
                if (buff.toString() == 'r') {
                    console.info('retry');
                    return tryToLogin(
                        hasCookies,
                        silentMode,
                        inputLogin,
                        inputPassword,
                        inputProxy,
                        verificationMode
                    );
                } else {
                    console.info('exit');
                    process.exit();
                }
            });

            //sleepSync(1000*30);
            //process.exit();
            //return "IgResponseError";
        });
    return result;
}

//Use it to generate new sessions without overwrite last ones
function clone(obj) {
    if (null == obj || 'object' != typeof obj) return obj;
    let copy = new obj.constructor();
    for (let attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
    }
    return copy;
}

function logEvent(name) {
    return (data) => console.info(name, data);
}
