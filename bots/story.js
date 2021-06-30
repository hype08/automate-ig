require('../src/instabot.js');

(async () => {
    console.info(':: Story Bot ::'.bgCyan);

    try {
        
        let ig = await login({
            inputLogin: process.env.IG_USERNAME,
            inputPassword: process.env.IG_PASSWORD,
        });

        const storyUsers = ['lewishamilton', 'danielricciardo', 'landonorris', 'fernandoalo_oficial'];

        for (i=0; i < storyUsers.length; i++) {
            await viewStoryOfUser(ig, storyUsers[i]);
            await sleep(17);
        }

        process.exit(0);
    } catch (error) {
        
        console.error(error);
        process.exit(1);
    }
})();