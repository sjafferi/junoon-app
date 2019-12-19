import { action, computed, observable } from 'mobx';
import { assign, isEmpty } from 'lodash';
import { RootStore } from './index';
import { login, signup, signout, fetchUser } from 'api'
import { getParameterByName } from "../util";
import { removeQueryParam } from "views/Journal/util";

export const PUBLIC_ACCT_PARAM_NAME = 'sample';
const DUMMY_ACCT_ID = '0638b3b2-6821-425f-b6c0-99dca352ced5';
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
    const viewingSampleData = getParameterByName(PUBLIC_ACCT_PARAM_NAME);
    if (viewingSampleData) {
      this.setUser({ id: DUMMY_ACCT_ID, isPublic: true });
      this.assign({ isViewingPublicAcct: true });
      PUBLIC_ACCT_ID = DUMMY_ACCT_ID;
    } else if (document.cookie) {
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
    if (!this.isViewingPublicAcct && user?.email) {
      PUBLIC_ACCT_ID = null;
    }
    if (user?.email && !isEmpty(getParameterByName(PUBLIC_ACCT_PARAM_NAME))) {
      location.search = removeQueryParam('sample', 'signup', 'login');
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

    location.search = removeQueryParam('sample');

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

