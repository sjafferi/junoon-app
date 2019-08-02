import { post, get } from './api';
import { API_HOST } from 'consts';

export function fetchUser(id: string) {
  return get(`${API_HOST}/users/${id}`);
}

export function login(payload: any) {
  return post(`${API_HOST}/users/login`, payload);
}

export function signup(payload: any) {
  return post(`${API_HOST}/users/signup`, payload);
}