import { action, computed, observable } from 'mobx';
import { RootStore } from './index';
import { login, signup, signout, fetchUser } from 'api'

export type IRole = "admin" | "customer" | "restaurant";

export interface IUser {
  id?: string;
  email: string;
  phone: string;
  role: IRole;
  password: string;
  city: string;
}

export class User {
  @observable public user?: IUser;
  @observable public sessionLoaded = false;

  constructor(protected rootStore: RootStore) {
    console.log("COOKIE: ", document.cookie);
    window.onbeforeunload = () => {
      console.log("before unload COOKIE: ", document.cookie);
    }
    if (document.cookie) {
      this.validateUser();
    } else {
      this.onSessionLoad();
    }
  }

  @action
  setUser = (user: IUser) => {
    this.user = user;
    this.rootStore.journal.initialize();
    console.log("COOKIE: ", document.cookie);
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

    if (result) this.setUser(result);

    this.onSessionLoad();
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
  onSessionLoad = () => {
    this.sessionLoaded = true;
    if (this.rootStore.journal && !this.rootStore.journal.initialized) {
      this.rootStore.journal.initialize();
    }
  }

  @computed
  get isLoggedIn(): boolean {
    return !!(this.user);
  }
}

