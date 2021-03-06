import * as React from 'react';
import * as moment from 'moment';
import styled, { css } from 'styled-components';
import { Resizable, ResizeCallback, ResizeStartCallback } from "re-resizable";
import ScrollUpButton from "react-scroll-up-button";
import { debounce } from "lodash";
import { action, toJS } from "mobx";
import { inject, observer } from "mobx-react";
import { ToastContainer, toast } from 'react-toastify';
import { Viewport, RouterStore, Journal, User, IQuery } from 'stores';
import { History } from "history";
import { Colors } from 'ui';
import { EditorState } from 'draft-js';
import Editor from '../Editor';
import State from "../state";
import { BASE_ROUTE } from "../index";

import 'react-toastify/dist/ReactToastify.css';
import "flexboxgrid/dist/flexboxgrid.min.css";

interface IWeeklyState {
  resizing: boolean;
  loading: boolean;
  showSunday: boolean;
  showAnalyze?: boolean;
  resizableRowHeight: number;
}

interface IWeeklyProps {
  state: State;
  start: moment.Moment;
  viewport?: Viewport;
  history?: History;
  router?: RouterStore;
  journal?: Journal;
  user?: User;
}

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
  &.mobile-row {
    flex-wrap: initial !important;
    scroll-snap-type: x mandatory;
    > div {
      scroll-snap-align: center;
    }
  }
`;

const ResizableRow: any = styled(Resizable)`
  ${RowStyles}
  border-bottom: 1px solid ${Colors.lightGrey};

  > span > div {
    z-index: 3;
  }
`;

const Column: any = styled.div`
  position: relative;
  flex-grow: 1;
  min-height: 100%;
  height: fit-content;
  border-left: 1px solid ${Colors.lightGrey};
  min-width: ${(props: any) => props.width}px;
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
  &.form {
    color: #818181bd;
    display: flex;
    flex-direction: row-reverse;
    margin-left: 12px;
    i {
      margin-right: 0;
      margin-left: 5px;
    }
  }
