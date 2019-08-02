import { post, get } from './api';
import { API_HOST } from 'consts';
import { IEntry } from 'views/Journal/state'

export function fetchEntries(start: number, end: number) {
  return post(`${API_HOST}/entries/fetch-or-create-many`, { start, end });
}

export function updateEntries(payload: IEntry[]) {
  return post(`${API_HOST}/entries/save-many`, payload);
}

export function createEntries(payload: IEntry[]) {
  return post(`${API_HOST}/entries/create-many`, payload);
}