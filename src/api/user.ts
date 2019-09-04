import { post, get } from './api';
import { API_HOST } from 'consts';

export function fetchUser() {
  return get(`${API_HOST}/users/fetch-current-session`);
}

export function login(payload: any) {
  return post(`${API_HOST}/users/login`, payload);
}

export function signup(payload: any) {
  return post(`${API_HOST}/users/signup`, payload);
}

export function signout() {
  return post(`${API_HOST}/users/signout`);
}