`;

interface IAction {
  title: string;
  icon: string;
  onClick: () => void;
  className?: string;
}

const Action: React.SFC<IAction> = ({ title, icon, onClick, className }) => (
  <ActionContainer className={`noselect ${className ? className : ""}`} onClick={onClick}>
    <i className={`fa ${icon}`} />
    {title}
  </ActionContainer>
);

const ScrollUp: React.SFC = () => (
  <ScrollUpButton
    ContainerClassName="scroll-up-container"
    TransitionClassName="scroll-up-transition"
    ShowAtPosition={1}
  >
    <button>Scroll up</button>
  </ScrollUpButton>
);

@inject("router")
@inject("viewport")
@inject("journal")
@inject("user")
@observer
export default class Weekly extends React.Component<IWeeklyProps, IWeeklyState> {
  state = {
    resizing: false,
    loading: false,
    showAnalyze: false,
    showSunday: moment().day() === 0,
    resizableRowHeight: this.rowHeight
  };
  changed = false;
  clearAutosave: () => void;

  constructor(props: IWeeklyProps) {
    super(props);

    const resizableRowLayout = JSON.parse(localStorage.getItem("resizableRowLayout") || "{}");

    if (resizableRowLayout && resizableRowLayout.height) {
      const resizableRowHeight = resizableRowLayout.height * window.innerHeight;
      this.state.resizableRowHeight = resizableRowHeight;
    }

    this.setDocumentTitle(props);
    this.clearAutosave = this.startAutosave();
  }

  componentWillUnmount() {
    this.clearAutosave();
  }

  componentWillUpdate(nextProps: IWeeklyProps) {
    this.setDocumentTitle(nextProps);
  }

  setDocumentTitle = (props?: IWeeklyProps) => {
    props = props || this.props;
    const start = this.start;
    const formattedStart = start.format("MMM D");
    const formattedEnd = start.add("1", "w").format("MMM D");
    document.title = `Junoon - Digital Agenda (${formattedStart} - ${formattedEnd})`
  }

  setHash = () => {
    const prevHash = location.hash;
    location.hash = "";
    setTimeout(() => {
      if (this.start.isSameOrAfter(moment().startOf('isoWeek'))) {
        location.hash = prevHash || ("#" + moment().format("MMMD"));
      }
    }, 500)
  }

  get viewport() {
    return this.props.viewport!;
  }

  get journalStore() {
    return this.props.journal!;
  }

  get journalState() {
    return this.props.state;
  }

  get columnWidth() {
    return (this.viewport.width * 0.99) / 3;
  }

  get rowHeight() {
    return (window.innerHeight - 50) / 2;
  }

  get entries() {
    return this.journalStore.entries;
  }

  get keys() {
    return Object.keys(this.journalState.entriesForWeek).map((key) => key);
  }

  get start() {
    return this.props.start.clone().startOf('isoWeek').startOf('day');
  }

  get week() {
    const startOfWeek = this.start.startOf('isoWeek');
    const endOfWeek = this.start.clone().endOf('isoWeek');
    let start = startOfWeek.format("MMM D"), end = endOfWeek.format("D");
    if (startOfWeek.month() !== endOfWeek.month()) {
      end = endOfWeek.format("MMM D");
    }
    return `${start} - ${end}`;
  }

  startAutosave = () => {
    const timer = setInterval(() => {
      if (this.props.user!.isViewingPublicAcct) {
        clearInterval(timer);
        return;
      }
      this.onSave(false);
    }, 5000);
    return () => clearInterval(timer);
  }

  handleResizeStart: ResizeStartCallback = (e, direction, ref) => {
    this.setState({ resizing: true });
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

  @action
  openForm = (dayOfWeek: number) => {
    const regex = new RegExp(`(\/${BASE_ROUTE}\/[a-zA-Z]+[0-9]{1,2}(-[0-9]{4})?$)`, "g");

    if (regex.test(location.pathname)) {
      const formPath = `${location.pathname}/form/${this.start.add(dayOfWeek, 'd').format("MMMD")}`;
      this.props.history!.push(formPath);
    }
  }

  getActionsForEntry = (dayOfWeek: number): IAction[] => {
    const day = this.start.add(dayOfWeek, 'd');
    let actions = [];
    if (dayOfWeek >= 5) { // Sat / Sun
      actions.push({
        title: `Swap ${dayOfWeek === 5 ? 'Sun' : 'Sat'}`,
        icon: 'fa-retweet',
        onClick: this.toggleShowSunday
      });
    }
    if (this.journalState.shouldShowFormLink(day)) {
      const form = this.props.journal!.getFormForDay(day);
      actions.push({
        title: `${form && form.submitted ? "Edit" : "Fill out"} form`,
        icon: 'fa-expand',
        className: 'form',
        onClick: () => this.openForm(dayOfWeek)
      });
    }
    return actions;
  }

  onSave = async (showToast?: boolean) => {
    if (!this.changed || !this.journalStore.isLoggedIn || this.props.user!.isViewingPublicAcct) return;
    await this.journalStore.saveMany(this.keys);
    setTimeout(() => {
      if (showToast) toast("Save successful!");
    }, 1000);
    this.changed = false;
  }

  @action
  onQueryChange = async (payload: Partial<IQuery>) => {
    const response = await this.journalStore.updateQuery(payload);
    if (response && !(response as any).error) {
      this.journalStore.fetchAnalysis(this.start);
    }
  }

  @action
  onChange = (id: string, index: number) => (editorState: EditorState, callback: () => void) => {
    const currentContent = this.entries[id].getCurrentContent();
    const newContent = editorState.getCurrentContent();

    if (currentContent !== newContent) {
      this.changed = true;
      const day = this.start.add(index, 'd');
      this.debouncedUpdateFormState(day, true, false);
    }

    this.entries[id] = editorState;
    this.journalStore.assign({ entries: this.entries });
    if (callback) {
      callback();
    }
  };

  debouncedUpdateFormState = debounce(this.journalState.updateFormState, 500, { leading: true, trailing: false });

  renderEntries = (start: number, end: number, numColumns = 4) => {
    const width = this.viewport!.isMobile ? this.columnWidth * 3.05 : this.columnWidth / (numColumns / 4);
    return this.keys.map((key, index) => ({ key, index })).filter((key, index) => index >= start && index < end).map(({ key, index }) => {
      const actions = this.getActionsForEntry(index);
      return (
        <Column className={`editor-block`} key={key} width={width}>
          {actions.length ? <ActionsContainer> {actions.map((...props) => <Action key={props[1]} {...(props[0])} />)} </ActionsContainer> : null}
          <Editor
            id={key}
            isTopRow={index <= 2}
            autoFocus={index === 0}
            onSave={() => this.onSave(true)}
            onChange={this.onChange(key, index)}
            editorState={this.journalState.entriesForWeek[key]}
            dragHandlers={this.journalState.dragHandlers(key)}
          />
        </Column>
      );
    });
  }

  renderDesktop = () => {
    const width = this.columnWidth * 3.05;
    return (
      <>
        <ResizableRow
          className={`row ${this.state.resizing ? "resizing" : ""}`}
          size={{ width, height: this.state.resizableRowHeight }}
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
      </>
    );
  }

  renderMobile = () => {
    const width = this.columnWidth * 3.1;
    return (
      <>
        <Row className="mobile-row row" width={width} height={this.rowHeight * 2}>
          {this.renderEntries(0, 7, 1)}
        </Row>
      </>
    )
  }

  render() {
    return (
      <>
        {!this.viewport.isMobile && this.renderDesktop()}
        {this.viewport.isMobile && this.renderMobile()}
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
      </>
    );
  }
}