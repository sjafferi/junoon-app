import * as React from 'react';
import styled from 'styled-components';
import { observer } from "mobx-react";
import { IAnalysis } from 'stores';
import { Header4, Row as RowUI, Modal } from 'ui'

const Container = styled(Modal)`
  padding: 50px;
  padding-top: 30px;
  text-align: center;
`;

const Title = styled(Header4)`
  padding-bottom: 6px;
  border-bottom: 1px solid #e5e5e5;
  width: 100%;
`;

const Row = styled(RowUI)`
  padding: 20px;
  font-size: 11px;
  span {
    margin-left: 15px;
    font-size: 12px;
  }
`;

@observer
export default class LoginModal extends React.Component<{ open?: boolean, close: () => void; analysis?: IAnalysis, week: string }> {
  constructor(props: any) {
    super(props);
  }

  close = () => {
    this.props.close();
  }

  renderAnalysis = ({ value, label }: { value: string, label: string }, index: number) => {
    return <Row key={index}> <label>{label}</label> <span>{value}</span></Row>
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