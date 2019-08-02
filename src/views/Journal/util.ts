import { EditorState } from 'draft-js';
import { getCurrentBlock, addNewBlock, addNewBlockAt } from "editor/model";

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