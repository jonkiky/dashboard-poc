import type { Asset, Approval, AuditEvent, GovernanceState, ReviewDraft } from '../domain/types';
import { POLICY_VERSION } from '../domain/engine';

/** All content below is fictional local simulation data, not NIH/NCI policy or approvals. */
const seedAssets: Asset[] = [
  {
    "id": "mcp-imaging",
    "name": "Imaging Metadata Connector",
    "subtitle": "Public imaging collections · MCP server",
    "description": "Read synthetic collection metadata and download a sample manifest for public imaging research.",
    "type": "mcp",
    "owner": "Mira Patel",
    "team": "Illustrative Imaging Informatics Team",
    "version": "1.2.0",
    "status": "approved",
    "risk": "low",
    "submittedAt": "2026-11-02",
    "reviewDue": "2026-11-05",
    "dataClass": "Public",
    "environment": "Research sandbox",
    "permissions": [
      "read:metadata",
      "download:manifest"
    ],
    "destinations": [
      "https://public-imaging.example.invalid/mcp"
    ],
    "dependencies": [],
    "evidence": [
      {
        "id": "imaging-security",
        "title": "Package and permission checks",
        "detail": "Simulated package digest verified; only read and manifest actions are declared.",
        "result": "passed"
      },
      {
        "id": "imaging-privacy",
        "title": "Public metadata boundary",
        "detail": "Synthetic public collection records only; no patient or participant fields.",
        "result": "passed"
      },
      {
        "id": "imaging-validation",
        "title": "Connector contract validation",
        "detail": "Simulated metadata and manifest examples match the declared schema.",
        "result": "passed"
      }
    ],
    "source": "{\n  \"$schema\": \"https://schemas.example.invalid/server.schema.json\",\n  \"name\": \"invalid.example.demo/mcp-imaging\",\n  \"title\": \"Imaging Metadata Connector\",\n  \"description\": \"Public imaging metadata and manifests. Synthetic demonstration package; no real service is deployed.\",\n  \"version\": \"1.2.0\",\n  \"remotes\": [\n    {\n      \"type\": \"streamable-http\",\n      \"url\": \"https://public-imaging.example.invalid/mcp\"\n    }\n  ],\n  \"_meta\": {\n    \"invalid.example.demo\": {\n      \"simulationOnly\": true,\n      \"dataClass\": \"Public\",\n      \"allowedActions\": [\n        \"read:metadata\",\n        \"download:manifest\"\n      ],\n      \"notice\": \"Illustrative metadata, not NIH policy or a working integration.\"\n    }\n  }\n}\n",
    "sourcePath": "/mock-assets/mcp-imaging/server.json",
    "useCase": "Explore public imaging collections and prepare a manifest for a research workspace.",
    "conditions": [
      "Public collection metadata only.",
      "No image pixels or participant-level records.",
      "Use only the declared read and manifest actions."
    ],
    "findings": []
  },
  {
    "id": "mcp-publications",
    "name": "Literature Search Connector",
    "subtitle": "Public abstracts and citations · MCP server",
    "description": "Search a simulated public literature index and return citations with stable source identifiers.",
    "type": "mcp",
    "owner": "Evan Cole",
    "team": "Illustrative Research Discovery Team",
    "version": "2.1.0",
    "status": "approved",
    "risk": "low",
    "submittedAt": "2026-11-02",
    "reviewDue": "2026-11-05",
    "dataClass": "Public",
    "environment": "Research sandbox",
    "permissions": [
      "read:literature"
    ],
    "destinations": [
      "https://publications.example.invalid/mcp"
    ],
    "dependencies": [],
    "evidence": [
      {
        "id": "publications-security",
        "title": "Read-only tool surface",
        "detail": "The sample server exposes literature search only; no write operations.",
        "result": "passed"
      },
      {
        "id": "publications-privacy",
        "title": "Public source review",
        "detail": "The demo corpus contains synthetic public abstracts and citation metadata.",
        "result": "passed"
      },
      {
        "id": "publications-validation",
        "title": "Citation schema checks",
        "detail": "Sample responses include title, source identifier, and retrieval context.",
        "result": "passed"
      }
    ],
    "source": "{\n  \"$schema\": \"https://schemas.example.invalid/server.schema.json\",\n  \"name\": \"invalid.example.demo/mcp-publications\",\n  \"title\": \"Literature Search Connector\",\n  \"description\": \"Read-only public literature discovery. Synthetic demonstration package; no real service is deployed.\",\n  \"version\": \"2.1.0\",\n  \"remotes\": [\n    {\n      \"type\": \"streamable-http\",\n      \"url\": \"https://publications.example.invalid/mcp\"\n    }\n  ],\n  \"_meta\": {\n    \"invalid.example.demo\": {\n      \"simulationOnly\": true,\n      \"dataClass\": \"Public\",\n      \"allowedActions\": [\n        \"read:literature\"\n      ],\n      \"notice\": \"Illustrative metadata, not NIH policy or a working integration.\"\n    }\n  }\n}\n",
    "sourcePath": "/mock-assets/mcp-publications/server.json",
    "useCase": "Find public research literature and export a cited reading list.",
    "conditions": [
      "Public literature queries only.",
      "Do not include unpublished findings or sensitive identifiers in queries."
    ],
    "findings": []
  },
  {
    "id": "mcp-labfiles",
    "name": "Lab Workspace File Index",
    "subtitle": "Internal file metadata · MCP server",
    "description": "List metadata for synthetic laboratory workspace files inside the internal research sandbox, without reading file contents or exporting data.",
    "type": "mcp",
    "owner": "Jules Bennett",
    "team": "Illustrative Lab Enablement Team",
    "version": "0.1.0",
    "status": "in-review",
    "risk": "moderate",
    "submittedAt": "2026-11-02",
    "reviewDue": "2026-11-05",
    "dataClass": "Internal",
    "environment": "Research sandbox",
    "permissions": [
      "read:file-metadata"
    ],
    "destinations": [
      "internal network"
    ],
    "dependencies": [],
    "evidence": [
      {
        "id": "labfiles-security",
        "title": "Metadata-only permission review",
        "detail": "Simulated package and permission checks confirm read:file-metadata only; no file-content, execution, write, or export tools.",
        "result": "passed"
      },
      {
        "id": "labfiles-privacy",
        "title": "Internal data and destination boundary",
        "detail": "Synthetic file names, sizes, and formats remain in Research sandbox within the internal network scenario.",
        "result": "passed"
      },
      {
        "id": "labfiles-validation",
        "title": "Connector contract validation",
        "detail": "Simulated contract examples pass metadata schema, path-boundary, and missing-file handling checks.",
        "result": "passed"
      },
      {
        "id": "labfiles-ownership",
        "title": "Maintainer responsibilities acknowledged",
        "detail": "The illustrative owner has accepted the demo maintenance, scoped-use, and review responsibilities.",
        "result": "passed"
      }
    ],
    "source": "{\n  \"$schema\": \"https://schemas.example.invalid/server.schema.json\",\n  \"name\": \"invalid.example.demo/mcp-labfiles\",\n  \"title\": \"Lab Workspace File Index\",\n  \"description\": \"Metadata-only internal laboratory workspace listing. Synthetic demonstration package; no real service is deployed.\",\n  \"version\": \"0.1.0\",\n  \"remotes\": [\n    {\n      \"type\": \"streamable-http\",\n      \"url\": \"https://labfiles.internal.example.invalid/mcp\"\n    }\n  ],\n  \"_meta\": {\n    \"invalid.example.demo\": {\n      \"simulationOnly\": true,\n      \"dataClass\": \"Internal\",\n      \"allowedActions\": [\n        \"read:file-metadata\"\n      ],\n      \"notice\": \"Illustrative metadata, not NIH policy or a working integration.\"\n    }\n  }\n}\n",
    "sourcePath": "/mock-assets/mcp-labfiles/server.json",
    "useCase": "Inspect synthetic laboratory workspace file metadata for research organization and reproducibility planning.",
    "conditions": [
      "Synthetic Internal metadata only in Research sandbox.",
      "No file contents, unrestricted paths, writes, execution, or data export.",
      "Human review is required before relying on metadata summaries."
    ],
    "findings": [
      "Simulated evidence is complete; four reviewer attestations and a named approval decision are required."
    ]
  },
  {
    "id": "mcp-clinical",
    "name": "Clinical Cohort Export Connector",
    "subtitle": "Controlled data export · MCP server",
    "description": "A deliberately blocked scenario that requests controlled record access and export to an external destination.",
    "type": "mcp",
    "owner": "Samira Wells",
    "team": "Illustrative Clinical Analytics Team",
    "version": "0.3.0",
    "status": "in-review",
    "risk": "high",
    "submittedAt": "2026-11-02",
    "reviewDue": "2026-11-05",
    "dataClass": "Controlled",
    "environment": "Research sandbox",
    "permissions": [
      "read:records",
      "export:cohort"
    ],
    "destinations": [
      "https://external-clinical.example.invalid/mcp"
    ],
    "dependencies": [],
    "evidence": [
      {
        "id": "clinical-security",
        "title": "External export boundary",
        "detail": "Failed simulated check: controlled records would cross the declared external destination boundary.",
        "result": "failed"
      },
      {
        "id": "clinical-privacy",
        "title": "Data-use and privacy evidence",
        "detail": "No simulated data-use authorization or privacy assessment is attached.",
        "result": "failed"
      },
      {
        "id": "clinical-validation",
        "title": "Output validation incomplete",
        "detail": "Cohort export evaluation and destination containment evidence are missing.",
        "result": "attention"
      }
    ],
    "source": "{\n  \"$schema\": \"https://schemas.example.invalid/server.schema.json\",\n  \"name\": \"invalid.example.demo/mcp-clinical\",\n  \"title\": \"Clinical Cohort Export Connector\",\n  \"description\": \"Intentionally blocked controlled-data export scenario. Synthetic demonstration package; no real service is deployed.\",\n  \"version\": \"0.3.0\",\n  \"remotes\": [\n    {\n      \"type\": \"streamable-http\",\n      \"url\": \"https://external-clinical.example.invalid/mcp\"\n    }\n  ],\n  \"_meta\": {\n    \"invalid.example.demo\": {\n      \"simulationOnly\": true,\n      \"dataClass\": \"Controlled\",\n      \"allowedActions\": [\n        \"read:records\",\n        \"export:cohort\"\n      ],\n      \"notice\": \"Illustrative metadata, not NIH policy or a working integration.\"\n    }\n  }\n}\n",
    "sourcePath": "/mock-assets/mcp-clinical/server.json",
    "useCase": "Demonstrate a blocked request to export controlled cohort records outside the approved boundary.",
    "conditions": [
      "Blocked scenario: never transmit any actual data.",
      "Resolve the external destination and failed evidence before resubmission."
    ],
    "findings": [
      "Controlled data is paired with an external destination.",
      "Security and privacy evidence failed.",
      "Reviewer attestations cannot override these hard blockers."
    ]
  },
  {
    "id": "skill-cohort",
    "name": "Public Imaging Cohort Planner",
    "subtitle": "Collection exploration workflow · Agent skill",
    "description": "Turn a research question into a candidate collection list and reviewable manifest using approved metadata tools.",
    "type": "skill",
    "owner": "Lena Brooks",
    "team": "Illustrative Imaging Informatics Team",
    "version": "1.0.0",
    "status": "approved",
    "risk": "moderate",
    "submittedAt": "2026-11-02",
    "reviewDue": "2026-11-05",
    "dataClass": "Public",
    "environment": "Research sandbox",
    "permissions": [
      "read:metadata",
      "download:manifest"
    ],
    "destinations": [
      "https://public-imaging.example.invalid/mcp"
    ],
    "dependencies": [
      "mcp-imaging"
    ],
    "evidence": [
      {
        "id": "cohort-security",
        "title": "Dependency scope checked",
        "detail": "Uses the approved Imaging Metadata Connector with matching public-data and sandbox scope.",
        "result": "passed"
      },
      {
        "id": "cohort-privacy",
        "title": "Workflow data boundary",
        "detail": "Uses synthetic collection-level metadata and never infers patient identity.",
        "result": "passed"
      },
      {
        "id": "cohort-validation",
        "title": "Workflow evaluation",
        "detail": "The simulated evaluation checks source attribution, manifest shape, and human review instructions.",
        "result": "passed"
      }
    ],
    "source": "---\nname: skill-cohort\ndescription: Draft a reviewable public imaging collection plan using simulated metadata.\nmetadata:\n  simulation-only: \"true\"\n  publisher: \"Illustrative demo team\"\n---\n\n# Public Imaging Cohort Planner\n\n> Synthetic demonstration asset. This package is for a local proof of concept only.\n> It does not represent NIH/NCI policy, scientific validation, or authorization.\n\n## Prerequisite\n\nUse `mcp-imaging` version `1.2.0` in `Research sandbox` with Public data only.\nAllowed actions are `read:metadata` and `download:manifest`.\n\n## Workflow\n\n1. Ask for a public collection-level research question without personal identifiers.\n2. Read synthetic metadata from the approved connector.\n3. Show candidate collections with source IDs and explicit limitations.\n4. Prepare a simulated manifest and request researcher review before further use.\n\n## Output\n\nReturn a candidate collection table, declared selection criteria, source references,\nand a sample manifest. This workflow cannot establish scientific or clinical validity.\n\n## Execution boundary\n\nDo not contact live services. Return simulated results only. Never accept patient,\nparticipant, genomic, credential, or other real sensitive data in this demonstration.\n",
    "sourcePath": "/mock-assets/skill-cohort/SKILL.md",
    "useCase": "Draft a candidate public imaging cohort plan for a researcher to review.",
    "conditions": [
      "Research planning only; no clinical or participant eligibility decisions.",
      "A researcher reviews all cohort criteria and outputs.",
      "Uses only the pinned approved connector version."
    ],
    "findings": []
  },
  {
    "id": "skill-reproducibility",
    "name": "Research Reproducibility Checklist",
    "subtitle": "Methods documentation workflow · Agent skill",
    "description": "Build a reproducibility checklist from a synthetic public methods note and its cited literature.",
    "type": "skill",
    "owner": "Noah Rivers",
    "team": "Illustrative Research Methods Team",
    "version": "0.4.2",
    "status": "approved",
    "risk": "low",
    "submittedAt": "2026-11-02",
    "reviewDue": "2026-11-05",
    "dataClass": "Public",
    "environment": "Research sandbox",
    "permissions": [
      "read:literature"
    ],
    "destinations": [
      "https://publications.example.invalid/mcp"
    ],
    "dependencies": [
      "mcp-publications"
    ],
    "evidence": [
      {
        "id": "repro-security",
        "title": "Instruction review",
        "detail": "Sample instructions contain no shell execution or write operations.",
        "result": "passed"
      },
      {
        "id": "repro-privacy",
        "title": "Input restrictions",
        "detail": "The demonstration accepts synthetic public methods text only.",
        "result": "passed"
      },
      {
        "id": "repro-validation",
        "title": "Checklist evaluation",
        "detail": "Simulated outputs identify missing versions, parameters, and source references.",
        "result": "passed"
      }
    ],
    "source": "---\nname: skill-reproducibility\ndescription: Prepare a reproducibility checklist from synthetic public methods.\nmetadata:\n  simulation-only: \"true\"\n  publisher: \"Illustrative demo team\"\n---\n\n# Research Reproducibility Checklist\n\n> Synthetic demonstration asset. This package is for a local proof of concept only.\n> It does not represent NIH/NCI policy, scientific validation, or authorization.\n\n## Workflow\n\n1. Read a synthetic public methods note supplied in the local demonstration.\n2. Use `mcp-publications` version `2.1.0` with `read:literature` if citations need context.\n3. List missing software versions, parameters, data provenance, and limitations.\n4. Produce a review checklist with citations and unresolved questions.\n\nDo not invent experiments, results, identifiers, or validation claims.\n\n## Execution boundary\n\nDo not contact live services. Return simulated results only. Never accept patient,\nparticipant, genomic, credential, or other real sensitive data in this demonstration.\n",
    "sourcePath": "/mock-assets/skill-reproducibility/SKILL.md",
    "useCase": "Prepare a reproducibility review checklist for public research methods.",
    "conditions": [
      "Human review required before publication.",
      "Checklist completion does not establish scientific validity."
    ],
    "findings": []
  },
  {
    "id": "skill-literature",
    "name": "Literature Evidence Brief",
    "subtitle": "Cited research summary · Agent skill",
    "description": "Produce a draft evidence brief from synthetic public literature with citations, uncertainty, and a human review step.",
    "type": "skill",
    "owner": "Ari Morgan",
    "team": "Illustrative Research Discovery Team",
    "version": "0.8.0",
    "status": "in-review",
    "risk": "low",
    "submittedAt": "2026-11-02",
    "reviewDue": "2026-11-05",
    "dataClass": "Public",
    "environment": "Research sandbox",
    "permissions": [
      "read:literature"
    ],
    "destinations": [
      "https://publications.example.invalid/mcp"
    ],
    "dependencies": [
      "mcp-publications"
    ],
    "evidence": [
      {
        "id": "literature-security",
        "title": "Instructions and dependencies",
        "detail": "Simulated review found read-only instructions and one approved dependency.",
        "result": "passed"
      },
      {
        "id": "literature-privacy",
        "title": "Public query boundary",
        "detail": "Sample queries contain no patient identifiers, controlled data, or unpublished material.",
        "result": "passed"
      },
      {
        "id": "literature-validation",
        "title": "Citation and uncertainty evaluation",
        "detail": "Simulated tests pass source attribution, unsupported-claim handling, and uncertainty labeling.",
        "result": "passed"
      },
      {
        "id": "literature-ownership",
        "title": "Maintainer acknowledged",
        "detail": "The illustrative owner has accepted the demo maintenance and review responsibilities.",
        "result": "passed"
      }
    ],
    "source": "---\nname: skill-literature\ndescription: Draft a cited brief from synthetic public literature for researcher review.\nmetadata:\n  simulation-only: \"true\"\n  publisher: \"Illustrative demo team\"\n---\n\n# Literature Evidence Brief\n\n> Synthetic demonstration asset. This package is for a local proof of concept only.\n> It does not represent NIH/NCI policy, scientific validation, or authorization.\n\n## Prerequisite\n\nUse `mcp-publications` version `2.1.0` in `Research sandbox` with Public data.\nThe only allowed action is `read:literature`.\n\n## Workflow\n\n1. Accept a public research question without sensitive or unpublished content.\n2. Retrieve simulated literature metadata through the approved connector.\n3. Separate reported findings, uncertainty, and interpretation.\n4. Cite each source and identify missing or conflicting evidence.\n5. Present a draft for human review; do not offer clinical recommendations.\n\n## Evaluation notes\n\nLocal synthetic examples check citation completeness, abstention when support is\nmissing, and explicit uncertainty. These checks are demonstration evidence only.\n\n## Execution boundary\n\nDo not contact live services. Return simulated results only. Never accept patient,\nparticipant, genomic, credential, or other real sensitive data in this demonstration.\n",
    "sourcePath": "/mock-assets/skill-literature/SKILL.md",
    "useCase": "Draft a cited evidence brief from public research literature for human review.",
    "conditions": [
      "Public literature only.",
      "Draft output must be reviewed by a researcher.",
      "No clinical recommendations or automated decisions."
    ],
    "findings": [
      "Automated demo evidence is complete; four reviewer attestations are still required."
    ]
  },
  {
    "id": "skill-protocol",
    "name": "Protocol Checklist Assistant",
    "subtitle": "Internal document review · Agent skill",
    "description": "Draft a completeness checklist for a synthetic internal protocol document without modifying source records.",
    "type": "skill",
    "owner": "Theo Grant",
    "team": "Illustrative Protocol Operations Team",
    "version": "0.5.1",
    "status": "in-review",
    "risk": "moderate",
    "submittedAt": "2026-11-02",
    "reviewDue": "2026-11-05",
    "dataClass": "Internal",
    "environment": "Research sandbox",
    "permissions": [
      "read:documents"
    ],
    "destinations": [
      "internal network"
    ],
    "dependencies": [],
    "evidence": [
      {
        "id": "protocol-security",
        "title": "Read-only instruction review",
        "detail": "No execution, publication, or document write action is requested.",
        "result": "passed"
      },
      {
        "id": "protocol-privacy",
        "title": "Metadata handling review",
        "detail": "The demo privacy reviewer must confirm whether document headers need redaction.",
        "result": "attention"
      },
      {
        "id": "protocol-validation",
        "title": "Completeness checks",
        "detail": "Synthetic examples surface omitted sections without asserting regulatory approval.",
        "result": "passed"
      }
    ],
    "source": "---\nname: skill-protocol\ndescription: Draft a completeness checklist from a synthetic internal protocol.\nmetadata:\n  simulation-only: \"true\"\n  publisher: \"Illustrative demo team\"\n---\n\n# Protocol Checklist Assistant\n\n> Synthetic demonstration asset. This package is for a local proof of concept only.\n> It does not represent NIH/NCI policy, scientific validation, or authorization.\n\n## Scope\n\nEnvironment: `Research sandbox`. Data class: Internal. Action: `read:documents`.\nRead only locally supplied synthetic documents inside the internal network scenario.\n\n## Workflow\n\n1. Confirm the input is a synthetic internal protocol example.\n2. Identify expected sections and flag missing information.\n3. Quote only the minimum needed to explain each completeness finding.\n4. Return a draft checklist for the document owner to review.\n\nDo not assert protocol approval, ethics approval, or regulatory compliance.\n\n## Execution boundary\n\nDo not contact live services. Return simulated results only. Never accept patient,\nparticipant, genomic, credential, or other real sensitive data in this demonstration.\n",
    "sourcePath": "/mock-assets/skill-protocol/SKILL.md",
    "useCase": "Draft a completeness checklist for a synthetic internal protocol document.",
    "conditions": [
      "Synthetic internal documents only.",
      "Does not replace protocol, ethics, or regulatory review."
    ],
    "findings": [
      "Privacy reviewer should resolve the document-header handling note."
    ]
  }
];

