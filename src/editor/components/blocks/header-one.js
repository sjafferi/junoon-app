import './header.scss';

import * as React from 'react';
import { EditorBlock } from 'draft-js';

export default class Header1Block extends React.Component {
  render() {
    const data = this.props.block.getData();
    const textLength = this.props.block.getLength();
    const placeholder = textLength === 0 && data.get('placeholder');
    return (
      <div className="md-block-header">
        {placeholder && <span className="placeholder">{placeholder}</span>}
        <EditorBlock {...this.props} />
      </div>
    );
  }
}