import * as Avers from "avers";
import * as React from "react";
import styled from "styled-components";

import { boulderStats, BoulderStat, gradeCompare } from "../src/storage";
import { App } from "../src/app";

import { Site } from "../src/Views/Components/Site";
import { SectorSelector } from "../src/Views/Components/Stats/SectorSelector";
import { SetterSelector } from "../src/Views/Components/Stats/SetterSelector";
import { Visualization } from "../src/Views/Components/Stats/Visualization";
import { Section } from "../src/Views/Components/Stats/Internal";
import { GradeDistributionChart } from "../src/Components/GradeDistributionChart";
import Computation from "computation";
import { useTypeface, heading20 } from "../src/Materials/Typefaces";
import { SectorDistributionChart } from "../src/Components/SectorDistributionChart";

interface StatsPageProps {
  app: App;
}

interface StatsPageState {
  sectors: string[];
  selectedSetters: string[]; // ObjId[]
}

type EventType = "set" | "removed";
interface Event {
  bs: BoulderStat;
  type: EventType;
  date: Date;
  setters: string[];
  sector: string;
  grade: string;
}

const matchSector = (sectors: string[]) =>
  sectors.length === 0 ? () => true : (bs: BoulderStat) => sectors.indexOf(bs.sector) !== -1;

const matchSetter = (setters: string[]) =>
  setters.length === 0
    ? () => true
    : (bs: BoulderStat) => bs.setters.some(setterId => setters.indexOf(setterId) !== -1);

export default class extends React.Component<StatsPageProps, StatsPageState> {
  state: StatsPageState = {
    sectors: [],
    selectedSetters: []
  };

  clearSectors = (): void => {
    this.setState({ sectors: [] });
  };
  toggleSector = (sector: string): void => {
    if (this.state.sectors.indexOf(sector) === -1) {
      this.setState({ sectors: [sector].concat(this.state.sectors) });
    } else {
      this.setState({ sectors: this.state.sectors.filter(x => x !== sector) });
    }
  };

  clearSetters = (): void => {
    this.setState({ selectedSetters: [] });
  };
  toggleSetter = (setterId: string): void => {
    if (this.state.selectedSetters.indexOf(setterId) === -1) {
      this.setState({ selectedSetters: [setterId].concat(this.state.selectedSetters) });
    } else {
      this.setState({ selectedSetters: this.state.selectedSetters.filter(x => x !== setterId) });
    }
  };

  bssC = (): Computation<Event[]> => {
    const { app } = this.props;

    const toEvents = (bss: BoulderStat[]) =>
      bss
        .map(
          (bs: BoulderStat): Event[] => {
            if (bs.removedOn === undefined) {
              return [{ bs, type: "set", date: bs.setOn, setters: bs.setters, sector: bs.sector, grade: bs.grade }];
            } else {
              return [
                { bs, type: "set", date: bs.setOn, setters: bs.setters, sector: bs.sector, grade: bs.grade },
                { bs, type: "removed", date: bs.removedOn, setters: bs.setters, sector: bs.sector, grade: bs.grade }
              ];
            }
          }
        )
        .reduce<Event[]>((a, x) => a.concat(x), [])
        .sort((a, b) => +a.date - +b.date)
        .filter(a => a.date.getTime() > 10000);

    return Avers.staticValue(app.data.aversH, boulderStats(app.data.aversH)).fmap(toEvents);
  };

  render() {
    const { app } = this.props;
    const { sectors, selectedSetters } = this.state;

    const bssC = this.bssC();

    const gradeDistribution = (() => {
      const map = new Map<string, number>();
      const events = bssC.get<Event[]>([]);
      events.forEach(ev => {
        const grade = ev.bs.grade;
        const count = map.get(grade) || 0;
        if (matchSector(sectors)(ev.bs) && matchSetter(selectedSetters)(ev.bs)) {
          if (ev.type === "set") {
            map.set(grade, count + 1);
          } else if (ev.type === "removed") {
            map.set(grade, count - 1);
          }
        }
      });

      const ret = Array.from(map.entries()).map(([k, v]) => {
        return { grade: k, count: v };
      });
      ret.sort((a, b) => {
        return gradeCompare(a.grade, b.grade);
      });
      return ret;
    })();

    const sectorDistribution = (() => {
      const map = new Map<string, number>();
      const events = bssC.get<Event[]>([]);
      events.forEach(ev => {
        const sector = ev.bs.sector;
        const count = map.get(sector) || 0;
        if (matchSector(sectors)(ev.bs) && matchSetter(selectedSetters)(ev.bs)) {
          if (ev.type === "set") {
            map.set(sector, count + 1);
          } else if (ev.type === "removed") {
            map.set(sector, count - 1);
          }
        }
      });

      const ret = Array.from(map.entries()).map(([k, v]) => {
        return { sector: k, count: v };
      });
      ret.sort();
      return ret;
    })();

    return (
      <Site>
        <Root>
          <Side>
            <SideContent>
              <SectorSelector
                sectors={sectors}
                clear={sectors.length === 0 ? undefined : this.clearSectors}
                toggle={this.toggleSector}
              />

              <SetterSelector
                app={app}
                selectedSetters={selectedSetters}
                clear={selectedSetters.length === 0 ? undefined : this.clearSetters}
                toggle={this.toggleSetter}
              />
            </SideContent>
          </Side>
          <Main>
            <Toolbar>
              <div>
                <Section>Boulders</Section>
                <div>Sectors: {sectors.length === 0 ? "ALL" : sectors.join(", ")}</div>
              </div>
            </Toolbar>
            <Grid>
              <GridItem>
                <GridItemTitle>History</GridItemTitle>
                <GridItemContent>
                  <Visualization bssC={bssC} sectors={sectors} selectedSetters={selectedSetters} />
                </GridItemContent>
              </GridItem>
              <GridItem>
                <GridItemTitle>Grade Distribution</GridItemTitle>
                <GridItemContent>
                  <GradeDistributionChart data={gradeDistribution} />
                </GridItemContent>
              </GridItem>
              <GridItem>
                <GridItemTitle>Sector Distribution</GridItemTitle>
                <GridItemContent>
                  <SectorDistributionChart data={sectorDistribution} />
                </GridItemContent>
              </GridItem>
              <GridItem />
            </Grid>
          </Main>
        </Root>
      </Site>
    );
  }
}

const Root = styled.div`
  flex: 1;
  padding: 20px 24px;
  display: flex;
`;

const Side = styled.div`
  flex: 0 0 300px;
  position: relative;
  margin-right: 24px;
`;

const SideContent = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Toolbar = styled.div`
  flex: 0 0 120px;
  display: flex;
  justify-content: space-between;
`;

const Grid = styled.div`
  flex: 1;
  display: grid;
  grid-template: calc(50% - 12px) calc(50% - 12px) / 1fr 1fr;
  grid-gap: 24px;
`;

const GridItem = styled.div`
  background: white;
  box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.16s;
  display: flex;
  flex-direction: column;
`;

const GridItemTitle = styled.div`
  ${useTypeface(heading20)};
  margin: 24px 24px 0;
`;

const GridItemContent = styled.div`
  flex: 1;
  display: flex;
`;
