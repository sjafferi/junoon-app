import { post, put, get, deleteRequest } from './api';
import { API_HOST } from 'consts';
import { IEntry, IForm, ICreateMetric, IMetric, IMetricValue, IQuery } from 'stores'

export interface IErrorResponse {
  error: boolean;
  message: string;
}

export function fetchEntries(start: number, end: number) {
  return post(`${API_HOST}/entries/fetch-or-create-many`, { start, end });
}

export function updateEntries(payload: IEntry[]) {
  return post(`${API_HOST}/entries/save-many`, payload);
}

export function createEntries(payload: IEntry[]) {
  return post(`${API_HOST}/entries/create-many`, payload);
}

export function fetchAnalysis(start: number, end: number) {
  return get(`${API_HOST}/queries/fetch-analysis/${start}/${end}`);
}

export function updateQuery(payload: Partial<IQuery>): Promise<IQuery | IErrorResponse> {
  return put(`${API_HOST}/queries`, payload);
}

export function fetchMetrics() {
  return get(`${API_HOST}/forms/fetch-metrics`);
}

export function fetchMetricValues(start: number, end: number): Promise<IMetricValue[] | IErrorResponse> {
  return get(`${API_HOST}/forms/fetch-metric-values/${start}/${end}`);
}

export function fetchMetricAverage(start: number, end: number): Promise<IMetricValue[] | IErrorResponse> {
  return get(`${API_HOST}/forms/fetch-metric-average/?start=${start}&end=${end}`);
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

export function deleteMetrics(payload: string[]): Promise<string[] | IErrorResponse> {
  return deleteRequest(`${API_HOST}/forms/delete-metrics`, payload);
}