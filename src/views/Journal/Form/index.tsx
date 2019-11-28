import * as React from 'react';
import * as moment from 'moment';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import ReactForm, { FormProps, IChangeEvent, UiSchema } from "react-jsonschema-form";
import { merge, isEqual } from 'lodash';
import { toJS } from 'mobx';
import { History } from "history";
import { inject, observer } from "mobx-react";
import { IErrorResponse } from 'api';
import { Journal, User, IForm, IMetric, ICreateMetric, RouterStore } from 'stores';
import { Colors, Header2, Modal, EditableInput, SmallScrollbar } from 'ui';
import { FormStyles } from "./FormStyles";
import { addQueryParam, transformMetricToSchema, transformMetricToUISchema } from "../util";
import { BASE_ROUTE } from "../index";
import State from "../state";

interface IFormProps {
  date: string;
  state: State;
  history?: History;
  router?: RouterStore;
  journal?: Journal;
  user?: User;
  navigateToCreateMetrics: () => void;
}

interface IFormState {
  selectedSegment: string;
  addingMetrics: boolean;
  addedMetrics: { type: string, value: ICreateMetric, id: string }[];
}

const Container = styled(Modal)`
  min-width: 600px;
  height: 80%;
  overflow: hidden;
  form {
    ${FormStyles}
    ${SmallScrollbar}

    width: 100%;
    max-height: calc(100% - 20px);
    overflow: scroll;
    padding: 15px 20px;

    legend {
      text-align: center;
    }

    font-size: 14px;
    line-height: 21px;

    .form-control {
      font-size: 12px;
      border-radius: 0;
    }

    > div:last-child {
      display: flex;
      justify-content: center;
      button {
        width: 50%;
      }
    }

    #root__title {
      display: none;
      // font-size: 24px;
      // border-bottom: 1px solid #e5e5e5;
      // padding-bottom: 6px;
    }

    legend {
      font-size: 20px;
      text-align: center;
      border: none;
    }
    
    label {
      font-weight: normal;
    }

    label[for="root_metrics"], label[for="root"] {
      display: none;
    }

    #root_metrics__title {
      margin-bottom: 0;
    }
    #root_metrics__description {
      margin-top: 5px;
      text-align: center;
    }
    #root_metrics .form-group.field-boolean {
      margin: 0;
      margin-bottom: 7px !important;
      > label {
        display: none;
      }
    }
    #root_metrics {
      .form-group {
        margin-bottom: 21px !important;
      }
    }
  }

  .form .checkbox {
    margin-top: 12px;
    margin-bottom: 25px;
  }

  input.form-control {
    border: none;
    box-shadow: none;
    border-bottom: 1px solid ${Colors.mutedTextGrey};
  }

  .form-group {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .tasks label {
    display: none;
  }

  .tasks .form-group {
    // margin-bottom: 0;
  }

  .hidden-title label.control-label {
    display: none;
  }

  .tasks-title {
    line-height: 3;
  }

  .add-button {
    width: 50%;
    margin: 0;
    padding: 2px;
    text-align: center;
    text-decoration: none !important;
    color: ${Colors.blackish};
    border: 1px solid ${Colors.darkLightGrey};
  }

  select.add-button {
    border: none;
    outline: none;
    &::-webkit-scrollbar {
      width: 0px;
      background-color: transparent;
    }

    option {
      margin: auto;
      text-align: center;
      text-transform: capitalize;
      font-size: 12px;
      width: 110px;
    }
  }
  
  .tasks .field-boolean {
    display: none;
  }

  #root_tasks, #root_metrics {
    display: none;
    padding-bottom: 12px;
  }
`;

const AddMetricsContainer = styled.div`
  width: 100%;
  display: flex;

  select {
    display: none;
  }

  &.adding-metrics {
    button {
      display: none;
    }
    select {
      display: block;
    }
  }
`;

const Title = styled(Header2)`
  margin: 0;
  text-align: center;
  padding: 12px 0;
  border-bottom: 1px solid ${Colors.lighterGrey};
`;

