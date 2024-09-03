import {DBAAS} from "../../shared/project_ids";

// {sourceFieldId: []}
export type TargetFields = Record<string, Array<{
  projectId: string;
  fieldId: string;
  fieldType:
}>>;

export type SyncFieldsConfig = {
  forceSyncFieldId?: string;
  to: TargetFields;
};

// {sourceProjectId: []}
export const CONFIG: Record<string, SyncFieldsConfig> = {
  [DBAAS.projectId]: {},
}
