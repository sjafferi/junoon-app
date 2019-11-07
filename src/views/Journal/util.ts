import * as moment from "moment";
import { EditorState } from 'draft-js';
import { UiSchema } from "react-jsonschema-form";
import { getCurrentBlock, addNewBlock, addNewBlockAt } from "editor/model";
import { IForm, IMetric, ICreateMetric } from "stores";

export function getBlockKey(block: Element) {
  return (block.getAttribute('data-offset-key') || '').split('-')[0];
}

export function getElementBounds(el: Element) {
  var rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return { top: rect.top + scrollTop, left: rect.left + scrollLeft, width: rect.width, height: rect.height }
}

export function isOverlapping(d2: Element, d3: HTMLElement, x: number, y: number) {
  const d0 = getElementBounds(d2), d1 = getElementBounds(d3),
    x11 = d0.left,
    y11 = d0.top,
    x12 = d0.left + d0.width,
    y12 = d0.top + d0.height,
    x21 = x,
    y21 = y,
    x22 = x + d1.width,
    y22 = y + d1.height,

    x_overlap = Math.max(0, Math.min(x12, x22) - Math.max(x11, x21)),
    y_overlap = Math.max(0, Math.min(y12, y22) - Math.max(y11, y21));

  return x_overlap * y_overlap >= d1.width / 2;
}

export function containsPoint(d2: Element, x: number, y: number) {
  const d0 = getElementBounds(d2),
    x11 = d0.left,
    y11 = d0.top,
    x12 = d0.left + d0.width,
    y12 = d0.top + d0.height;

  return x >= x11 && x <= x12 && y >= y11 && y <= y12;
}


export interface Snippet {
  blockType: string,
  placeholder: string
}

export function addSnippet(snippet: Snippet[], editorState: EditorState) {
  let { blockType, placeholder } = snippet[0];
  editorState = addNewBlock(editorState, blockType, { placeholder });

  snippet.forEach(({ blockType, placeholder }, index) => {
    if (index == 0) return;
    let currentBlock = getCurrentBlock(editorState);
    editorState = addNewBlockAt(editorState, currentBlock.getKey(), blockType, { placeholder });
  });

  return editorState;
}

export function genMetricId(title: string) {
  var hash = 0, i, chr;
  if (title.length === 0) return hash.toString();
  for (i = 0; i < title.length; i++) {
    chr = title.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
}

export function transformMetricToSchema(metrics: { type: string, value: ICreateMetric, id: string }[]) {
  return metrics.reduce((acc: Record<string, IMetric["data"]>, { value, id }) => {
    const { ui, ...rest } = value;
    (acc as any)[id as any] = rest!;
    return acc;
  }, {}) as IForm["metricsSchema"];
}

export function transformMetricToUISchema(metrics: { type: string, value: ICreateMetric, id: string }[], currentSchema?: UiSchema) {
  const ids: string[] = [];
  const schema = metrics.reduce((acc: IForm["uiSchema"], { value, id }) => {
    ids.push(id);
    if (!value.ui) return acc;
    acc![id] = Object.entries(value.ui).reduce((nested_acc: IMetric["ui"], [key, value]) => {
      nested_acc![`ui:${key}`] = value;
      return nested_acc;
    }, {});
    return acc;
  }, {}) as IForm["uiSchema"];

  let order = [] as any;
  if (currentSchema) {
    order = currentSchema!["ui:order"] || order;
  }
  schema!["ui:order"] = [...order, ...ids];
  return schema;
}

export function convertToUTC(date: moment.Moment) { // ensure that forwarded dates are in UTC already!
  const cloned = date.clone();
  let offset = moment().utcOffset();
  if (cloned.isDST() && !cloned.isUTC()) {
    offset += 60;
  }
  return cloned.add(offset, 'm').utc();
}

export function convertToLocal(date: moment.Moment) {
  const cloned = date.clone();
  let offset = moment().utcOffset();
  if (cloned.isDST() && cloned.isUTC()) {
    offset += 60;
  }
  return cloned.add(-offset, 'm').local();
}

export const groupBy = (key: string) => (array: any[]) =>
  array.reduce(
    (objectsByKeyValue, obj) => ({
      ...objectsByKeyValue,
      [obj[key]]: (objectsByKeyValue[obj[key]] || []).concat(obj)
    }),
    {}
  );