import * as React from 'react';
import * as moment from 'moment';
import styled from 'styled-components';
import { action } from 'mobx';
import { parse } from 'query-string';
import { inject, observer } from "mobx-react";
import { Switch, Route } from "react-router-dom";
import { Journal, User } from 'stores';
import { Action, History, Location, UnregisterCallback } from "history";
import { Colors, Primary, HeaderNavigationText, Spinner } from 'ui';
import { BASE_ROUTE } from "../index";
import State from "../state";
import Header from "./Header";
import WeeklyEntries from "./Entries";
import WeeklyAnalysis from "./Analyze";
import ViewMetrics from "./ViewMetrics";

interface IWeeklyState { }

interface IWeeklyProps {
  state: State;
  start: moment.Moment;
  history?: History;
  journal?: Journal;
  user?: User;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: white;
  position: relative;

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

  .loader {
    position: absolute;
    top: 42%;
    left: 47%;
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
    margin-left: 20px;
  }
`;

@inject("user")
@inject("journal")
@observer
export default class Weekly extends React.Component<IWeeklyProps, IWeeklyState> {
  state = { forceRender: false };
  unregister!: UnregisterCallback;

  constructor(props: IWeeklyProps) {
    super(props);
    this.onChangeWeek(moment(props.start, "MMMD"));
  }

  componentWillMount() {
    this.unregister = this.props.history!.listen(this.onRouteChange);
  }

  componentWillUpdate(nextProps: Readonly<IWeeklyProps>) {
    if (!this.props.start.isSame(nextProps.start)) {
      this.onChangeWeek(nextProps.start);
    }
  }

  componentWillUnmount() {
    this.unregister();
  }

  get journal() {
    return this.props.journal!;
  }

  get params() {
    return parse(this.props.history!.location.search) || {};
  }

  get start() {
    return this.props.start.format("MMMD");
  }

  get isReady() {
    return this.journal.initialized && this.journal.entries[this.journal.getKeyForDay(this.props.start)];
  }

  forceRender = () => this.setState({ forceRender: !this.state.forceRender })

  onRouteChange = (location: Location, action: Action) => {
    if (location.pathname.includes(`/${BASE_ROUTE}/${this.start}`)) {
      this.forceRender();
    }
  }

  @action
  onChangeWeek = (date: moment.Moment) => {
    this.props.state!.assign({ selectedWeek: date.startOf('isoWeek') });
    this.props.state!.updateEntriesForWeek(this.props.state!.startOfSelectedWeek, true);
  }

  navigateToCreateMetrics = () => {
    this.props.history!.push({ search: "?viewMetrics=true" });
  }

  navigateToAnalysis = () => {
    this.props.history!.push(`/${BASE_ROUTE}/${this.start}/analyze`);
  }

  navigateToAgenda = () => {
    this.props.history!.push(`/${BASE_ROUTE}/${this.start}`);
  }

  renderHeaderLeft = () => {
    const loggedIn = this.journal.isLoggedIn;
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
    const loggedIn = this.journal.isLoggedIn;
    return (
      <HeaderActions>
        {!loggedIn && (
          <Primary onClick={() => this.props.history!.push({ search: "?login=true" })}>Login</Primary>
        )}
        {loggedIn && (
          <Primary onClick={() => this.props.user!.signout()}>Sign out</Primary>
        )}
      </HeaderActions>
    );
  }


  render() {
    const ready = this.isReady;

    return (
      <Container>
        <Header
          LeftElement={this.renderHeaderLeft()}
          RightElement={this.renderHeaderRight()}
          start={this.props.start}
          isLoggedIn={this.journal.isLoggedIn}
        />
        {!ready && <Spinner />}
        {ready && <Switch>
          {this.journal.isLoggedIn && <Route path={`/${BASE_ROUTE}/:start/analyze`} render={() => (
            <WeeklyAnalysis
              start={this.props.start}
              state={this.props.state}
              end={this.props.start.clone().endOf('isoWeek')}
              navigateToMetrics={this.navigateToCreateMetrics}
            />
          )} />}
          <Route path={`/${BASE_ROUTE}/:start`} render={() => (
            <WeeklyEntries
              history={this.props.history}
              start={this.start}
              state={this.props.state}
            />
          )} />
        </Switch>}
        {this.params.viewMetrics && <ViewMetrics
          journal={this.journal}
          history={this.props.history!}
          start={this.props.start}
        />}
      </Container>
    );
  }
}