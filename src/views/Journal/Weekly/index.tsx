import * as React from 'react';
import * as moment from 'moment';
import styled, { css } from 'styled-components';
import { Resizable, ResizeCallback, ResizeStartCallback } from "re-resizable";
import ScrollUpButton from "react-scroll-up-button";
import { inject, observer } from "mobx-react";
import { ToastContainer, toast } from 'react-toastify';
import { Viewport } from 'stores';
import { Colors } from 'consts';
import { EditorState } from 'draft-js';
import Editor from '../Editor';
import Header from './Header';
import State from "../state";

const { useEffect, useState } = React;

import 'react-toastify/dist/ReactToastify.css';
import "flexboxgrid/dist/flexboxgrid.min.css";

interface IWeeklyState {
  snappedRows: number[];
  resizing: boolean;
  loading: boolean;
  showSunday: boolean;
  resizableRowHeight: number;
}

interface IWeeklyProps {
  state: State;
  start: string;
  viewport?: Viewport;
  onChange: (id: string) => (editorState: EditorState, callback: () => void) => void;
}

const MIN_ROW_HEIGHT = 25;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: white;

  .scroll-up-container {
    position: fixed;
    right: -100px;
    bottom: 150px;
    transition: right 0.5s;
    cursor: pointer;
    background-color: transparent;
    z-index: 5;
    > button {
      font-size: 12px;
      padding: 8px;
      color: ${Colors.darkLightGrey};
    }
  }

  .scroll-up-transition {
    right: 20px;
  }
`;

const RowStyles = css`
  overflow-y: scroll;
  &::-webkit-scrollbar {
    width: 2px;
    background-color: transparent;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
    background-color: ${Colors.lighterGrey};
  }
`

const Row: any = styled.div`
  ${RowStyles}
  flex-grow: 1 !important;
  width: ${(props: any) => props.width}px;
  height: ${(props: any) => props.height}px;
`;

const ResizableRow: any = styled(Resizable)`
  ${RowStyles}
  position: static !important;
  border-top: 1px solid ${Colors.lightGrey};
  border-bottom: 1px solid ${Colors.lightGrey};

  ${(props: any) =>
    props.snapped ? "transition: height 100ms ease-in;" : ""
  }

  > span > div {
    top: ${(props: any) => props.height + 48}px;
    bottom: none;
  }
`;

const Column: any = styled.div`
  position: relative;
  flex-grow: 1;
  min-height: 100%;
  height: fit-content;
  border-left: 1px solid ${Colors.lightGrey};
  width: ${(props: any) => props.width}px;
  padding-bottom: 70px;
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

interface IAutosave {
  save: (showToast?: boolean) => void;
  saving: boolean;
}

const AutosaveConatiner = styled.div`
  position: absolute;
  left: 25px;
  top: 25px;
  font-size: 8px;
`;

const Autosave: React.SFC<IAutosave> = ({ save, saving }) => {
  useEffect(() => {
    const timer = setInterval(() => {
      save(false);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <AutosaveConatiner>
      {saving ? "Saving..." : "Saved."}
    </AutosaveConatiner>
  );
};

const ScrollUp: React.SFC = () => (
  <ScrollUpButton
    ContainerClassName="scroll-up-container"
    TransitionClassName="scroll-up-transition"
    ShowAtPosition={1}
  >
    <button>Scroll up</button>
  </ScrollUpButton>
);

@inject("viewport")
@observer
export default class Weekly extends React.Component<IWeeklyProps, IWeeklyState> {
  state = {
    snappedRows: [0, 0],
    resizing: false,
    loading: false,
    showSunday: false,
    resizableRowHeight: this.rowHeight
  };

  constructor(props: IWeeklyProps) {
    super(props);
    const resizableRowLayout = JSON.parse(localStorage.getItem('resizableRowLayout') || '{}');

    if (resizableRowLayout && resizableRowLayout.height) {
      const rowHeight = parseFloat(resizableRowLayout.height) * window.innerHeight;
      this.state.resizableRowHeight = rowHeight;
    }
  }

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

  setHeight = (resizableRowHeight: number) => {
    this.setState({ resizableRowHeight });
    localStorage.setItem("resizableRowLayout", JSON.stringify({
      height: resizableRowHeight / window.innerHeight,
    }));
  }

  handleResizeStart: ResizeStartCallback = (e, direction, ref) => {
    this.setState({ resizing: true });
  }

  handleResize: ResizeStartCallback = (e, direction, ref) => {
    if (!this.state.resizing) return;

    const { snappedRows } = this.state;
    if (!snappedRows[0] && ref.clientHeight <= MIN_ROW_HEIGHT) {
      snappedRows[0] = 1;
      this.setHeight(10)
    } else if (snappedRows[0] && ref.clientHeight > MIN_ROW_HEIGHT) {
      snappedRows[0] = 0;
      this.setHeight(50)
    } else if (!snappedRows[1] && ref.clientHeight >= window.innerHeight - 50 - MIN_ROW_HEIGHT) {
      snappedRows[1] = 1;
      this.setHeight(window.innerHeight - 50 - 10)
    } else if (snappedRows[1] && ref.clientHeight < window.innerHeight - MIN_ROW_HEIGHT) {
      snappedRows[1] = 0;
    }
  }

  handleResizeStop: ResizeCallback = (e, direction, ref, d) => {
    if (!this.state.resizing) return;

    localStorage.setItem("resizableRowLayout", JSON.stringify({
      height: parseInt(ref.style.height!) / window.innerHeight,
    }));

    this.setState({
      resizableRowHeight: parseInt(ref.style.height!),
      resizing: false
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

  onSave = async (showToast?: boolean) => {
    this.setState({ loading: true });
    await this.props.state.saveMany(this.keys);
    setTimeout(() => {
      if (showToast) toast("Save successful!");
      this.setState({ loading: false })
    }, 1000);
  }

  renderEntries = (start: number, end: number, numColumns = 4) => {
    const width = this.columnWidth / (numColumns / 4);

    return this.keys.map((key, index) => ({ key, index })).filter((key, index) => index >= start && index < end).map(({ key, index }) => {
      const actions = this.getActionsForEntry(index);
      return (
        <Column className={`col-sm-${numColumns} col-md-${numColumns} col-lg-${numColumns} editor-block`} key={key} width={width}>
          {actions.length ? <ActionsContainer> {actions.map((...props) => <Action key={props[1]} {...(props[0])} />)} </ActionsContainer> : null}
          <Editor
            id={key}
            isTopRow={index <= 2}
            autoFocus={index === 0}
            onSave={() => this.onSave(true)}
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
        <Header start={this.start}>
          <Autosave saving={this.state.loading} save={this.onSave} />
        </Header>
        <ResizableRow
          className={`row ${this.state.resizing ? "resizing" : ""}`}
          size={{ width, height: this.state.resizableRowHeight }}
          enable={{ bottom: true }}
          onResizeStart={this.handleResizeStart}
          // onResize={this.handleResize}
          onResizeStop={this.handleResizeStop}
          height={this.state.resizableRowHeight}
          snapped={this.state.snappedRows[0] || this.state.snappedRows[1]}
        >
          {this.renderEntries(0, 3)}
        </ResizableRow>
        <Row className="row" width={width} height={this.rowHeight}>
          {this.renderEntries(3, 5)}
          {!this.state.showSunday && this.renderEntries(5, 6)}
          {this.state.showSunday && this.renderEntries(6, 7)}
        </Row>
        <ToastContainer
          position="bottom-left"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          draggable
          pauseOnHover
        />
        <ScrollUp />
      </Container>
    );
  }
}