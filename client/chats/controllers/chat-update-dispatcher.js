import {Meteor} from 'meteor/meteor';
import {Updates} from '/model/updates';

/**
 * Sets up a Default dispatcher for All CHAT events
 */
Updates.addDispatcher('CHAT', (event, notify, clear, next) => {
  const {info} = event;
  const userId = Meteor.userId();

  // if no Info or Auhtor is current user, then call Next
  if (event.initial || !info || info.owner === userId) {
    return next();
  }

  // Private, nice, notify user!
  if (info.type === 'PRIVATE') {
    return notify({
      title: 'Личное сообщение',
      text: info.text,
      icon: Meteor.users.getAvatarProps(info.owner).url.thumb,
      sound: true,
      href: {pathname: 'chatdetails', params: {chatId: info.chat}},
    });
  }

  // Reply to me??? Really?? Show me that one!
  if (info.replyOwner === userId) {
    return notify({
      title: 'Ответ на сообщение',
      text: info.text,
      icon: Meteor.users.getAvatarProps(info.owner).url.thumb,
      sound: true,
    });
  }

  // Nothing interesting, next!
  return next();
});
