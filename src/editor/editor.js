import * as PropTypes from 'prop-types';
import * as React from 'react';
import {
  Editor,
  EditorState,
  RichUtils,
  SelectionState,
  Modifier,
} from 'draft-js';
import {
  registerCopySource,
  handleDraftEditorPastedText,
} from "draftjs-conductor";
import * as isSoftNewlineEvent from 'draft-js/lib/isSoftNewlineEvent';
import { OrderedMap } from 'immutable';
import AddButton from './components/addbutton';
import Toolbar, { BLOCK_BUTTONS, INLINE_BUTTONS } from './components/toolbar';
import LinkEditComponent from './components/LinkEditComponent';

import rendererFn from './components/customrenderer';
import customStyleMap from './util/customstylemap';
import RenderMap from './util/rendermap';
import keyBindingFn from './util/keybinding';
import { getElementPosition } from './util';
import {
  Block,
  Snippets,
  ADD_BLOCK_BUTTONS,
  Entity as E,
  HANDLED,
  NOT_HANDLED,
  KEY_COMMANDS
} from './util/constants';
import beforeInput, { StringToTypeMap } from './util/beforeinput';
import blockStyleFn from './util/blockStyleFn';
import {
  getCurrentBlock,
  addNewBlock,
  addNewBlockAt,
  isCursorBetweenLink,
} from './model';
import { HEADER_HEIGHT } from 'consts';

