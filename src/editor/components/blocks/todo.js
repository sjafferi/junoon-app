import * as React from 'react';
import * as PropTypes from 'prop-types';
import Draggable from 'react-draggable'; // The default
import { EditorBlock } from 'draft-js';

import { updateDataOfBlock } from '../../model/';

export default class TodoBlock extends React.Component {

  updateData = () => {
    const { block, blockProps } = this.props;
    const { setEditorState, getEditorState } = blockProps;
    const data = block.getData();
    const checked = (data.has('checked') && data.get('checked') === true);
    const newData = data.set('checked', !checked);
    setEditorState(updateDataOfBlock(getEditorState(), block, newData));
  }

  render() {
    const { blockProps } = this.props;
    const { handleDragStart, handleDrag, handleDragEnd } = blockProps;
    const key = this.props.block.getKey();
    const data = this.props.block.getData();
    const depth = this.props.block.getDepth();
    const textLength = this.props.block.getLength();
    const checked = data.get('checked') === true;
    const placeholder = textLength === 0 && data.get('placeholder');
    
    return (
      <Draggable
        handle=".md-block-todo"
        onStart={handleDragStart}
        onDrag={handleDrag}
        onStop={handleDragEnd}
      >
        <div className="md-block-todo control control--checkbox" style={{ marginLeft: `${depth * 1.5}em`}}>
          {placeholder && <span className="placeholder">{placeholder}</span>}
          <input id={`input-${key}`} type="checkbox" checked={checked} onChange={this.updateData}/>
          <label htmlFor={`input-${key}`} className="control__indicator" />
          <EditorBlock {...this.props} />
        </div>
      </Draggable>
    );
  }
}


TodoBlock.propTypes = {
  block: PropTypes.object,
  blockProps: PropTypes.object,
};