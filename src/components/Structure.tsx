import styled, { css } from 'styled-components';
import { breakpoint } from './Typography';

export const Section: any = styled.div`
  width: 100%;
  height: 90vh;
  background: ${(props: any) => props.color ? props.color : 'white'};
  ${(props: any) => props.center ? `
    display: flex;
    flex-direction: column;
    align-items: center;
  ` : ''}
`;

export const Row = styled.div`
  display: flex;
`;

export const Column: any = styled.div`
  display: flex;
  flex-direction: column;

  ${(props: any) => props.center ? `
    justify-content: center;
  ` : ''}
`

export const Spacer: any = styled.div`
  ${(props: any) => props.width ? `
    width: ${props.width}px;
  ` : ''}

  ${(props: any) => props.height ? `
    height: ${props.height}px;
  ` : ''}
`

export const ButtonStyle = css`
background: #26A65B;
color: white;
font-weight: 400;
font-size: 1em;
cursor: pointer;
display: inline;
padding: 6.525px 23.4px;
text-align: center;

transition: all 0.3s ease 0s;
text-decoration: none !important;

&:active, &:hover, &:focus {
  box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1);
}

  ${breakpoint.down('xs')`{
    width: 80%;
  }`}
`