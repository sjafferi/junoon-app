import * as React from 'react';
import styled from 'styled-components';
import { Colors, Header4, Primary, Spacer, Text } from 'ui';
import { observer } from 'mobx-react'
import FormState from './state';

const Title = styled(Header4)`
  margin: 0 !important;
`;

const Tabs = styled.div`
  display: flex;
  position: absolute;
  top: 30px;
`;

const Tab: any = styled(Primary)`
  color: ${Colors.darkTextGrey};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 15px;
  border: none;
  min-height: 210px;

  fieldset {
    border: none;
    padding: 0;
  }

  button {
    width: 100%;
  }

  input {
    margin-bottom: 10px;
    font-size: 12px;
    width: 175px;
    padding: 5px 9px 3px 9px;
  }

  p.error {
    padding: 5px;
    margin: 0;
    bottom: 9px;
    font-size: 9px;
    text-align: center;
    position: absolute;
    color: ${Colors.mutedTextGrey};
  }

  p.server {
    margin-top: 25px;
    text-align: center;
    font-size: 10px;
    color: red;
  }
`;

interface ILoginProps {
  state: FormState;
  onSubmit: () => void;
}

@observer
export default class Login extends React.Component<ILoginProps> {
  get form() { return this.props.state; }

  toggleSignup = (e: React.MouseEvent) => {
    this.form.assign({ inSignup: !this.form.inSignup });
    e.preventDefault();
  }

  handleChange = (key: string) => (event: any) => {
    this.form.assign({ [key]: event.target.value });
  }

  submit = async (e: any) => {
    e.preventDefault();
    const result = await this.form.submit();
    if (result && !result.error) {
      this.props.onSubmit();
    }
  }

  renderField = (name: string, type: string, placeholder?: string) => {
    return <Field name={name} type={type} placeholder={placeholder} state={this.form} handleChange={this.handleChange(name)} />;
  }

  public render() {
    return (
      <Form>
        <Tabs>
          <Tab type="button" className={!this.form.inSignup ? "active" : ""} onClick={this.toggleSignup}>
            <Title center>Login</Title>
          </Tab>
          <Tab type="button" className={this.form.inSignup ? "active" : ""} onClick={this.toggleSignup}>
            <Title center>Signup</Title>
          </Tab>
        </Tabs>
        <Spacer height={30} />
        <fieldset>
          {this.renderField('email', 'email')}
          {this.renderField('password', 'password')}
          {this.form.inSignup && this.renderField('confirmPassword', 'password', 'Confirm password')}
        </fieldset>
        <Primary onClick={this.submit} type="submit" loading={this.form.loading}>Submit</Primary>
        {this.form.displayErrorMessage && <Text className="error">{this.form.displayErrorMessage}</Text>}
      </Form>
    )
  }
}

const FieldContainer: any = styled.div`
  p.error-message {
    display: none;
  }
  &.error {
    // p.error-message {
    //   display: block;
    // }
    input {
      border-color: red;
    }
  
    input::placeholder {
      color: red;
      font-weight: 300;
    }
  }
`

interface IFieldProps {
  state: FormState;
  name: string;
  handleChange: (event: any) => void,
  type?: string,
  placeholder?: string
}
;
const Field: React.SFC<IFieldProps> = observer(({ state, name, type, placeholder, handleChange }) => (
  <FieldContainer className={state.errorFor(name) ? "error" : ""}>
    <input placeholder={placeholder || `Enter ${name}`}
      type={type || "text"}
      value={(state as any)[name as any]}
      onChange={handleChange} />
    <Text className="error-message">{state.errors[name]}</Text>
  </FieldContainer>
))