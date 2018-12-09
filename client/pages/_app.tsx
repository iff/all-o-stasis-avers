import React from "react";
import NApp, { Container } from "next/app";
import * as Avers from "avers";
import { config, Data, App, infoTable } from "../src/app";
import { parse } from "url";
import shallowEqual from "fbjs/lib/shallowEqual";

export default class extends NApp {
  static async getInitialProps({ Component, ctx }) {
    let pageProps = {};

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx);
    }

    return { pageProps };
  }

  app = ((): App => {
    const aversH = Avers.newHandle({
      apiHost: (config.secure ? "https://" : "http://") + config.apiHost,
      fetch: typeof window !== "undefined" ? window.fetch.bind(window) : () => {},
      createWebSocket: path => new WebSocket((config.secure ? "wss://" : "ws://") + config.apiHost + path),
      now: typeof window !== "undefined" ? window.performance.now.bind(window.performance) : () => 0,
      infoTable
    });

    const data = new Data(aversH);
    return new App(data);
  })();

  state = { isMounted: false, generationNumber: 0 };

  refreshId: undefined | any = undefined;
  generationListener = () => {
    if (this.refreshId === undefined) {
      this.refreshId = requestAnimationFrame(() => {
        this.refreshId = undefined;
        this.setState({ generationNumber: this.app.data.aversH.generationNumber });
      });
    }
  };

  componentDidMount() {
    this.setState({ isMounted: true });
    Avers.attachGenerationListener(this.app.data.aversH, this.generationListener);
    Avers.restoreSession(this.app.data.session);

    const windowAny = window as any;
    windowAny.Avers = Avers;
    windowAny.app = this.app;

    // If window.location.href contains any additional query params, reflect them into
    // the router.
    const { router } = this.props;
    const { query } = parse(window.location.href, true);
    const extendedQuery = { ...router.query, ...query };
    if (!shallowEqual(router.query, extendedQuery)) {
      const href = { pathname: router.pathname, query: extendedQuery };
      router.replace(href, router.asPath).catch(console.error);
    }
  }

  componentWillUnmount() {
    if (this.refreshId !== undefined) {
      cancelAnimationFrame(this.refreshId);
      this.refreshId = undefined;
    }
  }

  render() {
    const { Component, pageProps } = this.props;
    const { isMounted } = this.state;

    if (!isMounted) {
      return null;
    }

    return (
      <Container>
        <Component generationNumber={this.state.generationNumber} app={this.app} {...pageProps} />
      </Container>
    );
  }
}
