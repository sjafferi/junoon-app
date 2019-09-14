import { action, observable, computed, toJS } from 'mobx';
import { assign, isEqual, entries, range, isEmpty, pick, pickBy, uniqBy } from 'lodash';
import * as moment from 'moment';
import {
  EditorState, genKey, convertToRaw, convertFromRaw, RawDraftContentBlock, ContentBlock
} from 'draft-js';
import { FormProps, UiSchema } from "react-jsonschema-form";
import { Snippets } from "editor/util/constants"
import { RootStore } from './index';
import { addSnippet } from "../views/Journal/util";
import { getFirstBlock, updateDataOfBlock } from "editor/model";
import { IErrorResponse, fetchEntries, updateEntries, updateQuery, fetchAnalysis, fetchForms, fetchMetrics, createMetrics, saveForm } from "api"

export type IQuery = {
  id: string;
  order: number;
  metricId: string;
  label: string;
  value: string;
  function: string;
  functions: string[];
};

export type IAnalysis = IQuery[];

export interface IEntry {
  id?: string,
  date?: number,
  content: string,
}
export interface ICreateMetric {
  id?: string;
  userId?: string;
  title?: string;
  type: string;
  ui?: object;
  enum?: number[];
  showInForm?: boolean;
  additionalSchemaOptions?: object;
};
export type ICreateMetricPayload = ICreateMetric & { ui?: string, additionalSchemaOptions?: string };
export interface IMetric {
  id?: string,
  data: FormProps<any>["schema"],
  ui?: Record<string, any>;
  order?: number;
  showInForm?: boolean;
}
export interface ITask {
  title: string;
  reason?: string;
  done: boolean;
  order: number;
}
export interface IForm {
  id?: string;
  date?: number;
  tasks: ITask[];
  metrics?: Record<string, IMetric["data"]>;
  metricsSchema?: Record<string, IMetric["data"]>;
  uiSchema?: UiSchema;
  submitted?: boolean;
}

export enum JournalActions {
  "CREATE_ENTRY" = "CREATE_ENTRY"
}

export class Journal {
  @observable public entries: { [key: string]: EditorState } = {};
  @observable public analyses: Record<string, IAnalysis> = {};
  @observable public forms: { [key: string]: IForm } = {};
  @observable public metrics: IMetric[] = [];
  @observable public initialized = false;
  public observers: any[] = [];
  public entityMap: { [key: number]: { id: string } } = {};

  constructor(protected rootStore: RootStore) {
    this.initialize();
  }

  initialize = async () => {
    this.cleanEntries();
    if (this.rootStore.user.isLoggedIn) {
      if (!this.metrics.length) await this.fetchMetrics();
    } else {
      this.generateEntries();
    }
    console.log("we init");
    this.assign({ initialized: true });
  }

  saveMany = async (ids: string[]) => {
    const payload = entries(pick(this.entries, ids)).map(([id, editorState]) => ({ id, content: JSON.stringify(convertToRaw(editorState.getCurrentContent())) }));
    const response = await updateEntries(payload);
    return response;
  }

  @action
  createMetrics = async (metrics: ICreateMetricPayload[]) => {
    let response, error;

    try {
      response = await createMetrics(metrics);
    } catch (e) {
      error = e;
    }

    if (response && !(response as IErrorResponse).error && !error) {
      response = <IMetric[]>response;
      this.assign({ metrics: [...this.metrics, ...response] });
    }

    return { response, error };
  }

  @action
  saveForm = async (id?: string) => {
    if (!id || !this.forms[id]) {
      throw new Error(`No form with id ${id}`);
    }
    const params = ["title", "reason", "done"];
    const metrics = this.forms[id].metrics;
    const unfinishedTasks = ((this.forms[id].tasks || []).map(task => toJS(task)));
    const finishedTasks = this.generateFormTasksFromBlocks(convertToRaw(this.entries[id]!.getCurrentContent()).blocks, true)
      .filter(({ title }) => unfinishedTasks.some((task) => isEqual(task.title, title)));
    const tasks = [...unfinishedTasks, ...finishedTasks].sort((a, b) => a.order - b.order).map(
      task => ({ ...pickBy(task, (_, key) => params.includes(key)), done: !!task.done })) as ITask[];
    const payload = { metrics, tasks, date: this.forms[id].date }
    const response = await saveForm(payload as IForm);
    if (response && !(response as IErrorResponse).error) {
      this.assign({ forms: { ...this.forms, [id]: { ...response, submitted: true } } });
    }
    return response;
  }

  @action
  updateQuery = async (payload: Partial<IQuery>) => {
    let response
    try {
      response = await updateQuery(payload);
    } catch (e) {

    }
    return response;
  }

