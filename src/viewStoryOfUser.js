async function viewStoryOfUser(ig, username) {
    userInfo = await getUserInfo(ig, username);

    let id = userInfo.pk;
    let result = await viewStoryOfId(ig, id, username);
    if (result == 0) {
        console.info('No stories found on user ' + username);
    }
    return result;
}

module.exports = viewStoryOfUser;