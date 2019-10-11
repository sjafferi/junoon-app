import * as React from 'react';
import * as moment from 'moment';
import styled from 'styled-components';
import Select from 'react-select'
import { observer } from "mobx-react";
import { keys, sortBy } from "lodash";
import { Colors, Primary, Modal, EditableInput, Text, Header3, Spacer } from "ui";
import { IMetric, Journal } from "stores";
import { METRIC_FIELDS } from "../Form";
import { History } from "history";

interface ICRUDTableProps {
  journal: Journal;
  history: History;
  isOpen?: boolean;
  start: moment.Moment;
}

interface ICRUDTableState {
  messageText?: string;
  showMessage?: boolean;
  addedMetrics: IMetric[];
  deletedMetrics: string[];
  changedMetrics: Record<string, IMetric>;
  invalidMetrics: Record<string, { type: boolean, title: boolean }>;
}

const Container = styled(Modal)`
  min-width: 65%;
  min-height: 60vh;
  max-height: 95%;
  transform: translate(-58%,-50%);
  padding: 2rem;
  padding-bottom: 75px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  overflow: hidden;
  table { 
    width: 100%; 
    border-collapse: collapse; 
  }
  td, th { 
    padding: 6px; 
    border: 1px solid #ccc; 
    text-align: center; 
  }
  th {
    font-size: 12px;
    font-weight: normal;
    border-top: none;
  }
  td {
    font-size: 11px;
    min-width: 200px;
    max-width: 300px;
    height: 35px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  td:first-child, th:first-child {
    border-left: none;
    border-right: none;
  }
  td:last-child, th:last-child {
    border-left: none;
    border-right: none;
  }
  tr:last-child {
    td {
      border-bottom: none;
    }
    padding-bottom: 75px;
  }
  th.title-col-header {
    border-left: none;
    border-right: none;
  }
  .react-select__value-container {
    display: flex;
    justify-content: center;
  }
`;

const TableContainer = styled.div`
  padding: 20px;
  width: 100%;
  height: 100%;
  min-height: 20vh;
  max-height: 60vh;
  overflow-y: scroll;
  overflow-x: hidden;

  &::-webkit-scrollbar-thumb {
    border-radius: 10px;
    -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
    background-color: ${Colors.lighterGrey};
  }
  &::-webkit-scrollbar {
    width: 2px;
    background-color: transparent;
    box-shadow: none;
  }

  .error {
    position: relative;
  }
  .error:before {
    position: absolute;
    content: "";
    top: 0;
    left: -50px;
    width: 300%;
    height: 100%;
    border-bottom: 1px solid red;
    z-index: -1;
  }

  .title-col {
    border-left: none;
    border-right: none;
  }

  .row-button-col {
    min-width: 40px;
    border-right: none;
  }
  .row-button {
    border: none;
    outline: none;
    font-size: 13px;
    color: #ff0000a6;
    cursor: pointer;
    position: relative;
  }
  .error-icon {
    color: #FF9800;
    font-size: 12px;
    position: absolute;
    left: 23px;
    top: 2.5px;
    cursor: help;
  }
`;

const Input = styled(EditableInput)`
  margin-bottom: 0 !important;
  background: #50505005;
  width: 100%
  min-width: 300px;
`;

const Title = styled(Header3)`
  text-align: center;
  margin: 12px 0;
  margin-top: 0;
`;

const Row = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 250ms ease-in;
  opacity: 1;

  &.fixed-to-bottom {
    position: absolute;
    bottom: 10px;
    left: 1%;
  }
  &.hide {
    opacity: 0;
  }
`;

const ActionButton = styled(Primary)`
  width: 40%;
  margin: 10px;
