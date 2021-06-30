require('../src/instabot.js');

async function main() {
    console.info(':: Timeline Bot ::'.bgCyan);

    try {
        
        let ig = await login({
            inputLogin: process.env.IG_USERNAME,
            inputPassword: process.env.IG_PASSWORD,
        });

        const posts = await getTimelineFeed(ig);
        console.info('posts count: ', posts.length);

        for (i=0; i < posts.length; i++) {
            let curPost = posts[i];

            await likeId(ig, curPost.pk);
            await sleep(25);
        }

        process.exit(0);
    } catch (error) {
        
        console.error(error);
        process.exit(1);
    }
}

main();