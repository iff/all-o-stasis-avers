import * as Avers from "avers";

export class Account {
  login!: string;
  role!: string;
  email!: string;
  name!: string;
}
Avers.definePrimitive(Account, "login", "");
Avers.definePrimitive(Account, "role", "user");
Avers.definePrimitive(Account, "email", "");
Avers.definePrimitive(Account, "name", "");

export class Boulder {
  setter!: string[];
  sector!: string;
  grade!: string;
  gradeNr!: number;
  setDate!: number;
  removed!: number;
  name!: string;
}

Avers.definePrimitive(Boulder, "setter", []);
Avers.definePrimitive(Boulder, "sector", "spektrumone");
Avers.definePrimitive(Boulder, "grade", "yellow");
Avers.definePrimitive(Boulder, "gradeNr", 0);
Avers.definePrimitive(Boulder, "setDate", 0);
Avers.definePrimitive(Boulder, "removed", 0);
Avers.definePrimitive(Boulder, "name", "");

export const roles: string[] = ["user", "setter", "admin"];
export const grades: string[] = ["yellow", "green", "orange", "blue", "red", "white", "black"];
export const sectors = [
  "starship",
  "bigboss",
  "dune",
  "plaettliwand",
  "kurswand",
  "hoefli",
  "spektrumone",
  "spektrumtwo",
  "spektrumthree",
  "spektrumfour"
];

export const gradeCompare = (a: string, b: string) => grades.indexOf(a) - grades.indexOf(b);

export function boulderCompare(a: Boulder, b: Boulder): number {
    if (a.grade === b.grade) {
        return a.gradeNr - b.gradeNr;
    } else {
        return grades.indexOf(a.grade) - grades.indexOf(b.grade);
    }
}

// FIXME
export function prettyPrintSector(sectorName: string): string {
  return sectorName
    .replace(/one/i, " 1")
    .replace(/two/i, " 2")
    .replace(/three/i, " 3")
    .replace(/four/i, " 4")
    .replace(/oe/i, "ö")
    .replace(/ae/i, "ä");
}

export interface SetterMonthlyStats {
  Yellow?: number;
  Green?: number;
  Orange?: number;
  Blue?: number;
  Red?: number;
  White?: number;
  Black?: number;
}

const aosNS = Symbol("all-o-stasis");
export const setterMonthlyStats = (
  aversH: Avers.Handle,
  setterId: string,
  year: number,
  month: number
): Avers.Static<SetterMonthlyStats> => {
  const fetch = () =>
    aversH.config.fetch(`${aversH.config.apiHost}/stats/${setterId}/${year}/${month}`).then(res => res.json());
  return new Avers.Static<SetterMonthlyStats>(aosNS, `${setterId}-${year}-${month}`, fetch);
};

export interface BoulderStat {
  setOn: Date;
  removedOn: void | Date;
  setters: string[];
  sector: string;
  grade: string;
}

export const parseBoulderStat = (json: any): BoulderStat => ({
  ...json,
  setOn: new Date(Date.parse(json.setOn)),
  removedOn: json.removedOn ? new Date(Date.parse(json.removedOn)) : undefined
});

export const boulderStats = (aversH: Avers.Handle): Avers.Static<BoulderStat[]> => {
  const fetch = () =>
    aversH.config
      .fetch(`${aversH.config.apiHost}/stats/boulders`)
      .then(res => res.json())
      .then(bss => bss.map(parseBoulderStat));

  return new Avers.Static<BoulderStat[]>(aosNS, `boulderStats`, fetch);
};

export interface PublicProfile {
  name: string;
  avatar: string;
}

export const publicProfile = (aversH: Avers.Handle, accountId: string): Avers.Static<PublicProfile> => {
  const fetch = async () => {
    const res = await aversH.config.fetch(`${aversH.config.apiHost}/public-profile/${accountId}`);
    return res.json();
  };

  return new Avers.Static<PublicProfile>(aosNS, `publicProfile/${accountId}`, fetch);
};
