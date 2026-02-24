import React from "react";
import { CheckCircle, AlertTriangle, ListFilter, Trash2, XCircle, CheckSquare, Square } from "lucide-react";

interface DocumentPreviewTableProps {
    data: any[];
    onDataChange: (index: number, field: string, value: any) => void;
    onRowDelete: (index: number) => void;
    onDecisionChange: (index: number, action: 'APPEND' | 'UPDATE' | 'SKIP') => void;
    decisions: Record<number, 'APPEND' | 'UPDATE' | 'SKIP'>;
    selectedRows: number[];
    onToggleSelection: (index: number) => void;
    onToggleSelectAll: () => void;
}

const DocumentPreviewTable: React.FC<DocumentPreviewTableProps> = ({
    data,
    onDataChange,
    onRowDelete,
    onDecisionChange,
    decisions,
    selectedRows,
    onToggleSelection,
    onToggleSelectAll
}) => {
    // Basic Duplicate Detection (Title based)
    const titles = data.map(r => r.title?.toLowerCase().trim());

    return (
        <div className="glass-card" style={{ padding: "1.5rem", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
                <ListFilter size={20} className="text-primary" />
                <h3 style={{ margin: 0 }}>Admin Control Workspace</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: "auto" }}>
                    {data.length} records in pipeline
                </span>
            </div>

            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                    <thead>
                        <tr style={{ background: "transparent", textAlign: "left" }}>
                            <th style={{ padding: "0.5rem 1rem", width: "40px" }}>
                                <button
                                    onClick={onToggleSelectAll}
                                    style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex" }}
                                >
                                    {selectedRows.length === data.length && data.length > 0 ? (
                                        <CheckSquare size={18} className="text-primary" />
                                    ) : (
                                        <Square size={18} className="text-muted" />
                                    )}
                                </button>
                            </th>
                            <th style={{ padding: "0.5rem 1rem", fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Decision / Status</th>
                            <th style={{ padding: "0.5rem 1rem", fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Task Details</th>
                            <th style={{ padding: "0.5rem 1rem", fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Assignment</th>
                            <th style={{ padding: "0.5rem 1rem", fontSize: "0.7rem", textTransform: "uppercase", color: "var(--text-muted)", textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => {
                            const decision = decisions[idx] || (row.exists ? 'UPDATE' : 'APPEND');
                            const isExisting = row.exists;
                            const isMissingTitle = !row.title?.trim();
                            const isDuplicate = titles[idx] && titles.filter(t => t === titles[idx]).length > 1;
                            const isSelected = selectedRows.includes(idx);
                            const isSkipped = decision === 'SKIP';

                            // User-Dept Mismatch Mock Check
                            const isMismatch = row.assigneeEmail && (!row.departmentName || row.departmentName === "General");

                            let rowBg = "white";
                            let borderColor = "transparent";
                            let statusIcon = <CheckCircle size={14} className="text-success" />;
                            let statusLabel = "READY";
                            let statusColor = "var(--success)";

                            // Selection highight
                            if (isSelected) rowBg = "rgba(var(--primary-rgb), 0.05)";

                            if (isSkipped) {
                                rowBg = "#f8fafc";
                                borderColor = "#cbd5e1";
                                statusIcon = <XCircle size={14} style={{ color: "var(--text-muted)" }} />;
                                statusLabel = "SKIPPED";
                                statusColor = "var(--text-muted)";
                            } else if (isMissingTitle) {
                                rowBg = "#fff1f2";
                                borderColor = "var(--error)";
                                statusIcon = <XCircle size={14} style={{ color: "var(--error)" }} />;
                                statusLabel = "REQUIRED";
                                statusColor = "var(--error)";
                            } else if (isDuplicate) {
                                rowBg = "#fffbeb";
                                borderColor = "#f59e0b";
                                statusIcon = <AlertTriangle size={14} style={{ color: "#f59e0b" }} />;
                                statusLabel = "DUPLICATE";
                                statusColor = "#d97706";
                            } else if (isExisting) {
                                rowBg = "#f0f9ff";
                                borderColor = "var(--primary)";
                                statusIcon = <AlertTriangle size={14} style={{ color: "var(--primary)" }} />;
                                statusLabel = decision === 'UPDATE' ? "UPDATED" : "CONFLICT";
                                statusColor = "var(--primary)";
                            }

                            return (
                                <tr key={idx} style={{
                                    background: rowBg,
                                    borderRadius: "12px",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                                    borderLeft: `4px solid ${borderColor}`,
                                    transition: "all 0.2s",
                                    opacity: isSkipped ? 0.6 : 1,
                                    fontStyle: isSkipped ? "italic" : "normal"
                                }}>
                                    <td style={{ padding: "1rem", width: "40px" }}>
                                        <button
                                            onClick={() => onToggleSelection(idx)}
                                            style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex" }}
                                        >
                                            {isSelected ? (
                                                <CheckSquare size={18} className="text-primary" />
                                            ) : (
                                                <Square size={18} className="text-muted" />
                                            )}
                                        </button>
                                    </td>
                                    <td style={{ padding: "1rem", width: "135px" }}>
                                        <div style={{ color: statusColor, display: "flex", alignItems: "center", gap: "6px", fontSize: "0.6rem", fontWeight: 800 }}>
                                            {statusIcon} {statusLabel}
                                        </div>
                                        <select
                                            value={decision}
                                            onChange={(e) => onDecisionChange(idx, e.target.value as any)}
                                            style={{
                                                marginTop: "8px",
                                                padding: "4px 6px", fontSize: "0.65rem", width: "100%", borderRadius: "4px",
                                                borderColor: decision === 'SKIP' ? "var(--text-muted)" : (decision === 'UPDATE' ? "#d97706" : "var(--success)"),
                                                background: "white"
                                            }}
                                        >
                                            <option value="APPEND">Appended</option>
                                            <option value="UPDATE">Updated</option>
                                            <option value="SKIP">Skipped</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: "1rem" }}>
                                        <div style={{ position: "relative" }}>
                                            <input
                                                value={row.title || ""}
                                                onChange={(e) => onDataChange(idx, "title", e.target.value)}
                                                disabled={isSkipped}
                                                placeholder="Task Title (Required)"
                                                style={{
                                                    display: "block", width: "100%", fontWeight: 600, fontSize: "0.9rem",
                                                    border: "none", background: "transparent", padding: "4px",
                                                    color: isMissingTitle || isDuplicate ? statusColor : "inherit",
                                                    outline: "none"
                                                }}
                                            />
                                            {isDuplicate && !isSkipped && <div style={{ fontSize: "0.65rem", color: "#d97706", position: "absolute", bottom: "-12px", left: "4px" }}>Duplicate name detected</div>}
                                            {isMissingTitle && !isSkipped && <div style={{ fontSize: "0.65rem", color: "var(--error)", position: "absolute", bottom: "-12px", left: "4px" }}>Field required</div>}
                                        </div>
                                        <textarea
                                            value={row.description || ""}
                                            onChange={(e) => onDataChange(idx, "description", e.target.value)}
                                            disabled={isSkipped}
                                            placeholder="Description..."
                                            style={{
                                                width: "100%", fontSize: "0.75rem", color: "var(--text-muted)",
                                                border: "none", background: "transparent", padding: "4px", resize: "none",
                                                height: "24px", marginTop: "8px", outline: "none"
                                            }}
                                        />
                                    </td>
                                    <td style={{ padding: "1rem" }}>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <input
                                                value={row.departmentName || ""}
                                                onChange={(e) => onDataChange(idx, "departmentName", e.target.value)}
                                                disabled={isSkipped}
                                                placeholder="Department..."
                                                style={{
                                                    display: "block", width: "100%", fontSize: "0.85rem",
                                                    border: "none", background: "transparent", padding: "4px", outline: "none"
                                                }}
                                            />
                                            <div style={{ position: "relative" }}>
                                                <input
                                                    value={row.assigneeEmail || ""}
                                                    onChange={(e) => onDataChange(idx, "assigneeEmail", e.target.value)}
                                                    disabled={isSkipped}
                                                    placeholder="Assignee Email..."
                                                    style={{
                                                        display: "block", width: "100%", fontSize: "0.75rem", color: "var(--text-muted)",
                                                        border: "none", background: "transparent", padding: "4px", outline: "none"
                                                    }}
                                                />
                                                {isMismatch && !isSkipped && (
                                                    <div style={{ position: "absolute", right: "4px", top: "50%", transform: "translateY(-50%)" }}>
                                                        <AlertTriangle size={12} color="#f59e0b" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ padding: "1rem", borderRadius: "0 12px 12px 0", textAlign: "right" }}>
                                        <button
                                            onClick={() => onRowDelete(idx)}
                                            style={{ color: "var(--error)", background: "transparent", border: "none", cursor: "pointer", padding: "8px" }}
                                            title="Discard this row"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DocumentPreviewTable;
