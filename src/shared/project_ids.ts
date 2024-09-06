interface NeonProject {
  projectId: string;
  trackedInFieldId?: string;
  forceSyncFieldId?: string;
  targetShipMothFieldId?: string;
  targetShipQuarterFieldId?: string;
  progressFieldId?: string;
  roadmapTargetShipMonthFieldId?: string;
  roadmapTargetShipQuarterFieldId?: string;
  statusFieldId?: string;
  figmaLinkFieldId?: string;
  statusLastUpdatedFieldId?: string;
}

// project id: 8
export const NEON_PRIVATE_ROADMAP: NeonProject = {
  projectId: "PVT_kwDOBKF3Cs4ADWZl",
  targetShipMothFieldId: "PVTIF_lADOBKF3Cs4ADWZlzgB7V1c",
  targetShipQuarterFieldId: "PVTIF_lADOBKF3Cs4ADWZlzgJK-lA",
  forceSyncFieldId: 'PVTF_lADOBKF3Cs4ADWZlzgKz5cA',
};

// project id: 21
export const CONSOLE: NeonProject = {
  projectId: "PVT_kwDOBKF3Cs4AMKWT",
  trackedInFieldId: 'PVTF_lADOBKF3Cs4AMKWTzgHwfhM',
  progressFieldId: 'PVTF_lADOBKF3Cs4AMKWTzgHwfhU',
  roadmapTargetShipMonthFieldId: 'PVTF_lADOBKF3Cs4AMKWTzgKSzlo',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AMKWTzgKS3O4',
};

// project id: 6
export const ENGINEERING: NeonProject = {
  projectId: 'PVT_kwDOBKF3Cs1e-g',
  trackedInFieldId: 'PVTF_lADOBKF3Cs1e-s4AB3Qt',
  progressFieldId: 'PVTF_lADOBKF3Cs1e-s4ADvDB',
  roadmapTargetShipMonthFieldId: 'PVTF_lADOBKF3Cs1e-s4Ck_92',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs1e-s4Ck_-L',
};

interface DesignProject extends NeonProject {
  statusFieldId: string, figmaLinkFieldId: string
}

// project id: 17
export const PRODUCT_DESIGN: DesignProject = {
  projectId: 'PVT_kwDOBKF3Cs4AL_Xj',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AL_XjzgKe_xI',
  roadmapTargetShipMonthFieldId: 'PVTF_lADOBKF3Cs4AL_XjzgL3Peo',
  trackedInFieldId: 'PVTF_lADOBKF3Cs4AL_XjzgL3Qvg',
  statusFieldId: 'PVTSSF_lADOBKF3Cs4AL_XjzgHpb8U',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4AL_XjzgIGS9w',
  forceSyncFieldId: 'PVTF_lADOBKF3Cs4AL_XjzgfGov4',
};

// project id: 37
export const INFRA: NeonProject = {
  projectId: 'PVT_kwDOBKF3Cs4AQhn_',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AQhn_zgKjQLU',
  roadmapTargetShipMonthFieldId: 'PVTF_lADOBKF3Cs4AQhn_zgKjQLQ',
  trackedInFieldId: 'PVTF_lADOBKF3Cs4AQhn_zgKjQK4',
}

// project id: 50
export const AUTOSCALING: NeonProject = {
  projectId: 'PVT_kwDOBKF3Cs4ASNuf',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4ASNufzgLodD0',
  roadmapTargetShipMonthFieldId: 'PVTF_lADOBKF3Cs4ASNufzgLodDw',
  trackedInFieldId: 'PVTF_lADOBKF3Cs4ASNufzgLodDY',

}

// project id: 48
export const CONTROL_PLANE: NeonProject = {
  projectId: 'PVT_kwDOBKF3Cs4ASIxL',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4ASIxLzgLlRoA',
  roadmapTargetShipMonthFieldId: 'PVTF_lADOBKF3Cs4ASIxLzgLlRn8',
  trackedInFieldId: 'PVTF_lADOBKF3Cs4ASIxLzgLlRnk',
}

