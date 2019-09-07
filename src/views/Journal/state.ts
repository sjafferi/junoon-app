import { action, observable, computed, toJS } from 'mobx';
import { assign, debounce, entries, range, merge, isElement, pick, pickBy } from 'lodash';
import * as moment from 'moment';
import {
  EditorState, genKey, convertToRaw, convertFromRaw, RawDraftContentBlock
} from 'draft-js';
import { Journal, IMetric, IForm } from "stores";
import { addNewBlockAt, removeBlockAt } from "editor/model"
import { isOverlapping, getBlockKey, containsPoint, genMetricId } from "./util";

export default class JournalState {
  @observable public selectedWeek: moment.Moment = moment();
  public lockedCalls: { [key: string]: boolean } = {};

  constructor(public journalStore: Journal) {
    journalStore.observers.push(this);
  }

  @action
  updateFormState = (day: moment.Moment, updateTasks = true, updateMetrics = true) => {
    const form = this.journalStore.getFormForDay(day) || { tasks: [] };
    const key = this.journalStore.getKeyForDay(day);
    const editorState = this.journalStore.getEntryForDay(day);
    if (updateTasks && editorState) {
      const blocks = convertToRaw(editorState!.getCurrentContent()).blocks;
      const tasks = this.journalStore.generateFormTasksFromBlocks(blocks);
      if (tasks && tasks.length) {
        form.tasks = tasks.map(task => {
          const existingTask = form.tasks.find(({ title }) => task.title === title);
          const reason = existingTask && existingTask.reason;
          return { ...task, reason: reason || "" };
        });
      } else {
        form.tasks = [];
      }
    }
    if (updateMetrics && ((!form.metrics || !form.metrics!.length) && this.journalStore.metrics.length)) {
      form.metricsSchema = this.journalStore.metrics.reduce((acc: Record<string, IMetric["data"]>, metric) => {
        if (!metric.showInForm) return acc;
        const id = metric.id!;
        acc[id] = toJS(metric.data);
        return acc;
      }, {}) as IForm["metricsSchema"];
      form.uiSchema = this.journalStore.metrics.reduce((acc: IForm["uiSchema"], metric) => {
        if (!metric.showInForm) return acc;
        const id = metric.id!;
        if (!metric.ui) return acc;
        acc![id] = Object.entries(metric.ui).reduce((nested_acc: IMetric["ui"], [key, value]) => {
          nested_acc![`ui:${key}`] = toJS(value);
          return nested_acc;
        }, {});
        return acc;
      }, {}) as IForm["uiSchema"];
      form.uiSchema!["ui:order"] = this.journalStore.metrics.map(({ id }) => id!);
    }
    form.id = key;
    form.date = day.unix();

    this.journalStore.forms[key] = form;
  }

  @action
  updateEntriesForWeek = (date: moment.Moment = this.startOfSelectedWeek) => {
    const key = date.unix();
    if (!this.journalStore.entityMap[key]) {
      if (this.journalStore.isLoggedIn) {
        const fetchWeek = this.debouncedFetchWeek(key);
        if (fetchWeek) fetchWeek(date);
      } else {
        this.journalStore.generateEntries(date);
      }
    }
  }

  @computed
  get entriesForWeek() {
    const date = this.startOfSelectedWeek.clone();
    const key = this.journalStore.getKeyForEntityMap(this.startOfSelectedWeek);
    const ids: string[] = [];
    if (!this.journalStore.entityMap[key]) {
      this.updateEntriesForWeek();
      return pick(this.journalStore.entries, ids);
    }
    let { id } = this.journalStore.entityMap[key];
    while (date.add(1, 'days').diff(this.endOfSelectedWeek) < 0) {
      ids.push(id);
      id = this.journalStore.entityMap[this.journalStore.getKeyForEntityMap(date)].id;
    }
    ids.push(id);
    return pick(this.journalStore.entries, ids);
  }