/*

=> First enter should 

A wrapper over `draft-js`'s default **Editor** component which provides
some built-in customisations like custom blocks (todo, caption, etc) and
some key handling for ease of use so that users' mouse usage is minimum.
*/
class MediumDraftEditor extends React.Component {
  static propTypes = {
    id: PropTypes.string.isRequired,
    beforeInput: PropTypes.func,
    keyBindingFn: PropTypes.func,
    customStyleMap: PropTypes.object,
    blockStyleFn: PropTypes.func,
    rendererFn: PropTypes.func,
    editorEnabled: PropTypes.bool,
    spellCheck: PropTypes.bool,
    stringToTypeMap: PropTypes.object,
    blockRenderMap: PropTypes.object,
    blockButtons: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.element,
        PropTypes.object,
      ]),
      style: PropTypes.string.isRequired,
      icon: PropTypes.string,
      description: PropTypes.string,
      onClick: PropTypes.func,
    })),
    inlineButtons: PropTypes.arrayOf(PropTypes.shape({
      label: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.element,
        PropTypes.object,
      ]),
      style: PropTypes.string.isRequired,
      icon: PropTypes.string,
      description: PropTypes.string,
      onClick: PropTypes.func,
    })),
    placeholder: PropTypes.string,
    imageCaptionPlaceholder: PropTypes.string,
    continuousBlocks: PropTypes.arrayOf(PropTypes.string),
    sideButtons: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string.isRequired,
      component: PropTypes.func,
    })),
    editorState: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    handleKeyCommand: PropTypes.func,
    handleReturn: PropTypes.func,
    handlePastedText: PropTypes.func,
    disableToolbar: PropTypes.bool,
    showLinkEditToolbar: PropTypes.bool,
    toolbarConfig: PropTypes.object,
    processURL: PropTypes.func,
  };

  static defaultProps = {
    beforeInput,
    keyBindingFn,
    customStyleMap,
    blockStyleFn,
    rendererFn,
    editorEnabled: true,
    spellCheck: true,
    stringToTypeMap: StringToTypeMap,
    blockRenderMap: RenderMap,
    blockButtons: BLOCK_BUTTONS,
    inlineButtons: INLINE_BUTTONS,
    imageCaptionPlaceholder: 'Add image caption...',
    continuousBlocks: [
      Block.UNSTYLED,
      Block.BLOCKQUOTE,
      Block.OL,
      Block.UL,
      Block.CODE,
      Block.TODO,
    ],
    sideButtons: ADD_BLOCK_BUTTONS,
    disableToolbar: false,
    showLinkEditToolbar: true,
    toolbarConfig: {},
  };

  state = {};

  constructor(props) {
    super(props);

    this.focus = () => this._editorNode.focus();
    this.onChange = (editorState, cb) => {
      this.props.onChange(editorState, cb);
    };

    this.getEditorState = () => this.props.editorState;

    this.onTab = this.onTab.bind(this);
    this.handleKeyCommand = this.handleKeyCommand.bind(this);
    this.handleBeforeInput = this.handleBeforeInput.bind(this);
    this.handleReturn = this.handleReturn.bind(this);
    this.toggleBlockType = this._toggleBlockType.bind(this);
    this.toggleInlineStyle = this._toggleInlineStyle.bind(this);
    this.setLink = this.setLink.bind(this);
    this.blockRendererFn = this.props.rendererFn(this.onChange, this.getEditorState, this.props);

    if (props.addDefaultSnippet) this.addSnippet(Snippets.DEFAULT);
  }

  componentDidMount() {
    if (this.props.autoFocus) this.focus();
    if (this._editorNode && this._editorNode.editor) {
      this.rootRow = this._editorNode.editor.closest(".row");
    }
    this.copySource = registerCopySource(this._editorNode);
  }

  componentWillUnmount() {
    if (this.copySource) {
      this.copySource.unregister();
    }
  }

  addSnippet = (snippet) => {
    let { editorState } = this.props;

    let currentBlock = getCurrentBlock(editorState);

    snippet.forEach(snippet => {
      editorState = addNewBlockAt(editorState, currentBlock.getKey(), snippet.blockType, { placeholder: snippet.placeholder });
      this.onChange(editorState);
      currentBlock = getCurrentBlock(editorState);
    });
  }

  /**
   * Implemented to provide nesting of upto 2 levels in ULs or OLs.
   */
  onTab(e) {
    const { editorState } = this.props;
    const content = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const key = selection.getAnchorKey();
    const currentBlock = content.getBlockForKey(key);
    let newEditorState;
    if (currentBlock.getType().indexOf(Block.TODO) === 0) {
      const blockBefore = content.getBlockBefore(key);
      let depth = Math.min(blockBefore.getDepth() + 1, currentBlock.getDepth() + 1);
      if (event.shiftKey) {
        depth = Math.max(0, currentBlock.getDepth() - 1);
      }
      newEditorState = addNewBlock(editorState, Block.TODO, {}, depth);
      e.preventDefault();
    } else {
      newEditorState = RichUtils.onTab(e, editorState, 4);
    }
    if (newEditorState) {
      this.onChange(newEditorState);
    }
  }

  onLeftArrow = (e) => {
    const { editorState } = this.props;
    const content = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const key = selection.getAnchorKey();
    const firstBlock = content.getFirstBlock();
    if (selection.getAnchorOffset() === 0) {
      if (firstBlock.getKey() !== key) {
        const blockBefore = content.getBlockBefore(key);
        if (!blockBefore) {
          return;
        }
        e.preventDefault();
        const newSelection = selection.merge({
          anchorKey: blockBefore.getKey(),
          focusKey: blockBefore.getKey(),
          anchorOffset: blockBefore.getLength(),
          focusOffset: blockBefore.getLength(),
          isBackward: false,
        });
        this.onChange(EditorState.forceSelection(editorState, newSelection));
      }
    }
  };


  onUpArrow = (e) => {
    const { editorState } = this.props;
    const content = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const key = selection.getAnchorKey();
    const firstBlock = content.getFirstBlock();
    if (firstBlock.getKey() !== key) {
      const blockBefore = content.getBlockBefore(key);
      if (!blockBefore) {
        return;
      }
      const offset = Math.min(selection.getAnchorOffset(), blockBefore.getLength());
      e.preventDefault();
      const newSelection = selection.merge({
        anchorKey: blockBefore.getKey(),
        focusKey: blockBefore.getKey(),
        anchorOffset: offset,
        focusOffset: offset,
        isBackward: false,
      });
      this.onChange(EditorState.forceSelection(editorState, newSelection));
    }

    setTimeout(() => {
      const parentElement = window.getSelection().focusNode.parentElement;
      let { top } = getElementPosition(parentElement) || {};
      const initialTop = top;
      if (!isNaN(top) && top > HEADER_HEIGHT) {
        const { top: topBound } = getElementPosition(this.rootRow);
        const scrollTop = window.scrollY > topBound ? this.rootRow.scrollTop + window.scrollY : this.rootRow.scrollTop;
        const bottomBound = this.props.isTopRow ? this.rootRow.clientHeight + HEADER_HEIGHT : window.innerHeight;
        top -= scrollTop;
        top = Math.floor(top) - 20;
        const isInView = top >= topBound && top <= bottomBound;
        if (!isInView) {
          this.rootRow.scrollTop = topBound - initialTop;
        }
      }
    }, 0);
  };

  onDownArrow = (e) => {
    const { editorState } = this.props;
    const content = editorState.getCurrentContent();
    const selection = editorState.getSelection();
    const key = selection.getAnchorKey();
    const lastBlock = content.getLastBlock();
    if (lastBlock.getKey() !== key) {
      const blockAfter = content.getBlockAfter(key);
      if (!blockAfter) {
        return;
      }
      const offset = Math.min(selection.getAnchorOffset(), blockAfter.getLength());
      e.preventDefault();
      const newSelection = selection.merge({
        anchorKey: blockAfter.getKey(),
        focusKey: blockAfter.getKey(),
        anchorOffset: offset,
        focusOffset: offset,
        isBackward: false,
      });
      this.onChange(EditorState.forceSelection(editorState, newSelection));
    }

    this.setScrollPositionOnDownArrow();
  };

  setScrollPositionOnDownArrow = () => {
    const parentElement = window.getSelection().focusNode.parentElement;
    let { top } = getElementPosition(parentElement) || {};
    const initialTop = top;
    top += 100;
    top -= this.rootRow.scrollTop;
    if (!isNaN(top) && top > 100) {
      const { top: topBound } = getElementPosition(this.rootRow);
      const bottomBound = this.props.isTopRow ? this.rootRow.clientHeight + 50 : window.innerHeight;
      const isInView = top >= topBound && top <= bottomBound;
      if (!isInView) {
        const rootRowScrollTop = initialTop - topBound;
        if (rootRowScrollTop >= this.rootRow.clientHeight) {
          parentElement.scrollIntoView();
        } else {
          this.rootRow.scrollTop = rootRowScrollTop
        }
      }
    }
  }

  /*
  Adds a hyperlink on the selected text with some basic checks.
  */
  setLink(url) {
    let { editorState } = this.props;
    const selection = editorState.getSelection();
    const content = editorState.getCurrentContent();
    let entityKey = null;
    let newUrl = url;
    if (this.props.processURL) {
      newUrl = this.props.processURL(url);
    } else if (url.indexOf('http') !== 0 && url.indexOf('mailto:') !== 0) {
      if (url.indexOf('@') >= 0) {
        newUrl = `mailto:${newUrl}`;
      } else {
        newUrl = `http://${newUrl}`;
      }
    }
    if (newUrl !== '') {
      const contentWithEntity = content.createEntity(E.LINK, 'MUTABLE', { url: newUrl });
      editorState = EditorState.push(editorState, contentWithEntity, 'create-entity');
      entityKey = contentWithEntity.getLastCreatedEntityKey();
    }
    this.onChange(RichUtils.toggleLink(editorState, selection, entityKey), this.focus);
  }

  /**
   * Override which text modifications are available according BLOCK_BUTTONS style property.
   * Defaults all of them if no toolbarConfig.block passed:
   *   block: ['ordered-list-item', 'unordered-list-item', 'blockquote', 'header-three', 'todo'],
   * Example parameter: toolbarConfig = {
   *   block: ['ordered-list-item', 'unordered-list-item'],
   *   inline: ['BOLD', 'ITALIC', 'UNDERLINE', 'hyperlink'],
   * };
   */
  configureToolbarBlockOptions(toolbarConfig) {
    const { blockButtons } = this.props;
    return toolbarConfig && toolbarConfig.block
      ? toolbarConfig.block.map(type => blockButtons.find(button => button.style === type))
        .filter(button => button !== undefined)
      : blockButtons;
  }

  /**
   * Override which text modifications are available according INLINE_BUTTONS style property.
   * CASE SENSITIVE. Would be good clean up to lowercase inline styles consistently.
   * Defaults all of them if no toolbarConfig.inline passed:
   *   inline: ['BOLD', 'ITALIC', 'UNDERLINE', 'hyperlink', 'HIGHLIGHT'],
   * Example parameter: toolbarConfig = {
   *   block: ['ordered-list-item', 'unordered-list-item'],
   *   inline: ['BOLD', 'ITALIC', 'UNDERLINE', 'hyperlink'],
   * };
   */
  configureToolbarInlineOptions(toolbarConfig) {
    const { inlineButtons } = this.props;
    return toolbarConfig && toolbarConfig.inline
      ? toolbarConfig.inline.map(type => inlineButtons.find(button => button.style === type))
        .filter(button => button !== undefined)
      : inlineButtons;
  }

  /*
  Handles custom commands based on various key combinations. First checks
  for some built-in commands. If found, that command's function is apllied and returns.
  If not found, it checks whether parent component handles that command or not.
  Some of the internal commands are:

  - showlinkinput -> Opens up the link input tooltip if some text is selected.
  - add-new-block -> Adds a new block at the current cursor position.
  - changetype:block-type -> If the command starts with `changetype:` and
    then succeeded by the block type, the current block will be converted to that particular type.
  - toggleinline:inline-type -> If the command starts with `toggleinline:` and
    then succeeded by the inline type, the current selection's inline type will be
    togglled.
  */
  handleKeyCommand(command) {
    // console.log(command);
    const { editorState } = this.props;
    if (this.props.handleKeyCommand) {
      const behaviour = this.props.handleKeyCommand(command);
      if (behaviour === HANDLED || behaviour === true) {
        return HANDLED;
      }
    }
    if (command === KEY_COMMANDS.saveEditor()) {
      this.props.onSave();
      return HANDLED;
    }
    if (command === KEY_COMMANDS.showLinkInput()) {
      if (!this.props.disableToolbar && this.toolbar) {
        // For some reason, scroll is jumping sometimes for the below code.
        // Debug and fix it later.
        const isCursorLink = isCursorBetweenLink(editorState);
        if (isCursorLink) {
          this.editLinkAfterSelection(isCursorLink.blockKey, isCursorLink.entityKey);
          return HANDLED;
        }
        this.toolbar.handleLinkInput(null, true);
        return HANDLED;
      }
      return NOT_HANDLED;
    } else if (command === KEY_COMMANDS.unlink()) {
      const isCursorLink = isCursorBetweenLink(editorState);
      if (isCursorLink) {
        this.removeLink(isCursorLink.blockKey, isCursorLink.entityKey);
        return HANDLED;
      }
    }
    /* else if (command === KEY_COMMANDS.addNewBlock()) {
      const { editorState } = this.props;
      this.onChange(addNewBlock(editorState, Block.BLOCKQUOTE));
      return HANDLED;
    } */
    const block = getCurrentBlock(editorState);
    const currentBlockType = block.getType();
    // if (command === KEY_COMMANDS.deleteBlock()) {
    //   if (currentBlockType.indexOf(Block.ATOMIC) === 0 && block.getText().length === 0) {
    //     this.onChange(resetBlockWithType(editorState, Block.UNSTYLED, { text: '' }));
    //     return HANDLED;
    //   }
    //   return NOT_HANDLED;
    // }
    if (command.indexOf(`${KEY_COMMANDS.changeType()}`) === 0) {
      let newBlockType = command.split(':')[1];
      // const currentBlockType = block.getType();
      if (currentBlockType === Block.ATOMIC) {
        return HANDLED;
      }
      if (currentBlockType === Block.BLOCKQUOTE && newBlockType === Block.CAPTION) {
        newBlockType = Block.BLOCKQUOTE_CAPTION;
      } else if (currentBlockType === Block.BLOCKQUOTE_CAPTION && newBlockType === Block.CAPTION) {
        newBlockType = Block.BLOCKQUOTE;
      }
      this.onChange(RichUtils.toggleBlockType(editorState, newBlockType));
      return HANDLED;
    } else if (command.indexOf(`${KEY_COMMANDS.toggleInline()}`) === 0) {
      const inline = command.split(':')[1];
      this._toggleInlineStyle(inline);
      return HANDLED;
    }
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      this.onChange(newState);
      return HANDLED;
    }
    return NOT_HANDLED;
  }

  /*
  This function is responsible for emitting various commands based on various key combos.
  */
  handleBeforeInput(str) {
    return this.props.beforeInput(
      this.props.editorState, str, this.onChange, this.props.stringToTypeMap);
  }

  /*
  By default, it handles return key for inserting soft breaks (BRs in HTML) and
  also instead of inserting a new empty block after current empty block, it first check
  whether the current block is of a type other than `unstyled`. If yes, current block is
  simply converted to an unstyled empty block. If RETURN is pressed on an unstyled block
  default behavior is executed.
  */
  handleReturn(e) {
    if (this.props.handleReturn) {
      const behavior = this.props.handleReturn(e);
      if (behavior === HANDLED || behavior === true) {
        return HANDLED;
      }
    }
    const { editorState } = this.props;
    if (isSoftNewlineEvent(e)) {
      this.onChange(RichUtils.insertSoftNewline(editorState));
      return HANDLED;
    }
    if (!e.altKey && !e.metaKey && !e.ctrlKey) {
      const currentBlock = getCurrentBlock(editorState);
      const blockType = currentBlock.getType();

      if (blockType.indexOf(Block.ATOMIC) === 0) {
        this.onChange(addNewBlockAt(editorState, currentBlock.getKey()));
        return HANDLED;
      }

      if (blockType.indexOf(Block.TODO) === 0) {
        setTimeout(this.setScrollPositionOnDownArrow, 0);
      }

      if (currentBlock.getLength() === 0) {
        switch (blockType) {
          case Block.UL:
          case Block.OL:
          case Block.BLOCKQUOTE:
          case Block.BLOCKQUOTE_CAPTION:
          case Block.CAPTION:
          case Block.H2:
          case Block.H3:
          case Block.H1:
          default:
            return NOT_HANDLED;
        }
      }

      const selection = editorState.getSelection();

      if (selection.isCollapsed() && currentBlock.getLength() === selection.getStartOffset()) {
        if (this.props.continuousBlocks.indexOf(blockType) < 0) {
          this.onChange(addNewBlockAt(editorState, currentBlock.getKey()));
          return HANDLED;
        }
        return NOT_HANDLED;
      }
      return NOT_HANDLED;
    }
    return NOT_HANDLED;
  }

  handleEscape = () => {
    this.setState({ escapePressed: !this.state.escapePressed });
  }

  /*
  The function documented in `draft-js` to be used to toggle block types (mainly
  for some key combinations handled by default inside draft-js).
  */
  _toggleBlockType(blockType) {
    const type = RichUtils.getCurrentBlockType(this.props.editorState);
    if (type.indexOf(`${Block.ATOMIC}:`) === 0) {
      return;
    }
    this.onChange(
      RichUtils.toggleBlockType(
        this.props.editorState,
        blockType
      )
    );
  }

  /*
  The function documented in `draft-js` to be used to toggle inline styles of selection (mainly
  for some key combinations handled by default inside draft-js).
  */
  _toggleInlineStyle(inlineStyle) {
    this.onChange(
      RichUtils.toggleInlineStyle(
        this.props.editorState,
        inlineStyle
      )
    );
  }

  removeLink = (blockKey, entityKey) => {
    const { editorState } = this.props;
    const content = editorState.getCurrentContent();
    const block = content.getBlockForKey(blockKey);
    const oldSelection = editorState.getSelection();
    block.findEntityRanges((character) => {
      const eKey = character.getEntity();
      return eKey === entityKey;
    }, (start, end) => {
      const selection = new SelectionState({
        anchorKey: blockKey,
        focusKey: blockKey,
        anchorOffset: start,
        focusOffset: end,
      });
      const newEditorState = EditorState.forceSelection(RichUtils.toggleLink(editorState, selection, null), oldSelection);
      this.onChange(newEditorState, this.focus);
    });
  };

  editLinkAfterSelection = (blockKey, entityKey = null) => {
    if (entityKey === null) {
      return;
    }
    const { editorState } = this.props;
    const content = editorState.getCurrentContent();
    const block = content.getBlockForKey(blockKey);
    block.findEntityRanges((character) => {
      const eKey = character.getEntity();
      return eKey === entityKey;
    }, (start, end) => {
      const selection = new SelectionState({
        anchorKey: blockKey,
        focusKey: blockKey,
        anchorOffset: start,
        focusOffset: end,
      });
      const newEditorState = EditorState.forceSelection(editorState, selection);
      this.onChange(newEditorState);
      setTimeout(() => {
        if (this.toolbar) {
          this.toolbar.handleLinkInput(null, true);
        }
      }, 100);
    });
  };

  /**
   * Handle pasting when cursor is in an image block. Paste the text as the
   * caption. Otherwise, let Draft do its thing.
   */
  handlePastedText = (text, html, es) => {
    const currentBlock = getCurrentBlock(this.props.editorState);
    if (currentBlock.getType() === Block.IMAGE) {
      const { editorState } = this.props;
      const content = editorState.getCurrentContent();
      this.onChange(
        EditorState.push(
          editorState,
          Modifier.insertText(
            content,
            editorState.getSelection(),
            text
          )
        )
      );
      return HANDLED;
    }
    if (this.props.handlePastedText && this.props.handlePastedText(text, html, es) === HANDLED) {
      return HANDLED;
    }

    let newState = handleDraftEditorPastedText(html, es);

    if (newState) {
      this.onChange(newState);
      return true;
    }

    return false
  };

  /*
  Renders the `Editor`, `Toolbar` and the side `AddButton`.
  */
  render() {
    const { editorState, editorEnabled, disableToolbar, showLinkEditToolbar, toolbarConfig, id } = this.props;
    const showAddButton = false // editorEnabled;
    const editorClass = `md-RichEditor-editor${!editorEnabled ? ' md-RichEditor-readonly' : ''}`;
    let isCursorLink = false;
    if (editorEnabled && showLinkEditToolbar) {
      isCursorLink = isCursorBetweenLink(editorState);
    }
    const blockButtons = this.configureToolbarBlockOptions(toolbarConfig);
    const inlineButtons = this.configureToolbarInlineOptions(toolbarConfig);
    return (
      <div className="md-RichEditor-root" id={id}>
        <div className={editorClass}>
          <Editor
            ref={(node) => { this._editorNode = node; }}
            {...this.props}
            editorState={editorState}
            blockRendererFn={this.blockRendererFn}
            blockStyleFn={this.props.blockStyleFn}
            onChange={this.onChange}
            onTab={this.onTab}
            onUpArrow={this.onUpArrow}
            onDownArrow={this.onDownArrow}
            onLeftArrow={this.onLeftArrow}
            blockRenderMap={this.props.blockRenderMap}
            handleKeyCommand={this.handleKeyCommand}
            handleBeforeInput={this.handleBeforeInput}
            handleReturn={this.handleReturn}
            onEscape={this.handleEscape}
            handlePastedText={this.handlePastedText}
            customStyleMap={this.props.customStyleMap}
            readOnly={!editorEnabled}
            keyBindingFn={this.props.keyBindingFn}
            placeholder={this.props.placeholder}
            spellCheck={editorEnabled && this.props.spellCheck}
          />
          {this.props.sideButtons.length > 0 && showAddButton && (
            <AddButton
              editorState={editorState}
              getEditorState={this.getEditorState}
              setEditorState={this.onChange}
              focus={this.focus}
              sideButtons={this.props.sideButtons}
              escape={this.state.escapePressed}
            />
          )}
          {!disableToolbar && (
            <Toolbar
              ref={(c) => { this.toolbar = c; }}
              editorNode={this._editorNode}
              editorState={editorState}
              toggleBlockType={this.toggleBlockType}
              toggleInlineStyle={this.toggleInlineStyle}
              editorEnabled={editorEnabled}
              setLink={this.setLink}
              focus={this.focus}
              blockButtons={blockButtons}
              inlineButtons={inlineButtons}
            />
          )}
          {isCursorLink && (
            <LinkEditComponent
              {...isCursorLink}
              editorState={editorState}
              removeLink={this.removeLink}
              editLink={this.editLinkAfterSelection}
            />)}
        </div>
      </div>
    );
  }
}

export default MediumDraftEditor;
