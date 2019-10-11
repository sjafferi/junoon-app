import * as React from 'react';
import * as moment from 'moment';
import styled from 'styled-components';
import { observer } from 'mobx-react';
import { breakpoint, LineChart, PieChart, Colors } from "ui";
import { IMetric, IAverage } from "stores";
import { IRow } from "./index";
import { convertToLocal } from "../../util";

interface IGraphsProps {
  averages: Record<string, IAverage[]>;
  data: IRow[];
  metrics: IMetric[];
};

const Container = styled.div`
  max-width: 900px;
  min-height: 40%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-end;
  position: relative;
`;

const Legend = styled.div`
  display: flex;
  position: absolute;
  top: 18px;
  left: 30px;

  span {
    display: flex;
    font-size: 12px;
    margin-right: 15px;
  }

  .data-block {
    width: 25px;
    height: 10px;
    margin-right: 5px;
    background: ${Colors.gold};
  }

  .average-block {
    width: 25px;
    height: 10px;
    margin-right: 5px;
    background: ${Colors.chartAverageGrey};
  }

  ${breakpoint.down('ml')`{
    flex-direction: column;
    span:first-child {
      margin-bottom: 12.5px;
    }
  }`}
`;

function getChartType(metric: IMetric) {
  let chartType;
  switch (metric.data.type) {
    case "boolean": {
      chartType = "pie";
      break;
    }
    case "number": {
      chartType = "line";
      break;
    }
  }
  return chartType;
}

const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

@observer
export default class Graphs extends React.Component<IGraphsProps> {
  lineCharts: { x: Date, y: number }[][] = [];



  renderChart = ({ id, title, ...rest }: IRow) => {
    const metric = this.props.metrics.find(({ id: metricId }) => id === metricId);
    if (metric) {
      const averages = this.props.averages[metric.id!];
      const type = getChartType(metric);
      if (type === "line") {
        const labels: string[] = [], timestamps: Date[] = [];
        const data: { x: Date, y: number }[] = Object.entries(rest).filter(([timestamp, value]) => {
          timestamps.push(convertToLocal(moment.unix(parseInt(timestamp))).toDate());
          return !isNaN(parseFloat(value as any));
        }).map(([timestamp, value]) => ({ x: convertToLocal(moment.unix(parseInt(timestamp))).toDate(), y: parseFloat(value as any) }));
        const averageData: { x: Date, y: number }[] = []
        if (Array.isArray(averages)) {
          for (let i = 0; i < averages.length; i++) {
            const weekday = days[moment(timestamps[i].toISOString()).weekday()];
            const average = averages.find(({ day }) => day === weekday);
            const { value } = average || {} as any;
            const parsedVal = parseFloat(value as any);
            if (!isNaN(parsedVal)) {
              averageData.push({ x: timestamps[i], y: parsedVal });
            }
          }
        }
        if (data.length > 0) this.lineCharts.push(data);
        return data.length > 0 && <LineChart labels={labels} data={data} averages={averageData} key={id as string} title={title as string} />
      }
      if (type === "pie") {
        const yesLength = Object.entries(rest).filter(([_, value]) => value === "true").length;
        const dataLength = Object.keys(rest).length;
        const labels = ["Yes", "No"];
        return dataLength > 0 && <PieChart labels={labels} data={[yesLength, dataLength - yesLength]} key={id as string} title={title as string} />
      }
    }
  }

  render() {
    const { data } = this.props;
    this.lineCharts = [];
    return (
      <>
        <Container>
          {data.sort((a, b) => a.type > b.type ? 1 : -1).map(this.renderChart)}
        </Container>
        {this.lineCharts.length > 0 && (
          <Legend>
            <span><div className="data-block"></div> This week</span>
            <span><div className="average-block"></div> Average of previous weeks</span>
          </Legend>
        )}
      </>
    );
  }
}
