
export default function() {
  getFeedCursor = (limit, skip, userId) => {
    const sort = {
      createdAt: -1
    };

    return Feed.find({ forUsers: userId }, {
      sort,
      limit,
      skip,
      fields: {
        byUserId: 1,
        givenTaskId: 1,
        title: 1,
        report: 1
      },
      transform: transformFeed
    });
  }

  let usersCache = [];

  const transformFeed = (feed) => {
    if (!usersCache[feed.byUserId])
      usersCache[feed.byUserId] = Meteor.users.findOne({ _id: feed.byUserId },
           { fields: {"_id": 1, "profile.name": 1, "profile.lastname": 1, "profile.avatar": 1, "profile.privacy": 1}});

    feed.byUser = usersCache[feed.byUserId];

    if (feed.byUser) {
      feed.byUser.profile.avatar = Meteor.users.getAvatarProps(feed.byUserId);
    } else {
      feed.anonAvatar = {
        style: 'background-color: rgb(0, 0, 0);',
        url: {
          thumb: '/images/anonymous_avatar.png'
        }
      }
    }

    if (feed.report) feed.sentTime = moment(feed.report.reportSendAt).locale('ru').format("HH:mm, DD.MM");

    return feed;
  }
}
