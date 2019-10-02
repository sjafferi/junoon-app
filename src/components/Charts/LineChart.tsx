import * as React from 'react';
import * as moment from 'moment';
import * as Chart from "chart.js";
import styled from 'styled-components';
import { Header3 } from 'ui';
import { convertToLocal } from "views/Journal/util";

export interface IChartProps {
  data: { x: number | Date, y: number }[];
  averages?: { x: number | Date, y: number }[];
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

export default class LineChart extends React.Component<IChartProps> {
  chartRef: React.RefObject<HTMLCanvasElement> = React.createRef();
  myLineChart?: Chart;

  componentDidMount() {
    this.buildChart();
  }

  componentDidUpdate() {
    this.buildChart();
  }

  buildChart = () => {
    const myChartRef = this.chartRef.current!.getContext("2d");
    const { averages, data, title, labels } = this.props;

    if (typeof this.myLineChart !== "undefined") this.myLineChart.destroy();

    const datasets: Chart.ChartDataSets[] = [
      {
        label: title,
        data: data,
        fill: false,
        borderColor: "#f0a600",
        showLine: true,
      }
    ]
    if (averages) {
      datasets.push({
        label: "Average",
        data: averages,
        fill: false,
        showLine: true,
        borderColor: "#E0E0E0",
        pointRadius: 0,
        borderWidth: 3
      });
    }

    this.myLineChart = new Chart(myChartRef!, {
      type: "scatter",
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          xAxes: [{
            type: 'time',
            time: {
              unit: 'day',
              unitStepSize: 1
            },
            gridLines: {
              display: true,
              drawBorder: true
            },
            ticks: {
              min: 5,
              max: 7,
              callback: (label, index, labels) => {
                const date = moment(label, "MMM D");
                if (date.isValid())
                  return date.format("ddd D");
                return "";
              }
            }
          }],
          yAxes: [{
            ticks: {
              beginAtZero: true
            },
            gridLines: {
              display: true,
              drawBorder: true
            }
          }]
        }
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
