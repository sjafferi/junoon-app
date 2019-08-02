import { action, observable, computed } from 'mobx';
import { assign, debounce, entries, range, isElement, pick } from 'lodash';
import * as moment from 'moment';
import {
  EditorState, genKey, convertToRaw, convertFromRaw
} from 'draft-js';
import { Snippets } from "editor/util/constants"
import { addNewBlockAt, removeBlockAt } from "editor/model"
import { addSnippet, isOverlapping, getBlockKey, containsPoint } from "./util";
import { fetchEntries, updateEntries } from "api"

export type DragHandler = (block: HTMLElement, x: number, y: number) => void;

export interface IEntry {
  id?: string,
  date?: number,
  content: string,
}

export default class JournalState {
  @observable public entries: { [key: string]: EditorState } = {};
  @observable public selectedWeek: moment.Moment = moment();
  public entityMap: { [key: number]: { id: string } } = {};

  public lockedCalls: { [key: string]: boolean } = {};

  saveMany = async (ids: string[]) => {
    const payload = entries(pick(this.entries, ids)).map(([id, editorState]) => ({ id, content: JSON.stringify(convertToRaw(editorState.getCurrentContent())) }));
    const response = await updateEntries(payload);
    return response;
  }

  @computed
  get entriesForWeek() {
    const startOfWeek = this.selectedWeek.clone().startOf('isoWeek').startOf('day');
    const endOfWeek = this.selectedWeek.clone().endOf('isoWeek');
    const ids: string[] = [];
    if (!this.entityMap[startOfWeek.unix()]) {
      const fetchWeek = this.debouncedFetchWeek(startOfWeek.unix());
      if (fetchWeek) fetchWeek(this.selectedWeek);
      return pick(this.entries, ids);
    }
    const { id } = this.entityMap[startOfWeek.unix()];
    ids.push(id);
    while (startOfWeek.add(1, 'days').diff(endOfWeek) <= 0) {
      const { id } = this.entityMap[startOfWeek.unix()];
      ids.push(id);
    }
    return pick(this.entries, ids);
  }

  @action
  fetchWeek = async (day: moment.Moment = moment()) => {
    const startOfWeek = day.clone().startOf('isoWeek').unix();
    const endOfWeek = day.clone().endOf('isoWeek').unix();
    let entries;
    try {
      entries = await fetchEntries(startOfWeek, endOfWeek);
      console.log("Fetching week: ", day.toString());
    } catch (e) {

    }

    if (entries && !entries.error) {
      entries = entries.reduce((acc: { [key: string]: EditorState }, { id, date, content }: IEntry) => {
        let editorState = content ? EditorState.createWithContent(convertFromRaw(JSON.parse(content))) : EditorState.createEmpty();
        if (!content) {
          const snippet = Snippets.DEFAULT;
          const formattedDate = moment(date);
          snippet[0] = { ...snippet[0], placeholder: formattedDate.format("ddd D") };
          editorState = addSnippet(Snippets.DEFAULT, editorState);
        }
        acc[id!] = editorState;
        this.entityMap[moment(date).startOf('day').unix()] = { id: id! };
        return acc;
      }, {});

      this.assign({ entries: { ...this.entries, ...entries } });
    }

    return entries;
  }

  debouncedFetchWeek = (key: string | number, timeout: number = 5000) => {
    if (this.lockedCalls[key]) return;
    this.lockedCalls[key] = true;
    setTimeout(() => this.lockedCalls[key] = false, timeout);
    return debounce(this.fetchWeek, timeout, { leading: true, trailing: false });
  }

  generateEntries = () => {
    const startOfWeek = moment().startOf('isoWeek');
    this.entries = range(6).reduce((acc: { [key: string]: EditorState }) => {
      const date = startOfWeek.add(1, 'days');
      let editorState = EditorState.createEmpty();
      const snippet = Snippets.DEFAULT;
      snippet[0] = { ...snippet[0], placeholder: date.format("ddd D") };
      editorState = addSnippet(Snippets.DEFAULT, editorState);
      acc[genKey()] = editorState;
      return acc;
    }, {});
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
      for (let index in editors) {
        if (isOverlapping(editors[index], block, x, y)) {
          editor = editors[index];
          break;
        }
      }
      if (editor) {
        const blocks = editor.querySelectorAll('.md-block');
        const currBlockKey = getBlockKey(block.parentElement!);
        const targetEditorId = editor.getAttribute("id")!;
        const content = this.entries[currEditorId].getCurrentContent();
        const contentState = this.entries[targetEditorId].getCurrentContent();
        const blockMap = content.getBlockMap();
        const currBlock = blockMap.get(currBlockKey);
        for (let index in blocks) {
          if (isElement(blocks[index]) && isElement(block) && containsPoint(blocks[index], x, y)) {
            const targetBlock = blocks[index];
            const targetBlockAfterKey = getBlockKey(targetBlock);
            const targetBlockKey = contentState.getKeyBefore(targetBlockAfterKey) || contentState.getFirstBlock().getKey();
            if (targetBlockAfterKey !== null && !targetBlockKey) continue;
            this.entries[targetEditorId] = addNewBlockAt(this.entries[targetEditorId], targetBlockKey, currBlock.getType(), currBlock.getData(), currBlock.getText(), currBlock.getDepth());
            this.entries[currEditorId] = removeBlockAt(this.entries[currEditorId], currBlockKey);
            success = true;
            break;
          }
        }
        if (!success) {
          if (targetEditorId !== currEditorId) {
            const targetBlock = contentState.getLastBlock();
            const targetBlockKey = targetBlock.getKey();
            this.entries[targetEditorId] = addNewBlockAt(this.entries[targetEditorId], targetBlockKey, currBlock.getType(), currBlock.getData(), currBlock.getText(), currBlock.getDepth());
            this.entries[currEditorId] = removeBlockAt(this.entries[currEditorId], currBlockKey);
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
}