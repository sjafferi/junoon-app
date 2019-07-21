import * as React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { hot } from "react-hot-loader";

import Header from './Header';
import Journal from "../Journal";

import "normalize.css";

class App extends React.Component {
  public render() {
    return (
      <React.Fragment>
        <Switch>
          <Route exact path="/" render={() => <Redirect to="/journal" />} />
          <Route path="/journal" component={Journal} />
        </Switch>
      </React.Fragment>
    );
  }
}

export default hot(module)(App);
