import * as React from 'react';
import * as moment from 'moment';
import styled from 'styled-components';
import ReactForm, { FormProps, IChangeEvent, UiSchema } from "react-jsonschema-form";
import { debounce, merge, isEqual } from 'lodash';
import { toJS } from 'mobx';
import { History } from "history";
import { inject, observer } from "mobx-react";
import { IErrorResponse } from 'api';
import { Journal, IForm, IMetric, ICreateMetric, RouterStore } from 'stores';
import { Modal, EditableInput } from 'ui';
import { FormStyles } from "./FormStyles";
import { transformMetricToSchema, transformMetricToUISchema } from "../util";

import State from "../state";

interface IFormProps {
  date: string;
  state: State;
  history?: History;
  router?: RouterStore;
  journal?: Journal;
}

interface IFormState {
  addingMetrics: boolean;
  addedMetrics: { type: string, value: ICreateMetric, id: string }[];
}

const Container = styled(Modal)`
  min-width: 500px;
  height: 80%;
  padding: 30px;
  form {
    ${FormStyles}

    legend {
      text-align: center;
    }

    font-size: 12px;
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
      font-size: 24px;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 6px;
    }

    legend {
      font-size: 18px;
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
    #root_metrics .field-boolean {
      margin: 0;
      > label {
        display: none;
      }
    }
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
    margin-bottom: 0;
  }

  .hidden-title label.control-label {
    display: none;
  }

  .tasks-title {
    line-height: 3;
  }

  .add-button {
    width: 50%;
    margin-left: 25%;
    margin-top: 10px;
    margin-bottom: 10px;
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

const FIELDS: Record<string, ICreateMetric> = {
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


const FieldTemplate = (addButton: any, onSaveTitle: (id: string, title: string) => void) => function CustomFieldTemplate(props: any) {
  const { id, classNames, label, children } = props;
  const key = id.split("root_metrics_")[1];
  const isNew = Object.keys(FIELDS).some(key => id.includes(key));
  const isBool = (id as string).includes("yes / no");
  const isNewBool = (id as string).includes("yes / no") && isNew;
  const renderInput = () => <EditableInput onSave={(title: string) => onSaveTitle(key, title)} value={label === key ? "" : label} key={id} />;
  return (
    <div className={classNames}>
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
      {id === "root_metrics" && addButton()}
    </div>
  );
}


function ArrayFieldTemplate(props: any) {
  return (
    <div>
      <legend id="root_metrics__title">{props.title}</legend>
      <p id="root_metrics__description" className="field-description">Why weren't these tasks finished?</p>
      {props.items.map((element: any) => (
        <div key={element.key}>{props.formData[element.index].title} {element.children} </div>
      ))}
    </div>
  );
}

@inject("history")
@inject("journal")
@observer
export default class Form extends React.Component<IFormProps, IFormState> {
  state = {
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

  close = () => {
    this.props.history!.push(`/weekly/${this.props.date}`);
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

  get date() {
    return moment(this.props.date, "MMMD").startOf('day');
  }

  submit = async () => {
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
      const { response, error: err } = await this.journalStore.createMetrics(payload as any);
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
      await this.journalState.updateFormState(moment((response as any).date));
    }
    this.close();
  }

  change = (event: IChangeEvent<IForm>) => {
    const { edit, formData } = event;
    if (edit) {
      this.journalStore.assign({ forms: { ...this.journalStore.forms, [formData.id!]: formData } });
    }
  }

  clickAddMetrics = () => {
    if (this.metricsContainerRef && this.metricsContainerRef.current) {
      this.metricsContainerRef.current.classList.add("adding-metrics");
    }
    if (this.selectRef && this.selectRef.current) {
      this.selectRef.current.focus();
    }
  }

  closeAddMetrics = () => {
    if (this.metricsContainerRef && this.metricsContainerRef.current) {
      this.metricsContainerRef.current.classList.remove("adding-metrics");
    }
  };

  onBlur = (event: React.FocusEvent<HTMLSelectElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as any)) {
      this.closeAddMetrics();
    }
  }

  onAddField = (event: any) => {
    if (!event.target) return;
    const { label: value } = event.target;
    this.closeAddMetrics();
    if (value) {
      const schema = Object.assign({}, FIELDS[value], { label: null });
      this.setState({
        addedMetrics:
          this.state.addedMetrics.concat([{ type: value, value: schema, id: this.state.addedMetrics.length + value }] as any)
      })
    }
  };

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

  renderAddButton = () => {
    return (
      <AddMetricsContainer ref={this.metricsContainerRef}>
        <button type="button" className="add-button" onClick={this.clickAddMetrics}>Add metrics</button>
        <select className="add-button" ref={this.selectRef} onClick={this.onAddField} onBlur={this.onBlur} onFocus={(e: any) => { e.target.size = '6' }}>
          {Object.keys(FIELDS).map((key, index) => <option value={key} key={index}>{key}</option>)}
        </select>
      </AddMetricsContainer>
    )
  }

  fieldTemplate = FieldTemplate(this.renderAddButton.bind(this), this.onSaveTitle);
  render() {
    this.updateUiSchema();
    this.updateMetricsSchema();

    return (
      <Container isOpen close={this.close}>
        <ReactForm
          schema={this.metricsSchema!}
          uiSchema={this.uiSchema}
          formData={this.formData}
          FieldTemplate={this.fieldTemplate}
          ArrayFieldTemplate={ArrayFieldTemplate}
          onSubmit={this.submit}
          onChange={this.change}
        />
      </Container>
    );
  }
}