import React from 'react';
import ReactDOM from 'react-dom';
import Tracker from 'tracker-component';

import {Meteor} from 'meteor/meteor';
import {Chats} from '/model/chats';

import StuffList from './scroll-pane-react';

class ChatConfig extends Tracker.Component {
  constructor(props) {
    super(props);

    this.sub = null;
    this.subStuff = null;

    this.owner = Meteor.userId();

    this.isNew = props.chatId === 'new';
    this.hasMore = true;
    this.increment = 50;

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

    this.showToast = (text) => {
      const {$mdToast} = this.props;
      if (!text) {return;}

      $mdToast.show(
        $mdToast.simple()
          .textContent(text)
          .position('bottom right')
          .hideDelay(3000)
      );
    };

    this.state = {
      loading: true,
      chat: {},
      name: '',
      stuffFilter: 'ALL',
      stuffQuery: '',
      stuffUsers: [],
      limit: 50,
    };

    this.setDelayed = (state) => {
      this.setState(state);
    };

    this.setStateDelayed = _.debounce(this.setDelayed, 400);

    this.autorun(() => {
      const {stuffFilter, stuffQuery, limit} = this.state;
      this.hasMore = false;

      if (stuffFilter === 'STUFF') {
        return;
      }

      this.setState({loading: true});

      this.subStuff = this.subscribe('chatStuff', limit, this.owner, stuffFilter, stuffQuery);
    });

    this.autorun(() => {
      const {chat, stuffFilter} = this.state;

      if (stuffFilter === 'STUFF') {
        const stuffUsers = (chat.stuffUsers || [])
          .filter((_id) => {
            return _id !== chat.owner;
          })
          .map((_id) => {
            return {_id, name: (chat.stuffNames && chat.stuffNames[_id]) || 'Аноним'};
          });
        this.setState({stuffUsers, loading: false});
      }
    });

    this.autorun(() => {
      if (!this.subStuff || !this.subStuff.ready() || this.state.stuffFilter === 'STUFF') {
        return;
      }

      const selector = {_id: {$ne: this.state.chat.owner}};
      const countTotal = Meteor.users.find(selector).count();

      const {limit} = this.state;
      const skip = countTotal > limit ? 1 : 0;

      const stuffUsers = Meteor.users.find(selector, {limit, skip}).map(({_id, profile}) => {
        return {_id, name: Meteor.users.extractUserName(profile) || 'Аноним'};
      });

      const countLimitid = stuffUsers.length;
      this.hasMore = (countTotal > countLimitid);
      this.setState({stuffUsers, loading: false});
    });

    if (!this.isNew) {
      this.autorun(() => {
        this.sub = this.subscribe('chatConfig', props.chatId, {
          onStop: (err) => {
            if (err && err.error === 403) {
              this.showToast('Доступ к чату ограничен');
            }
          },
        });
      });

      this.autorun(() => {
        if (!(this.sub && this.sub.ready())) {
          return;
        }

        if (this.state.chat && this.state.chat.type) {
          return;
        }

        const chat = Chats.findOne(props.chatId);
        this.setState({chat, name: chat.name});

        const chatTypesPrefs = {
          PROGRAM: 'чат программы',
          STREAM: 'чат потока',
          GROUP: 'группа',
          PRIVATE: 'личный чат',
          PUBLIC: 'общий чат',
        };

        const chatName = chat.type !== 'PRIVATE' ? chat.name :
          _.reduce(chat.stuffNames, (memo, name, key) => {
            return key === Meteor.userId() ? memo : name;
          });

        this.owner = chat.owner || Meteor.userId();
        this.setTitle(`${chatName} (${chatTypesPrefs[chat.type]})`);
      });
    } else {
      this.setTitle('Новый чат');

      const user = Meteor.user();

      const chat = {
        type: 'PRIVATE',
        owner: user._id,
        name: '',
        stuffUsers: [user._id],
        stuffNames: {[`${user._id}`]: Meteor.users.extractUserName(user.profile)},
      };

      this.setState({chat});
    }
  }

  componentWillUnmount() {
    if (this.sub) {this.sub.stop();}
    if (this.subStuff) {this.subStuff.stop();}
  }

