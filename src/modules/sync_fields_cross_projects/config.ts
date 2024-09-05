import {PRODUCT_DELIVERY, PRODUCT_DESIGN} from "../../shared/project_ids";

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
// @ts-ignore
export const CONFIG: Record<string, SyncFieldsConfig> = {
  [PRODUCT_DESIGN.projectId]: {
    forceSyncFieldId: PRODUCT_DESIGN.forceSyncFieldId,
    to: {
      [PRODUCT_DESIGN.statusFieldId]: PRODUCT_DELIVERY
        .filter(({designStatusFieldId}) => !!designStatusFieldId)
        .map(({projectId, designStatusFieldId}) => ({
          projectId,
          designStatusFieldId,
        })),
      [PRODUCT_DESIGN.figmaLinkFieldId]: PRODUCT_DELIVERY
        .filter(({figmaLinkFieldId}) => !!figmaLinkFieldId)
        .map(({projectId, figmaLinkFieldId}) => ({
          projectId,
          figmaLinkFieldId,
        }))
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
