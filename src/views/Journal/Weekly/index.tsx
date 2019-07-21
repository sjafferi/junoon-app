import * as React from 'react';
import styled from 'styled-components';
import { inject, observer } from "mobx-react";
import { Viewport } from 'stores';
import { DragHandler } from "../state";
import { EditorState } from 'draft-js';
import Editor from '../Editor';
// import Editor from 'editor/index';
import "flexboxgrid/dist/flexboxgrid.min.css";

interface IWeeklyState {

}

interface IWeeklyProps {
  entries: { [key: string]: EditorState };
  viewport?: Viewport;
  onChange: (id: string) => (editorState: EditorState, callback: () => void) => void;
  dragHandlers: (id: string) => { start: DragHandler, move: DragHandler, end: DragHandler}
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 90vw;
  height: 90vh;
  background: white;
`;

const Row: any = styled.div`
  flex-grow: 1 !important;
  max-height: ${(props: any) => props.maxHeight}px;
  overflow-y: hidden;
`;

const Column: any = styled.div`
  flex-grow: 1;
  max-width: ${(props: any) => props.maxWidth}px;
`;

@inject("viewport")
@observer
export default class Weekly extends React.Component<IWeeklyProps, IWeeklyState> {
  get viewport() {
    return this.props.viewport!;
  }

  get maxWidth() {
    return this.viewport.width*0.9 / 3;
  }

  get maxHeight() {
    return window.screen.height*0.9 / 2;
  }

  render() {
    const maxWidth = this.maxWidth;
    const maxHeight = this.maxHeight;
    return (
      <Container>
        <Row className="row" maxHeight={maxHeight}>
          {Object.keys(this.props.entries).filter((key, index) => index < 3).map((key) => (
            <Column className="col-lg-4" key={key} maxWidth={maxWidth} >
              <Editor
                id={key}
                editorState={this.props.entries[key]}
                onChange={this.props.onChange(key)}
                dragHandlers={this.props.dragHandlers(key)}
              />
            </Column>
          ))}
        </Row>
        <Row className="row" maxHeight={maxHeight}>
          {Object.keys(this.props.entries).filter((key, index) => index >= 3).map(key => (
            <Column className="col-lg-4" key={key} maxWidth={maxWidth} >
              <Editor
                id={key}
                editorState={this.props.entries[key]}
                onChange={this.props.onChange(key)}
                dragHandlers={this.props.dragHandlers(key)}
              />
            </Column>
          ))}
        </Row>
      </Container>
    );
  }
}