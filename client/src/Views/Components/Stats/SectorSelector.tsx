import * as React from "react";

import { SectorPicker } from "../SectorPicker";
import { Section, SectionLink } from "./Internal";

export interface SectorSelectorProps {
  sectors: string[];

  clear: undefined | (() => void);
  toggle(sector: string): void;
}

export const SectorSelector = ({ sectors, clear, toggle }: SectorSelectorProps) => (
  <>
    <Section>
      Sector
      <SectionLink onClick={clear}>(reset)</SectionLink>
    </Section>

    <SectorPicker sectors={sectors} onChange={toggle} />
  </>
);