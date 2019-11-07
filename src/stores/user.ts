import { action, computed, observable } from 'mobx';
import { assign } from 'lodash';
import { RootStore } from './index';
import { login, signup, signout, fetchUser } from 'api'
import { getParameterByName } from "../util";

export const PUBLIC_ACCT_PARAM_NAME = 'uid';
export let PUBLIC_ACCT_ID: string | null = null;

export interface IUser {
  id?: string;
  email: string;
  password: string;
  isPublic?: boolean;
}

export class User {
  @observable public user?: Partial<IUser>;
  @observable public isViewingPublicAcct = false;

  constructor(protected rootStore: RootStore) {
    const publicAcctId = getParameterByName(PUBLIC_ACCT_PARAM_NAME);
    if (publicAcctId) {
      this.setUser({ id: publicAcctId, isPublic: true });
      this.assign({ isViewingPublicAcct: true });
      PUBLIC_ACCT_ID = publicAcctId;
    } if (document.cookie) {
      this.validateUser();
    } else {
      this.setUser();
    }
  }

  @action
  setUser = (user?: Partial<IUser>) => {
    this.user = user;
    if (this.rootStore.journal) {
      this.rootStore.journal.initialize();
    } else {
      setTimeout(() => this.setUser(user), 200);
    }
    if (user && user.email) {
      PUBLIC_ACCT_ID = null;
    }
  }

  @action
  validateUser = async () => {
    let result, error;

    try {
      const response = await fetchUser();
      if (response.error) error = response.error;
      else result = response;
    } catch (e) {
      error = e;
    }

    this.setUser(result);

    return { result, error };
  }

  @action
  public login = async (payload: { email: string, password: string }) => {
    let result, error;

    try {
      const response = await login(payload);
      if (response.error) error = response.error;
      else result = response;
    } catch (e) {
      error = e;
    }

    if (result) this.setUser(result);

    return { result, error };
  }

  @action
  public signup = async (payload: { email: string, password: string }) => {
    let result, error;

    try {
      const response = await signup(payload);
      if (response.error) error = response.error;
      else result = response;
    } catch (e) {
      error = e;
    }

    if (result) this.setUser(result);

    return { result, error };
  }

  @action
  public signout = async () => {
    let result, error;

    try {
      const response = await signout();
      if (response.error) error = response.error;
      else result = response;
    } catch (e) {
      error = e;
    }

    if (result) this.setUser(result);

    window.location.replace('/');
    window.location.reload();

    return { result, error };
  }

  @action
  assign(fields: { [id: string]: any }) {
    assign(this, fields);
  }

  @computed
  get isLoggedIn(): boolean {
    return !!(this.user) || this.isViewingPublicAcct;
  }
}

