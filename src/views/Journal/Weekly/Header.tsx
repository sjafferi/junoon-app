import * as React from 'react';
import * as moment from 'moment';
import styled from "styled-components";
import { Link } from 'react-router-dom';
import { observer } from "mobx-react";
import { Colors } from 'ui';
import { Journal, User } from 'stores';
import { BASE_ROUTE } from "../index";
import { HEADER_HEIGHT } from 'consts';

const Container = styled.div`
  width: 100vw;
  height: ${HEADER_HEIGHT}px;
  padding: 0 30px;
  display: flex;
  box-sizing: border-box;
  justify-content: space-between;
  border-bottom: 1px solid ${Colors.lightGrey};
`;

const Column = styled.div`
  display: flex;
  align-items: center;
`;

const DateRange = styled(Column)`
  margin-left: 5%;
  &.logged-in {
    margin-left: 0;
    margin-right: 16%;
  }
  a {
    padding: 0 20px;
    color: #7b7b7b;
  }
  .disabled {
    cursor: not-allowed;
  }
`;

const Title = styled.h3`
  width: 135px;
  text-align: center;
  font-size: 1.2em;
  color: ${Colors.darkLightGrey};
`;

interface IHeaderProps {
  start: moment.Moment;
  LeftElement: React.ReactNode;
  RightElement: React.ReactNode;
  isLoggedIn: boolean;
  journal?: Journal;
  user?: User;
}

@observer
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

  get showLeftNav() {
    if (!this.props.user!.isViewingPublicAcct) return true;
    const prevWeek = this.props.start.clone().subtract(1, 'w');
    return !!this.props.journal!.getEntryForDay(prevWeek);
  }

  get showRightNav() {
    if (!this.props.user!.isViewingPublicAcct) return true;
    const nextWeek = this.props.start.clone().add(1, 'w');
    return this.props.journal!.getEntryForDay(nextWeek);
  }

  render() {
    const { isLoggedIn } = this.props;
    const isAnalyzeActive = location.pathname.includes("analyze");
    const pathnameSuffix = isAnalyzeActive ? "/analyze" : "";
    const currUrl = `${location.pathname}${location.search}`;
    const showLeftNav = this.showLeftNav;
    const showRightNav = this.showRightNav;

    return (
      <Container>
        <Column>
          {this.props.LeftElement}
        </Column>
        <DateRange className={`${isLoggedIn ? "logged-in" : ""}`}>
          <Link
            className={`${!showLeftNav ? "disabled" : ""}`}
            to={showLeftNav ? `/${BASE_ROUTE}/${this.prevWeek}${pathnameSuffix}${location.search}` : currUrl}
          >
            <i className="fa fa-chevron-left"></i>
          </Link>
          <Title>{this.week}</Title>
          <Link
            className={`${!showRightNav ? "disabled" : ""}`}
            to={showRightNav ? `/${BASE_ROUTE}/${this.nextWeek}${pathnameSuffix}${location.search}` : currUrl}
          >
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
