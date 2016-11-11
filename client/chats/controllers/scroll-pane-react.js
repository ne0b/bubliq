import React from 'react';
import ReactDOM from 'react-dom';


// props
// @reversed       : Boolean     = should we reverse messages or not
// @scrollTreshold : Number      = offset triggers @onFetchMore
// @loader         : Node        = component/node loading indicator
// @className      : String      = wrapper <div> class name
// @isLoading      : Boolean     = indicates loading state
// @onFetchMore    : Function    = called if messages stack is scrolled out

// @children       : Array[Node] = array of messages

const ScrollPane = React.createClass({
  getDefaultProps() {
    return {
      reversed: false,
      scrollTreshold: 100,
      loader: (<div>Loading...</div>),
      className: '',
      isLoading: false,
    };
  },

  getInitialState() {
    this.lastFrameId = null;
    this.scrollTop = 0;
    this.scrollHeight = undefined;

    return {};
  },

  componentDidMount() {
    const scrollPane = ReactDOM.findDOMNode(this);

    const heightDelta = this.props.reversed ?
      (scrollPane.scrollHeight - scrollPane.clientHeight) : 0;

    this.scrollTop = scrollPane.scrollTop = heightDelta;
    this.lastFrameId = window.requestAnimationFrame(this.recallScroll);
  },

  componentDidUpdate() {
    this.updateScrollTop(true);
  },

  componentWillUnmount() {
    window.cancelAnimationFrame(this.lastFrameId);
  },

  recallScroll() {
    const thisNode = ReactDOM.findDOMNode(this);

    if (thisNode.scrollTop !== this.scrollTop) {
      if (this.shouldFetchMore(thisNode)) {
        this.props.onFetchMore();
      }
      this.updateScrollTop();
    }
    this.lastFrameId = window.requestAnimationFrame(this.recallScroll);
  },

  afterTreshold(reversed, scrollTreshold, scrollTop, scrollHeight, clientHeight) {
    return reversed ?
      (scrollTop <= scrollTreshold) :
      (scrollTop >= (scrollHeight - clientHeight - scrollTreshold));
  },

  shouldFetchMore(wrapNode) {
    const {reversed, scrollTreshold} = this.props;
    const {scrollTop, scrollHeight, clientHeight} = wrapNode;
    const done = this.afterTreshold(reversed, scrollTreshold, scrollTop, scrollHeight, clientHeight);
    return done && !this.props.isLoading;
  },

  updateScrollTop(checkListEnd = false) {
    const scrollPane = ReactDOM.findDOMNode(this);
    const {reversed} = this.props;

    const reverseDelta = reversed ? (scrollPane.scrollHeight - (this.scrollHeight || 0)) : 0;
    const newScrollTop = scrollPane.scrollTop + reverseDelta;

    // fix for watching chat endings
    if (checkListEnd && (this.scrollHeight || 0) - this.scrollTop - (reversed ? scrollPane.clientHeight : 0) < 60) {
      scrollPane.scrollTop = reversed ? scrollPane.scrollHeight : 0;
    } else if (newScrollTop !== scrollPane.scrollTop) {
      scrollPane.scrollTop = newScrollTop;
    }

    this.scrollTop = scrollPane.scrollTop;
    this.scrollHeight = scrollPane.scrollHeight;
  },

// -----------------------------------------------------------------------------
// Render now!
// -----------------------------------------------------------------------------

  render() {
    let messages = _.clone(this.props.children);

    const loadSpinner = (
      this.props.isLoading ?
        (<div ref="loadingSpinner">
          {this.props.loader || null}
        </div>) : (null)
    );

    const wrapStyle = {
      maxHeight: '100%',
      position: 'absolute',
      left: 0,
      right: 0,
      overflowY: 'auto',
    };

    if (this.props.reversed) {
      wrapStyle.bottom = 0;
    } else {
      wrapStyle.top = 0;
      wrapStyle.height = '100%';
    }

    const {className} = this.props;

    return (
      <div className={className} ref="scrollable" style={wrapStyle}>
        <div ref="smoothScrollingWrapper">
          {this.props.reversed ? loadSpinner : null}
          {messages}
          {this.props.reversed ? null : loadSpinner}
        </div>
      </div>
    );
  },
});


export default ScrollPane;
