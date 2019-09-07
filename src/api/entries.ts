import { post, get } from './api';
import { API_HOST } from 'consts';
import { IEntry, IForm, ICreateMetric, IMetric } from 'stores'

export interface IErrorResponse {
  error: boolean;
  message: string;
}

export function fetchEntries(start: number, end: number) {
  return post(`${API_HOST}/entries/fetch-or-create-many`, { start, end });
}

export function fetchMetrics() {
  return get(`${API_HOST}/forms/fetch-metrics`);
}

export function fetchAnalysis(start: number, end: number) {
  return get(`${API_HOST}/queries/fetch-analysis/${start}/${end}`);
}

export function fetchForms(start: number, end: number) {
  return get(`${API_HOST}/forms/fetch/${start}/${end}`);
}

export function saveForm(payload: IForm): Promise<IForm | IErrorResponse> {
  return post(`${API_HOST}/forms/save`, payload);
}

export function createMetrics(payload: ICreateMetric[]): Promise<IMetric[] | IErrorResponse> {
  return post(`${API_HOST}/forms/create-metrics`, payload);
}

export function updateEntries(payload: IEntry[]) {
  return post(`${API_HOST}/entries/save-many`, payload);
}

export function createEntries(payload: IEntry[]) {
  return post(`${API_HOST}/entries/create-many`, payload);
}