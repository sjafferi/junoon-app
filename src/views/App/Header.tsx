import * as React from "react";
import { Link } from 'react-router-dom';
import styled from "styled-components";
import { breakpoint, ButtonStyle } from "ui";
import { Logo } from 'icons';

const Container = styled.header`
  height: 50px;
  width: 100%;
  position: absolute;
  padding: 3em 10em;
  margin: auto auto;
  background: transparent;
  display: flex;
  box-sizing: border-box;
  align-items: center;
  justify-content: center;
  
  ${breakpoint.down('l')`{
    padding: 10%;
  }`}

  ${breakpoint.down('sss')`{
    padding: 15%;
  }`}
`;

const LogoContainer = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none !important;
  margin-right: auto;

  h2 {
    font-family: Poppins;
    font-size: 30px;
    color: #FFFFFF;
    letter-spacing: 0;
    text-align: center;
    padding-left: 20px;
    padding-bottom: 30px;
  }

  ${breakpoint.down('l')`{
    margin-left: auto;
  }`}
`;

const Menu = styled.ul`
  display: flex;
  list-style: none;
  margin: 0;
  margin-right: 2em;
  ${breakpoint.down('mm')`{
    display: none;
  }`}
`;

const Item = styled.a`
  ${ButtonStyle}
`;

export default class Header extends React.Component<{}, {}> {
  public render() {
    return (
      <Container>
        <LogoContainer to="/">
          <Logo />
          <h2>GrubGrab</h2>
        </LogoContainer>
        <Menu>
          <li>
            <Item href="https://explorer.grubgrab.io">Explore Meals</Item>
          </li>
        </Menu>
      </Container>
    );
  }
}
