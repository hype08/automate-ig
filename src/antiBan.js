/**
 * If on, regenerates cookie.
 */
 async function antiBan(ig) {
    if (ig.antiBanMode == true) {
        console.info('Using Antiban');
        ig = await regenSession(ig, (log = false));
    }
    return ig;
}

module.exports = antiBan;