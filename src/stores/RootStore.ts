import * as stores from "./";
import { syncHistoryWithStore } from "mobx-react-router";
import { History, createBrowserHistory } from "history";

export class RootStore {
  public history: History;
  public routerStore: stores.RouterStore;
  public viewport: stores.Viewport;

  public constructor() {
    const browerHistory = createBrowserHistory();

    this.routerStore = new stores.RouterStore();
    this.history = syncHistoryWithStore(browerHistory, this.routerStore);

    this.viewport = new stores.Viewport(this).listenForTouch().updateOnResize();

    return {
      routerStore: this.routerStore,
      history: this.history,
      viewport: this.viewport
    };
  }
}
