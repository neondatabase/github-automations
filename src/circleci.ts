import {Axios} from "axios";

export enum CirceCiJobs {
  DeployStaging = 'deploy-staging',
  DeployProduction = 'deploy-release',
  DeployProxyStaging = 'deploy-staging-proxy',
  DeployProxyProduction = 'deploy-release-proxy',
}

export const CircleCIClient = new Axios({
  baseURL: 'https://circleci.com/api/v2',
  headers: {
    'Circle-Token': process.env.CIRCLE_TOKEN || '',
  },
})
