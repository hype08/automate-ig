async function getTimelineFeed(ig) {
    const feed = await ig.feed.timeline().items();

    return feed;
}

module.exports = getTimelineFeed;