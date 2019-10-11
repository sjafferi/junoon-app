import * as React from 'react';

export default function contentEditable(WrappedComponent) {

  return class extends React.Component {

    state = {
      editing: false
    }

    constructor(props) {
      super(props);
      this.state = {
        value: props.value
      };
    }

    toggleEdit = (e) => {
      e.stopPropagation();
      if (this.state.editing) {
        this.cancel();
      } else {
        this.edit();
      }
    };

    edit = () => {
      this.setState({
        editing: true
      }, () => {
        if (this.domElm && this.domElm.focus)
          this.domElm.focus();
      });
    };

    save = () => {
      this.setState({
        editing: false
      }, () => {
        if (this.props.onSave && this.isValueChanged()) {
          this.props.onSave(this.state.value);
        }
      });
    };

    cancel = () => {
      this.setState({
        editing: false
      });
    };

    isValueChanged = () => {
      return this.props.value !== this.state.value;
    };

    handleChange = (e) => {
      this.setState({ value: e.target.value });
      this.props.onChange(e.target.value);
    }

    handleKeyDown = (e) => {
      const { key } = e;
      switch (key) {
        case 'Enter':
        case 'Escape':
          this.save();
          break;
      }
    };

    render() {
      let editOnClick = true;
      const { editing } = this.state;
      if (this.props.editOnClick !== undefined) {
        editOnClick = this.props.editOnClick;
      }
      const className = (this.props.className || '') + (editing ? ' editing' : '');
      return (
        <WrappedComponent
          {...this.props}
          className={className}
          onClick={editOnClick ? this.toggleEdit : undefined}
          contentEditable={editing}
          ref={(domNode) => { this.domElm = domNode; }}
          onBlur={this.save}
          onKeyDown={this.handleKeyDown}
          onChange={this.handleChange}
          value={this.state.value}
        >
          {this.state.value}
        </WrappedComponent>
      )
    }
  }
}