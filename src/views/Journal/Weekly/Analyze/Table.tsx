import * as React from 'react';
import * as moment from "moment";
import styled from 'styled-components';
import { sortBy } from "lodash";
import { IMetric } from "stores";

const Container = styled.div`
  padding: 2rem;
  table { 
    width: 100%; 
    border-collapse: collapse; 
  }
  /* Zebra striping */
  tr:nth-of-type(odd) { 
    background: #eee; 
  }
  th { 
    background: #333; 
    color: white; 
    font-weight: bold; 
  }
  td, th { 
    padding: 6px; 
    border: 1px solid #ccc; 
    text-align: center; 
  }
  td {
    font-size: 12px;
    max-width: 100px;
    height: 55px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media only screen and (max-width: 760px), (min-device-width: 768px) and (max-device-width: 1024px)  {
    /* Force table to not be like tables anymore */
    table, thead, tbody, th, td, tr { 
      display: block; 
    }
    
    /* Hide table headers (but not display: none;, for accessibility) */
    thead tr { 
      position: absolute;
      top: -9999px;
      left: -9999px;
    }
    
    tr { border: 1px solid #ccc; }
    
    td { 
      /* Behave  like a "row" */
      border: none;
      border-bottom: 1px solid #eee; 
      position: relative;
      padding-left: 50%; 
    }
    
    td:before { 
      /* Now like a table header */
      position: absolute;
      /* Top/left values mimic padding */
      top: 6px;
      left: 6px;
      width: 45%; 
      padding-right: 10px; 
      white-space: nowrap;
    }
  }
`;

interface ITableProps {
  headers: { id: number, title: string }[];
  rows: Record<number | string, (string | number | moment.Moment)>[]
}

/*

headers: [ {id, title}] id = unix timestamp
rows: [ {id, value} ] timestamp => value
*/

const Table: React.SFC<ITableProps> = ({ headers, rows }) => {
  return (
    <Container>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            {headers.map((header, index) => <th key={index}>{header.title}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => <tr key={rowIdx}>
            <td title={(row["title"] as string).length > 15 ? (row["title"] as string) : undefined} >{row["title"]}</td>
            {sortBy(Object.entries(row).map(([timestamp, value]) =>
              ({ timestamp, value })), "timestamp").map(({ timestamp, value }, colIdx) => {
                return (timestamp !== "title" && timestamp !== "id" && timestamp !== "type") && <td title={(value as string).length > 15 ? (value as string) : undefined} key={colIdx}>{value}</td>;
              })}
          </tr>)}
        </tbody>
      </table>
    </Container>
  )
}


export default Table;