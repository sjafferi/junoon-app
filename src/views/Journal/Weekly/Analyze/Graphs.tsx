import * as React from 'react';
import * as moment from 'moment';
import styled from 'styled-components';
import { LineChart, PieChart } from "ui";
import { IMetric } from "stores";
import { IRow, IAverage } from "./index";
import { convertToLocal } from "../../util";

interface IGraphsProps {
  averages: Record<string, IAverage[]>;
  data: IRow[];
  metrics: IMetric[];
};

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
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

export default class Graphs extends React.Component<IGraphsProps> {
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
            const { value } = averages[i];
            const parsedVal = parseFloat(value as any);
            if (!isNaN(parsedVal)) {
              averageData.push({ x: timestamps[i], y: parsedVal });
            }
          }
        }
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
    return (
      <Container>
        {data.map(this.renderChart)}
      </Container>
    );
  }
}
