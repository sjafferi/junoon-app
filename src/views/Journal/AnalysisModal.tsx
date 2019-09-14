import * as React from 'react';
import styled from 'styled-components';
import { observer } from "mobx-react";
import { IAnalysis, IQuery } from 'stores';
import { Header4, Row as RowUI, Modal, Primary, Colors } from 'ui'

interface IProps {
  open?: boolean;
  close: () => void;
  analysis?: IAnalysis;
  week: string;
  onQueryChange: (payload: Partial<IQuery>) => void
}

const Container = styled(Modal)`
  padding: 92px;
  padding-top: 30px;
  text-align: center;
  min-width: 500px;
`;

const Title = styled(Header4)`
  padding: 0 25px;
  padding-bottom: 6px;
  border-bottom: 1px solid #e5e5e5;
  width: 100%;
`;

const Row = styled(RowUI)`
  position: relative;
  padding: 13px;
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
`;

const FunctionsContainer = styled.div`
  position: absolute;
  top: 28%;
  left: -85px;
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
    background: #ffc800;
    border-color: #ffc800;
    color: ${Colors.darkTextGrey};
  }
  padding: 2px;
  height: 16px;
  width: 45px;
  font-size: 8px;
  text-transform: capitalize;
  min-width: 0;
`;

@observer
export default class AnalysisMdal extends React.Component<IProps> {
  constructor(props: any) {
    super(props);
  }

  close = () => {
    this.props.close();
  }

  handleQueryChange = (original: IQuery, payload: Partial<IQuery>) => {
    if (original.function !== payload.function) {
      this.props.onQueryChange(payload)
    }
  }

  renderAnalysis = (query: IQuery, index: number) => {
    const { value, label, id, metricId, functions } = query;
    return (
      <Row key={index}>
        <FunctionsContainer>
          {functions.length > 1 && functions.map((fn, index) =>
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
      </Row>
    );
  }

  public render() {
    const { analysis, week } = this.props;
    return (
      <Container isOpen={!!this.props.open} close={this.close}>
        <Title>Analysis: {week}</Title>
        {analysis && Object.values(analysis).map((value, index) => this.renderAnalysis(value, index))}
      </Container>
    )
  }
}