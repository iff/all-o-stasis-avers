import * as Avers from "avers";
import * as React from "react";
import styled from "styled-components";

import { boulderStats, BoulderStat, gradeCompare } from "../src/storage";
import { Site } from "../src/Views/Components/Site";

import { useTypeface, heading20 } from "../src/Materials/Typefaces";

import { SectorDistributionChart } from "../src/Components/SectorDistributionChart";
import { GradeDistributionChart } from "../src/Components/GradeDistributionChart";
import { Visualization } from "../src/Views/Components/Stats/Visualization";
import { StatsFilter } from "../src/Views/Components/Stats/StatsFilter";

import { useEnv } from "../src/env";

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

export default () => {
  const [sectors, setSectors] = React.useState<string[]>([]);
  const [selectedSetters, setSelectedSetters] = React.useState<string[]>([]);

  const { app } = useEnv();
  const { aversH } = app.data;

  const clearSectors = (): void => { setSectors([]); };
  const clearSetters = (): void => { setSelectedSetters([]); };

  const toggleSector = (sector: string): void => {
    if (sectors.includes(sector)) {
      setSectors(sectors.filter(x => x !== sector));
    } else {
      setSectors([sector, ...sectors]);
    }
  };

  const toggleSetter = (accountId: string): void => {
    if (selectedSetters.includes(accountId)) {
      setSelectedSetters(selectedSetters.filter(x => x !== accountId));
    } else {
      setSelectedSetters([accountId, ...selectedSetters]);
    }
  };

  const history_start = new Date();
  history_start.setMonth(history_start.getMonth() - 4);

  const bss = React.useMemo(() => {
    return Avers.staticValue(aversH, boulderStats(aversH)).get<BoulderStat[]>([]);
  }, [aversH, aversH.generationNumber]);

  const events = React.useMemo(() => {
    return bss
        .map(
          (bs: BoulderStat): Event[] => {
            // before history_start just track not removed boulders, and boulders that are removed after history_start
            if (bs.setOn < history_start) {
              if (bs.removedOn === undefined) {
                return [{ bs, type: "set", date: bs.setOn, setters: bs.setters, sector: bs.sector, grade: bs.grade }];
              } else {
                if (bs.removedOn > history_start) {
                  return [
                    { bs, type: "set", date: bs.setOn, setters: bs.setters, sector: bs.sector, grade: bs.grade },
                    { bs, type: "removed", date: bs.removedOn, setters: bs.setters, sector: bs.sector, grade: bs.grade }
                  ];
                } else {
                  return [];
                }
              }
            }

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
        .sort((a, b) => +a.date - +b.date);
  }, [bss])

  function useGradeDistribution() {
    return React.useMemo(() => {
      const map = new Map<string, number>();
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
    }, [events, sectors, selectedSetters])
  }

  function useSectorDistribution() {
    return React.useMemo(() => {
      const map = new Map<string, number>();
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
    }, [events, sectors, selectedSetters])
  }

  return (
    <Site>
      <Root>
        <Main>
          <Toolbar>
            <StatsFilter
              sectors={sectors}
              selectedSetters={selectedSetters}
              clearSectors={clearSectors}
              clearSetters={clearSetters}
              toggleSector={toggleSector}
              toggleSetter={toggleSetter}
            />
          </Toolbar>

          <Grid>
            <GridItem>
              <GridItemTitle>History</GridItemTitle>
              <GridItemContent>
                <Visualization events={events} sectors={sectors} selectedSetters={selectedSetters} />
              </GridItemContent>
            </GridItem>
            <GridItem>
              <GridItemTitle>Grade Distribution</GridItemTitle>
              <GridItemContent>
                <GradeDistributionChart data={useGradeDistribution()} />
              </GridItemContent>
            </GridItem>
            <GridItem>
              <GridItemTitle>Sector Distribution</GridItemTitle>
              <GridItemContent>
                <SectorDistributionChart data={useSectorDistribution()} />
              </GridItemContent>
            </GridItem>
            <GridItem />
          </Grid>
        </Main>
      </Root>
    </Site>
  );
};


// ----------------------------------------------------------------------------

const Root = styled.div`
  flex: 1;
  padding: 20px 24px;
  display: flex;
`;

const Main = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const Toolbar = styled.div`
  padding-bottom: 20px;
`;

const Grid = styled.div`
  flex: 1;
  display: grid;
  grid-template: 1fr 1fr;
  grid-gap: 12px;

  @media screen and (min-width: 600px) {
    grid-template: calc(50% - 12px) calc(50% - 12px) / 1fr 1fr;
    grid-gap: 24px;
  }
`;

const GridItem = styled.div`
  background: white;
  box-shadow: 0 0 4px 0 rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.16s;
  display: flex;
  flex-direction: column;
  min-height: 300px;
`;

const GridItemTitle = styled.div`
  ${useTypeface(heading20)};
  margin: 24px 24px 0;
`;

const GridItemContent = styled.div`
  flex: 1;
  display: flex;
`;
