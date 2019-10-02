import * as React from 'react';
import * as moment from 'moment';
import styled from "styled-components";
import { Link } from 'react-router-dom';
import { Colors } from 'ui';
import { BASE_ROUTE } from "../index";

const Container = styled.div`
  width: 91vw;
  height: 50px;
  padding: 0 30px;
  display: flex;
  box-sizing: border-box;
  justify-content: space-between;
`;

const Column = styled.div`
  display: flex;
  align-items: center;
`;

const DateRange = styled(Column)`
  margin-left: 9%;
  &.logged-in {
    margin-left: 0;
    margin-right: 16%;
  }
  a {
    padding: 0 20px;
    color: #7b7b7b;
  }
`;

const Title = styled.h3`
  width: 135px;
  text-align: center;
  color: ${Colors.darkLightGrey};
`;

interface IHeaderProps {
  start: moment.Moment;
  LeftElement: React.ReactNode;
  RightElement: React.ReactNode;
  isLoggedIn: boolean;
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
        <Column>
          {this.props.LeftElement}
        </Column>
        <DateRange className={`${this.props.isLoggedIn ? "logged-in" : ""}`}>
          <Link to={`/${BASE_ROUTE}/${this.prevWeek}`} >
            <i className="fa fa-chevron-left"></i>
          </Link>
          <Title>{this.week}</Title>
          <Link to={`/${BASE_ROUTE}/${this.nextWeek}`} >
            <i className="fa fa-chevron-right"></i>
          </Link>
        </DateRange>
        <Column>
          {this.props.RightElement}
        </Column>
      </Container>
    );
  }
}