const seedAudit: AuditEvent[] = [
  { id: 'audit-seed-labfiles-submitted', timestamp: '2026-11-02T14:40:00Z', actor: 'Jules Bennett (demo)', action: 'MCP submitted for review', assetId: 'mcp-labfiles', detail: 'Lab Workspace File Index v0.1.0 submitted for Internal metadata-only use in Research sandbox with four passing synthetic evidence records.', category: 'review' },
  { id: 'audit-seed-6', timestamp: '2026-11-02T14:30:00Z', actor: 'Demo policy engine', action: 'Policy blocker detected', assetId: 'mcp-clinical', detail: 'Simulated controlled-data export targets an external destination; failed evidence prevents approval.', category: 'system' },
  { id: 'audit-seed-5', timestamp: '2026-11-02T14:20:00Z', actor: 'Ari Morgan (demo)', action: 'Submitted for review', assetId: 'skill-literature', detail: 'Literature Evidence Brief v0.8.0 submitted with four passing simulated evidence records.', category: 'review' },
  { id: 'audit-seed-4', timestamp: '2026-11-02T14:10:00Z', actor: 'Theo Grant (demo)', action: 'Evidence updated', assetId: 'skill-protocol', detail: 'Added synthetic protocol validation evidence; privacy handling note remains open.', category: 'change' },
  { id: 'audit-seed-3', timestamp: '2026-11-02T14:00:00Z', actor: 'Demo review team', action: 'Scoped approval recorded', assetId: 'skill-cohort', detail: 'Approved exact v1.0.0 for Public data in Research sandbox with read:metadata and download:manifest only.', category: 'review' },
  { id: 'audit-seed-2', timestamp: '2026-11-02T13:50:00Z', actor: 'Demo researcher', action: 'Catalog viewed', assetId: 'mcp-imaging', detail: 'Viewed the illustrative connector passport and its source metadata; no external service was contacted.', category: 'access' },
  { id: 'audit-seed-1', timestamp: '2026-11-02T13:40:00Z', actor: 'Demo workspace', action: 'Demonstration initialized', detail: 'Loaded eight fictional assets and four scoped approvals. No production systems or real research data are connected.', category: 'system' },
];

export function createSeedState(): GovernanceState {
  const assets = structuredClone(seedAssets);
  const approvals: Approval[] = assets.filter((asset) => asset.status === 'approved').map((asset) => ({
    id: `approval-seed-${asset.id}`,
    assetId: asset.id,
    version: asset.version,
    purpose: asset.useCase,
    dataClass: asset.dataClass,
    environment: asset.environment,
    allowedActions: [...asset.permissions],
    conditions: [...asset.conditions],
    reviewedBy: 'Demo review team',
    reviewedAt: '2026-11-02T13:30:00Z',
    expiresAt: '2027-06-01',
    policyVersion: POLICY_VERSION,
    status: 'active',
  }));
  const reviews: Record<string, ReviewDraft> = Object.fromEntries(assets.map((asset) => [asset.id, {
    checks: { security: false, privacy: false, validation: false, ownership: false },
    notes: '',
  }]));
  return {
    schemaVersion: 1,
    assets,
    approvals,
    audit: structuredClone(seedAudit),
    reviews,
    incidents: [],
    simulationUsed: false,
  };
}
