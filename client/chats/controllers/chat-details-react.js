import {Meteor} from 'meteor/meteor';
import React from 'react';
import ReactDOM from 'react-dom';
import Tracker from 'tracker-component';

import {moment} from 'meteor/momentjs:moment';
import Textarea from 'react-textarea-autosize';
import PrettyText from 'react-format-text';

import {Messages, Chats} from '/model/chats';
import {Updates} from '/model/updates';

import ChatView from './scroll-pane-react';

const RECALL_ACTIONS = {
  REPLY: 1,
  EDIT: 2,
  FIX: 3,
};


class Chat extends Tracker.Component {
  constructor(props) {
    super(props);

    this.increment = 20;
    this.hasMore = true;
    this.sub = null;
    this.lastBreak = 0;
    this.lastBreakHorizon = 0;

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

    this.state = {
      limit: 40,
      loading: true,
      chat: null,
      messages: [],
      messageId: null,
      pickedId: null,
      actionType: null,
    };

    const {chatId} = props;
    // add Updates dispatcher
    Updates.addDispatcher('CHAT', chatId, this.updatesDispatcher);

    // subscribe
    this.autorun(() => {
      const {limit} = this.state;

      this.hasMore = false;
      this.sub = this.subscribe('chat', chatId, limit);
    });

    // fetch messages
    this.autorun(() => {
      if (!(this.sub && this.sub.ready())) {
        return this.setState({loading: true});
      }

      this.setState({loading: false});

      const fields = {_id: 1};
      const countTotal = Messages.find({}, {fields}).count();

      const {limit} = this.state;
      const sort = {createdAt: 1};
      const skip = countTotal > limit ? 1 : 0;

      const messages = Messages.find({}, {fields, sort, limit, skip}).fetch();
      const chat = Chats.findOne(chatId);

      if (chat && chat.stuffBreaks) {
        const lastBreak = chat.stuffBreaks[Meteor.userId()] || 0;
        if (!this.lastBreakHorizon && lastBreak > this.lastBreak) {
          this.lastBreakHorizon = lastBreak || 1;
        }
        this.lastBreak = lastBreak;
      }

      if (chat) {
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

        this.setTitle(`${chatName} (${chatTypesPrefs[chat.type]})`);
      }

      const countLimitid = messages.length;
      this.hasMore = (countTotal > countLimitid);

      return this.setState({messages, chat});
    });
  }

  componentWillUnmount() {
    // Remove Updates dispatcher first
    Updates.removeDispatcher(this.updatesDispatcher);
    // Clear subscribtions
    if (this.sub) {this.sub.stop();}
  }

  updatesDispatcher(event, notify, clear, next) {
    // Here we subscribes only for this Chat
    // so we gonna simply clear the counts
    // but if we are on unactive tab, we have to
    // call Next() and let other Dispatchers to send the Notification
    if (!event.active) {
      return next();
    }

    // skip initial Events and clear the stack after 500ms
    if (event.initial) {
      Meteor.defer(() => {
        clear(event);
      });
    } else {
      // clear events, no call for Next() here!
      clear(event);
    }
  }

  onRoute(stateName, params = {}) {
    this.redirectTo(stateName, params);
  }

  onFetchMore() {
    const {limit} = this.state;

    if (this.hasMore) {
      this.setState({limit: limit + this.increment});
    }
  }

  unpickUnplug() {
    const {messageId, pickedId} = this.state;
    if (messageId === pickedId) {this.setState({pickedId: null});}
  }

  likeMessage(messageId) {
    const {chatId} = this.props;
    Meteor.call('likeMessage', chatId, messageId, () => {});
  }

  cancelEdit() {
    this.unpickUnplug();
    this.setState({messageId: null, actionType: null, pickedId: null});
  }

  callEditMessage(messageId) {
    const selector = {_id: messageId, owner: Meteor.userId()};

    if (Messages.find(selector).count()) {
      this.setState({messageId, actionType: RECALL_ACTIONS.EDIT});
    }
  }

  callReply(messageId) {
    if (Messages.find(messageId).count()) {
      this.setState({messageId, actionType: RECALL_ACTIONS.REPLY});
    }
  }

  callLastMessage() {
    const sort = {createdAt: -1};
    const selector = {owner: Meteor.userId()};

    const lastMsg = Messages.findOne(selector, {sort});

    if (lastMsg) {
      this.setState({messageId: lastMsg._id});
      this.setState({actionType: RECALL_ACTIONS.FIX});
    }
  }