  @action
  fetchAnalysis = async (day: moment.Moment) => {
    const start = day.clone().startOf('isoWeek').utc().startOf('day').unix();
    const end = day.clone().endOf('isoWeek').utc().unix();

    let analyses;
    try {
      analyses = await fetchAnalysis(start, end);
    } catch (e) {

    }

    if (analyses && !analyses.error) {
      const updated = uniqBy([...analyses, ...(this.analyses[start] || [])].sort((a, b) => a.order - b.order), 'metricId');
      this.assign({ analyses: { ...this.analyses, [start]: updated } });
    }
  }

  @action
  fetchMetrics = async () => {
    let metrics;
    try {
      metrics = await fetchMetrics();
    } catch (e) {

    }

    if (metrics && !metrics.error) {
      this.assign({ metrics });
    }
  }

  @action
  fetchWeek = async (day: moment.Moment = moment()) => {
    const startOfWeek = day.clone().utc().startOf('isoWeek').unix();
    const endOfWeek = day.clone().utc().endOf('isoWeek').unix();

    let entries, forms;
    try {
      entries = await fetchEntries(startOfWeek, endOfWeek);
      forms = await fetchForms(startOfWeek, endOfWeek);
    } catch (e) {

    }

    if (entries && !entries.error) {
      const dates: moment.Moment[] = [];
      entries = entries.reduce((acc: { [key: string]: EditorState }, { id, date, content }: IEntry) => {
        let editorState = content ? EditorState.createWithContent(convertFromRaw(JSON.parse(content))) : EditorState.createEmpty();
        const formattedDate = moment.utc(date);
        const firstBlock = getFirstBlock(editorState) as ContentBlock;
        if (!content || firstBlock && isEmpty(firstBlock.getText())) {
          const snippet = Snippets.DEFAULT;
          const placeholder = formattedDate.format("ddd D");
          snippet[0] = { ...snippet[0], placeholder };
          if (!content) {
            editorState = addSnippet(snippet, editorState);
          } else {
            editorState = updateDataOfBlock(editorState, firstBlock, { placeholder });
          }
        }
        dates.push(formattedDate);
        acc[id!] = editorState;
        this.entityMap[this.getKeyForEntityMap(formattedDate)] = { id: id! };
        return acc;
      }, {});

      this.assign({ entries: { ...this.entries, ...entries } });

      dates.forEach(date => this.notifyObservers(JournalActions.CREATE_ENTRY, date));
    }

    if (forms && !forms.error) {
      forms = forms.reduce((acc: Record<string, IForm>, form: IForm) => {
        const id = this.getKeyForDay(moment(form.date));
        form.id = id;
        form.submitted = true;
        form.date = moment.utc(form.date).unix();
        acc[id] = form;
        return acc;
      }, {});

      this.assign({ forms: { ...this.forms, ...forms } });
    }

    return entries;
  }

  @action
  generateEntries = (day: moment.Moment = moment()) => {
    let date = day.clone().utc().startOf('isoWeek');
    const entries = range(7).reduce((acc: { [key: string]: EditorState }) => {
      let editorState = EditorState.createEmpty();
      const id = genKey();
      const entityMapId = this.getKeyForEntityMap(date);
      const snippet = Snippets.DEFAULT;
      snippet[0] = { ...snippet[0], placeholder: date.format("ddd D") };
      editorState = addSnippet(snippet, editorState);
      acc[id] = editorState;
      this.entityMap[entityMapId] = { id: id! };
      date = date.add(1, 'days');
      return acc;
    }, {});

    this.assign({ entries: { ...this.entries, ...entries } });
  }

  getKeyForDay = (day: moment.Moment) => {
    return (this.entityMap[this.getKeyForEntityMap(day)] || { id: "" }).id;
  }

  getKeyForEntityMap = (day: moment.Moment) => {
    return day.utc().startOf('day').unix();
  }

  getFormForDay = (day: moment.Moment) => {
    const id = this.getKeyForDay(day);
    return this.forms[id];
  }

  getEntryForDay = (day: moment.Moment) => {
    const id = this.getKeyForDay(day);
    return this.entries[id];
  }

  generateFormTasksFromBlocks = (blocks: RawDraftContentBlock[], finishedTasks?: boolean): ITask[] => {
    return blocks.map((block, index) => ({ ...block, index }))
      .filter(({ data, type, text }) => type === "todo" && text && (finishedTasks ? (data as any).checked : !(data as any).checked))
      .map(block => ({
        title: block.text,
        done: (block.data as any).checked,
        order: block.index
      }))
  }

  @action
  assign(fields: { [id: string]: any }) {
    assign(this, fields);
    (window as any).lol = toJS(this);
  }

  @action
  cleanEntries = () => {
    this.entries = {};
    this.entityMap = {};
    this.initialized = false;
  }

  get isLoggedIn() {
    return this.rootStore.user.isLoggedIn;
  }

  notifyObservers = (action: string, payload: any) => {
    this.observers.forEach(observer => observer.onNotify(action, payload));
  }
}