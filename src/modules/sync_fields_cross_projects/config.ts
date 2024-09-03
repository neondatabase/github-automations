import {DBAAS, PRODUCT_DESIGN} from "../../shared/project_ids";

// {sourceFieldId: []}
export type TargetFields = Record<string, Array<{
  projectId: string;
  fieldId: string;
  // fieldType:
}>>;

export type SyncFieldsConfig = {
  forceSyncFieldId?: string;
  to: TargetFields;
};

// {sourceProjectId: []}
export const CONFIG: Record<string, SyncFieldsConfig> = {
  [PRODUCT_DESIGN.projectId]: {
    forceSyncFieldId: PRODUCT_DESIGN.forceSyncFieldId,
    to: {
      [PRODUCT_DESIGN.statusFieldId]: [
        {projectId: DBAAS.projectId, fieldId: DBAAS.designStatusFieldId}
      ]
    }
  },
}

function getTargetProjectIds(config: Record<string, SyncFieldsConfig>) {
  const projectsMap: Record<string, boolean> = {};
  Object.entries(config).forEach(([, item]) => {
    Object.entries(item.to).forEach(([, c]) => {
      c.forEach(entry => {
        projectsMap[entry.projectId] = true
      })
    })
  })
  return Object.keys(projectsMap);
}

export const WATCH_PROJECT_IDS = getTargetProjectIds(CONFIG);
