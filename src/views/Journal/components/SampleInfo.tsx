import * as React from 'react';
import * as moment from 'moment';
import styled from 'styled-components';
import Select from 'react-select'
import { observer, inject } from "mobx-react";
import { keys, sortBy } from "lodash";
import { Colors, Primary, Modal, EditableInput, Text, Header3, Spacer } from "ui";
import { IMetric, Journal, User } from "stores";
import { METRIC_FIELDS } from "../Form";
import { History } from "history";

interface ICRUDTableProps {
  user?: User;
}

interface ICRUDTableState {
  isOpen: boolean
}

const Container = styled(Modal)`
  width: 300px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
`;

const Title = styled(Header3)`
  text-align: center;
  margin: 12px 0;
  margin-top: 0;
`;

const Row = styled.div`
  display: flex;
  justify-content: center;
  padding: 7px;
  p { text-align: center !important; };
`

@inject('user')
@observer
export default class SampleInfo extends React.Component<ICRUDTableProps> {
  state = {
    isOpen: true
  };

  constructor(props: ICRUDTableProps) {
    super(props);
    this.state.isOpen = props.user!.isViewingPublicAcct && !localStorage.getItem("hasClosedPublicAcctInfo");
  }

  close = () => {
    this.setState({ isOpen: false });
    localStorage.setItem("hasClosedPublicAcctInfo", "true");
  }

  get isOpen() {
    return this.props.user!.isViewingPublicAcct && this.state.isOpen;
  }

  render() {
    return (
      <Container isOpen={this.isOpen} close={this.close}>
        <Title>Welcome to Junoon! 🎉</Title>
        <Row>
          <Text>You are viewing a sample account. Click around and explore :)</Text>
        </Row>
      </Container>
    )
  }
}