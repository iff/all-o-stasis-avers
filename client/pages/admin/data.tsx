import * as Avers from "avers";
import * as React from "react";
import styled from "styled-components";
import { CSVLink } from "react-csv";

import { App } from "../../src/app";
import { useEnv } from "../../src/env";

import { Site } from "../../src/Views/Components/Site";

import { boulderStats, BoulderStat } from "../../src/storage";

interface Event {
  date: Date;
  setters: string[];
  sector: string;
  grade: string;
}

function get_stats(app: App): any {
  // very crude way to get the data.. we should at least notify the user when 
  // things are ready :)

  let accountNames = new Map<string, string>();
  app.data.accountsCollection.ids.get([] as string[]).forEach(accountId => {
    const name = Avers.lookupEditable<Account>(app.data.aversH, accountId)
      .fmap(accountE => {
        return accountE.content.name
      }).get("");

    if (name === undefined || name == "") {
      accountNames.set(accountId, accountId);
    } else {
      accountNames.set(accountId, name);
    }
  });

  const toEvents = (bss: BoulderStat[]) =>
    bss
      .map(
        (bs: BoulderStat): Event[] => {
          return [{ date: bs.setOn, setters: bs.setters, sector: bs.sector, grade: bs.grade }];
        }
      )
      .reduce<Event[]>((a, x) => a.concat(x), [])
      .sort((a, b) => +a.date - +b.date);

  let data = Avers.staticValue(app.data.aversH, boulderStats(app.data.aversH)).fmap(toEvents).get<Event[]>([]);
  let yearly = new Map<number, string[]>();
  data.forEach( d => {
    const year = d.date.getFullYear();
    let rows = yearly.get(year) || [["setters", "date", "sector", "grade"]];
    let setters = d.setters.map( s => accountNames.get(s) );
    rows.push([setters.join(','), d.date, d.sector, d.grade]);
    yearly.set(year, rows);
  });

  return Array.from(yearly.entries()).map(([k, v]) => {
    return { year: k, rows: v};
  });

}

export default () => (
  <Site>
    <Root>
      <p>Data preparation takes a while.. be patient before clicking download :)</p>
      <table>
        <thead>
          <tr>
            <th style={{ width: 100, marginRight: 30 }}>Year</th>
            <th style={{ width: 100, marginRight: 30 }}>CSV</th>
          </tr>
        </thead>
        <tbody>
            {get_stats(useEnv().app).map(({year, rows}) => (
              <tr>
                <td>{year}</td>
                <td><CSVLink data={rows}>download</CSVLink></td>
              </tr>
            ))}
        </tbody>
      </table>
    </Root>
  </Site>
);

const Root = styled.div`
  margin: 16px 24px;

  table {
    width: 100%;

    th {
      text-align: left;
    }
  }
`;
