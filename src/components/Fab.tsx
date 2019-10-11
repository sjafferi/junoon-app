import * as React from 'react';
import styled from "styled-components";
import Primary, { IPrimaryProps } from "./Primary";

const Container = styled(Primary)`
  border-radius: 50%;
  min-width: unset;
  width: 25px;
  height: 25px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

export default class Fab extends React.Component<IPrimaryProps> {
  render() {
    return (
      <Container {...this.props as any} />
    );
  }
}
