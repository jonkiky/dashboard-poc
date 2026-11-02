---
name: skill-literature
description: Draft a cited brief from synthetic public literature for researcher review.
metadata:
  simulation-only: "true"
  publisher: "Illustrative demo team"
---

# Literature Evidence Brief

> Synthetic demonstration asset. This package is for a local proof of concept only.
> It does not represent NIH/NCI policy, scientific validation, or authorization.

## Prerequisite

Use `mcp-publications` version `2.1.0` in `Research sandbox` with Public data.
The only allowed action is `read:literature`.

## Workflow

1. Accept a public research question without sensitive or unpublished content.
2. Retrieve simulated literature metadata through the approved connector.
3. Separate reported findings, uncertainty, and interpretation.
4. Cite each source and identify missing or conflicting evidence.
5. Present a draft for human review; do not offer clinical recommendations.

## Evaluation notes

Local synthetic examples check citation completeness, abstention when support is
missing, and explicit uncertainty. These checks are demonstration evidence only.

## Execution boundary

Do not contact live services. Return simulated results only. Never accept patient,
participant, genomic, credential, or other real sensitive data in this demonstration.