  remoteActionCallback(err) {
    if (err) {
      let emsg = err.message || err.toString();
      if (err.error === 403) {
        emsg = 'Доступ к этому чату ограничен';
      }
      if (err.error === 404) {
        emsg = 'Сообщение не доступно';
      }
      return this.showToast(emsg);
    }

    return this.cancelEdit();
  }

  removeMessage(messageId) {
    const selector = {_id: messageId, owner: Meteor.userId()};

    const remoteCallback = (e) => this.remoteActionCallback(e);

    if (Messages.find(selector).count()) {
      if (messageId === this.state.messageId || messageId === this.state.pickedId) {
        this.cancelEdit();
      }

      Meteor.call('deleteMessage', messageId, remoteCallback);
    }
  }

  postMessage(text) {
    const {messageId, actionType} = this.state;
    const {chatId} = this.props;

    const remoteCallback = (e) => this.remoteActionCallback(e);

    // new message
    if (!messageId && !actionType) {
      Meteor.call('sendMessage', text, chatId, null, remoteCallback);
    }

    // reply any message
    if (messageId && actionType === RECALL_ACTIONS.REPLY) {
      Meteor.call('sendMessage', text, chatId, messageId, remoteCallback);
    }

    // fix last message
    if (messageId && actionType === RECALL_ACTIONS.FIX) {
      Meteor.call('editMessage', text, messageId, remoteCallback);
    }

    // edit any message
    if (messageId && actionType === RECALL_ACTIONS.EDIT) {
      Meteor.call('editMessage', text, messageId, remoteCallback);
    }
  }

  pickMessage(messageId) {
    const {pickedId} = this.state;

    this.setState({pickedId: (messageId === pickedId ? null : messageId)});
  }

  getActionProps({messageId, actionType}) {
    const {chat} = this.state;
    if (chat && messageId && actionType) {
      const targetMsg = Messages.findOne(messageId);
      const targetUserName = chat.stuffNames[targetMsg.owner];

      const action = actionType === RECALL_ACTIONS.FIX ? 'Последнее сообщение (изменить)' :
        actionType === RECALL_ACTIONS.REPLY ? `Ответ на сообщение ${targetUserName}` :
        'Сообщение (изменить)';

      const text = actionType === RECALL_ACTIONS.REPLY ? null : targetMsg.text;
      const marker = actionType === RECALL_ACTIONS.REPLY ? targetMsg.text : null;

      return {action, text, marker, messageId};
    }
  }

  getMessages({messages}) {
    let prevUser = null;
    let prevDate = null;
    let prevCount = 0;

    let lastBreakRendered = false;

    const {pickedId, chat} = this.state;

    const actions = {
      callReply: (...args) => this.callReply(...args),
      removeMessage: (...args) => this.removeMessage(...args),
      likeMessage: (...args) => this.likeMessage(...args),
      callEditMessage: (...args) => this.callEditMessage(...args),
      pickMessage: (...args) => this.pickMessage(...args),
      callRoute: (...args) => this.onRoute(...args),
    };

    const transform = (origin) => {
      const doc = origin;

      doc.picked = origin._id === pickedId;
      doc.sameMsg =
        (prevCount < 6) &&
        (prevUser === origin.owner) &&
        (!origin.reply) &&
        (prevDate) &&
        (moment(prevDate).isSame(origin.createdAt, 'day'));

      prevUser = origin.owner;
      prevDate = origin.createdAt;
      prevCount = prevCount > 5 ? 0 : prevCount + 1;

      if (origin.likesUsers && origin.likesUsers.length) {
        doc.likedByUser = origin.likesUsers.includes(Meteor.userId());
      }

      if (doc.picked) {
        if (origin.likesCount) {
          doc.likesUsers = _.chain(chat.stuffNames)
            .pick(origin.likesUsers)
            .map((name, _id) => ({_id, name}))
            .value()
            .reverse();
        }
      }

      const lastBreak = origin.createdAt.getTime();

      doc.hasNews = !lastBreakRendered && this.lastBreakHorizon && (lastBreak > this.lastBreakHorizon);
      lastBreakRendered = doc.hasNews || lastBreakRendered;

      let name = chat.stuffNames && chat.stuffNames[origin.owner];
      if (name) {
        doc.owner = {_id: origin.owner, name};
      }

      if (origin.reply) {
        name = chat.stuffNames && chat.stuffNames[origin.reply.owner];
        if (name) {
          doc.reply.owner = {_id: origin.reply.owner, name};
        }
      }

      return _.extend({}, doc, {actions});
    };

    const mapped = messages.map(({_id}) => {
      const messageProps = Messages.findOne(_id, {transform});
      if (messageProps) {
        return (<ChatMessage {...messageProps} key={_id}/>);
      }
      return (<div key={_id}/>);
    });

    return mapped;
  }