  onFetchMore() {
    const {limit} = this.state;

    if (this.hasMore) {
      this.setState({limit: limit + this.increment});
    }
  }

  applyChatChanges() {
    const {chat, name} = this.state;
    let chatId = chat._id;

    const methodCallCallback = (err, res) => {
      if (err) {
        if (err.error === 403) {
          return this.showToast('Создание новых чатов ограничено');
        }
        return this.showToast(err.message || err.toString());
      }

      if (chatId && res.newChatId) {this.showToast('Создан новый чат');}
      if (chatId && res.existedChatId) {this.showToast('Данные чата обновлены');}
      if (!chatId && res.newChatId) {this.showToast('Создан новый чат');}
      if (!chatId && res.existedChatId) {this.showToast('Такой чат уже существует');}

      chatId = res.existedChatId || res.newChatId;
      this.redirectTo('chatdetails', {chatId});
    };

    if (chat.type === 'GROUP' && chat.stuffUsers.length > 2) {
      const chatName = (!chat.name || chat.name.trim() === '') ? name : chat.name;
      Meteor.call('openChat', chat.type, chatName, chat.stuffUsers, chatId, methodCallCallback);
    }

    if (chat.type === 'PRIVATE' && chat.stuffUsers.length === 2) {
      Meteor.call('openChat', chat.type, '', chat.stuffUsers, chatId, methodCallCallback);
    }
  }

  toggleUser(userId, name) {
    const {chat} = this.state;

    if (chat.stuffUsers.includes(userId) && userId !== chat.owner) {
      chat.stuffUsers = _.without(chat.stuffUsers, userId);
      chat.stuffNames = _.omit(chat.stuffNames, userId);
    } else {
      chat.stuffUsers.push(userId);
      chat.stuffNames[userId] = name;
    }

    if (chat.stuffUsers.length === 1) {
      chat.name = '';
      chat.type = 'PRIVATE';
      this.setState({name: ''});
    }

    if (chat.stuffUsers.length < 3) {
      chat.name = '';
      chat.type = 'PRIVATE';
      const chatName = _.reduce(chat.stuffNames, (memo, userName, key) => {
        return key === Meteor.userId() ? memo : userName;
      });

      this.setState({name: `Личный чат с ${chatName}`});
    }

    if (chat.stuffUsers.length > 2) {
      chat.type = 'GROUP';
      const suffLen = chat.stuffUsers.length;
      const chatName = _.values(chat.stuffNames).slice(0, 2).join(', ')
        + (suffLen < 3 ? '' : ` и еще ${suffLen - 2}`);

      this.setState({name: chat.name || chatName});
    }

    this.setState({chat});
  }

  toggleFilter(stuffFilter) {
    if (stuffFilter === 'STUFF') {
      return this.setState({stuffFilter, stuffQuery: ''});
    }
    return this.setStateDelayed({stuffFilter});
  }

  changeQuery(stuffQuery = '') {
    this.setStateDelayed({stuffQuery});
  }

  changeName(chatName = '') {
    const {chat} = this.state;
    if (chat.type && chat.type === 'GROUP') {
      chat.name = chatName.trim();
      this.setState({chat});
    }
  }

  renderDoneButton() {
    const {chat} = this.state;
    const doneDisabled = !(chat && chat.stuffUsers && chat.stuffUsers.length > 1);

    const onClick = (e) => {
      e.preventDefault();
      this.applyChatChanges();
    };

    const doneStyle = doneDisabled ? {transform: 'scale(0.6}'} : {backgroundColor: '#259b24'};

    return (
      <div className="chat-config--done">
        <button className="md-fab md-button" disabled={doneDisabled} onClick={onClick} style={doneStyle}>
          <i className="material-icons">done</i>
        </button>
      </div>
    );
  }

