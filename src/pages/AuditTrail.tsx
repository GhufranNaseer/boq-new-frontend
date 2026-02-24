import { useState, useEffect } from "react";
import axios from "../api/axiosConfig";
import {
    Activity,
    Search,
    ChevronLeft,
    ChevronRight,
    ShieldAlert,
    Clock,
    User as UserIcon,
    Box,
    Download,
    Trash2
} from "lucide-react";

interface AuditLog {
    id: string;
    action: string;
    targetModel: string;
    details: any;
    timestamp: string;
    userId: string;
    user: {
        name: string;
        email: string;
    };
    eventId?: string;
    taskId?: string;
    documentId?: string;
}

const AuditTrail = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Filters
    const [search, setSearch] = useState("");
    const [action, setAction] = useState("");
    const [targetModel, setTargetModel] = useState("");
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 20,
                search,
                action,
                targetModel
            };
            const res = await axios.get("/audit-logs", { params });
            setLogs(res.data.items || []);
            setTotal(res.data.total || 0);
            setTotalPages(res.data.totalPages || 1);
            setSelectedIds([]); // Clear selection on fetch
        } catch (err) {
            setError("Failed to load audit logs");
        } finally {
            setLoading(false);
        }
    };

    const handleClearLogs = async () => {
        if (selectedIds.length === 0) return;
        if (!window.confirm(`WARNING: You are about to PERMANENTLY delete ${selectedIds.length} audit logs. This cannot be undone. Proceed?`)) return;

        setLoading(true);
        try {
            await axios.post("/audit-logs/clear", { ids: selectedIds });
            setSelectedIds([]);
            fetchLogs();
        } catch (err) {
            setError("Failed to clear audit logs");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(logs.map(log => log.id));
        } else {
            setSelectedIds([]);
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const exportAuditLogs = async () => {
        try {
            const res = await axios.get("/audit-logs/export");
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `full_audit_log_${new Date().toISOString()}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } catch (err) {
            setError("Export failed");
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchLogs, 300); // Debounce
        return () => clearTimeout(timer);
    }, [page, search, action, targetModel]);

    const formatTimestamp = (ts: string) => {
        return new Date(ts).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div style={{ animation: "fadeIn 0.3s ease-out" }}>
            <header style={{ marginBottom: "2.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>Security Audit Trail</h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <ShieldAlert size={18} className="text-primary" />
                        <span style={{ fontSize: "0.875rem", background: "rgba(var(--primary-rgb), 0.1)", color: "var(--primary)", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                            IMMUTABLE RECORDS
                        </span>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                            {total} total records
                        </span>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    {selectedIds.length > 0 && (
                        <button
                            className="secondary"
                            onClick={handleClearLogs}
                            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", color: "var(--error)", borderColor: "var(--error)" }}
                        >
                            <Trash2 size={18} /> Clear Selected ({selectedIds.length})
                        </button>
                    )}
                    <button
                        className="primary"
                        onClick={exportAuditLogs}
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px" }}
                    >
                        <Download size={18} /> Download JSON Export
                    </button>
                </div>
            </header>

            {/* Filters Bar */}
            <div className="glass-card" style={{ padding: "1.25rem", marginBottom: "1.5rem", display: "flex", gap: "15px", alignItems: "center" }}>
                <div style={{ position: "relative", flex: 1 }}>
                    <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={18} />
                    <input
                        type="text"
                        placeholder="Search users, actions, or models..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        style={{ width: "100%", padding: "10px 10px 10px 40px", borderRadius: "10px", border: "1px solid var(--border-color)", background: "white" }}
                    />
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                    <select
                        value={action}
                        onChange={(e) => {
                            setAction(e.target.value);
                            setPage(1);
                        }}
                        style={{ padding: "10px", borderRadius: "10px", border: "1px solid var(--border-color)", background: "white", fontSize: "0.875rem" }}
                    >
                        <option value="">All Actions</option>
                        <option value="CREATE">Create</option>
                        <option value="UPDATE">Update</option>
                        <option value="DELETE">Delete</option>
                        <option value="RESTORE">Restore</option>
                        <option value="LOGIN">Login</option>
                        <option value="SYNC">Sync</option>
                        <option value="STATUS_CHANGE">Status Change</option>
                    </select>

                    <select
                        value={targetModel}
                        onChange={(e) => {
                            setTargetModel(e.target.value);
                            setPage(1);
                        }}
                        style={{ padding: "10px", borderRadius: "10px", border: "1px solid var(--border-color)", background: "white", fontSize: "0.875rem" }}
                    >
                        <option value="">All Entities</option>
                        <option value="USER">User</option>
                        <option value="EVENT">Event</option>
                        <option value="TASK">Task</option>
                        <option value="DEPARTMENT">Department</option>
                        <option value="DOCUMENT">Document</option>
                    </select>
                </div>
            </div>

            {error && <div className="error-message" style={{ marginBottom: "1.5rem" }}>{error}</div>}

            <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ background: "rgba(0,0,0,0.02)", textAlign: "left", borderBottom: "1px solid var(--border-color)" }}>
                            <th style={{ padding: "1rem 1.5rem", width: "50px" }}>
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={logs.length > 0 && selectedIds.length === logs.length}
                                    style={{ cursor: "pointer" }}
                                />
                            </th>
                            <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Action</th>
                            <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Entity</th>
                            <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Initiated By</th>
                            <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Timestamp</th>
                            <th style={{ padding: "1rem 1.5rem", fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)" }}>Ref ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array(5).fill(0).map((_, i) => (
                                <tr key={i}><td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading records...</td></tr>
                            ))
                        ) : logs.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>No audit records found matching your criteria.</td></tr>
                        ) : logs.map(log => (
                            <tr key={log.id} style={{
                                borderBottom: "1px solid var(--border-color)",
                                transition: "background 0.2s",
                                background: selectedIds.includes(log.id) ? "rgba(var(--primary-rgb), 0.03)" : "transparent"
                            }} className="hover-row">
                                <td style={{ padding: "1rem 1.5rem" }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(log.id)}
                                        onChange={() => toggleSelect(log.id)}
                                        style={{ cursor: "pointer" }}
                                    />
                                </td>
                                <td style={{ padding: "1rem 1.5rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{
                                            padding: "6px", borderRadius: "6px",
                                            background: log.action === 'DELETE' ? "#fee2e2" : (log.action === 'CREATE' ? "#dcfce7" : "#f1f5f9"),
                                            color: log.action === 'DELETE' ? "#ef4444" : (log.action === 'CREATE' ? "#22c55e" : "#64748b")
                                        }}>
                                            <Activity size={14} />
                                        </div>
                                        <span style={{ fontWeight: 600, fontSize: "0.875rem" }}>{log.action.replace('_', ' ')}</span>
                                    </div>
                                </td>
                                <td style={{ padding: "1rem 1.5rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", color: "var(--text)" }}>
                                        <Box size={14} className="text-muted" /> {log.targetModel}
                                    </div>
                                </td>
                                <td style={{ padding: "1rem 1.5rem" }}>
                                    <div>
                                        <div style={{ fontWeight: 500, fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "6px" }}>
                                            <UserIcon size={14} className="text-muted" /> {log.user?.name || "Unknown User"}
                                        </div>
                                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{log.user?.email || log.userId}</div>
                                    </div>
                                </td>
                                <td style={{ padding: "1rem 1.5rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                                        <Clock size={14} /> {formatTimestamp(log.timestamp)}
                                    </div>
                                </td>
                                <td style={{ padding: "1rem 1.5rem", fontFamily: "monospace", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                    {log.taskId || log.eventId || log.documentId || log.id.slice(0, 8)}...
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div style={{ padding: "1.25rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.01)" }}>
                    <div style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                        Showing Page <strong>{page}</strong> of <strong>{totalPages}</strong>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button
                            className="secondary"
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            style={{ padding: "6px 12px", minWidth: "40px" }}
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            className="secondary"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            style={{ padding: "6px 12px", minWidth: "40px" }}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditTrail;
