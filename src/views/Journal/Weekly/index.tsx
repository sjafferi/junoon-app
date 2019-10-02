import * as React from 'react';
import * as moment from 'moment';
import styled from 'styled-components';
import { inject, observer } from "mobx-react";
import { Switch, Route, Redirect } from "react-router-dom";
import { RouterStore, Journal, User } from 'stores';
import { History } from "history";
import { Colors, Primary, HeaderNavigationText } from 'ui';
import { BASE_ROUTE } from "../index";
import State from "../state";
import Header from "./Header";
import WeeklyEntries from "./Entries";
import WeeklyAnalysis from "./Analyze";

interface IWeeklyState { }

interface IWeeklyProps {
  state: State;
  start: string;
  history?: History;
  router?: RouterStore;
  journal?: Journal;
  user?: User;
}

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

const HeaderActions = styled.div`
  display: flex;
  button + button {
    border-left: none !important;
  }
`

const HeaderNavigation = styled.div`
  display: flex;
  h2 + h2 {
    padding-left: 20px;
  }
`;

@inject("user")
@inject('router')
@inject("journal")
@observer
export default class Weekly extends React.Component<IWeeklyProps, IWeeklyState> {
  state = { forceRender: false };

  constructor(props: IWeeklyProps) {
    super(props);
  }

  get start() {
    return moment(this.props.start, "MMMD").startOf('isoWeek').startOf('day');
  }

  forceRender = () => this.setState({ forceRender: !this.state.forceRender })

  navigateToAnalysis = () => {
    this.props.history!.push(`/${BASE_ROUTE}/${this.props.start}/analyze`);
    this.forceRender();
  }

  navigateToAgenda = () => {
    this.props.history!.push(`/${BASE_ROUTE}/${this.props.start}`);
    this.forceRender();
  }

  renderHeaderLeft = () => {
    const loggedIn = this.props.journal!.isLoggedIn;
    const isAnalyzeActive = location.pathname.includes("analyze");
    return loggedIn && (
      <HeaderNavigation>
        <HeaderNavigationText
          className={`${isAnalyzeActive ? "" : "active"}`}
          onClick={isAnalyzeActive ? this.navigateToAgenda : undefined}
        >
          Agenda
        </HeaderNavigationText>
        <HeaderNavigationText
          className={`${isAnalyzeActive ? "active" : ""}`}
          onClick={!isAnalyzeActive ? this.navigateToAnalysis : undefined}
        >
          Analyze
        </HeaderNavigationText>
      </HeaderNavigation>
    );
  }

  renderHeaderRight = () => {
    const loggedIn = this.props.journal!.isLoggedIn;
    return (
      <HeaderActions>
        {!loggedIn && (
          <Primary onClick={() => this.props.router!.push({ search: "?login=true" })}>Login</Primary>
        )}
        {loggedIn && (
          <Primary onClick={() => this.props.user!.signout()}>Sign out</Primary>
        )}
      </HeaderActions>
    );
  }


  render() {
    return (
      <Container>
        <Header
          LeftElement={this.renderHeaderLeft()}
          RightElement={this.renderHeaderRight()}
          start={this.start}
          isLoggedIn={this.props.journal!.isLoggedIn}
        />
        <Switch>
          <Route path={`/${BASE_ROUTE}/:start/analyze`} render={() => (
            <WeeklyAnalysis
              start={this.start}
              end={this.start.clone().endOf('isoWeek')}
              state={this.props.state}
            />
          )} />
          <Route path={`/${BASE_ROUTE}/:start`} render={() => (
            <WeeklyEntries
              history={this.props.history}
              start={this.props.start}
              state={this.props.state}
            />
          )} />
        </Switch>
      </Container>
    );
  }
}