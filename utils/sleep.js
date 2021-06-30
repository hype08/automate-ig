async function sleep(seconds, logTimer = true) {
    let ms = seconds * 1000;
    if (logTimer) {
        console.info(('Sleeping ' + seconds + ' s').yellow);
    }
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = sleep;