`;

const selectStyles: any = {
  option: (styles: any, { data, isDisabled, isFocused, isSelected }: any) => {
    return {
      ...styles,
      backgroundColor: isDisabled
        ? null
        : isSelected
          ? "#ffc800cc"
          : isFocused
            ? Colors.lightGold
            : null,
      color: isDisabled
        ? '#ccc'
        : Colors.blackish
    };
  }
};

function getMetricLabel(metric: IMetric) {
  switch (metric.data.type) {
    case "integer":
    case "number":
      if (metric.ui && metric.ui.widget === "radio") {
        return "scale (1 - 5)"
      }
      return "numeric"
    case "boolean":
      return "yes / no"
    case "string":
      return "text"
  }
}

const metricOptions = ["numeric", "text", "yes / no", "scale (1 - 5)"].map(label => ({ label, value: label }));

@observer
export default class CRUDTable extends React.Component<ICRUDTableProps, ICRUDTableState> {
  state: ICRUDTableState = {
    addedMetrics: [],
    deletedMetrics: [],
    changedMetrics: {},
    invalidMetrics: {}
  };

  counter = 0;

  componentDidMount() {
    this.addEmptyRow();
  }

  close = () => {
    this.props.history!.push({ search: "" });;
  }

  get store() {
    return this.props.journal;
  }

  get metrics() {
    return sortBy(this.store.metrics, "order").slice(1); // todo: make sure form completion is always first
  }

  addEmptyRow = () => {
    this.setState({ addedMetrics: this.state.addedMetrics.concat([{ data: {}, id: this.counter.toString() + "-temp" }]) })
    this.counter++;
  }

  handleChange = (metric: IMetric) => {
    this.setState({
      changedMetrics: { ...this.state.changedMetrics, [metric.id!]: metric },
      invalidMetrics: { ...this.state.invalidMetrics, [metric.id!]: { type: false, title: false } },
      showMessage: false
    });
  }

  delete = (metricId: string, rowIdx: number, isNew: boolean) => {
    const invalidMetrics = Object.assign({}, this.state.invalidMetrics);
    const changedMetrics = Object.assign({}, this.state.changedMetrics);
    const addedMetrics = this.state.addedMetrics.slice(0);
    const deletedMetrics = this.state.deletedMetrics.slice(0);
    if (isNew) {
      addedMetrics.splice(rowIdx, 1);
    } else {
      deletedMetrics.push(metricId);
    }
    delete changedMetrics[metricId];
    delete invalidMetrics[metricId];
    this.setState({ changedMetrics, addedMetrics, deletedMetrics, invalidMetrics });
  }

  save = () => {
    const invalidMetrics: Record<string, { type: boolean, title: boolean }> = {};
    const changedMetrics: Record<string, IMetric> = {};
    const addedMetrics: IMetric[] = [];
    const payload = Object.entries(this.state.changedMetrics)
      .filter(([id, metric]) => {
        const { data } = metric;
        const valid = data.type && data.title;
        if (!valid) {
          addedMetrics.push(metric);
          changedMetrics[id] = metric;
          invalidMetrics[id] = { type: !data.type, title: !data.title };
        }
        return valid;
      })
      .map(([id, metric]) => {
        const isNew = id.includes("temp");
        const { type, title } = metric.data;
        const { ui, ...additionalSchemaOptions } = METRIC_FIELDS[getMetricLabel(metric)!];
        return { id: !isNew ? id : undefined, type: type as string, title, ui: JSON.stringify(ui), additionalSchemaOptions: JSON.stringify(additionalSchemaOptions) };
      });
    if (payload.length) {
      this.store.upsertMetrics(payload as any).then(({ error }) => {
        this.setState({ changedMetrics, addedMetrics, messageText: !error ? "Save successful!" : `Error: ${error}`, showMessage: true });
        if (addedMetrics.length === 0) this.addEmptyRow();
        if (!error) {
          this.store.fetchAnalysis(this.props.start);
        }
      }, (e) => this.setState({ messageText: e.message, showMessage: true }));
    }
    if (this.state.deletedMetrics.length) {
      this.store.deleteMetrics(this.state.deletedMetrics).then(({ error }) => {
        this.setState({ deletedMetrics: [] });
        if (!payload.length) {
          this.setState({ messageText: !error ? "Save successful!" : `Error: ${error}`, showMessage: true });
          if (!error) {
            this.store.fetchAnalysis(this.props.start);
          }
        }
      });
    }
    this.setState({ invalidMetrics });
    setTimeout(() => this.setState({ showMessage: false }), 3500);
  }

  renderRow = (metric: IMetric, rowIdx: number, isNewlyAdded = false) => {
    metric = this.state.changedMetrics[metric.id!] ? this.state.changedMetrics[metric.id!] : metric;
    const label = getMetricLabel(metric) || '';
    const isInvalid = this.state.invalidMetrics[metric.id!] || {};
    const isDeleted = this.state.deletedMetrics.find(id => id === metric.id);

    if (isDeleted) return null;

    let ref: React.RefObject<Select>, handleClick;
    if (isNewlyAdded && this.state.addedMetrics.length - rowIdx < 3) {
      ref = React.createRef();
      handleClick = () => {
        const currRef = ref && ref.current;
        setTimeout(() => {
          const menuListRef = currRef && currRef.select.menuListRef;
          if (menuListRef)
            (menuListRef as any).scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
        }, 50);
      }
    }

    return (
      <tr key={metric.id}>
        <td className="row-button-col">
          <button className="row-button" onClick={() => this.delete(metric.id!, rowIdx, isNewlyAdded)}>
            <i className="fa fa-trash-o" title="Delete metric" />
            {(isInvalid.type || isInvalid.title) && <i
              className="error-icon fa fa-exclamation-triangle"
              title={`Save incomplete: Missing ${isInvalid.title && isInvalid.type ? "title, type" : isInvalid.title ? "title" : "type"}.`}
            />}
          </button>
        </td>
        <td className={`hoverable title-col`}>
          <Input
            value={metric.data.title}
            onChange={(title: string) => this.handleChange({ ...metric, data: { ...metric.data, title } })}
          />
        </td>
        <td style={{ overflow: 'visible', zIndex: rowIdx + 1 }}>
          {isNewlyAdded && <Select
            classNamePrefix="react-select"
            styles={selectStyles}
            theme={(theme) => ({
              ...theme,
              colors: {
                ...theme.colors,
                primary25: Colors.lightGold,
                primary: Colors.gold,
              },
            })}
            value={label ? { value: label, label } : undefined}
            options={metricOptions}
            onChange={({ value }: any) => this.handleChange({ ...metric, ui: METRIC_FIELDS[value].ui, data: { ...metric.data, type: METRIC_FIELDS[value].type! as any } })}
            onMenuOpen={handleClick}
            ref={ref!}
            placeholder={<div>Select a type</div>}
          />}
          {!isNewlyAdded && label}
        </td>
      </tr>
    );
  }

  render() {
    const { changedMetrics, deletedMetrics, messageText, showMessage } = this.state;
    return (
      <Container isOpen close={this.close}>
        <Title>Metrics</Title>
        <TableContainer>
          <table>
            <thead>
              <tr>
                <th></th>
                <th className="title-col-header">Title</th>
                <th>Type</th>
              </tr>
            </thead>
            <tbody>
              {this.metrics.map((metric, rowIdx) => this.renderRow(metric, rowIdx))}
              {this.state.addedMetrics.map((metric, rowIdx) => this.renderRow(metric, rowIdx, true))}
            </tbody>
          </table>
        </TableContainer>
        <Spacer height={20} />
        <Row>
          <ActionButton onClick={this.addEmptyRow}>Add metric</ActionButton>
          <Spacer width={8} />
          <ActionButton onClick={this.save} disabled={!keys(changedMetrics).length && !deletedMetrics.length}>Save changes</ActionButton>
        </Row>
        <Row className={`${showMessage ? "" : "hide"} fixed-to-bottom`}>
          <Text>{messageText}</Text>
        </Row>
      </Container>
    )
  }
}