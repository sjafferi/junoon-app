import * as React from 'react';
import styled from 'styled-components';
import { inject, observer } from "mobx-react";
import { User } from 'stores';
import { History } from "history";
import { Modal } from 'ui';
import FormState from './state';
import Form from './LoginForm';

const Container = styled(Modal)`
  padding: 25px;
`;

@inject("user")
@inject("history")
@observer
export default class LoginModal extends React.Component<{ user?: User, history?: History, isOpen?: boolean; }> {
  private formState: FormState = new FormState();

  constructor(props: any) {
    super(props);
    this.formState.assign({ user: props.user, history: props.history });
  }

  close = () => {
    this.props.history!.goBack();
  }

  public render() {
    return (
      <Container isOpen close={this.close}>
        <Form state={this.formState} onSubmit={this.close} />
      </Container>
    )
  }
}