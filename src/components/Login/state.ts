import { action, computed, observable } from 'mobx';
import { assign } from 'lodash'
import { User, RouterStore } from 'stores';
import * as joi from 'joi';

const UserLoginSchema = joi.object().keys({
  email: joi
    .string()
    .email()
    .label("Email"),
  password: joi.string().required().label("Password")
});

const UserSignupSchema = UserLoginSchema.keys({
  confirmPassword: joi
    .string()
    .required()
    .label("Confirm password")
    .valid(joi.ref('password')).options({
      language: {
        any: {
          allowOnly: '!!Passwords do not match',
        }
      }
    }),
});


export default class LoginState {
  @observable email: string = "";
  @observable password: string = "";
  @observable confirmPassword: string = "";
  @observable errors: { [key: string]: string } = {};
  @observable isDirty: { [key: string]: string } = {};
  @observable loading: boolean = false;
  @observable inSignup: boolean = false;
  @observable errorMessage?: string;

  public user?: User;
  public router?: RouterStore;

  @action
  assign = (fields: { [key: string]: any }) => {
    assign(this, fields);
    assign(this.isDirty, fields);
  }

  @action
  submit = async () => {
    if (!this.validate()) return false;
    this.loading = true;
    const action = this.inSignup ? this.user!.signup : this.user!.login;
    const { result, error } = await action(this.fields);
    this.loading = false;

    if (error) {
      this.errors.server = error.message;
      return false;
    }

    return result;
  }

  @action
  validate = () => {
    this.isDirty = {};
    this.errors = {};
    const payload: any = this.fields;
    if (this.inSignup) {
      payload.confirmPassword = this.confirmPassword.toString();
    }
    const { error } = joi.validate(payload, this.inSignup ? UserSignupSchema : UserLoginSchema);
    if (error) {
      error.details.forEach(({ message, context }) => {
        const key = context!.key as string;
        this.errors[key] = message.replace(/\"/g, '');
      });
      return false;
    }

    return true;
  }

  errorFor = (key: string) => {
    return this.errors[key] && !this.isDirty[key];
  }

  @computed
  get displayErrorMessage() {
    const invalidField = ["server", "email", "password", "confirmPassword"].find(this.errorFor);
    return invalidField && this.errors[invalidField];
  }

  get fields() {
    return {
      email: this.email.toString(),
      password: this.password.toString()
    }
  }
}