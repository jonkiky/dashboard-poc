# Demo walkthrough

Allow approximately 10–15 minutes. Run the application locally using the README or open your deployed copy. The same browser should be used throughout because the state is stored locally.

Before presenting, select **Reset demo workspace** in the sidebar, then **Reset demo data** in the confirmation dialog. This removes your previous local changes and restores the initial synthetic data. Keep all entries fictional; this demonstration has no approved path for sensitive information.

## 1. Introduce the product

Open **Overview**. Explain the core question: “Which MCP server release may this team use, with which data, tool permissions, and environment—and what happens when it changes?”

Point out the MCP server metrics, risk, and review queue. Agent skills are visibly secondary. An approval is scoped and time-bound; it is not a permanent endorsement of every future version or use of a server. Role and reviewer labels are demo personas, not authenticated permissions. **Take the guided tour** in the sidebar offers a shorter three-part MCP governance story.

## 2. Find and inspect an asset

Open **Asset inventory**, which defaults to **MCP servers**. Open a server row to inspect its **Governance record**: owner, version, data scope, permissions, destinations, conditions, findings, and dependencies. Submission evidence is shown in **Review workspace**. **Agent skills** is a separate secondary tab; **All assets** shows both types.

Select **Mock source**, then **Download snapshot**. Explain that the preview is synthetic content and that `.invalid` endpoints intentionally do not resolve. No external package is fetched and no skill or MCP tool is executed.

Select **Register MCP server** at the top of the page. Keep the default MCP asset type, fill in the required fields with clearly synthetic values, and choose **Submit for review**. The app opens the new submission in **Review workspace**; return to the inventory to confirm its **In review** status. Registration establishes a catalog record; it does not authorize use.

## 3. Approve scoped MCP use

Open **Review workspace** and select **Lab Workspace File Index** (`mcp-labfiles`), the default review example. Inspect its `Internal` synthetic data scope, `read:file-metadata` action, `Research sandbox` environment, and passing evidence. Its scope excludes file contents, write actions, and unrestricted exports.

Complete **Security review**, **Data and privacy boundary**, **Workflow validation**, and **Accountable owner**. Add a **Decision rationale** of at least eight characters, for example:

> Synthetic demo review: approved for Internal file metadata in Research sandbox using read:file-metadata only. File contents, writes, and unrestricted exports remain outside scope.

Select **Approve scoped use**. Confirm the status and scoped approval, then inspect the corresponding audit entry. Draft edits are saved locally without adding an event for each keystroke. **Reject submission** records a rejection with rationale; reset and repeat this step if you want to show both outcomes.

Explain that completing these UI steps demonstrates a workflow. It does not replace real security assessment, scientific validation, or an authorized official's decision.

## 4. Show the clinical-data block

In **Review workspace**, select **Clinical Cohort Export Connector** (`mcp-clinical`). Its `Controlled` scope and external destination create a hard policy block, and its failed evidence is also blocking.

Show the **Controlled-data boundary** reason in **Policy assessment** and the disabled **Approve scoped use** button. Checklist completion cannot make the submission eligible for approval under this illustrative policy. A rejection can still be recorded. This demonstrates the distinction between collecting review evidence and satisfying a policy rule.

The rule is a product example. It is not a complete representation of NIH controlled-data policy or HIPAA applicability.

## 5. Simulate an invocation

Select **Simulation lab** at the top of the page. **Test an approval boundary** defaults to **Imaging Metadata Connector** (`mcp-imaging`). Confirm **Public** input data, **read:metadata**, and **Research sandbox**.

Select **Run access simulation** and confirm **Allowed by demo policy**. Then choose **Controlled** input data, **write:unapproved**, or **Unmanaged workstation**, changing one field at a time, and run the simulation again. Confirm **Denied by demo policy** includes an explanation. Restore the matching scope to see the allowed result again.

Inspect the audit trail to see the simulation events. These are evaluations against local state, not network calls or actual runtime enforcement.

## 6. Trigger an upstream change

In **Overview**, select **Explore the change scenario**, then **Simulate upstream change**. The demo changes the imaging MCP governance metadata from version `1.2.0` to `1.3.0` and adds `write:cohort`.

Confirm the resulting changes:

- The imaging MCP server becomes suspended.
- The dependent **Public Imaging Cohort Planner** (`skill-cohort`) becomes suspended.
- Affected active approvals become invalidated.
- An incident and audit events describe the change.

Return to **Simulation lab** and evaluate the previously permitted imaging request again. It should now be denied because the server's approval and state no longer support that invocation. As a secondary extension, open the **Agent skills** inventory tab and inspect **Public Imaging Cohort Planner** to show downstream impact. Skills also remain selectable in the review workspace and lab.

This is a seeded scenario. The app does not monitor a real repository or revoke an actual external runtime. The imaging record's **Mock source** still shows the bundled `1.2.0` snapshot and displays a notice explaining the distinction. **Inspect the change scenario** now reopens the completed scenario.

## 7. Inspect policy and export evidence

Open **Policy library** and connect its illustrative rules to the cases just demonstrated: review prerequisites, controlled destinations, approval scope, version changes, and dependency status.

Open **Audit trail** and select **Export evidence**. Inspect the downloaded JSON file to see the local assets, approvals, review drafts, incidents, and event trail, along with the export format, timestamp, policy version, and limitations notice. The export itself adds an audit event. The package can support a demonstration discussion, but it is editable client-side data, not tamperproof regulatory evidence.

Reload the page to demonstrate persistence. Reset the demo when finished to restore the starting state and clear the fictional registration and decisions.

## Discussion prompts

- Who should own the catalog, who can accept risk, and which existing NIH/NCI review process should each submission enter?
- Which MCP servers, tool permissions, and data-access use cases would make a useful first pilot?
- Which clients and runtimes could enforce decisions, and which paths would remain outside their visibility?
- What evidence can be reused across projects, and what must be reassessed for each data scope or deployment?
- When MCP governance is established, what additional evidence would help teams reuse dependent agent skills?

If a scenario appears already completed, reset before repeating it. If local state disappears, check whether site data was cleared or a different browser/origin was opened. There is no shared server state to restore.
