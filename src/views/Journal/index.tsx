import * as React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { EditorState } from 'draft-js';
import styled from "styled-components";
import Editor from "./Editor";
// import Editor from 'editor/index';
import Weekly from "./Weekly";
import State from "./state";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 90vw;
  height: 90vh;
  background: #ffefef;
`;

export default class Journal extends React.Component {
  public journalState = new State();

  getEntry = (id: number) => {
    return this.journalState.entries[id];
  }

  onChange = (id: string) => (editorState: EditorState, callback: () => void) => {
    this.journalState.entries[id] = editorState;
    if (callback) {
      callback();
    }
  };

  public render() {
    console.log(this.journalState.entries)
    return (
      <Container>
        <Switch>
          <Route exact path="/journal" render={() => <Redirect to="/journal/single" />} />
          <Route path="/journal/single/:id" render={({ match }) => (
              <Editor
                id={match.params.id}
                onChange={this.onChange(match.params.id)}
                editorState={this.getEntry(match.params.id)}
              />
            )} 
          />
          <Route path="/journal/weekly" render={() => (
              <Weekly entries={this.journalState.entries} dragHandlers={this.journalState.dragHandlers} onChange={this.onChange} />
            )}
          />
        </Switch>
      </Container>
    );
  }
}
