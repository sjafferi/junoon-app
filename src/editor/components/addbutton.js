import * as PropTypes from 'prop-types';
// import './addbutton.scss';

import * as React from 'react';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import { getSelectedBlockNode } from '../util';


/**
 * Implementation of the medium-link side `+` button to insert various rich blocks
 * like Images/Embeds/Videos.
 */
export default class AddButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      style: {},
      buttonContainerStyle: {},
      visible: false,
      isOpen: false,
    };
    this.node = null;
    this.blockKey = '';
    this.blockType = '';
    this.blockLength = -1;

    this.findNode = this.findNode.bind(this);
    this.hideBlock = this.hideBlock.bind(this);
    this.openToolbar = this.openToolbar.bind(this);
  }

  // To show + button only when text length == 0
  componentWillReceiveProps(newProps) {
    const { editorState, escape } = newProps;
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();

    // add show drag handler logic here

    if (escape !== this.props.escape) {
      this.hideBlock();
      return;
    }
    if (!selectionState.hasFocus) {
      return;
    }
    const blockKey = contentState.getBlockForKey(selectionState.getAnchorKey());
    const block = contentState.getBlockForKey(selectionState.anchorKey);
    if (!selectionState.isCollapsed() || selectionState.anchorKey !== selectionState.focusKey || !blockKey || !block || blockKey.getType().indexOf('atomic') >= 0) {
      this.hideBlock();
      return;
    }
    const bkey = block.getKey();
    if (block.getLength() > 0) {
      this.hideBlock();
      return;
    }
    if (block.getType() !== this.blockType) {
      this.blockType = block.getType();
      if (block.getLength() === 0) {
        setTimeout(this.findNode, 0);
      }
      this.blockKey = bkey;
      return;
    }
    if (this.blockKey === bkey) {
      if (block.getLength() > 0) {
        this.hideBlock();
      } else {
        setTimeout(this.findNode, 0);
        this.setState({
          visible: true,
        });
      }
      return;
    }
    this.blockKey = bkey;
    if (block.getLength() > 0) {
      // console.log('no len');
      this.hideBlock();
      return;
    }
    setTimeout(this.findNode, 0);
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.handleClickOutside);
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.handleClickOutside);
  }


  handleClickOutside = (event) => {
    if (this.ref && !this.ref.contains(event.target)) {
      this.hideBlock()
    }
  }


  hideBlock() {
    if (this.state.visible) {
      this.setState({
        visible: false,
        isOpen: false,
      });
      this.setState({ buttonContainerStyle: { opacity: 0 } });
    }
  }

  openToolbar() {
    this.setState({
      isOpen: !this.state.isOpen,
    }, () => { // callback function
      this.setState({ buttonContainerStyle: { opacity: 1 } });
      // save page state
      const x = window.scrollX;
      const y = window.scrollY;
      // do focus
      this.props.focus();
      // back previous window state
      window.scrollTo(x, y);
    });
  }

  findNode() {
    // eslint-disable-next-line no-undef
    const node = getSelectedBlockNode(window);
    if (node === this.node) {
      // console.log('Node exists');
      return;
    }
    if (!node) {
      this.setState({
        visible: false,
        isOpen: false,
      });
      return;
    }
    // const rect = node.getBoundingClientRect();
    this.node = node;
    this.setState({
      visible: true,
      style: {
        top: node.offsetTop + node.clientHeight / 2 - 12,
      },
    });
  }

  render() {
    if (!this.state.visible) {
      return null;
    }
    return (
      <div className="md-side-toolbar" style={this.state.style} ref={node => { this.ref = node; }}>
        <button
          onClick={this.openToolbar}
          className={`md-sb-button md-add-button${this.state.isOpen ? ' md-open-button' : ''}`}
          type="button"
        >
          <svg viewBox="0 0 8 8" height="14" width="14">
            <path d="M3 0v3h-3v2h3v3h2v-3h3v-2h-3v-3h-2z" />
          </svg>
        </button>
        {this.state.isOpen ? (
          <TransitionGroup className="button-container" style={this.state.buttonContainerStyle}>
            {this.props.sideButtons.map((button) => {
              const Button = button.component;
              const extraProps = button.props ? button.props : {};
              return (
                <CSSTransition
                  key={button.title}
                  classNames="md-add-btn-anim"
                  appear
                  timeout={{
                    enter: 200,
                    exit: 100,
                    appear: 100,
                  }}
                >
                  <Button
                    {...extraProps}
                    getEditorState={this.props.getEditorState}
                    setEditorState={this.props.setEditorState}
                    close={this.openToolbar}
                  />
                </CSSTransition>
              );
            })}
          </TransitionGroup>
        ) : null}
      </div>
    );
  }
}

AddButton.propTypes = {
  focus: PropTypes.func,
  getEditorState: PropTypes.func.isRequired,
  setEditorState: PropTypes.func.isRequired,
  sideButtons: PropTypes.arrayOf(PropTypes.object),
};