const Content = styled.div`
  display: flex;
  height: 100%;
  padding: 30px;
  padding-top: 0;
  padding-right: 0;
  &.selected-metrics #root_metrics {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  &.selected-tasks #root_tasks {
    display: block;
  }
  > form > div:last-child {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    padding: 12px;
    background: white;
    border-top: 1px solid ${Colors.lighterGrey};
  }
`;

const FormNavigation = styled.ul`
  width: 100px;
  margin: 0;
  padding: 0;
  padding-top: 10px;
  border-right: 1px solid ${Colors.lighterGrey};
  
  li {
    padding: 12px 7px;
    list-style-type: none;
    text-transform: capitalize;
    color: ${Colors.mutedTextGrey};
    transition: color 0.3s ease-out;
    cursor: pointer;
  }

  li.selected {
    color: ${Colors.blackish};
  }
`;

const schema: FormProps<any>["schema"] = {
  title: "Daily Review",
  type: "object",
  properties: {
    tasks: {
      type: "array",
      title: "Tasks",
      description: "Were these tasks finished?",
      items: {
        type: "object",
        properties: {
          reason: {
            type: "string"
          },
          done: {
            type: "boolean",
            title: "Done?",
            default: false
          }
        }
      }
    },
    metrics: {
      title: "Metrics",
      type: "object",
      description: "Keep track of your daily deliverables"
    }
  }
};

export const METRIC_FIELDS: Record<string, ICreateMetric> = {
  "yes / no": {
    type: "boolean"
  },
  "numeric": {
    type: "number",
    ui: {
      widget: "updown"
    }
  },
  "scale (1 - 5)": {
    type: "number",
    enum: [1, 2, 3, 4, 5],
    ui: {
      widget: "radio",
      options: { inline: true }
    }
  },
  "text": {
    type: "string",
    ui: {
      widget: "textarea"
    }
  }
};


const FieldTemplate = (date: string, onSaveTitle: (id: string, title: string) => void) => function CustomFieldTemplate(props: any) {
  const { id, classNames, label, children } = props;
  const key = id.split("root_metrics_")[1];
  const isNew = Object.keys(METRIC_FIELDS).some(key => id.includes(key));
  const isBool = (id as string).includes("yes / no");
  const isNewBool = (id as string).includes("yes / no") && isNew;
  const isMetricsEmpty = id === "root_metrics" && Object.keys(props.children[0].props.formData).length === 0;
  const renderInput = () => <EditableInput onSave={(title: string) => onSaveTitle(key, title)} value={label === key ? "" : label} key={id} />;
  return (
    <div className={classNames} id={id}>
      {!isNew && label && <label htmlFor={id}>{label}</label>}
      {isNew && !isBool && renderInput()}
      {!isNewBool && children}
      {isNewBool && (
        <div className="checkbox">
          <label>
            <input type="checkbox" id={id} />
            {renderInput()}
          </label>
        </div>
      )}
      {isMetricsEmpty && <Link className="add-button" to={`/${BASE_ROUTE}/${date}${addQueryParam('viewMetrics', true)}`}>Add metrics</Link>}
    </div>
  );
}

function ArrayFieldTemplate(props: any) {
  return (
    <div id={props.id}>
      <legend id="root_metrics__title">{props.title}</legend>
      <p id="root_metrics__description" className="field-description">Why weren't these tasks finished?</p>
      {props.items.map((element: any) => (
        <div key={element.key}>{props.formData[element.index].title} {element.children} </div>
      ))}
    </div>
  );
}

const FORM_SEGMENTS = ["metrics", "tasks"]

@inject("history")
@inject("journal")
@inject("user")
@observer
export default class Form extends React.Component<IFormProps, IFormState> {
  state = {
    selectedSegment: "metrics",
    addingMetrics: false,
    addedMetrics: [] as { type: string, value: ICreateMetric, id: string }[]
  };

  metricsContainerRef: React.RefObject<HTMLDivElement> = React.createRef();
  selectRef: React.RefObject<HTMLSelectElement> = React.createRef();
  uiSchema?: UiSchema;
  metricsSchema?: FormProps<any>["schema"];

  componentWillMount() {
    this.journalState.updateFormState(this.date);
  }

  get date() {
    return moment(this.props.date, "MMMD").startOf('day');
  }

  get journalState() {
    return this.props.state;
  }

