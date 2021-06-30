async function viewStoriesOfId(ig, id, username) {
    try {
        if (!Array.isArray(id)) {
            let aux = [];
            aux.push(id);
            id = aux;
        }
        const reelsFeed = await ig.feed.reelsMedia({
            userIds: id,
        });
        await sleep(2, false);
        const storyItems = await reelsFeed.items();

        if (storyItems.length != 0) {
            process.stdout.write('Viewing => ');
            process.stdout.write(`👀  ${username}`);
            await ig.story.seen(storyItems);
            process.stdout.write('👍 ');
            return storyItems.length;
        } else {
            return 0;
        }
    } catch (e) {
        console.info(e);
        console.info('Wait 30 minutes');
        await sleep(30 * 60);
        return await viewStoriesOfId(ig, id);
    }
}

module.exports = viewStoriesOfId;
