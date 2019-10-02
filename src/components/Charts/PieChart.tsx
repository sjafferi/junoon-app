import * as React from 'react';
import * as moment from 'moment';
import * as Chart from "chart.js";
import styled from 'styled-components';
import { Header3 } from 'ui';

export interface IChartProps {
  data: number[];
  labels: string[];
  title: string;
  key: string;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 300px;
  max-height: 200px;
  padding: 20px;
`;

const Title = styled(Header3)`
  font-size: 0.6em;
  text-align: center;
  font-weight: 700;
  text-transform: none;
`

Chart.defaults.global.defaultFontFamily = "'DM Sans', sans-serif"
Chart.defaults.global.legend!.display = false;
Chart.defaults.global.elements!.line!.tension = 0;

export default class PieChart extends React.Component<IChartProps> {
  chartRef: React.RefObject<HTMLCanvasElement> = React.createRef();
  myPieChart?: Chart;

  componentDidMount() {
    this.buildChart();
  }

  componentDidUpdate() {
    this.buildChart();
  }

  buildChart = () => {
    const myChartRef = this.chartRef.current!.getContext("2d");
    const { data, title, labels } = this.props;

    if (typeof this.myPieChart !== "undefined") this.myPieChart.destroy();

    const datasets: Chart.ChartDataSets[] = [
      {
        label: title,
        data: data,
        backgroundColor: [
          "#f0a600", // true
          "#E0E0E0" // false
        ]
      }
    ]

    this.myPieChart = new Chart(myChartRef!, {
      type: "doughnut",
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      }
    });
  }

  render() {
    return (
      <Container>
        <Title>{this.props.title}</Title>
        <canvas ref={this.chartRef} />
      </Container>
    );
  }
}
