import * as React from 'react';
import * as moment from 'moment';
import styled from 'styled-components';
import { Resizable, ResizeCallback, ResizeStartCallback } from "re-resizable";
import { inject, observer } from "mobx-react";
import { Viewport } from 'stores';
import { Colors } from 'consts';
import { EditorState } from 'draft-js';
import Editor from '../Editor';
import Header from './Header';
import State from "../state";

import "flexboxgrid/dist/flexboxgrid.min.css";

interface IWeeklyState {
  showSunday: boolean;
  rowHeight: number;
}

interface IWeeklyProps {
  state: State;
  start: string;
  viewport?: Viewport;
  onChange: (id: string) => (editorState: EditorState, callback: () => void) => void;
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
  width: ${(props: any) => props.width}px;
  height: ${(props: any) => props.height}px;
  overflow-y: hidden;
`;

const ResizableRow = styled(Resizable)`
  flex-grow: 1 !important;

  transition: height 1ms;
  overflow-y: hidden;
`;

const Column: any = styled.div`
  position: relative;
  flex-grow: 1;
  height: 100%;
  border: 1px solid ${Colors.lightGrey};
  width: ${(props: any) => props.width}px;
`;

const ActionsContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 15px;
  font-size: 12px;
  color: #e9911cbd;
  width: 100%;
  height: 30px;
  z-index: 2;
`;

const ActionContainer = styled.a`
  cursor: pointer;
  i {
    margin-right: 5px;
  }
`;

interface IAction {
  title: string;
  icon: string;
  onClick: () => void;
}

const Action: React.SFC<IAction> = ({ title, icon, onClick }) => (
  <ActionContainer className="noselect" onClick={onClick}>
    <i className={`fa ${icon}`} />
    {title}
  </ActionContainer>
);

@inject("viewport")
@observer
export default class Weekly extends React.Component<IWeeklyProps, IWeeklyState> {
  state = {
    showSunday: false,
    rowHeight: this.rowHeight
  };

  originalHeight = this.rowHeight;

  get viewport() {
    return this.props.viewport!;
  }

  get columnWidth() {
    return (this.viewport.width * 0.9) / 3;
  }

  get rowHeight() {
    return (window.innerHeight - 50) / 2;
  }

  get keys() {
    return Object.keys(this.props.state.entriesForWeek).map((key) => key);
  }

  get start() {
    return moment(this.props.start, "MMMD");
  }

  handleResizeStart: ResizeStartCallback = (e: any, direction, ref) => {
    this.originalHeight = e.clientY;
  }

  handleResizeStop: ResizeCallback = (e: any, direction, ref, d) => {
    const diff = this.originalHeight - e.clientY;
    this.setState({
      rowHeight: this.state.rowHeight - diff,
    });
  }

  toggleShowSunday = () => this.setState({ showSunday: !this.state.showSunday })

  getActionsForEntry = (dayOfWeek: number): IAction[] => {
    let actions = []
    if (dayOfWeek >= 5) { // Sat / Sun
      actions.push({
        title: `Swap ${dayOfWeek === 5 ? 'Sun' : 'Sat'}`,
        icon: 'fa-retweet',
        onClick: this.toggleShowSunday
      });
    }
    return actions;
  }

  onSave = () => {
    this.props.state.saveMany(this.keys);
  }

  renderEntries = (start: number, end: number, numColumns = 4, ) => {
    const width = this.columnWidth / (numColumns / 4);

    return this.keys.map((key, index) => ({ key, index })).filter((key, index) => index >= start && index < end).map(({ key, index }) => {
      const actions = this.getActionsForEntry(index);
      return (
        <Column className={`col-sm-${numColumns} col-md-${numColumns} col-lg-${numColumns} editor-block`} key={key} width={width}>
          {actions.length ? <ActionsContainer> {actions.map((...props) => <Action key={props[1]} {...(props[0])} />)} </ActionsContainer> : null}
          <Editor
            id={key}
            onSave={this.onSave}
            onChange={this.props.onChange(key)}
            editorState={this.props.state.entriesForWeek[key]}
            dragHandlers={this.props.state.dragHandlers(key)}
          />
        </Column>
      );
    });
  }

  render() {
    const width = this.columnWidth * 3.05;
    return (
      <Container>
        <Header start={this.start} />
        <ResizableRow
          className="row resizable"
          size={{ width, height: this.state.rowHeight }}
          enable={{ bottom: true }}
          onResizeStart={this.handleResizeStart}
          onResizeStop={this.handleResizeStop}
        >
          {this.renderEntries(0, 3)}
        </ResizableRow>
        <Row className="row" width={width} height={this.rowHeight}>
          {this.renderEntries(3, 5)}
          {!this.state.showSunday && this.renderEntries(5, 6)}
          {this.state.showSunday && this.renderEntries(6, 7)}
        </Row>
      </Container>
    );
  }
}