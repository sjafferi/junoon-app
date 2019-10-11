import * as React from 'react';
import styled from 'styled-components';
import { observer } from "mobx-react";
import { IAnalysis, IQuery } from 'stores';
import { Header4, Row as RowUI, Primary, Colors } from 'ui'

interface IProps {
  analysis?: IAnalysis;
  onQueryChange: (payload: Partial<IQuery>) => void
}

const Container = styled.div`
  padding: 92px;
  padding-top: 30px;
  text-align: center;
  box-sizing: content-box;
`;

const Title = styled(Header4)`
  padding: 0 25px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e5e5e5;
  width: 100%;
`;

const Row = styled(RowUI)`
  position: relative;
  padding: 13px 40px 13px 0px;
  font-size: 11px;
  justify-content: space-between;
  label {
    text-align: left;
  }
  span {
    margin-left: 15px;
    font-size: 12px;
  }
  &:hover {
    > div:first-child {
      opacity: 1;
    }
  }
  &.title > * {
    font-size: 13px;
    font-weight: bold;
    font-style: normal;
    font-family: 'Open Sans',sans-serif;
    color: ${Colors.darkTextGrey};
  }
`;

const FunctionsContainer = styled.div`
  position: absolute;
  top: 28%;
  left: -98px;
  border: none;
  opacity: 0;
  > button:first-child {
    border-top-left-radius: 10px;
    border-bottom-left-radius: 10px;
  }
  > button:last-child {
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
  }
`;

const Function = styled(Primary)`
  &:hover, &.active {
    background: ${Colors.gold};
    border-color: ${Colors.gold};
    color: ${Colors.darkTextGrey};
  }
  padding: 2px;
  height: 10px;
  width: 40px;
  font-size: 8px;
  text-transform: capitalize;
  min-width: 0;
`;

const Insight = styled.span`
  position: absolute;
  top: 28%;
  right: -90px;
  font-family: 'Open Sans', sans-serif;
  font-size: 13px !important;
  font-style: italic;
  color: ${Colors.darkTextGrey};
  &.red {
    color: red;
  }
  &.green {
    color: green;
  }
  i {
    font-size: 10px;
    margin: 0 5px;
  }
  i.indicator {
    font-size: 12px;
  }
`;


@observer
export default class Summary extends React.Component<IProps> {
  constructor(props: any) {
    super(props);
  }

  handleQueryChange = (original: IQuery, payload: Partial<IQuery>) => {
    if (original.function !== payload.function) {
      this.props.onQueryChange(payload)
    }
  }

  renderTitle = () => {
    const doesInsightExist = this.props.analysis && this.props.analysis.find(({ insight }) => insight && insight.perc > 0 && insight.delta !== 0);
    return (
      <Row className="title">
        <label>Metric</label>
        <span>Value</span>
        {doesInsightExist && <Insight style={{ top: "13px", right: "-137px" }}>Change from last week</Insight>}
      </Row>
    );
  }

  renderAnalysis = (query: IQuery, index: number) => {
    const { value, label, id, metricId, functions, insight } = query;
    return (
      <Row key={index}>
        <FunctionsContainer>
          {functions && functions.length > 1 && functions.map((fn, index) =>
            <Function
              key={index}
              className={`${query.function === fn ? 'active' : ''}`}
              onClick={() => this.handleQueryChange(query, { id, function: fn, metricId })}
            >
              {fn}
            </Function>
          )}
        </FunctionsContainer>
        <label>{label}</label>
        <span>{value}</span>
        {insight && insight.perc > 0 && insight.delta !== 0 && (
          <Insight
            className={`${insight.delta > 0 ? "green" : insight.delta < 0 ? "red" : ""}`}
          >
            {insight.delta !== 0 && <i className={`indicator fa ${insight.delta > 0 ? "fa-angle-double-up" : "fa-angle-double-down"}`}></i>}
            {((insight.delta < 0 ? 1 - insight.perc : insight.perc) * 100).toFixed(2)}
            <i className="fa fa-percent"></i>
          </Insight>
        )}
      </Row>
    );
  }

  public render() {
    const { analysis } = this.props;
    return (
      <Container>
        {/* {this.renderTitle()} */}
        {analysis && Object.values(analysis).map((value, index) => this.renderAnalysis(value, index))}
      </Container>
    )
  }
}