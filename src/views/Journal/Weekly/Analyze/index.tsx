import * as React from 'react';
import * as moment from "moment";
import styled from "styled-components";
import { sortBy, entries } from "lodash";
import { toJS } from "mobx";
import { inject, observer } from "mobx-react";
import { Colors, Primary, Header4, Spinner, Text, TextLink, SmallScrollbar } from "ui";
import { Journal, IMetricValue, IQuery } from "stores";
import { MetricsEmptyState } from "icons";
import { convertToUTC, groupBy } from "../../util";
import State from "../../state";
import Summary from "./Summary";
import Graphs from "./Graphs";
import Table from "./Table";

interface IAnalysisProps {
  start: moment.Moment;
  end: moment.Moment;
  state: State;
  journal?: Journal;
  navigateToMetrics: () => void;
}

export type IRow = Record<number | string, string | number | moment.Moment>;

const Container = styled.div`
  box-sizing: border-box;
  height: 90%;
  width: 96%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  padding-bottom: 50px;
  overflow: scroll;
  position: relative;
  ${SmallScrollbar}
`;

const TabContainer = styled.div`
  box-sizing: content-box;
  > button:first-child {
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
  }
  > button:last-child {
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
  }
`;

const Tab = styled(Primary)`
  &:hover, &.active {
    background: #ffc800;
    border-color: #ffc800;
    color: ${Colors.darkTextGrey};
  }
  padding: 3px;
  height: 17px;
  width: 75px;
  font-size: 12px;
  text-transform: capitalize;
  line-height: 1px;
`;

const ActionsContainer = styled.div`
  box-sizing: content-box;
  width: 106%;
  height: 15px;
  padding: 15px;
  bottom: -45px;
  position: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e6e6e624;
  border: 1px solid ${Colors.lightGrey};
  transition: all 300ms ease-in-out;

  button {
    width: 200px;
  }

  .close {
    position: absolute;
    top: 6px;
    right: 30px;
    width: 7px;
    height: 15px;
    border-radius: 50%;
    border: 1px solid black;
    border: none;
    color: ${Colors.mutedTextGrey};
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 12px;
    cursor: pointer;
    transition: all 300ms ease-in-out;
    outline: none;
    background: transparent;
  }

  &.open {
    transform: translateY(-40px);
    .close {
      transform: rotate(180deg);
    }
  }

  .link {
    margin-left: 15px;
    margin-top: 14px;
  }
`;

const BannerText = styled(Header4)`
  display: flex;
  color: black;
  text-transform: none;
  font-size: 0.8em;
  font-weight: normal;
  .emphasis {
    font-weight: bold;
    font-size: 1em;
    letter-spacing: 1.25px;
  }
`;

const EmptyStateContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 50px;
  padding-right: 2vw;
  margin: 0 !important;
  color: ${Colors.textGrey};
  svg {
    max-height: 330px;
  }
  h4 {
    margin: 15px;
    font-size: 1.15em;
  }
  p {
    margin: 5px;
    max-width: 600px;
    text-align: center;
    font-size: 0.825em;
  }
