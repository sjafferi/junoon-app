import * as React from 'react';
import styled, { css } from 'styled-components'
import { Colors, Spinner } from 'ui';

export interface IPrimaryProps extends React.HTMLProps<HTMLButtonElement> {
  loading?: boolean;
  theme?: string;
  iconClassName?: string;
  pushedColor?: string;
  borderColor?: string;
  textColor?: string;
}

const onHover = css`
  &.active, &:hover {
    color: ${Colors.white};
    border-color: ${(props: any) => props.pushedColor || Colors.blackish};
    background-color: ${(props: any) => props.pushedColor || Colors.blackish};
  }
`;

const Button = styled.button`
  padding: 6px;
  height: 28px;
  min-width: 60px;
  font-size: 12px;
  text-align: center;
  color: ${(props: any) => props.textColor || Colors.mutedTextGrey};
  border-color: ${(props: any) => props.borderColor || Colors.grey};
  cursor: pointer;
  ${props => !props.disabled ? onHover : "cursor: not-allowed;"}
  
  transition: all 0.2s ease 0s;
  outline: none !important;

  .icon {
    margin-right: 12px;
  }

  ${(props: any) => props.loading ? `
    display: flex;
    justify-content: center;
    padding: 3px;
    .loader {
      width: 17px;
      height: 17px;
    }
  ` : ""}
`;

export default class Primary extends React.Component<IPrimaryProps> {
  static defaultProps = {
    theme: 'dark'
  }

  public render() {
    const { loading, iconClassName, ...rest } = this.props;
    return (
      <Button
        {...(rest as any)}
        loading={loading}
      >
        {iconClassName && <i className={`icon ${iconClassName}`} />}
        {!loading && this.props.children}
        {loading && <Spinner theme="dark" />}
      </Button>
    )
  }
}