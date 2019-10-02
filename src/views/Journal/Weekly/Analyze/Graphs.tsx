import * as React from 'react';
import * as moment from 'moment';
import styled from 'styled-components';
import { LineChart } from "ui";
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
      if (metric.ui && metric.ui.widget === "radio") {
        chartType = "bar";
      } else {
        chartType = "line";
      }
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
      if (type) {
        const labels: string[] = [], timestamps: number[] = [];
        const data: { x: number, y: number }[] = Object.entries(rest).filter(([timestamp, value]) => {
          timestamps.push(parseInt(timestamp));
          labels.push(convertToLocal(moment.unix(parseInt(timestamp))).format("ddd D"));
          return !isNaN(parseFloat(value as any));
        }).map(([timestamp, value]) => ({ x: parseInt(timestamp), y: parseFloat(value as any) }));
        const averageData: { x: number, y: number }[] = []
        if (Array.isArray(averages)) {
          for (let i = 0; i < averages.length; i++) {
            const { value } = averages[i];
            const parsedVal = parseFloat(value as any);
            if (!isNaN(parsedVal)) {
              averageData.push({ x: timestamps[i], y: parsedVal });
            }
          }
        }
        console.log(`${title} average: `, averageData)
        console.log(`${title} data: `, data)
        return data.length > 0 && <LineChart labels={labels} data={data} averages={averageData} key={id as string} title={title as string} />
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
