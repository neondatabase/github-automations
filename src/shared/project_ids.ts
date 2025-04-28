export interface NeonProject {
  projectNumber: number;
  projectId: string;
  trackedInFieldId?: string;
  forceSyncFieldId?: string;
  targetShipMothFieldId?: string;
  targetShipQuarterFieldId?: string;
  progressFieldId?: string;
  roadmapTargetShipQuarterFieldId?: string;
  statusFieldId?: string;
  figmaLinkFieldId?: string;
  statusLastUpdatedFieldId?: string;
  createdAtFieldId?: string;
  updatedAtFieldId?: string;
  closedAtFieldId?: string;
  hasParentInProjectFieldId?: string;
  teamLabelName?: string;
}

// project id: 8
export const NEON_PRIVATE_ROADMAP: NeonProject = {
  projectNumber: 8,
  projectId: "PVT_kwDOBKF3Cs4ADWZl",
  targetShipQuarterFieldId: "PVTIF_lADOBKF3Cs4ADWZlzgJK-lA",
  forceSyncFieldId: 'PVTF_lADOBKF3Cs4ADWZlzgKz5cA',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4ADWZlzgq6cQI',
};

// project id: 21
// project not in use, clean up?
export const CONSOLE: NeonProject = {
  projectNumber: 21,
  projectId: "PVT_kwDOBKF3Cs4AMKWT",
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AMKWTzgKS3O4',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4AMKWTzgsrQ-4',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4AMKWTzgsrQ-8',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4AMKWTzgsrRCA',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4AMKWTzgsrQ8k',
};

// project id: 6
// project not in use, clean up?
export const ENGINEERING: NeonProject = {
  projectNumber: 6,
  projectId: 'PVT_kwDOBKF3Cs1e-g',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs1e-s4Ck_-L',
};

interface DesignProject extends NeonProject {
  statusFieldId: string, figmaLinkFieldId: string
}

// project id: 17
export const PRODUCT_DESIGN: DesignProject = {
  projectNumber: 17,
  projectId: 'PVT_kwDOBKF3Cs4AL_Xj',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AL_XjzgKe_xI',
  statusFieldId: 'PVTSSF_lADOBKF3Cs4AL_XjzgHpb8U',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4AL_XjzgIGS9w',
  forceSyncFieldId: 'PVTF_lADOBKF3Cs4AL_XjzgfGov4',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4AL_Xjzgq6crc',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4AL_Xjzgq6ctY',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4AL_Xjzgq6cyY',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4AL_XjzgsrMuQ',
};

// project id: 14
export const DATA: NeonProject = {
  projectNumber: 14,
  projectId: 'PVT_kwDOBKF3Cs4ALGJW',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4ALGJWzgL3Pu8',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4ALGJWzgq6eeU',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4ALGJWzgq6ehY',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4ALGJWzgq6elU',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4ALGJWzgsrLas',
}

// project id: 25
export const DOCS: NeonProject = {
  projectNumber: 25,
  projectId: 'PVT_kwDOBKF3Cs4ANGVj',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4ANGVjzgL3PwQ',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4ANGVjzgq6YBo',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4ANGVjzgq6YCE',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4ANGVjzgq6YII',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4ANGVjzgsrN00',
}

// project id: 50
export const AUTOSCALING: NeonProject = {
  projectNumber: 50,
  projectId: 'PVT_kwDOBKF3Cs4ASNuf',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4ASNufzgLodD0',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4ASNufzgq6dGU',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4ASNufzgq6dH4',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4ASNufzgq6dKs',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4ASNufzgsrNho',
}

// project id: 48
export const CONTROL_PLANE: NeonProject = {
  projectNumber: 48,
  projectId: 'PVT_kwDOBKF3Cs4ASIxL',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4ASIxLzgLlRoA',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4ASIxLzgq6aHs',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4ASIxLzgq6aLc',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4ASIxLzgq6aNI',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4ASIxLzgsrOkc',
}

