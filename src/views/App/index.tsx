import * as React from "react";
import { BrowserRouter as Router, Switch, Route, Redirect, withRouter } from "react-router-dom";
import { hot } from "react-hot-loader";
import { Journal as IJournal, User } from 'stores';
import { History } from 'history';
import { inject, observer } from "mobx-react";
import Journal from "../Journal";

import "normalize.css";

@inject("router")
@observer
class App extends React.Component<{ history?: History, router?: any, user?: User, journal?: IJournal }, {}> {
  public render() {
    return (
      <Router>
        <Switch>
          <Route path="/" component={Journal} />
        </Switch>
      </Router>
    );
  }
}

export default hot(module)(App);