  debouncedFetchWeek = (key: string | number, timeout: number = 5000) => {
    if (this.lockedCalls[key]) return;
    this.lockedCalls[key] = true;
    setTimeout(() => this.lockedCalls[key] = false, timeout);
    return debounce(this.journalStore.fetchWeek, timeout, { leading: true, trailing: false });
  }

  @action
  dragHandlers = (currEditorId: string) => {
    const start = (block: HTMLElement, x: number, y: number) => {
      // set global dragging class 
      document.body.classList.add('dragging');
      block.parentElement!.classList.add('dragging');
    }
    const move = (block: HTMLElement, x: number, y: number) => {

    }
    const end = (block: HTMLElement, x: number, y: number) => {
      document.body.classList.remove('dragging');
      block.parentElement!.classList.remove('dragging');
      const editors = document.querySelectorAll('.md-RichEditor-root');
      let editor, success;
      for (const index in editors) {
        if (isElement(editors[index]) && isOverlapping(editors[index], block, x, y)) {
          editor = editors[index];
          break;
        }
      }
      if (editor) {
        const blocks = editor.querySelectorAll('.md-block');
        const currBlockKey = getBlockKey(block.parentElement!);
        const targetEditorId = editor.getAttribute("id")!;
        const content = this.journalStore.entries[currEditorId].getCurrentContent();
        const contentState = this.journalStore.entries[targetEditorId].getCurrentContent();
        const blockMap = content.getBlockMap();
        const currBlock = blockMap.get(currBlockKey);
        for (let index in blocks) {
          if (isElement(blocks[index]) && isElement(block) && containsPoint(blocks[index], x, y)) {
            const targetBlock = blocks[index];
            const targetBlockAfterKey = getBlockKey(targetBlock);
            const targetBlockKey = contentState.getKeyBefore(targetBlockAfterKey) || contentState.getFirstBlock().getKey();
            if (targetBlockAfterKey !== null && !targetBlockKey) continue;
            this.journalStore.entries[targetEditorId] = addNewBlockAt(this.journalStore.entries[targetEditorId], targetBlockKey, currBlock.getType(), currBlock.getData(), currBlock.getText(), currBlock.getDepth());
            this.journalStore.entries[currEditorId] = removeBlockAt(this.journalStore.entries[currEditorId], currBlockKey);
            success = true;
            break;
          }
        }
        if (!success) {
          if (targetEditorId !== currEditorId) {
            const targetBlock = contentState.getLastBlock();
            const targetBlockKey = targetBlock.getKey();
            this.journalStore.entries[targetEditorId] = addNewBlockAt(this.journalStore.entries[targetEditorId], targetBlockKey, currBlock.getType(), currBlock.getData(), currBlock.getText(), currBlock.getDepth());
            this.journalStore.entries[currEditorId] = removeBlockAt(this.journalStore.entries[currEditorId], currBlockKey);
          }
        }
      }
      if (!success) {
        block.setAttribute("style", "transform: translate(0, 0);");
      }
    }
    return { start, move, end };
  }

  @action
  assign(fields: { [id: string]: any }) {
    assign(this, fields);
  }

  shouldShowFormLink = (day: moment.Moment) => {
    const form = this.journalStore.getFormForDay(day);
    const isEmpty = !(form && ((form.tasks && form.tasks.length) || (form.metrics && Object.keys(form.metrics || {}).length)))
    return this.journalStore.isLoggedIn && !isEmpty && moment().isAfter(day)
  }

  public onNotify = (type: string, payload: any) => {
    switch (type) {
      case "CREATE_ENTRY": {
        this.updateFormState(payload, true, true);
        return;
      }
    }
  }

  get startOfSelectedWeek() {
    return this.selectedWeek.clone().utc().startOf('isoWeek').startOf('day');
  }

  get endOfSelectedWeek() {
    return this.selectedWeek.clone().utc().endOf('isoWeek');
  }
}