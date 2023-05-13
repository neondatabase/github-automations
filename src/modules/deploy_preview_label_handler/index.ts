import {Probot} from "probot";
import {
  PRLabeledHandler,
  PRMergedOrClosedHandler,
  PROpenedHandler, PRUnLabeledHandler
} from "./deploy_preview_label_handler";

export const pull_request_label_change_listener = (app: Probot) => {
  app.on("pull_request.labeled", async (context) => {
    PRLabeledHandler(context)
  });

  app.on("pull_request.opened", async (context) => {
    PROpenedHandler(context)
  });

  app.on(["pull_request.closed"], async (context) => {
    PRMergedOrClosedHandler(context)
  });

  app.on(["pull_request.unlabeled"], async (context) => {
    PRUnLabeledHandler(context)
  });
}