// project id: 49
export const COMPUTE: NeonProject = {
  projectNumber: 49,
  projectId: 'PVT_kwDOBKF3Cs4ASNk7',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4ASNk7zgLoW6k',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4ASNk7zgq6eL0',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4ASNk7zgq6eOE',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4ASNk7zgq6eOI',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4ASNk7zgsrQYM',
}

// project id: 51
export const STORAGE: NeonProject = {
  projectNumber: 51,
  projectId: 'PVT_kwDOBKF3Cs4AS3LL',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AS3LLzgMC_kM',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4AS3LLzgq6dt0',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4AS3LLzgq6dvY',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4AS3LLzgq6dxM',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4AS3LLzgsrQCs',
}

// project id: 65
export const PROXY: NeonProject = {
  projectNumber: 65,
  projectId: 'PVT_kwDOBKF3Cs4AUpZ9',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AUpZ9zgNMQiY',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4AUpZ9zgq6fXo',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4AUpZ9zgq6faA',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4AUpZ9zgq6fdE',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4AUpZ9zgsrP2w',
}

// project id: 72
export const SECURITY: NeonProject = {
  projectNumber: 72,
  projectId: 'PVT_kwDOBKF3Cs4AVPsD',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4AVPsDzgq6f4M',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4AVPsDzgq6f7Q',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4AVPsDzgq6f8E',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4AVPsDzgsrOuw',
}

// project id: 37
export const SRE: NeonProject = {
  projectNumber: 37,
  projectId: 'PVT_kwDOBKF3Cs4AQhn_',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AQhn_zgq6cLk',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4AQhn_zgq6btM',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4AQhn_zgq6buA',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4AQhn_zgq6b1k',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4AQhn_zgsrPo8',
}

// project id: 83
export const SUPPORT_ESCALATIONS: NeonProject = {
  projectNumber: 83,
  projectId: 'PVT_kwDOBKF3Cs4Aj1E_',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4Aj1E_zgq6gVA',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4Aj1E_zgq6gZo',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4Aj1E_zgq6gcU',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4Aj1E_zgsrSTg',
}

// project id: 104
export const PERFORMANCE_CORRECTNESS: NeonProject = {
  projectNumber: 104,
  projectId: 'PVT_kwDOBKF3Cs4As3oj',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4As3ojzgq6gxU',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4As3ojzgq6g1Q',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4As3ojzgq6g2I',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4As3ojzgsrPKg',
}

// project id: 80
export const DEVPROD: NeonProject = {
  projectNumber: 80,
  projectId: 'PVT_kwDOBKF3Cs4AfHq7',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4AfHq7zgq6bOA',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4AfHq7zgq6bPk',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4AfHq7zgq6bPs',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4AfHq7zgsrPA8',
}

// project id: 32
// unclear if project is in use
export const POSTGRES: NeonProject = {
  projectNumber: 32,
  projectId: 'PVT_kwDOBKF3Cs4AQQPR',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AQQPRzgL3QBI',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4AQQPRzgsrI6I',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4AQQPRzgsrJBc',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4AQQPRzgsrJEI',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4AQQPRzgsrI3E',
}

// project id: 11
// project is inactive
export const PRODUCT: NeonProject = {
  projectNumber: 11,
  projectId: 'PVT_kwDOBKF3Cs4AHA73',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AHA73zgL3Pzo',
}

// project id: 10
// projects is inactive
export const PIXEL_POINT: NeonProject = {
  projectNumber: 10,
  projectId: 'PVT_kwDOBKF3Cs4AFa_n',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AFa_nzgL3Q_s',
}

// project id: 64
// project is inactive
export const ALL_EPICS: NeonProject = {
  projectNumber: 64,
  projectId: 'PVT_kwDOBKF3Cs4AUkqb',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AUkqbzgNJOys',
}

