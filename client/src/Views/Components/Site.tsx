import * as Avers from "avers";
import * as React from "react";

import { role } from "../../actions";

import { AdminBar } from "../../Components/AdminBar";
import { Header } from "../../Components/Header/Header";
import { TransientNotification } from "./TransientNotification";
import { useEnv } from "../../env";

interface SiteProps {
  children?: React.ReactNode;
}

export const Site = ({ children }: SiteProps) => {
  const { app } = useEnv();

  const onClick = React.useCallback(() => {
    Avers.startNextGeneration(app.data.aversH);
  }, [app.data.aversH]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }} onClick={onClick}>
      <Header />
      {role(app) === "admin" && <AdminBar />}
      {children}
      <TransientNotification />
    </div>
  );
};