`;

const EmptyState: React.SFC<{ title: string, subtitle: string }> = ({ title, subtitle }) => (
  <EmptyStateContainer>
    <MetricsEmptyState />
    <Header4>{title}</Header4>
    <Text>{subtitle}</Text>
  </EmptyStateContainer>
);


const Tabs = ["summary", "graphs", "table"];

@inject("journal")
@observer
export default class Analyze extends React.Component<IAnalysisProps> {
  state = {
    showActionBar: true,
    forceRender: false,
    activeTab: "summary"
  };

  showingEmptyState = false;

  componentWillMount() {
    this.props.state.updateAnalysisForWeek(this.props.start, this.props.end, true);
  }

  componentDidUpdate(prevProps: IAnalysisProps) {
    if (!prevProps.start.isSame(this.props.start)) {
      this.props.state.updateAnalysisForWeek(this.props.start, this.props.end, true);
    }
  }

  onQueryChange = async (payload: Partial<IQuery>) => {
    const response = await this.journal.updateQuery(payload);
    if (response && !(response as any).error) {
      this.journal.fetchAnalysis(this.props.start.clone());
    }
  }

  switchTab = (tab: string) => this.setState({ activeTab: tab, showActionBar: !this.showingEmptyState ? tab === "summary" : true })

  toggleShowActionBar = () => this.setState({ showActionBar: !this.state.showActionBar })

  forceRender = () => this.setState({ forceRender: !this.state.forceRender })

  get journal() {
    return this.props.journal!;
  }

  get isLoading() {
    const { loading: { metricValues, metricAverages, analyses } } = this.props.state;
    return metricValues || metricAverages || analyses;
  }

  get formattedStart() {
    return this.props.start.clone().startOf('isoWeek').startOf('day').format("MM-DD-YYYY");
  }

  get isMetricsEmpty() {
    return this.journal.metrics.length <= 1;
  }

  get metrics() {
    return sortBy(this.journal.metrics, "order");
  }

  get headers() {
    const date = convertToUTC(this.props.start);
    const end = convertToUTC(this.props.end);
    const headers: { id: number, title: string }[] = [];
    headers.push({ id: date.unix(), title: date.format("ddd D") });
    while (date.add(1, 'days').diff(end) <= 0) {
      headers.push({ id: date.unix(), title: date.format("ddd D") });
    }
    return headers;
  }

  get rows() {
    const rows: IRow[] = [];
    const start = convertToUTC(this.props.start);
    const end = convertToUTC(this.props.end);
    const values = groupBy('metricId')(this.journal.metricValues.filter(({ date }) => date.isSameOrAfter(start) && date.isSameOrBefore(end)));

    const addDay = (currDay: moment.Moment, metricValues: IMetricValue[], acc: IRow) => {
      let value;
      if (metricValues) {
        value = metricValues.find(({ date }) => {
          return currDay.isSame(date)
        });
      }
      acc[currDay.unix()] = value ? value.value : " -- ";
    }

    this.metrics.forEach(metric => {
      const row: IRow = { title: metric.data.title!, id: metric.id!, type: metric.data.type! as string };
      const metricValues: IMetricValue[] = values[metric.id!];
      const date = convertToUTC(this.props.start);
      addDay(date, metricValues, row);
      while (date.add(1, 'days').diff(end) <= 0) {
        addDay(date, metricValues, row);
      }
      rows.push(row);
    });

    return rows;
  }

  renderActiveTab = () => {
    const { activeTab } = this.state;;

    this.showingEmptyState = true;

    if (this.isMetricsEmpty) {
      return <EmptyState
        title="You haven't created any metrics yet"
        subtitle="Create a set of metrics below to get started."
      />
    }

    const rows = this.rows;
    const date = this.formattedStart;
    const noNumericMetricsExist = !this.metrics.some(({ data }, index) => index > 0 && data.type !== "string");

    if (!entries(rows[0]).some(([id, row]) => moment.unix(parseInt(id)).isValid() && row !== " -- ")) {
      return <EmptyState
        title="No forms filled"
        subtitle="Fill out a form in the agenda screen to analyze this week's metrics."
      />
    }

    if (noNumericMetricsExist && (activeTab === "summary" || activeTab === "graphs")) {
      return <EmptyState
        title="You have only added text metrics"
        subtitle="Only numeric or boolean metrics are available for summary or graph insights."
      />
    }

    this.showingEmptyState = false;

    switch (activeTab) {
      case "summary": {
        return (
          <Summary
            analysis={toJS(this.journal.analyses[this.journal.getKeyForEntityMap(this.props.start)])}
            onQueryChange={this.onQueryChange}
          />
        );
      }
      case "graphs": {
        return (
          <Graphs
            averages={this.props.state.metricAverages[date] || {}}
            metrics={this.metrics}
            data={rows}
          />
        )
      }
      case "table": {
        return (
          <Table
            headers={this.headers}
            rows={rows}
          />
        );
      }
    }
  }

  renderLoadedContent = () => {
    const { showActionBar } = this.state;
    return (
      <>
        {!this.showingEmptyState && <TabContainer>
          {Tabs.map(tab => <Tab className={`${this.state.activeTab === tab ? "active" : ""}`} onClick={() => this.switchTab(tab)} key={tab}>{tab}</Tab>)}
        </TabContainer>}
        {this.renderActiveTab()}
        <ActionsContainer className={`${showActionBar ? "open" : ""}`}>
          <button className="close" onClick={this.toggleShowActionBar}>
            <i className="fa fa-close" />
          </button>
          <BannerText>
            Metrics help you measure what matters.
          </BannerText>
          <TextLink className="link" onClick={this.props.navigateToMetrics}>Create metrics here.</TextLink>
        </ActionsContainer>
      </>
    );
  }

  render() {
    const isLoading = this.isLoading;
    return (
      <Container>
        {isLoading && <Spinner />}
        {!isLoading && this.renderLoadedContent()}
      </Container>
    );
  }
}