// project id: 79
export const NEON_RELEASE_STATUS: NeonProject = {
  projectNumber: 79,
  projectId: 'PVT_kwDOBKF3Cs4AfDv2',
  statusLastUpdatedFieldId: 'PVTF_lADOBKF3Cs4AfDv2zgZ0RRw',
  statusFieldId: 'PVTSSF_lADOBKF3Cs4AfDv2zgUgpnk',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4AfDv2zgsrLCc',
}


// Product delivery projects
interface ProductDeliveryTeamProject extends NeonProject {
  teamLabelName: string;
  designStatusFieldId?: string;
  figmaLinkFieldId?: string;
}

// project id: 91
//consider removing, team not active
export const AI_EXPERIMENTS: ProductDeliveryTeamProject = {
  projectNumber: 91,
  projectId: 'PVT_kwDOBKF3Cs4Ak7Jy',
  teamLabelName: 'team/ai',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4Ak7JyzgdDpRQ',
  designStatusFieldId: 'PVTF_lADOBKF3Cs4Ak7JyzgsrKTk',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4Ak7JyzgsrKSA',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4Ak7JyzgsrJv4',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4Ak7JyzgsrJv8',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4Ak7JyzgsrJwA',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4Ak7JyzgsrJw0',
}

// project id: 90
export const AZURE: ProductDeliveryTeamProject = {
  projectNumber: 90,
  projectId: 'PVT_kwDOBKF3Cs4Ak7Jt',
  teamLabelName: 'team/azure',
  designStatusFieldId: 'PVTF_lADOBKF3Cs4Ak7Jtzgq6OAE',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4Ak7Jtzgq6OCg',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4Ak7JtzgdDpNA',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4Ak7Jtzgq6OCk',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4Ak7Jtzgq6OD0',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4Ak7Jtzgq6OG4',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4Ak7JtzgsrNXg',
}

// project id: 88
export const BAAS: ProductDeliveryTeamProject = {
  projectNumber: 88,
  projectId: 'PVT_kwDOBKF3Cs4Ak7JT',
  teamLabelName: 'team/baas',
  designStatusFieldId: 'PVTF_lADOBKF3Cs4Ak7JTzgfOU50',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4Ak7JTzgfOU7Y',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4Ak7JTzgdDo18',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4Ak7JTzgq6M_4',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4Ak7JTzgq6NBA',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4Ak7JTzgq6NE8',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4Ak7JTzgsrOMo',
}

// project id: 93
export const BILLING: ProductDeliveryTeamProject = {
  projectNumber: 93,
  projectId: 'PVT_kwDOBKF3Cs4Ak7J2',
  teamLabelName: 'team/billing 💰',
  designStatusFieldId: 'PVTF_lADOBKF3Cs4Ak7J2zgfOUZo',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4Ak7J2zgfOUb8',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4Ak7J2zgfOUfw',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4Ak7J2zgq6L7Q',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4Ak7J2zgq6L-I',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4Ak7J2zgq6MB0',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4Ak7J2zgsrPgI',
}

// project id: 87
export const DBAAS: ProductDeliveryTeamProject = {
  projectNumber: 87,
  projectId: 'PVT_kwDOBKF3Cs4AkjdS',
  teamLabelName: 'team/dbaas',
  designStatusFieldId: 'PVTF_lADOBKF3Cs4AkjdSzgfGXDk',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4AkjdSzgfNck4',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AkjdSzgfNlKw',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4AkjdSzgq2BWI',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4AkjdSzgq2BaU',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4AkjdSzgq2TQ0',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4AkjdSzgsjGO0',
}

// project id: 114
export const FE_INFRA: ProductDeliveryTeamProject = {
  projectNumber: 114,
  projectId: 'PVT_kwDOBKF3Cs4A1Hgc',
  teamLabelName: 'team/fe-infra',
  designStatusFieldId: 'PVTF_lADOBKF3Cs4A1Hgczgqo69U',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4A1Hgczgqo69Y',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4A1Hgczgqo69c',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4A1Hgczgq6Uhw',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4A1Hgczgq6UjU',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4A1Hgczgq6UmA',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4A1HgczgsrMKk',
}

