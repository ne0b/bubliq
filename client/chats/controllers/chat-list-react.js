import React from 'react';
import ReactDOM from 'react-dom';
import Tracker from 'tracker-component';

import {Meteor} from 'meteor/meteor';

import {moment} from 'meteor/momentjs:moment';
import ChatsList from './scroll-pane-react';

import {Chats} from '/model/chats';
import {Updates} from '/model/updates';


class ChatList extends Tracker.Component {
  constructor(props) {
    super(props);

    this.increment = 30;
    this.hasMore = true;

    this.state = {loading: true, limit: 50};

    this.setTitle = (title = '') => {
      const {$scope, $state} = this.props;
      Meteor.defer(() =>
        $scope.$apply(() => {
          $state.title = title;
        })
      );
    };

    this.redirectTo = (stateName, params = {}) => {
      const {$state} = this.props;
      Meteor.defer(() =>
        $state.go(stateName, params)
      );
    };

    this.showToast = (text = '') => {
      const {$mdToast} = this.props;
      $mdToast.show(
        $mdToast.simple()
          .textContent(text)
          .position('bottom right')
          .hideDelay(3000)
      );
    };

    // fetch messages
    this.autorun(() => {
      this.hasMore = false;
      this.sub = this.subscribe('chats', this.state.limit);
    });

    this.autorun(() => {
      if (!(this.sub && this.sub.ready())) {
        return this.setState({loading: true});
      }

      this.setState({loading: false});

      const fields = {_id: 1};
      const countTotal = Chats.find({}).count();

      const {limit} = this.state;
      const skip = countTotal > limit ? 1 : 0;

      const countLimitid = Chats.find({}, {fields, limit, skip}).count();
      this.hasMore = (countTotal > countLimitid);
    });

    this.autorun(() => {
      const chatsCount = Updates.countFor({type: 'CHAT'});
    });

    this.setTitle('Чаты');
  }

  componentWillUnmount() {
    if (this.sub) {this.sub.stop();}
  }

  onFetchMore() {
    const {limit} = this.state;

    if (this.hasMore) {
      this.setState({limit: limit + this.increment});
    }
  }

  onRoute(stateName, params = {}) {
    this.redirectTo(stateName, params);
  }

  renderChatsList() {
    const today = new Date().getTime();
    const chatUpdDelay = 60;

    return _.chain(Chats.find({}).fetch())
      .groupBy('typeOrder')
      .map((chats, type) => {
        const items = _.chain(chats)
          .sortBy(({lastAt, name}) => {
            const lastTs = today - Math.floor((lastAt || 0) / chatUpdDelay) * chatUpdDelay;
            const lastTsLeading = (`00000000000000${lastTs}`).slice(-14);
            return `${lastTsLeading}_${name}`;
          })
          .map((item) => {
            const href = `/chat/${item._id}`;

            const renderLastMessageDate = () => {
              if (!item.lastAt) {
                return 'нет сообщений';
              }

              if (item.lastAt >= new Date()) {
                return 'пару секунд назад';
              }

              return moment(item.lastAt).locale('ru').fromNow();
            };

            const usersCountText = item.stuffCount ?
              `участников ${item.stuffCount}` : 'нет участников';


            const onClickConfig = (e) => {
              e.preventDefault();
              this.onRoute('chatconfig', {chatId: item._id});
            };

            const onClick = (e) => {
              if (!e.defaultPrevented) {
                e.preventDefault();
                this.onRoute('chatdetails', {chatId: item._id});
              }
            };

            // Get counts for Chat
            const chatCount = Updates.countFor({subject: item._id});
            const className = `chat-list--chat ${chatCount ? ' chat-news' : ''}`;

            const chatCountBadge = !chatCount ? (null) :
              (<div className="chat-list--chat-badge">
                {chatCount > 99 ? '99+' : chatCount}
              </div>);

            const configButton = item.type === 'GROUP' && item.owner === Meteor.userId() ?
              (<button className="md-secondary md-button md-icon-button" onClick={onClickConfig}>
                <i className="material-icons">settings</i>
              </button>) : (null);

            const avatarProps = Chats.getAvatarProps(item);

            const chatAvatar = avatarProps.src ?
              (<img src={avatarProps.src} style={avatarProps.style} alt={item.name} title={item.name}/>) :
              (<span className="material-icons">{avatarProps.icon}</span>);

            return (
              <div key={item._id} className={className} onClick={onClick}>
                <div className="chat-list--chat-body">
                  <div className="chat-list--chat-header">{item.name}</div>
                  <div className="chat-list--chat-details">
                    <span className="hide-xs">{usersCountText}, </span>
                    <span>{renderLastMessageDate()}</span>
                  </div>
                </div>
                <div className="chat-list--chat-config">{configButton}</div>
                <div className="chat-list--chat-avatar">{chatAvatar}{chatCountBadge}</div>
              </div>
            );
          })
          .value();

        return (
          <div key={type} className="chat-list">
            <div>{items}</div>
          </div>
        );
      })
      .value();
  }

  renderInitButton() {
    const onClick = (e) => {
      e.preventDefault();
      this.onRoute('chatconfig', {chatId: 'new'});
    };

    return (
      <div className="chat-list--init-chat">
        <button className="md-fab md-button" onClick={onClick}>
          <i className="material-icons">add</i>
        </button>
      </div>
    );
  }

  render() {
    const chatsList = this.renderChatsList();
    const initButton = this.renderInitButton();

    return (
      <div className="chat-list-container transparent-frame content-transparent-frame">
        <div className="chat-list-pane">
          {initButton}
          <ChatsList
            isLoading={this.state.loading}
            reversed={false}
            children={chatsList}
            onFetchMore={() => this.onFetchMore()}
          />
        </div>
      </div>
    );
  }
}

const mountChatListAtNode = (_node, props = {}) => {
  const node = _node;

  node.style.top = 0;
  node.style.bottom = 0;
  node.style.width = '100%';
  node.style.position = 'absolute';

  ReactDOM.render(<ChatList {...props}/>, node);
};

const unmountChatListAtNode = (node) => {
  ReactDOM.unmountComponentAtNode(node);
};

export {mountChatListAtNode, unmountChatListAtNode};