  render() {
    const {loading} = this.state;

    const actionProps = this.getActionProps(this.state);
    const messagesMap = this.getMessages(this.state);

    return (
      <div className="chat-container transparent-frame content-transparent-frame">
        <div className="chat-container--messages-box">

          <ChatView
            isLoading={loading}
            reversed={1}
            loader={(<ChatLoader/>)}
            children={messagesMap}
            onFetchMore={() => this.onFetchMore()}
          />

        </div>
        <div className="chat-container--input-box" data-chat-container>

          <ChatInput
            cancelEdit={() => this.cancelEdit()}
            postMessage={(text) => this.postMessage(text)}
            callLastMessage={() => this.callLastMessage()}
            {...actionProps}
          />
        </div>
      </div>
    );
  }
}

const ChatMessage = React.createClass({

  getInitialState() {
    return {likesExpanded: false};
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.picked !== this.props.picked) {
      this.setState({likesExpanded: false});
    }
  },

  /**
   * Important optimization issue [!!!]
   * We only have update component only if uuts, picked or sameMsg changed
   */
  shouldComponentUpdate(nextProps, nextState) {
    return nextState.likesExpanded !== this.state.likesExpanded ||
      nextProps.uuts !== this.props.uuts ||
      nextProps.sameMsg !== this.props.sameMsg ||
      nextProps.picked !== this.props.picked;
  },

  renderMessageHeader({createdAt, owner, actions}) {
    const diffNow = moment();

    const renderMessageDate = () => {
      if (createdAt >= new Date()) {
        return 'пару секунд назад';
      }

      const format = (diffNow.isSame(createdAt, 'day') ? '' :
        diffNow.isSame(createdAt, 'year') ? 'DD MMMM' :
        'DD MMMM YYYY') + '  HH:mm';
      return moment(createdAt).format(format);
    };

    const profileHref = `/profile/${owner._id}`;

    const onClick = (e) => {
      const {button, ctrlKey} = e;
      if (button === 1 || ctrlKey) {
        return e.stopPropagation();
      }
      e.preventDefault();
      return actions.callRoute('profileview', {userId: owner._id});
    };

    return (
      <div className="chat-message-header">
        <strong>
          <a className="redirect-link" href={profileHref} onClick={onClick}> {owner.name} </a>
        </strong>
        <small>
          {renderMessageDate()}
        </small>
      </div>
    );
  },

  renderMessageLabel({owner, sameMsg, createdAt, actions}) {
    if (sameMsg) {
      const dateTime = moment(createdAt).format(' HH:mm');
      return (<div className="chat-message-label avatar">{dateTime}</div>);
    }

    const avatar = Meteor.users.getAvatarProps(owner._id);
    const profileHref = `/profile/${owner._id}`;

    const onClick = (e) => {
      const {button, ctrlKey} = e;
      if (button === 1 || ctrlKey) {
        return e.stopPropagation();
      }
      e.preventDefault();
      return actions.callRoute('profileview', {userId: owner._id});
    };

    return (
      <div className="chat-message-label avatar">
        <a className="redirect-link" href={profileHref} title={owner.name} onClick={onClick}>
          <img src={avatar.url.thumb} style={{backgroundColor: avatar.color}} alt={owner.name}/>
        </a>
      </div>);
  },

  renderMessageLikes({_id, likesCount, likedByUser, actions}) {
    const iconName = likesCount ?
      (<i className="material-icons">&#xE87D;</i>) :
      (<i className="material-icons">&#xE87E;</i>);

    const likesText = likesCount || '';

    const likeStyle = {
      color: likedByUser ? 'rgba(16,108,200,0.82)' : 'rgba(0, 0, 0, 0.54)',
    };

    const onClick = (e) => {
      e.preventDefault();
      actions.likeMessage(_id);
    };

    return (
      <div className="chat-message-label like" style={likeStyle}>
        <button type="button" className="md-secondary md-button md-icon-button" onClick={onClick}>
          <strong>{likesText}</strong>
          {iconName}
        </button>
      </div>
    );
  },

  renderLikersStub({likesCount, likesUsers, picked, actions}) {
    if (!picked || !(likesCount && likesUsers)) {
      return (<div/>);
    }

    let {likesExpanded} = this.state;

    const rootWidth = document.querySelector('[data-reactroot]').clientWidth;
    const maxSpace = rootWidth - 128 - (rootWidth > 730 ? 120 : 14);
    const maxItems = likesExpanded ? likesCount : Math.min(Math.floor(maxSpace / 40), likesCount);

    likesExpanded = likesExpanded || (maxItems >= likesCount);

    const likers = likesUsers.slice(0, maxItems).map(({_id, name}) => {
      let userName = name || 'Аноним';

      const avatar = Meteor.users.getAvatarProps(_id);
      const profileHref = `/profile/${_id}`;

      const onClick = (e) => {
        e.preventDefault();
        actions.callRoute('profileview', {userId: _id});
      };

      return (
        <div className="redirect-link" key={_id} title={userName} onClick={onClick}>
          <img src={avatar.url.thumb} style={{backgroundColor: avatar.color}} alt={userName}/>
        </div>
      );
    });

    const className = likesExpanded ? 'chat-message-likers expanded' : 'chat-message-likers';

    const onClick = (e) => {
      e.preventDefault();
      this.setState({likesExpanded: true});
    };

    return (
      <div style={{paddingBottom: 4}}>
        <div className={className}>{likers}</div>
        <button
          type="button"
          className="chat-message-expand-likers md-secondary md-button md-ink-ripple"
          onClick={onClick}
        >
        Показать всех
        </button>
      </div>
    );
  },

  renderMessageText({text, reply}) {
    const replyChunk = !reply ? (<span/>) : (
      <div className="chat-message-reply">
        <i className="material-icons">&#xE244;</i>
        {reply.text}
      </div>
    );

    return (
      <div className="chat-message-text">
        {replyChunk}
        <PrettyText>{text}</PrettyText>
      </div>
    );
  },

  renderMessageActions({_id, owner, actions}) {
    const msgActions = [];

    const onClickReply = () => actions.callReply(_id);
    const onClickEdit = () => actions.callEditMessage(_id);
    const onClickRemove = () => actions.removeMessage(_id);

    const classNameMd = 'md-secondary md-button md-ink-ripple hidden-xs';
    const classNameXs = 'md-secondary md-button md-icon-button md-ink-ripple visible-xs';

    msgActions.push(
      <button type="button" className={classNameMd} key="reply" onClick={onClickReply}>
        <span>ответить</span>
      </button>);

    msgActions.push(
      <button type="button" className={classNameXs} key="reply-xs" onClick={onClickReply}>
        <i className="material-icons">&#xE15E;</i>
      </button>);

    if (owner._id === Meteor.userId()) {
      msgActions.push(
        <button type="button" className={classNameMd} key="edit" onClick={onClickEdit}>
          <span>изменить</span>
        </button>);
      msgActions.push(
        <button type="button" className={classNameXs} key="edit-xs" onClick={onClickEdit}>
          <i className="material-icons">&#xe3c9;</i>
        </button>);

      msgActions.push(
        <button type="button" className={classNameMd} key="remove" onClick={onClickRemove}>
          <span>удалить</span>
        </button>);
      msgActions.push(
        <button type="button" className={classNameXs} key="remove-xs" onClick={onClickRemove}>
          <i className="material-icons">&#xe5cd;</i>
        </button>);
    }
    return (<div className="chat-message-actions">{msgActions}</div>);
  },

  render() {
    const {props} = this;
    const nodeId = `msg-${props._id}`;

    const msgClassName = `chat-message ${props.sameMsg ? 'repeat' : ''} ${props.picked ? 'active' : ''} ${props.hasNews ? 'chat-news' : ''}`;

    const onClick = (e) => {
      if (!e.defaultPrevented) {
        props.actions.pickMessage(props._id);
      }
    };

    return (
      <div className={msgClassName} id={nodeId}>
        <div className="chat-message-body" onClick={onClick}>
          {this.renderMessageLabel(props)}
          {this.renderMessageLikes(props)}

          {this.renderMessageHeader(props)}
          {this.renderMessageText(props)}
          {this.renderLikersStub(props)}
          {this.renderMessageActions(props)}
        </div>
      </div>
    );
  },
});

const ChatInput = React.createClass({
  getInitialState() {
    return {filled: false};
  },

  componentDidMount() {
    this.input = document.querySelector('#typer');

    this.lastSetTarget = this.props.messageId;
    this.resetInput(this.props.text);

    this.parentWrapper = document.querySelector('[data-chat-container]');
    this.parentContainer = document.querySelector('[data-reactroot]');
    this.lastHeight = 0;
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.messageId && nextProps.messageId !== this.lastSetTarget) {
      this.resetInput(nextProps.text);
    }

    Meteor.defer(() => this.onHeightChange());
    this.lastSetTarget = nextProps.messageId;
  },

  onHeightChange() {
    const wh = Math.max(40, this.parentWrapper.clientHeight);
    if (wh !== this.lastHeight) {
      this.parentContainer.style.paddingBottom = `${wh}px`;
      this.lastHeight = wh;
    }
  },

  onKeyDown(e) {
    const {keyCode, shiftKey} = e;

    if (!Boolean((/13|27|38/).test(e.keyCode))) {
      return true;
    }

    // Ente + shift = new line
    if (keyCode === 13 && shiftKey) {
      return true;
    }

    const text = this.input.value.trim();
    const empty = Boolean(text.match(/^\s*$/));

    // Enter w/ shift = submit
    if (keyCode === 13 && !shiftKey && !empty) {
      this.props.postMessage(text);
    }

    // Up = call edit last message
    if (keyCode === 38) {
      if (!empty) {
        return true;
      }

      this.props.callLastMessage();
    }

    // Esc = cancel edit
    if (keyCode === 27) {
      this.props.cancelEdit();
    }

    e.preventDefault();
    this.resetInput();
  },

  onChange() {
    const text = this.input.value.trim();
    this.updateFilled(text);
  },

  onSubmit(e) {
    e.preventDefault();
    const text = this.input.value.trim();
    const empty = Boolean(text.match(/^\s*$/));

    if (!empty) {
      this.props.postMessage(text);
    }
    this.resetInput();
  },

  updateFilled(value) {
    this.setState({filled: Boolean(value)});
  },

  resetInput(text) {
    this.input.value = text || '';
    this.updateFilled(this.input.value);

    Meteor.defer(() => this.input.focus());
  },

  renderActionScope({action, marker}) {
    if (!action) {
      return (<div/>);
    }

    return (
      <div>
        <div className="chat-input-action">{action}</div>
        <div className="chat-input-quote">{marker} </div>
      </div>
    );
  },

  renderClearButton({filled}, {messageId}) {
    if (filled || messageId) {
      const onClick = (e) => {
        this.props.cancelEdit();
        e.preventDefault();
        this.resetInput();
      };

      return (
        <div className="chat-input-clear">
          <button
            type="submit"
            className="md-icon-button md-button md-ink-ripple"
            onClick={onClick}
          >
            <i className="material-icons">&#xe14c;</i>
          </button>
        </div>
      );
    }

    return (null);
  },

  render() {
    const placeholder = 'Ваше сообщение';
    const disabled = !this.state.filled;

    return (
      <label className="chat-input-label" htmlFor="typer">
        <div className="chat-input">
          {this.renderActionScope(this.props)}
          <Textarea
            id="typer"
            ref="typer"
            placeholder={placeholder}
            style={{boxSizing: 'border-box', width: '100%'}}
            onHeightChange={this.onHeightChange}
            onKeyDown={this.onKeyDown}
            onChange={this.onChange}
          />

          <div className="chat-input-submit">
            <button
              type="submit"
              className="md-fab md-mini md-button md-ink-ripple"
              disabled={disabled}
              onClick={this.onSubmit}
            >
              <i className="material-icons">send</i>
            </button>
          </div>

          {this.renderClearButton(this.state, this.props)}
        </div>
      </label>
    );
  },
});


const ChatLoader = () => (
  <div className="chat-loader" role="progressbar">
    <div className="chat-loader--body">
      <div className="chat-loader--hover-bar"/>
      <div className="chat-loader--lower-bar"/>
    </div>
  </div>
);


const mountChatAtNode = (_node, props = {}) => {
  const node = _node;

  node.style.top = 0;
  node.style.bottom = 0;
  node.style.width = '100%';
  node.style.position = 'absolute';

  ReactDOM.render(<Chat {...props}/>, node);
};

const unmountChatAtNode = (node) => {
  ReactDOM.unmountComponentAtNode(node);
};

export {mountChatAtNode, unmountChatAtNode};
