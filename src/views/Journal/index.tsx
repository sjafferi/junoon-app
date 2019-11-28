import * as React from "react";
import * as moment from "moment";
import styled from "styled-components";
import { action } from "mobx";
import { parse } from 'query-string';
import { observer, inject } from "mobx-react";
import { Switch, Route, Redirect, withRouter } from "react-router-dom";
import { EditorState } from 'draft-js';
import { Journal as JournalStore, RouterStore, User } from 'stores';
import { LoginModal } from 'ui'
import { History } from 'history';
import { addQueryParam } from "./util";
import Editor from "./Editor";
import Weekly from "./Weekly";
import State from "./state";
import Form from "./Form";
import SampleInfo from "./components/SampleInfo";

interface IProps {
  journal?: JournalStore;
  user?: User;
  router?: RouterStore;
  history?: History;
}

interface IState {

}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  background: white;
`;

export const BASE_ROUTE = `agenda`;

@inject('user')
@inject('journal')
@(withRouter as any)
@observer
export default class Journal extends React.Component<IProps, IState> {
  public journalState: State;

  constructor(props: IProps) {
    super(props);
    this.journalState = new State(props.journal!);
  }

  get startOfWeek() {
    return moment().format("MMMD");
  }

  get params() {
    return parse(this.props.history!.location.search) || {};
  }

  navigateToCreateMetrics = () => {
    this.props.history!.push({ search: addQueryParam('viewMetrics', true) });
  }

  getEntry = (id: number) => {
    return this.props.journal!.entries[id];
  }

  getStartOfWeek = (date: string) => {
    return moment(date, "MMMD").startOf('isoWeek').startOf('day');
  }

  @action
  onChange = (id: string) => (editorState: EditorState, callback: () => void) => {
    this.props.journal!.entries[id] = editorState;
    this.props.journal!.assign({ entries: this.props.journal!.entries });
    if (callback) {
      callback();
    }
  };

  onSingleSave = (id: string) => {

  }

  public render() {
    return (
      <Container>
        <Switch>
          <Route path="/single/:id" render={({ match }) => (
            <Editor
              id={match.params.id}
              onSave={this.onSingleSave}
              onChange={this.onChange(match.params.id)}
              editorState={this.getEntry(match.params.id)}
            />
          )}
          />
          <Route path={`/${BASE_ROUTE}/:start`} render={({ match }) => (
            <Weekly
              history={this.props.history as any}
              start={this.getStartOfWeek(match.params.start)}
              state={this.journalState}
            />
          )}
          />
          <Route exact path="/" render={() => <Redirect to={`/${BASE_ROUTE}`} />} />
          <Route exact path={`/${BASE_ROUTE}`} render={() => <Redirect to={`/${BASE_ROUTE}/${this.startOfWeek}`} />} />
          <Route render={() => <Redirect to={`/`} />} />
        </Switch>
        <Route path={`/${BASE_ROUTE}/:start/form/:date`} render={({ match }) => (
          <Form
            history={this.props.history as any}
            date={match.params.date}
            state={this.journalState}
            navigateToCreateMetrics={this.navigateToCreateMetrics}
          />
        )}
        />
        {!this.props.user!.isLoggedIn && this.params.login && <LoginModal />}
        <SampleInfo />
      </Container>
    );
  }
}
