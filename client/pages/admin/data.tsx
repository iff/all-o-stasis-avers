import * as Avers from "avers";
import * as React from "react";
import Link from "next/link";
import styled from "styled-components";
import { CSVLink } from "react-csv";

import { App } from "../../src/app";

import { Site } from "../../src/Views/Components/Site";

import { boulderStats, BoulderStat, gradeCompare } from "../../src/storage";

function get_stats(app: App): Any {
  // very crude way to get the data.. we should at least notify the user when things are ready :)

  let accountNames = new Map<string, string>();
  app.data.accountsCollection.ids.get([] as string[]).forEach(accountId => {
    const name = Avers.lookupEditable<Account>(app.data.aversH, accountId)
      .fmap(accountE => {
        return accountE.content.name == "" ? accountId : accountE.content.name
      }).get(null);

    accountNames.set(accountId, name);
  });

  const toEvents = (bss: BoulderStat[]) =>
    bss
      .map(
        (bs: BoulderStat): Event[] => {
          return [{ bs, date: bs.setOn, setters: bs.setters, sector: bs.sector, grade: bs.grade }];
        }
      )
      .reduce<Event[]>((a, x) => a.concat(x), [])
      .sort((a, b) => +a.date - +b.date);

  let data = Avers.staticValue(app.data.aversH, boulderStats(app.data.aversH)).fmap(toEvents).get<Event[]>([]);
  let yearly = new Map<string, string[]>();
  data.forEach( d => {
    const year = d.date.getFullYear();
    let rows = yearly.get(year) || [["setters", "date", "sector", "grade"]];
    let setters = d.setters.map( s => accountNames.get(s) );
    //console.log(setters);
    rows.push([setters.join(','), d.date, d.sector, d.grade]);
    yearly.set(year, rows);
  });

  return Array.from(yearly.entries()).map(([k, v]) => {
    return { year: k, rows: v};
  });

}

export default ({ app }: { app: App }) => (
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
            {get_stats(app).map(({year, rows}) => (
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
