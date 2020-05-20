import * as React from "react";
import styled from "styled-components";

import { SetterSelector } from "./SetterSelector";
import { SectorSelector } from "./SectorSelector";

import { accountPublicProfile } from "../../../../pages/account";
import { useEnv } from "../../../env";


export interface StatsFilterProps {
  sectors: string[];
  selectedSetters: string[];

  clearSectors: undefined | (() => void);
  clearSetters: undefined | (() => void);

  toggleSector(sector: string): void;
  toggleSetter(setterId: string): void;
}

export const StatsFilter = ({sectors, selectedSetters, clearSectors, clearSetters, toggleSector, toggleSetter}: StatsFilterProps) => {
  const { app } = useEnv();
  let [showFilter, setShowFilter] = React.useState(false);

  let summaryText = "";
  summaryText += sectors.length === 0 ? "ALL" : sectors.join(", ");

  const setterNames = selectedSetters.map(accountId => {
    return accountPublicProfile(app.data.aversH, accountId).name.split(" ")[0]
  });
  summaryText += setterNames.length === 0 ? "" : " | " + setterNames.join(", ");

  const filterStyle = {
    height: "0px",
    opacity: 0,
    pointer_events: null,
    transition: "opacity 0.2s ease-in 0.15s"
  };

  if (showFilter) {
    filterStyle.height = "auto";
    filterStyle.opacity = 1;
  }

  return (
    <Root>
      <Filter placeholder={summaryText} onClick={() => setShowFilter(!showFilter)} readonly />

      <div style={filterStyle}>
        <FilterItem>
          <SectorSelector
            sectors={sectors}
            clear={sectors.length === 0 ? undefined : clearSectors}
            toggle={toggleSector}
          />
        </FilterItem>

        <FilterItem>
          <SetterSelector
            selectedSetters={selectedSetters}
            clear={selectedSetters.length === 0 ? undefined : clearSetters}
            toggle={toggleSetter}
          />
        </FilterItem>
      </div>
    </Root>
  );
}

const Root = styled.div`
  z-index: 10;
  background: #fafafa;
  display: flex;
  flex-direction: column;
`;

const Filter = styled.input`
  font-size: 12px;
  line-height: 28px;
  @media screen and (min-width: 600px) {
    font-size: 20px;
  }
`;

const FilterItem = styled.div`
  max-width: 200px;
`;