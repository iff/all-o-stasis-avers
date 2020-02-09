import * as Avers from "avers";
import * as React from "react";
import styled from "styled-components";
import { format } from "date-fns";

import { App } from "../src/app";
import { Boulder, boulderCompare } from "../src/storage";

import { text } from "../src/Materials/Colors";
import { useTypeface, copy16Bold } from "../src/Materials/Typefaces";

import { BoulderCard } from "../src/Views/Components/BoulderCard";
import { Site } from "../src/Views/Components/Site";
import { SetterBar } from "../src/Components/SetterBar";
import { role } from "../src/actions";

interface State {
  search: string;
  grades: string[];
}

export default class extends React.Component<{ app: App }, State> {
  state: State = {
    search: "",
    grades: []
  };

  changeSearch = (ev): void => {
    this.setState({ search: ev.target.value });
  };

  toggleGrade = (grade: string): void => {
    const { grades } = this.state;
    if (grades.indexOf(grade) === -1) {
      this.setState({ grades: [grade].concat(grades) });
    } else {
      this.setState({ grades: grades.filter(x => x !== grade) });
    }
  };

  render() {
    const { app } = this.props;
    const { search, grades } = this.state;

    const editableBoulders = app.data.activeBouldersCollection.ids
      .get<string[]>([])
      .map(boulderId => Avers.lookupEditable<Boulder>(app.data.aversH, boulderId).get(null))
      .filter(x => {
        if (x === null) {
          return false;
        } else if (search === "" && grades.length === 0) {
          return true;
        } else {
          return grades.indexOf(x.content.grade) !== -1 && (search === "" || +search === x.content.gradeNr);
        }
      });

    const groups = [] as Array<{ date: Date; boulders: Array<Avers.Editable<Boulder>> }>;

    editableBoulders.forEach(boulder => {
      if (!boulder) {
        return;
      }

      const createdAt = new Date(boulder.content.setDate);
      const lastGroup = groups[groups.length - 1];

      if (lastGroup === undefined) {
        groups.push({ date: createdAt, boulders: [boulder] });
      } else if (
        lastGroup.date.getMonth() === createdAt.getMonth() &&
        lastGroup.date.getDate() === createdAt.getDate()
      ) {
        lastGroup.boulders.push(boulder);
      } else {
        lastGroup.boulders.sort((a, b) => boulderCompare(a.content, b.content));
        groups.push({ date: createdAt, boulders: [boulder] });
      }
    });

    return (
      <Site>
        {(role(app) === "admin" || role(app) === "setter") && <SetterBar />}
        <Boulders>
          {groups.map(({ date, boulders }) => (
            <React.Fragment key={date.toISOString()}>
              <BoulderSeparator key={`separator-${date.toISOString()}`}>{format(date, "dd. MMMM")}</BoulderSeparator>
              {boulders.map(boulder => (
                <BoulderCard key={boulder.objectId} boulderE={boulder} />
              ))}
            </React.Fragment>
          ))}
        </Boulders>
      </Site>
    );
  }
}

// ----------------------------------------------------------------------------

const Boulders = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const BoulderSeparator = styled.div`
  flex: 0 0 100%;
  width: 100%;
  padding: 20px 16px 12px;

  ${useTypeface(copy16Bold)};
  color: ${text};

  &:first-of-type {
    padding-top: 10px;
  }

  @media (min-width: 600px) {
    padding: 80px 24px 12px;
    &:first-of-type {
      padding: 20px 24px 12px;
    }
  }
`;