  renderStuff() {
    const {stuffUsers, chat} = this.state;
    const stuffAdded = (chat && chat.stuffUsers) || [];

    return (stuffUsers || []).map(({_id, name}) => {
      const avatar = Meteor.users.getAvatarProps(_id);

      const alreadyAdded = stuffAdded.includes(_id);

      const className = alreadyAdded ? 'chat-stuff chat-added' : 'chat-stuff';
      const markerIcon = alreadyAdded ? (<i className="material-icons">done</i>) : (null);

      const onClick = (e) => {
        e.preventDefault();
        this.toggleUser(_id, name);
      };

      return (
        <div key={_id} className={className} onClick={onClick}>
          <div className="chat-stuff-label avatar">
            <img src={avatar.url.thumb} alt={name} title={name} style={{backgroundColor: avatar.color}}/>
          </div>
          <div>
            <div className="chat-stuff--user-header">{name}</div>
          </div>
          <div className="chat-stuff-label marker">
            {markerIcon}
          </div>
        </div>
      );
    });
  }

  render() {
    const stuffUsers = this.renderStuff();
    const {stuffQuery, stuffFilter, chat, name} = this.state;

    const doneButton = this.renderDoneButton();

    return (
      <div className="chat-config-container transparent-frame content-transparent-frame">
        {doneButton}
        <div className="chat-config--filters">
          <ConfigPanel
            stuffQuery={stuffQuery}
            stuffFilter={stuffFilter}
            chatType={chat.type}
            chatName={name}
            onQuery={(arg) => this.changeQuery(arg)}
            onFilter={(arg) => this.toggleFilter(arg)}
            onName={(arg) => this.changeName(arg)}
          />
        </div>
        <div className="chat-config--stuff">
          <StuffList
            isLoading={this.state.loading}
            reversed={false}
            children={stuffUsers}
            onFetchMore={() => this.onFetchMore()}
          />
        </div>
      </div>
    );
  }
}

const ConfigPanel = React.createClass({
  componentDidMount() {
    this.query = this.refs.query;
    this.name = this.refs.name;
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.stuffFilter === 'STUFF') {
      this.query.value = '';
    }

    if (nextProps.chatType === 'PRIVATE') {
      this.name.value = '';
    }
  },

  onQuery(e) {
    const value = e.target.value.trim();
    this.props.onQuery(value);
  },

  onFilter(e) {
    const value = e.target.value.trim();
    this.props.onFilter(value);
  },

  onName(e) {
    const value = e.target.value.trim();
    this.props.onName(value);
  },

  render() {
    const {stuffQuery, stuffFilter, chatType, chatName} = this.props;
    const queryDisabled = stuffFilter === 'STUFF';
    const nameDisabled = chatType === 'PRIVATE';
    const namePlaceholder = (chatName && chatName !== '') ? chatName : 'Название чата';

    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-sm-12 chat-config-input--wrap">
            <input
              className="chat-config-input"
              type="text"
              id="name"
              ref="name"
              placeholder={namePlaceholder}
              onBlur={this.onName}
              disabled={nameDisabled}
            />
          </div>
        </div>
        <div className="row">
          <div className="col-sm-4 chat-config-input--wrap chat-config-select-wrap">
            <select
              className="chat-config-input"
              id="filter"
              defaultValue={stuffFilter}
              onChange={this.onFilter}
            >
              <option value="ALL">Все пользователи</option>
              <option value="PROGRAM">Из моих программ</option>
              <option value="STREAM">Из моих потоков</option>
              <option value="STUFF">Только те кто уже в чате</option>
            </select>
          </div>
          <div className="col-sm-8 chat-config-input--wrap">
            <input
              className="chat-config-input"
              type="text"
              id="query"
              ref="query"
              placeholder="Поиск по имени"
              defaultValue={stuffQuery}
              onChange={this.onQuery}
              disabled={queryDisabled}
            />
          </div>
        </div>
      </div>
    );
  },
});

const mountChatConfigAtNode = (_node, props = {}) => {
  const node = _node;

  node.style.top = 0;
  node.style.bottom = 0;
  node.style.width = '100%';
  node.style.position = 'absolute';

  ReactDOM.render(<ChatConfig {...props}/>, node);
};

const unmountChatConfigAtNode = (node) => {
  ReactDOM.unmountComponentAtNode(node);
};

export {mountChatConfigAtNode, unmountChatConfigAtNode};
