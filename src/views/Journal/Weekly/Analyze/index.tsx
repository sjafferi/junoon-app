import * as React from 'react';
import * as moment from "moment";
import styled from "styled-components";
import { merge, sortBy } from "lodash";
import { toJS } from "mobx";
import { inject, observer } from "mobx-react";
import { Colors, Primary } from "ui";
import { Journal, IMetricValue } from "stores";
import { convertToUTC, convertToLocal, groupBy } from "../../util";
import State from "../../state";
import Table from "./Table";
import Graphs from "./Graphs";

interface IAnalysisProps {
  start: moment.Moment;
  end: moment.Moment;
  state: State;
  journal?: Journal;
}

export type IRow = Record<number | string, string | number | moment.Moment>;

export interface IAverage {
  day: string;
  metricId: string;
  value?: string;
}

const Container = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  padding-bottom: 50px;
  border-top: 1px solid ${Colors.lightGrey};
  overflow: scroll;
`;

const TabContainer = styled.div`
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


@inject("journal")
@observer
export default class Analyze extends React.Component<IAnalysisProps> {
  state = {
    showTable: false,
    averages: {}
  };

  componentWillMount() {
    this.props.journal!.fetchMetricValues(this.props.start, this.props.end);
    this.updateAverages();
  }

  toggleShowTable = () => this.setState({ showTable: !this.state.showTable })

  updateAverages = async () => {
    const averages = await this.props.journal!.fetchMetricAverages(moment.unix(0), convertToUTC(this.props.start));
    this.setState({ averages: merge(this.state.averages, averages) });
  }

  get metrics() {
    return sortBy(this.props.journal!.metrics, "order");
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
    const values = groupBy('metricId')(this.props.journal!.metricValues.filter(({ date }) => date.isSameOrAfter(start) && date.isSameOrBefore(end)));

    const addDay = (currDay: moment.Moment, metricValues: IMetricValue[], acc: IRow) => {
      let value;
      if (metricValues) {
        value = metricValues.find(({ date }) => {
          return currDay.unix() === date.unix()
        });
      }
      acc[currDay.unix()] = value ? value.value : " -- ";
    }

    this.metrics.forEach(metric => {
      const row: IRow = { title: metric.data.title!, id: metric.id! };
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

  render() {
    const rows = this.rows;
    return (
      <Container>
        <TabContainer>
          <Tab className={`${this.state.showTable ? "active" : ""}`} onClick={this.toggleShowTable}>Table</Tab>
          <Tab className={`${this.state.showTable ? "" : "active"}`} onClick={this.toggleShowTable}>Graphs</Tab>
        </TabContainer>
        {this.state.showTable && <Table
          headers={this.headers}
          rows={rows}
        />}
        {!this.state.showTable && <Graphs
          averages={this.state.averages}
          metrics={this.metrics}
          data={rows}
        />}
      </Container>
    );
  }
}
