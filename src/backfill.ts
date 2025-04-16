import {Probot} from "probot";

import {backfill_created_updated_deleted} from "./modules";

// backfill scripts for automations, mostly run locally
export = async (app: Probot) => {

  // @ts-ignore
  const octo = await app.auth(process.env.GITHUB_INSTALLATION_ID);
  backfill_created_updated_deleted(octo);
};
