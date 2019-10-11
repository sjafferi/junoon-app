import * as React from 'react';
import styled, { keyframes } from 'styled-components';
import { Colors } from 'ui';

interface ISpinnerProps {
  theme: string;
  className?: string;
}

const Spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Container = styled.div`
  width: 30px;
  height: 30px;
  &.light {
    border: 3px solid #FFC107;
    border-top-color: #ffc80066;
  }
  &.dark {
    border: 3px solid #72665cc4;
    border-top-color: #c4babaed;
  }
  border-radius: 50%;
  animation: ${Spin} 0.9s linear infinite;
`;



export default class Spinner extends React.Component<ISpinnerProps> {
  static defaultProps = {
    theme: "light"
  };

  public render() {
    const { className, theme } = this.props;
    return (
      <Container className={`${theme} ${className ? className : ""} loader`} />
    )
  }
}