// project id: 14
export const DATA: NeonProject = {
  projectId: 'PVT_kwDOBKF3Cs4ALGJW',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4ALGJWzgL3Pu8',
  roadmapTargetShipMonthFieldId: 'PVTF_lADOBKF3Cs4ALGJWzgL3PuQ',
  trackedInFieldId: 'PVTF_lADOBKF3Cs4ALGJWzgL3RAY',
}

// project id: 49
export const COMPUTE: NeonProject = {
  projectId: 'PVT_kwDOBKF3Cs4ASNk7',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4ASNk7zgLoW6k',
  roadmapTargetShipMonthFieldId: 'PVTF_lADOBKF3Cs4ASNk7zgLoW6g',
  trackedInFieldId: 'PVTF_lADOBKF3Cs4ASNk7zgLoW6I',
}

// project id: 25
export const DOCS: NeonProject = {
  projectId: 'PVT_kwDOBKF3Cs4ANGVj',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4ANGVjzgL3PwQ',
  roadmapTargetShipMonthFieldId: 'PVTF_lADOBKF3Cs4ANGVjzgL3Pw8',
  trackedInFieldId: 'PVTF_lADOBKF3Cs4ANGVjzgL3RHs',
}

// project id: 32
export const POSTGRES: NeonProject = {
  projectId: 'PVT_kwDOBKF3Cs4AQQPR',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AQQPRzgL3QBI',
  roadmapTargetShipMonthFieldId: 'PVTF_lADOBKF3Cs4AQQPRzgL3QAc',
  trackedInFieldId: 'PVTF_lADOBKF3Cs4AQQPRzgL3RLg',
}

// project id: 11
export const PRODUCT: NeonProject = {
  projectId: 'PVT_kwDOBKF3Cs4AHA73',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AHA73zgL3Pzo',
  roadmapTargetShipMonthFieldId: 'PVTF_lADOBKF3Cs4AHA73zgL3Pzk',
  trackedInFieldId: 'PVTF_lADOBKF3Cs4AHA73zgL3RSk',
}

// project id: 10
export const PIXEL_POINT: NeonProject = {
  projectId: 'PVT_kwDOBKF3Cs4AFa_n',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AFa_nzgL3Q_s',
  roadmapTargetShipMonthFieldId: 'PVTF_lADOBKF3Cs4AFa_nzgL3Q_A',
  trackedInFieldId: 'PVTF_lADOBKF3Cs4AFa_nzgL3Raw',
}

// project id: 64
export const ALL_EPICS: NeonProject = {
  projectId: 'PVT_kwDOBKF3Cs4AUkqb',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AUkqbzgNJOys',
  roadmapTargetShipMonthFieldId: 'PVTF_lADOBKF3Cs4AUkqbzgNJOyo',
}

// project id: 79
export const NEON_RELEASE_STATUS: NeonProject = {
  projectId: 'PVT_kwDOBKF3Cs4AfDv2',
  statusLastUpdatedFieldId: 'PVTF_lADOBKF3Cs4AfDv2zgZ0RRw',
  statusFieldId: 'PVTSSF_lADOBKF3Cs4AfDv2zgUgpnk',
}


// Product delivery projects
interface ProductDeliveryTeamProject extends NeonProject {
  teamLabelName: string;
  designStatusFieldId?: string;
  figmaLinkFieldId?: string;
  roadmapTargetShipQuarterFieldId?: string;
}

// project id: 95
export const IDENTITY: ProductDeliveryTeamProject = {
  projectId: 'PVT_kwDOBKF3Cs4Ak_eq',
  trackedInFieldId: 'PVTF_lADOBKF3Cs4Ak_eqzgdHTgc',
  teamLabelName: 'team/identity 🆔',
  designStatusFieldId: 'PVTF_lADOBKF3Cs4Ak_eqzgfNd0g',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4Ak_eqzgfNd10',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4Ak_eqzgfNlkU'
}

