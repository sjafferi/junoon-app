import * as React from "react";
import styled, { css } from 'styled-components';
import { BREAKPOINTS } from 'consts';
import styledBreakpoint from '@humblebee/styled-components-breakpoint';
import contentEditable from "./ContentEditable";
import { Colors } from "./colors"
// Creates an object with breakpoint utility methods.
export const breakpoint = styledBreakpoint(BREAKPOINTS);

export const Header1 = styled.h1`
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  font-size: 2em;
  line-height: 2.5em;
  letter-spacing: 0.025em;

  ${breakpoint.down('m')`{
    text-align: center;
  }`}
`

export const Header2: any = styled.h2`
  font-family: 'DM Sans', sans-serif;
  font-weight: 400;
  font-size: 1.5em;
  line-height: 1em;
  letter-spacing: 0.025em;
  text-transform: capitalize;

  ${(props: any) => props.center ? `
    text-align: center;
  ` : ''}
`;;

export const Header3: any = styled.h3`
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 1.25em;
  line-height: 1.5em;
  letter-spacing: 0.025em;
  text-transform: capitalize;

  ${(props: any) => props.center ? `
    text-align: center;
  ` : ''}
`;

export const Header4: any = styled.h4`
  font-family: 'DM Sans', sans-serif;
  font-weight: 300;
  font-size: 1em;
  line-height: 1em;
  letter-spacing: 0.025em;

  ${(props: any) => props.center ? `
    text-align: center;
  ` : ''}
`;

export const Subtitle: any = styled.p`
  font-size: 24px;
  color: rgb(91, 97, 124);
  width: 500px;
  text-align: left;
  display: block;
  text-overflow: ellipsis;
  word-wrap: break-word;

  ${(props: any) => props.center ? `
    text-align: center;
  ` : ''}
`;

export const TextStyle = css`
  text-align: left;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5em;
  letter-spacing: 0.02em;
`;

export const Text: any = styled.p`
  ${TextStyle}

  ${(props: any) => props.center ? `
    text-align: center;
  ` : ''}
`;

export const TextLink = styled(Text)`
  cursor: pointer;
  padding-bottom: 1px;
  border-bottom 0.5px solid ${Colors.blackish};
`;

export const HeaderNavigationText = styled(Header2)`
  cursor: pointer;
  font-family: 'Open Sans', sans-serif;
  font-weight: bold;
  font-size: 1.5em;
  letter-spacing: 1.25px;
  margin: 0;
  margin-top: 5px;
  color: #c5c5c5;
  &.active {
    color: #929292;
  }
`;

const EditableInputContainer = styled.input`
  position: relative;
  width: 350px;
  height: 20px;
  outline: none;
  border: none;
  margin-bottom: 10px !important;

  &.editing {
    &:after {
      width: 200px !important;
    }
  }

  &:after {
    content: '';
    display: block;
    left: 0;
    top: 0;
    width: 200px;
    height: 4px;
    transition: width 200ms ease-out;
    border-bottom: 1px solid #FFC107;
    background-color: #FFC107;
  }
`;

class Input extends React.Component {
  render() {
    const { onSave, children, dangerouslySetInnerHTML, ...rest } = this.props as any;
    return (
      <EditableInputContainer {...rest} placeholder="Enter title (e.g calories consumed)" />
    );
  }
}

export const EditableInput = contentEditable(Input);