// project id: 85
export const GROWTH: ProductDeliveryTeamProject = {
  projectNumber: 85,
  projectId: 'PVT_kwDOBKF3Cs4AkUgD',
  teamLabelName: 'team/growth',
  designStatusFieldId: 'PVTF_lADOBKF3Cs4AkUgDzgfOUuY',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4AkUgDzgfOUww',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AkUgDzgci9uA',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4AkUgDzgq6WMI',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4AkUgDzgq6WPc',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4AkUgDzgq6WRc',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4AkUgDzgsrQm0',
}

// project id: 95
export const IDENTITY: ProductDeliveryTeamProject = {
  projectNumber: 95,
  projectId: 'PVT_kwDOBKF3Cs4Ak_eq',
  teamLabelName: 'team/identity 🆔',
  designStatusFieldId: 'PVTF_lADOBKF3Cs4Ak_eqzgfNd0g',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4Ak_eqzgfNd10',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4Ak_eqzgfNlkU',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4Ak_eqzgq6B-c',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4Ak_eqzgq6CAc',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4Ak_eqzgq6CGA',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4Ak_eqzgsrM4w',
}

// project id: 105
export const SUPPORT_TOOLS: ProductDeliveryTeamProject = {
  projectNumber: 105,
  projectId: 'PVT_kwDOBKF3Cs4Atql6',
  teamLabelName: 'team/support-tools',
  designStatusFieldId: 'PVTF_lADOBKF3Cs4Atql6zgq6J-A',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4Atql6zgq6J7M',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4Atql6zgkhPos',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4Atql6zgq6JzE',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4Atql6zgq6J1A',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4Atql6zgq6JoU',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4Atql6zgsrK6g',
}

// project id: 89
export const WORKFLOW: ProductDeliveryTeamProject = {
  projectNumber: 89,
  projectId: 'PVT_kwDOBKF3Cs4Ak7Jm',
  teamLabelName: 'team/workflow',
  designStatusFieldId: 'PVTF_lADOBKF3Cs4Ak7JmzgfNqC0',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4Ak7JmzgfNqC4',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4Ak7JmzgdDpGM',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4Ak7Jmzgq6K0w',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4Ak7Jmzgq6K3A',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4Ak7Jmzgq6K5U',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4Ak7JmzgsrL54',
}
// project id: 98
export const QA: ProductDeliveryTeamProject = {
  projectNumber: 98,
  projectId: 'PVT_kwDOBKF3Cs4Al5CB',
  teamLabelName: 'team/qa',
  createdAtFieldId: 'PVTF_lADOBKF3Cs4Al5CBzgq6Veg',
  updatedAtFieldId: 'PVTF_lADOBKF3Cs4Al5CBzgq6Vgc',
  closedAtFieldId: 'PVTF_lADOBKF3Cs4Al5CBzgq6Vlc',
  hasParentInProjectFieldId: 'PVTF_lADOBKF3Cs4Al5CBzgssQA8',
}



export const PRODUCT_DELIVERY = [
  AI_EXPERIMENTS,
  AZURE,
  BAAS,
  BILLING,
  DBAAS,
  FE_INFRA,
  GROWTH,
  IDENTITY,
  QA,
  SUPPORT_TOOLS,
  WORKFLOW,
]

export const ALL_TEAMS_PROJECTS = [
  ...PRODUCT_DELIVERY,
  PRODUCT_DESIGN,
  DATA,
  DOCS,
  AUTOSCALING,
  CONTROL_PLANE,
  COMPUTE,
  STORAGE,
  PROXY,
  SECURITY,
  SRE,
  PERFORMANCE_CORRECTNESS,
  DEVPROD,
  SUPPORT_ESCALATIONS,
  NEON_RELEASE_STATUS,
  POSTGRES,
  CONSOLE,
  ENGINEERING,
  PRODUCT,
  PIXEL_POINT,
  ALL_EPICS,
]
