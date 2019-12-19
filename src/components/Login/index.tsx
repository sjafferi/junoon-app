import * as React from 'react';
import styled from 'styled-components';
import { inject, observer } from "mobx-react";
import { User } from 'stores';
import { History } from "history";
import { Modal, breakpoint } from 'ui';
import FormState from './state';
import Form from './LoginForm';
import { removeQueryParam } from 'views/Journal/util';

const Container = styled(Modal)`
  padding: 25px;
  ${breakpoint.down('s')`{
    left: 29%;
    top: 27%;
  }`}
`;

@inject("user")
@observer
export default class LoginModal extends React.Component<{ user?: User, history: History, isOpen?: boolean; }> {
  private formState: FormState = new FormState();

  constructor(props: any) {
    super(props);
    this.formState.assign({ user: props.user, history: props.history });
  }

  get params() {
    return;
  }

  close = () => {
    this.props.history.push({ search: removeQueryParam('login', 'signup') });
  }

  public render() {
    return (
      <Container isOpen close={this.close}>
        <Form state={this.formState} onSubmit={this.close} />
      </Container>
    )
  }
}