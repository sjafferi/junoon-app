import * as React from 'react';

import { addNewBlock } from '../../model';
import { Block } from '../../util/constants';

import Image from './image';

const onClick = (blockType, props) => () => {
  props.setEditorState(addNewBlock(
    props.getEditorState(),
    blockType
  ));
  props.close();
}

const Todo = (props) => (
  <button className="md-sb-button" onClick={onClick(Block.TODO, props)} type="button">
    {/* <i className="fa fa-list-alt" /> */}
    <h3 className="title">Checklist</h3>
  </button>
);

const H1 = (props) => (
  <button className="md-sb-button" onClick={onClick(Block.H1, props)} type="button">
    {/* <i className="fa fa-list-alt" /> */}
    <h3 className="title">Header 1</h3>
  </button>
);

const H2 = (props) => (
  <button className="md-sb-button" onClick={onClick(Block.H2, props)} type="button">
    {/* <i className="fa fa-list-alt" /> */}
    <h3 className="title">Header 2</h3>
  </button>
);

const H3 = (props) => (
  <button className="md-sb-button" onClick={onClick(Block.H3, props)} type="button">
    {/* <i className="fa fa-list-alt" /> */}
    <h3 className="title">Header 3</h3>
  </button>
);

const UL = (props) => (
  <button className="md-sb-button" onClick={onClick(Block.UL, props)} type="button">
    {/* <i className="fa fa-list-alt" /> */}
    <h3 className="title">Bullet List</h3>
  </button>
);

const OL = (props) => (
  <button className="md-sb-button" onClick={onClick(Block.OL, props)} type="button">
    {/* <i className="fa fa-list-alt" /> */}
    <h3 className="title">Numbered List</h3>
  </button>
);

const Code = (props) => (
  <button className="md-sb-button" onClick={onClick(Block.CODE, props)} type="button">
    {/* <i className="fa fa-list-alt" /> */}
    <h3 className="title">Code Block</h3>
  </button>
);

const Buttons = {
  Image,
  H1, H2, H3,
  Todo, Code,
  UL, OL,
}


export {
  Buttons
}