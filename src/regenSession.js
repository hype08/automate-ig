async function regenSession(ig, log = true) {
    try {
        await deleteCookie(ig);
    } catch (e) {
        if (log) {
            console.info('No cookie found, not needed to remove.'.yellow);
        }
    }
    if (log) {
        console.info('Regenerating session'.cyan);
    }
    return await login({
        inputLogin: ig.loggedInUser.inputLogin,
        inputPassword: ig.loggedInUser.inputPassword,
        inputProxy: ig.loggedInUser.inputProxy,
        verificationMode: ig.loggedInUser.verificationMode,
        silentMode: true,
        antiBanMode: ig.antiBanMode
    });
}
module.exports = regenSession;