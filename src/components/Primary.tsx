import * as React from 'react';
import styled from 'styled-components'
import { Colors, Spinner } from 'ui';

export interface IPrimaryProps extends React.HTMLProps<HTMLButtonElement> {
  loading?: boolean;
  theme?: string;
}

const Button = styled.button`
  padding: 6px;
  height: 28px;
  min-width: 60px;
  font-size: 12px;
  text-align: center;
  color: ${Colors.mutedTextGrey};
  border-color: ${Colors.grey};
  &.active, &:hover {
    color: ${Colors.white};
    border-color: ${Colors.blackish};
    background-color: ${Colors.blackish};
  }
  cursor: pointer;
  transition: all 0.2s ease 0s;
  outline: none !important;
`;

export default class Primary extends React.Component<IPrimaryProps> {
  static defaultProps = {
    theme: 'dark'
  }

  public render() {
    const { loading, ...rest } = this.props;
    return (
      <Button
        {...(rest as any)}
      >
        {!loading && this.props.children}
        {loading && <Spinner />}
      </Button>
    )
  }
}