  get journalStore() {
    return this.props.journal!;
  }

  get formData() {
    const form = this.journalStore.getFormForDay(this.date);
    if (!form) this.journalState.updateFormState(this.date, false);
    return form;
  }

  selectSegment = (segment: string) => this.setState({ selectedSegment: segment });

  updateUiSchema = () => {
    const form = this.formData;
    const formSchema = form ? form.uiSchema : {};
    const uiSchema = {
      tasks: {
        classNames: 'hidden-title, tasks',
        "ui:placeholder": "Reason",
        "ui:options": { addable: true }
      },
      metrics: {
        ...transformMetricToUISchema(this.state.addedMetrics, formSchema)
      }
    };
    const schema = merge(uiSchema, { metrics: toJS(formSchema) });
    if (!isEqual(this.uiSchema, schema)) {
      this.uiSchema = schema;
    }
  }

  updateMetricsSchema = () => {
    const form = this.formData;
    const formSchema = form ? form.metricsSchema : {};
    const addedSchema = transformMetricToSchema(this.state.addedMetrics);
    const updatedSchema = merge({ properties: { metrics: { properties: { ...formSchema, ...addedSchema } } } }, schema);
    if (!isEqual(this.metricsSchema, updatedSchema)) {
      this.metricsSchema = updatedSchema;
    }
  }

  onSaveTitle = (id: string, title: string) => {
    const addedMetrics = this.state.addedMetrics.slice(0);
    const idx = addedMetrics.findIndex(({ id: id2 }) => id2 === id);
    if (idx >= 0) {
      addedMetrics[idx].value.title = title;
      this.setState({
        addedMetrics
      });
    }
  }

  close = () => {
    this.props.history!.push(`/${BASE_ROUTE}/${this.props.date}${location.search}`);
  }

  change = (event: IChangeEvent<IForm>) => {
    const { edit, formData } = event;
    if (edit) {
      this.journalStore.assign({ forms: { ...this.journalStore.forms, [formData.id!]: formData } });
    }
  }

  submit = async () => {
    if (this.props.user!.isViewingPublicAcct) {
      this.close();
      return;
    }
    let response, error;
    const { addedMetrics } = this.state;
    if (addedMetrics.length) {
      const payload = this.state.addedMetrics
        .filter(({ value }) => value.title)
        .map(({ value: { type, title, ui, ...rest } }) => ({
          type,
          title,
          ui: ui && JSON.stringify(ui),
          additionalSchemaOptions: rest && JSON.stringify(rest)
        }));
      const { response, error: err } = await this.journalStore.upsertMetrics(payload as any);
      error = err;
      if (!error) {
        addedMetrics.forEach(({ id, value }) => {
          const temp = this.formData.metrics![id];
          const metric = (response as IMetric[]).find(({ data }) => data.title === value.title);
          if (metric && metric.id) {
            this.formData.metrics![metric.id] = temp;
            delete this.formData.metrics![id];
          }
        });
      }
    }
    if (!error) {
      response = await this.journalStore.saveForm((this.formData || {}).id);
    }
    if (response && !(response as IErrorResponse).error) {
      await this.journalState.updateFormState(moment.utc((response as any).date));
    }
    this.close();
  }

  fieldTemplate = FieldTemplate(this.props.date, this.onSaveTitle);
  render() {
    this.updateUiSchema();
    this.updateMetricsSchema();

    return (
      <Container isOpen close={this.close}>
        <Title>Daily Review</Title>
        <Content className={`selected-${this.state.selectedSegment}`}>
          <FormNavigation>
            {FORM_SEGMENTS.map(segment =>
              <li
                onClick={() => this.selectSegment(segment)}
                className={`${segment === this.state.selectedSegment ? "selected" : ""}`}
              >
                {segment}
              </li>)}
          </FormNavigation>
          <ReactForm
            schema={this.metricsSchema!}
            uiSchema={this.uiSchema}
            formData={this.formData}
            FieldTemplate={this.fieldTemplate}
            ArrayFieldTemplate={ArrayFieldTemplate}
            onSubmit={this.submit}
            onChange={this.change}
          />
        </Content>
      </Container>
    );
  }
}