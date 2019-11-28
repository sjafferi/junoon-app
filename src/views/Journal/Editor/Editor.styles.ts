import styled from 'styled-components';
import { Colors } from 'ui';

export const Container = styled.div`
  width: 100%;
  height: 100%;
  max-width: 600px;
  font-size: 12px;

  .md-block {
    font-size: 13px;
    line-height: 1.6;
    color: #333;
    padding: 5px 0;

    user-select: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }

  .md-block span {
    user-select: text;
    -webkit-user-select: text;
    -khtml-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
  }

  h3 {
    font-weight: 700;
    letter-spacing: -0.003em;
    line-height: 1.1;
    margin-bottom: 0.25em;
    font-size: 2.5em;
  }
  
  span.placeholder {
    position: absolute;
    color: ${Colors.darkLightGrey};
    cursor: default;
    user-select: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
  }  

  .public-DraftEditor-content .md-block-paragraph {
    margin: 0;
  }

  .md-RichEditor-root {
    width: 100%;
    height: 100%;
    background: white;
  }
`;

export const Date = styled.span`
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: ${Colors.darkLightGrey};
  z-index: 1;
`;