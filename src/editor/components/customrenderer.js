import * as React from "react";
import QuoteCaptionBlock from './blocks/blockquotecaption';
import CaptionBlock from './blocks/caption';
import AtomicBlock from './blocks/atomic';
import TodoBlock from './blocks/todo';
import ImageBlock from './blocks/image';
import BreakBlock from './blocks/break';
import Header1Block from './blocks/header-one';

import { Block } from '../util/constants';

const ComponentMap = (setEditorState, getEditorState, type, extraProps) => {
  switch (type) {
    case Block.BLOCKQUOTE_CAPTION: return {
      component: QuoteCaptionBlock,
    };
    case Block.CAPTION: return {
      component: CaptionBlock,
    };
    case Block.H1: return {
      component: Header1Block,
    };
    case Block.ATOMIC: return {
      component: AtomicBlock,
      editable: false,
      props: {
        getEditorState,
      },
    };
    case Block.TODO: return {
      component: TodoBlock,
      props: {
        setEditorState,
        getEditorState,
        ...extraProps
      },
    };
    case Block.IMAGE: return {
      component: ImageBlock,
      props: {
        setEditorState,
        getEditorState,
        placeholder: extraProps ? extraProps.imageCaptionPlaceholder : '',
      },
    };
    case Block.BREAK: return {
      component: BreakBlock,
      editable: false,
    };
    default: return null;
  }
}

function hash(s) {
  let result = 0;
  for (let i = 0; i < s.length; i++)
    result += Math.pow(27, 10 - i - 1) * (1 + s.charCodeAt(i) - 97);
  return result;
}

const HoCDraggable = ({ blockProps, ...rest }) => {
  const Component = blockProps.Component;
  return (
    <Draggable
      index={hash(blockProps.key)}
      key={blockProps.key}
      draggableId={blockProps.key}
    >
      {(provided, snapshot) => (
        <div
          ref={() => this.divRef = provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
        >
          <Component {...rest} blockProps={blockProps} />
        </div>
      )}
    </Draggable>
  );
}

export default (setEditorState, getEditorState, extraProps) => (contentBlock) => {
  const type = contentBlock.getType();
  return ComponentMap(setEditorState, getEditorState, type, extraProps);
  // const block = ComponentMap(setEditorState, getEditorState, type, extraProps);
  if (block) {
    if (!block.props) block.props = {};
    block.props.key = contentBlock.getKey();
    block.props.Component = block.component;
    block.component = HoCDraggable;
  }
  return block;
};
