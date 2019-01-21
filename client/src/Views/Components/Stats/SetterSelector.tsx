import * as React from "react";
import styled from "styled-components";

import { accountPublicProfile } from "../../../../pages/account";

import { text, lightGrey } from "../../../Materials/Colors";
import { useTypeface, copy14 } from "../../../Materials/Typefaces";

import { Section, SectionLink } from "./Internal";

import { useEnv } from "../../../env";

export interface SetterSelectorProps {
  selectedSetters: string[];

  clear: undefined | (() => void);
  toggle(setterId: string): void;
}

export const SetterSelector = ({ selectedSetters, clear, toggle }: SetterSelectorProps) => {
  const { app } = useEnv();
  const setters = app.data.adminAccountCollection.ids
    .get<string[]>([])
    .map(accountId => {
      const isSelected = selectedSetters.length === 0 || selectedSetters.indexOf(accountId) !== -1;
      const { name, avatar } = accountPublicProfile(app.data.aversH, accountId);

      return (
        <Setter key={accountId} onClick={() => toggle(accountId)}>
          <SetterImage isSelected={isSelected} src={avatar} />
          <SetterName isSelected={isSelected}>{name}</SetterName>
        </Setter>
      );
    });

  return (
    <Root>
      <Section>
        Setter
        <SectionLink onClick={clear}>(reset)</SectionLink>
      </Section>

      <Setters>{setters}</Setters>
    </Root>
  );
};

const Root = styled.div`
  margin-top: 24px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
`;

const Setters = styled.div`
  flex-grow: 1;
  overflow-y: auto;
`;

const Setter = styled.div`
display: flex;
align-items: center;
margin: 4px 0;
padding: 0 0 0 2px;
border-left: 4px solid transparent;
cursor: pointer;
user-select: none;

transition all .2s;

&:hover {
  border-left-color: ${text};
}
`;

const SetterImage = styled<{ isSelected: boolean }, "img">("img")`
display: block;
width: 24px;
height: 24px;
margin-right: 8px;
border-radius: 2px;

transition all .2s;
opacity: ${({ isSelected }) => (isSelected ? 1 : 0.2)}
`;

const SetterName = styled<{ isSelected: boolean }, "div">("div")`
  ${useTypeface(copy14)};
  transition all .2s;
  color: ${({ isSelected }) => (isSelected ? text : lightGrey)};
`;
