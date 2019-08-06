import * as React from "react";
import * as moment from "moment";
import { pick } from "lodash";
import { action, computed } from "mobx";
import { observer } from "mobx-react";
import { Switch, Route, Redirect } from "react-router-dom";
import { EditorState } from 'draft-js';
import styled from "styled-components";
import Editor from "./Editor";
// import Editor from 'editor/index';
import Weekly from "./Weekly";
import State from "./state";

interface IProps {

}

interface IState {

}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 90.5vw;
  height: 100vh;
  background: #ffefef;
`;

@observer
export default class Journal extends React.Component<IProps, IState> {
  public journalState = new State();

  get startOfWeek() {
    return moment().format("MMMD");
  }

  getEntry = (id: number) => {
    return this.journalState.entries[id];
  }

  @action
  onChange = (id: string) => (editorState: EditorState, callback: () => void) => {
    this.journalState.entries[id] = editorState;
    this.journalState.assign({ entries: this.journalState.entries });
    if (callback) {
      callback();
    }
  };

  onSingleSave = (id: string) => {

  }

  onChangeWeek = (date: moment.Moment) => {
    this.journalState.assign({ selectedWeek: date.startOf('isoWeek') });
    return true;
  }

  public render() {
    return (
      <Container>
        <Switch>
          <Route exact path="/journal" render={() => <Redirect to="/journal/single" />} />
          <Route path="/journal/single/:id" render={({ match }) => (
            <Editor
              id={match.params.id}
              onSave={this.onSingleSave}
              onChange={this.onChange(match.params.id)}
              editorState={this.getEntry(match.params.id)}
            />
          )}
          />
          <Route path="/journal/weekly/:start" render={({ match }) => this.onChangeWeek(moment(match.params.start, "MMMD")) && (
            <Weekly
              onChange={this.onChange}
              start={match.params.start}
              state={this.journalState}
            />
          )}
          />
          <Route exact path="/journal/weekly" render={() => <Redirect to={`/journal/weekly/${this.startOfWeek}`} />} />
        </Switch>
      </Container>
    );
  }
}
