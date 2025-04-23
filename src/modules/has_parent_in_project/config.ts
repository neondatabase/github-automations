import {ALL_TEAMS_PROJECTS} from "../../shared/project_ids";

export const HAS_PARENT_IN_PROJECT_VALUE = 1; // @ts-ignore
export const configArr = ALL_TEAMS_PROJECTS.filter((projData) => (projData.projectId && projData.hasParentInProjectFieldId));
//@ts-ignore
export const config = Object.fromEntries(configArr.map(projData => ([projData.projectId, projData.hasParentInProjectFieldId])))