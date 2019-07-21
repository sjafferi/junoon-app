import * as React from 'react';
import * as moment from 'moment';
import { 
  EditorState
} from 'draft-js';
import { Container, Date } from "./Editor.styles";
import { DragHandler } from "../state";
import MediumEditor from 'editor/index';

interface IEditorState {
  dragging: boolean;
}

interface IEditorProps {
  id: string;
  dragHandlers?: { start: DragHandler, move: DragHandler, end: DragHandler}
  editorState: EditorState;
  onChange: (editorState: EditorState, callback: () => void) => void
}

export default class Editor extends React.Component<IEditorProps, IEditorState> {
  start?: DragHandler;
  move?: DragHandler;
  end?: DragHandler;

  state = { dragging: false };

  onDragStart = (e: MouseEvent, data: { node: HTMLElement}) => {
    this.setState({ dragging: true });
    if (this.props.dragHandlers) {
      this.props.dragHandlers.start(data.node, e.x, e.y);
    }
  }
  
  onDrag = (e: MouseEvent, data: { node: HTMLElement}) => {

  };

  onDragEnd = (e: MouseEvent, data: { node: HTMLElement}) => {
    this.setState({ dragging: false });
    if (this.props.dragHandlers) {
      this.props.dragHandlers.end(data.node, e.x, e.y);
    }
  }

  render() {
    return (
      <Container>
        <MediumEditor
          id={this.props.id}
          handleDragStart={this.onDragStart}
          handleDrag={this.onDrag}
          handleDragEnd={this.onDragEnd}
          editorState={this.props.editorState}
          onChange={this.props.onChange}
          disableToolbar={true}
        />
      </Container>
    );
  }
}