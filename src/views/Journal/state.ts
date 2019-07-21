import { action, observable } from 'mobx';
import { assign, range, isElement } from 'lodash';
import * as moment from 'moment';
import {
  EditorState, genKey
} from 'draft-js';
import { Block } from "editor/util/constants"
import { addNewBlockAt, resetBlockAt } from "editor/model"

export type DragHandler = (block: HTMLElement, x: number, y: number) => void;

function getBlockKey(block: Element) {
  return (block.getAttribute('data-offset-key') || '').split('-')[0];
}

function getElementBounds(el: Element) {
  var rect = el.getBoundingClientRect(),
  scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
  scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  return { top: rect.top + scrollTop, left: rect.left + scrollLeft, width: rect.width, height: rect.height }
}

function isOverlapping(d2: Element, d3: HTMLElement, x: number, y: number) {
  const d0 = getElementBounds(d2), d1 = getElementBounds(d3),
    x11 = d0.left,
    y11 = d0.top,
    x12 = d0.left + d0.width,
    y12 = d0.top + d0.height,
    x21 = x,
    y21 = y,
    x22 = x + d1.width,
    y22 = y + d1.height,

    x_overlap = Math.max(0, Math.min(x12,x22) - Math.max(x11,x21)),
    y_overlap = Math.max(0, Math.min(y12,y22) - Math.max(y11,y21));

  return x_overlap * y_overlap >= d1.width / 2;
}

export default class JournalState {
  @observable public entries: { [key: string]: EditorState } = {};

  constructor() {
    const startOfWeek = moment().startOf('week');
    this.entries = range(6).reduce((acc: { [key: string]: EditorState }) => {
      const editorState = EditorState.createEmpty();
      acc[genKey()] = editorState;
      // startOfWeek.add(1, 'days')
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
        for (let index in blocks) {
          if (isElement(blocks[index]) && isElement(block) && isOverlapping(blocks[index], block, x, y)) {
            const newBlockAt = blocks[index];
            const currBlockKey = getBlockKey(block.parentElement!);
            const targetBlockKey = getBlockKey(newBlockAt);
            const targetEditorId = editor.getAttribute("id")!;
            const content = this.entries[currEditorId].getCurrentContent();
            const blockMap = content.getBlockMap();
            const currBlock = blockMap.get(currBlockKey);
            this.entries[targetEditorId] = addNewBlockAt(this.entries[targetEditorId], targetBlockKey, currBlock.getType(), currBlock.getData(), currBlock.getText(), currBlock.getDepth());
            this.entries[currEditorId] = resetBlockAt(this.entries[currEditorId], currBlockKey);
            success = true;
            break;
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