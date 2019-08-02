import * as React from 'react';
import * as moment from 'moment';
import styled from 'styled-components';
import { toJS } from "mobx";
import { inject, observer } from "mobx-react";
import { Viewport } from 'stores';
import { Colors } from 'consts';
import { DragHandler } from "../state";
import { EditorState } from 'draft-js';
import Editor from '../Editor';
import Header from './Header';
import State from "../state";

import "flexboxgrid/dist/flexboxgrid.min.css";

interface IWeeklyState {

}

interface IWeeklyProps {
  // entries: { [key: string]: EditorState };
  state: State;
  start: string;
  viewport?: Viewport;
  // onSave: (ids: string[]) => void;
  onChange: (id: string) => (editorState: EditorState, callback: () => void) => void;
  // onChangeWeek: (date: moment.Moment) => void;
  // dragHandlers: (id: string) => { start: DragHandler, move: DragHandler, end: DragHandler }
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: white;
`;

const Row: any = styled.div`
  flex-grow: 1 !important;
  height: 100%;
  max-height: ${(props: any) => props.maxHeight}px;
  overflow-y: hidden;
`;

const Column: any = styled.div`
  flex-grow: 1;
  border: 1px solid ${Colors.lightGrey};
  max-width: ${(props: any) => props.maxWidth}px;
`;

@inject("viewport")
@observer
export default class Weekly extends React.Component<IWeeklyProps, IWeeklyState> {
  get viewport() {
    return this.props.viewport!;
  }

  get maxWidth() {
    return this.viewport.width / 3;
  }

  get maxHeight() {
    return (window.innerHeight - 50) / 2;
  }

  get keys() {
    return Object.keys(this.props.state.entriesForWeek).map((key) => key);
  }

  get start() {
    return moment(this.props.start, "MMMD");
  }

  onSave = () => {
    this.props.state.saveMany(this.keys);
  }

  renderEntries = (start: number, end: number, numColumns = 4, style = {}) => {
    const maxWidth = this.maxWidth / (numColumns / 4);

    return Object.keys(this.props.state.entriesForWeek).filter((key, index) => index >= start && index < end).map((key, index) => (
      <Column className={`col-sm-${numColumns} col-md-${numColumns} col-lg-${numColumns} editor-block`} key={key} maxWidth={maxWidth} style={style}>
        <Editor
          id={key}
          onSave={this.onSave}
          onChange={this.props.onChange(key)}
          editorState={this.props.state.entriesForWeek[key]}
          dragHandlers={this.props.state.dragHandlers(key)}
        />
      </Column>
    ));
  }

  render() {
    const maxHeight = this.maxHeight;
    const maxWidth = this.maxWidth;
    return (
      <Container>
        <Header start={this.start} />
        <Row className="row" maxHeight={maxHeight}>
          {this.renderEntries(0, 3)}
        </Row>
        <Row className="row" maxHeight={maxHeight}>
          {this.renderEntries(3, 5, 4)}
          <Column className="col-lg-4 editor-block" maxWidth={maxWidth} >
            <Row className="row" maxHeight={maxHeight}>
              {this.renderEntries(5, 7, 8, { border: 'none' })}
            </Row>
          </Column>
        </Row>
      </Container>
    );
  }
}