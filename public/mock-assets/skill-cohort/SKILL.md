---
name: skill-cohort
description: Draft a reviewable public imaging collection plan using simulated metadata.
metadata:
  simulation-only: "true"
  publisher: "Illustrative demo team"
---

# Public Imaging Cohort Planner

> Synthetic demonstration asset. This package is for a local proof of concept only.
> It does not represent NIH/NCI policy, scientific validation, or authorization.

## Prerequisite

Use `mcp-imaging` version `1.2.0` in `Research sandbox` with Public data only.
Allowed actions are `read:metadata` and `download:manifest`.

## Workflow

1. Ask for a public collection-level research question without personal identifiers.
2. Read synthetic metadata from the approved connector.
3. Show candidate collections with source IDs and explicit limitations.
4. Prepare a simulated manifest and request researcher review before further use.

## Output

Return a candidate collection table, declared selection criteria, source references,
and a sample manifest. This workflow cannot establish scientific or clinical validity.

## Execution boundary

Do not contact live services. Return simulated results only. Never accept patient,
participant, genomic, credential, or other real sensitive data in this demonstration.
