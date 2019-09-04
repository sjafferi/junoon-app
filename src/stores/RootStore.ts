import * as stores from "./";
import { syncHistoryWithStore } from "mobx-react-router";
import { History, createBrowserHistory } from "history";

export class RootStore {
  public history: History;
  public router: stores.RouterStore;
  public viewport: stores.Viewport;
  public user: stores.User;
  public journal: stores.Journal;

  public constructor() {
    const browerHistory = createBrowserHistory();

    this.router = new stores.RouterStore();
    this.history = syncHistoryWithStore(browerHistory, this.router);

    this.viewport = new stores.Viewport(this).listenForTouch().updateOnResize();
    this.user = new stores.User(this);
    this.journal = new stores.Journal(this);

    return {
      router: this.router,
      history: this.history,
      viewport: this.viewport,
      user: this.user,
      journal: this.journal
    };
  }
}
