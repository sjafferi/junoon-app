import * as React from 'react';
import * as moment from 'moment';
import { Link } from 'react-router-dom';
import styled from "styled-components";

import { Colors } from 'consts';

const Container = styled.div`
  width: 100vw;
  height: 50px;
  display: flex;
  justify-content: center;
`;

const DateRange = styled.div`
  display: flex;
  align-items: center;

  a {
    padding: 0 20px;
    color: #7b7b7b;
  }
`;

const Title = styled.h3`
  color: ${Colors.darkLightGrey};
`

interface IHeaderProps {
  start: moment.Moment;
}

export default class Header extends React.Component<IHeaderProps, {}> {
  get prevWeek() {
    const clone = this.props.start.clone().subtract(1, 'w');
    return clone.format("MMMD");
  }

  get nextWeek() {
    const clone = this.props.start.clone().add(1, 'w');
    return clone.format("MMMD");
  }

  get week() {
    const startOfWeek = this.props.start.startOf('isoWeek');
    const endOfWeek = this.props.start.clone().endOf('isoWeek');
    let start = startOfWeek.format("MMM D"), end = endOfWeek.format("D");
    if (startOfWeek.month() !== endOfWeek.month()) {
      end = endOfWeek.format("MMM D");
    }
    return `${start} - ${end}`;
  }

  render() {
    return (
      <Container>
        <DateRange>
          <Link to={`/journal/weekly/${this.prevWeek}`} >
            <i className="fa fa-chevron-left"></i>
          </Link>
          <Title>{this.week}</Title>
          <Link to={`/journal/weekly/${this.nextWeek}`} >
            <i className="fa fa-chevron-right"></i>
          </Link>
        </DateRange>
      </Container>
    );
  }
}
