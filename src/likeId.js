_ = require('lodash');
parser = require('instagram-id-to-url-segment');

async function likeId(
    ig,
    media_id,
    forceLike = false,
    extraInfo = new Object()
) {
    let alreadyExists = ig.db.get('likes').find({ media_id: media_id }).value();
    alreadyExists == undefined ? false : true;
    if (alreadyExists && forceLike == false) {
        console.info('Already liked.'.yellow);
        return 'already_liked';
    }
    await antiBan(ig);
    await ig.media.like({
        mediaId: media_id,
        moduleInfo: {
            module_name: 'profile',
            user_id: ig.loggedInUser.pk,
            username: ig.loggedInUser.username
        },
        d: _.sample([0, 1]) // d - means double-tap.
    });

    let timestamp =
        new Date().getTime() - new Date().getTimezoneOffset() * 60 * 1000;

    let link =
        'https://www.instagram.com/p/' +
        parser.instagramIdToUrlSegment(media_id);
    if (alreadyExists) {
        ig.db
            .get('likes')
            .find({ media_id: media_id })
            .assign({ created_at: timestamp })
            .write();
    } else {
        ig.db
            .get('likes')
            .push({
                id: ig.shortid.generate(),
                media_id: media_id,
                link: link,
                created_at: timestamp,
                extra_info: extraInfo
            })
            .write();
    }

    return console.info(
        'Liked https://www.instagram.com/p/'.green +
            parser.instagramIdToUrlSegment(media_id).green
    );
}

module.exports = likeId;