// project id: 87
export const DBAAS: ProductDeliveryTeamProject = {
  projectId: 'PVT_kwDOBKF3Cs4AkjdS',
  trackedInFieldId: 'PVTF_lADOBKF3Cs4AkjdSzgcvnTs',
  teamLabelName: 'team/dbaas',
  designStatusFieldId: 'PVTF_lADOBKF3Cs4AkjdSzgfGXDk',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4AkjdSzgfNck4',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AkjdSzgfNlKw'
}

// project id: 89
export const WORKFLOW: ProductDeliveryTeamProject = {
  projectId: 'PVT_kwDOBKF3Cs4Ak7Jm',
  trackedInFieldId: 'PVTF_lADOBKF3Cs4Ak7JmzgdDpF0',
  teamLabelName: 'team/workflow',
  designStatusFieldId: 'PVTF_lADOBKF3Cs4Ak7JmzgfNqC0',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4Ak7JmzgfNqC4',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4Ak7JmzgdDpGM'
}

// project id: 93
export const BILLING: ProductDeliveryTeamProject = {
  projectId: 'PVT_kwDOBKF3Cs4Ak7J2',
  teamLabelName: 'team/billing 💰',
  designStatusFieldId: 'PVTF_lADOBKF3Cs4Ak7J2zgfOUZo',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4Ak7J2zgfOUb8',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4Ak7J2zgfOUfw'
}

// project id: 85
export const GROWTH: ProductDeliveryTeamProject = {
  projectId: 'PVT_kwDOBKF3Cs4AkUgD',
  teamLabelName: 'team/growth',
  designStatusFieldId: 'PVTF_lADOBKF3Cs4AkUgDzgfOUuY',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4AkUgDzgfOUww',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4AkUgDzgci9uA'
}

// project id: 88
export const BAAS: ProductDeliveryTeamProject = {
  projectId: 'PVT_kwDOBKF3Cs4Ak7JT',
  teamLabelName: 'team/baas',
  designStatusFieldId: 'PVTF_lADOBKF3Cs4Ak7JTzgfOU50',
  figmaLinkFieldId: 'PVTF_lADOBKF3Cs4Ak7JTzgfOU7Y',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4Ak7JTzgdDo18'
}

// project id: 91
export const AI_EXPERIMENTS: ProductDeliveryTeamProject = {
  projectId: 'PVT_kwDOBKF3Cs4Ak7Jy',
  teamLabelName: 'team/ai',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4Ak7JyzgdDpRQ'
}

// project id: 98
export const QA: ProductDeliveryTeamProject = {
  projectId: 'PVT_kwDOBKF3Cs4Al5CB',
  teamLabelName: 'team/qa',
}

// project id: 90
export const AZURE: ProductDeliveryTeamProject = {
  projectId: 'PVT_kwDOBKF3Cs4Ak7Jt',
  teamLabelName: 'team/azure',
  // designStatusFieldId: '...',
  // figmaLinkFieldId: '...',
  roadmapTargetShipQuarterFieldId: 'PVTF_lADOBKF3Cs4Ak7JtzgdDpNA'
}

export const PRODUCT_DELIVERY = [
  BILLING,
  IDENTITY,
  DBAAS,
  BAAS,
  WORKFLOW,
  GROWTH,
  QA,
  AI_EXPERIMENTS,
  AZURE
]

export const ALL_TEAMS_PROJECTS = [
  ...PRODUCT_DELIVERY,
  CONSOLE,
  ENGINEERING,
  PRODUCT_DESIGN,
  INFRA,
  AUTOSCALING,
  CONTROL_PLANE,
  DATA,
  COMPUTE,
  DOCS,
  POSTGRES,
  PRODUCT,
  PIXEL_POINT,
  ALL_EPICS,
  NEON_RELEASE_STATUS,
]