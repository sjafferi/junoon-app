import * as React from 'react';
import * as ReactModal from 'react-modal';
import styled from 'styled-components';
import { Colors, SmallScrollbar } from 'ui'

interface IFormProps {
  isOpen: boolean;
  close: () => void;
  className?: string;
}

const Container = styled(ReactModal)`
  background: white;
  position: fixed;
  box-sizing: border-box;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  outline: none;
  overflow-y: scroll;
  border: 1px solid #d4d4d4;

  ${SmallScrollbar}

  .close {
    cursor: pointer;
    position: absolute;
    right: 5px;
    top: 5px;
    color: ${Colors.grey};
  }
`;

export default class Modal extends React.Component<IFormProps> {
  static defaultProps = {
    isOpen: true
  };

  render() {
    return (
      <Container
        isOpen={this.props.isOpen}
        onRequestClose={this.props.close}
        className={this.props.className}
      >
        <a className="close" onClick={this.props.close}> <i className="fa fa-close" /> </a>
        {this.props.children}
      </Container>
    );
  }
}

ReactModal.setAppElement("#app");