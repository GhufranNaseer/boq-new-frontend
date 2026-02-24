import { useState, useEffect } from "react";
import axios from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
    Edit2,
    Trash2,
    RefreshCw,
    History,
    Package,
    Search,
    ChevronLeft,
    ClipboardList,
    BrainCircuit,
    X
} from "lucide-react";

const EventManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState<any[]>([]);
    const [deletedEvents, setDeletedEvents] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"active" | "recycle" | "audit">("active");
    const [eventName, setEventName] = useState("");
    const [eventDate, setEventDate] = useState("");
    const [description, setDescription] = useState("");
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [viewingHistory, setViewingHistory] = useState<any>(null);
    const [eventHistory, setEventHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        setError("");
        try {
            if (activeTab === "active") {
                const res = await axios.get("/events");
                setEvents(res.data);
            } else if (activeTab === "recycle") {
                const res = await axios.get("/events/recycle-bin");
                setDeletedEvents(res.data);
            } else if (activeTab === "audit" && user?.role === "MASTER_ADMIN") {
                const res = await axios.get("/audit-logs?targetModel=EVENT");
                setAuditLogs(res.data.items || []);
            }
        } catch (err: any) {
            setError("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventName.trim()) return setError("Event name is required");
        if (!eventDate) return setError("Event date is required");

        setLoading(true);
        setError("");
        const data = { name: eventName, date: eventDate, description };
        try {
            if (editingEvent) {
                await axios.patch(`/events/${editingEvent.id}`, data);
            } else {
                await axios.post("/events", data);
            }
            setEventName("");
            setEventDate("");
            setDescription("");
            setEditingEvent(null);
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.message || "Action failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Move to recycle bin?")) return;
        try {
            await axios.delete(`/events/${id}`);
            fetchData();
        } catch (err: any) {
            setError("Delete failed");
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await axios.post(`/events/${id}/restore`);
            fetchData();
        } catch (err: any) {
            setError("Restore failed");
        }
    };

    const fetchEventHistory = async (event: any) => {
        setLoading(true);
        try {
            const res = await axios.get(`/audit-logs?eventId=${event.id}`);
            setEventHistory(res.data.items || []);
            setViewingHistory(event);
        } catch (err) {
            setError("Failed to fetch event history");
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: "active", label: "Active Projects", icon: <Package size={18} /> },
        { id: "audit", label: "Security Audit", icon: <History size={18} />, roles: ["MASTER_ADMIN"] },
    ];

    const exportAuditLogs = async () => {
        try {
            const res = await axios.get("/audit-logs/export");
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `audit_log_${new Date().toISOString()}.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        } catch (err) {
            setError("Export failed");
        }
    };

    return (
        <div>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.875rem", marginBottom: "0.25rem" }}>Event & BOQ Control</h1>
                    <p style={{ color: "var(--text-muted)" }}>Manage enterprise project timelines and data integrity.</p>
                </div>
                <button className="secondary" onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ChevronLeft size={18} /> Back
                </button>
            </header>

            {error && (
                <div style={{ padding: "1rem", background: "#fef2f2", color: "var(--error)", borderRadius: "0.5rem", marginBottom: "1.5rem", border: "1px solid #fee2e2" }}>
                    {error}
                </div>
            )}

            <div className="glass-card" style={{ padding: "0.5rem", display: "inline-flex", gap: "4px", marginBottom: "2rem" }}>
                {tabs.filter(t => !t.roles || t.roles.includes(user?.role || "")).map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "0.75rem 1.25rem",
                            borderRadius: "0.5rem",
                            background: activeTab === tab.id ? "white" : "transparent",
                            color: activeTab === tab.id ? "var(--primary)" : "var(--text-muted)",
                            boxShadow: activeTab === tab.id ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none",
                            border: "none"
                        }}
                    >
                        {tab.icon}
                        <span style={{ fontWeight: 600 }}>{tab.label}</span>
                    </button>
                ))}
            </div>

            {activeTab === "active" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "2rem", alignItems: "start" }}>
                    <div className="glass-card" style={{ padding: "1.5rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ margin: 0 }}>Project List</h3>
                            <div style={{ position: "relative" }}>
                                <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                <input placeholder="Search events..." style={{ width: "240px", paddingLeft: "32px" }} />
                            </div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Event Name</th>
                                    <th>Event Date</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {events.map(event => (
                                    <tr key={event.id}>
                                        <td style={{ fontWeight: 500 }}>
                                            <Link to={`/events/${event.id}/tasks`} style={{ color: "inherit", textDecoration: "none", display: "flex", alignItems: "center", gap: "8px" }} className="hover-link">
                                                <ClipboardList size={14} className="text-muted" />
                                                {event.name}
                                            </Link>
                                        </td>
                                        <td style={{ fontSize: "0.875rem" }}>
                                            {new Date(event.date).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <span style={{
                                                padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600,
                                                background: event.isActive ? "#dcfce7" : "#f1f5f9",
                                                color: event.isActive ? "#166534" : "#64748b"
                                            }}>
                                                {event.isActive ? "ACTIVE" : "INACTIVE"}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                            <Link to={`/events/${event.id}/tasks`} className="secondary" style={{ padding: "6px", marginRight: "8px", display: "inline-flex", alignItems: "center" }} title="Manage Tasks">
                                                <ClipboardList size={16} />
                                            </Link>
                                            {(user?.role === "MASTER_ADMIN" || user?.role === "ADMIN") && (
                                                <Link to={`/events/${event.id}/intelligence`} className="secondary" style={{ padding: "6px", color: "var(--primary)", marginRight: "8px", display: "inline-flex", alignItems: "center" }} title="Import BOQ / Intelligence">
                                                    <BrainCircuit size={16} />
                                                </Link>
                                            )}
                                            {user?.role === "MASTER_ADMIN" && (
                                                <button className="secondary" onClick={() => fetchEventHistory(event)} style={{ padding: "6px", marginRight: "8px" }} title="View Event History">
                                                    <History size={16} />
                                                </button>
                                            )}
                                            <button className="secondary" onClick={() => {
                                                setEditingEvent(event);
                                                setEventName(event.name);
                                                setEventDate(event.date?.split('T')[0] || "");
                                                setDescription(event.description || "");
                                            }} style={{ padding: "6px", marginRight: "8px" }} title="Edit">
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="secondary" onClick={() => handleDelete(event.id)} style={{ padding: "6px", color: "var(--error)" }} title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="glass-card" style={{ padding: "1.5rem" }}>
                        <h3 style={{ marginBottom: "1.25rem" }}>{editingEvent ? "Update Project" : "New Project"}</h3>
                        <form onSubmit={handleCreateOrUpdate}>
                            <div style={{ marginBottom: "1.25rem" }}>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Event Name</label>
                                <input
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    placeholder="e.g. Badar Expo 2026"
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: "1.25rem" }}>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Date</label>
                                <input
                                    type="date"
                                    value={eventDate}
                                    onChange={(e) => setEventDate(e.target.value)}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: "1.25rem" }}>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Brief event details..."
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        borderRadius: "0.5rem",
                                        border: "1px solid var(--border-color)",
                                        minHeight: "100px",
                                        resize: "vertical",
                                        fontFamily: "inherit"
                                    }}
                                />
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button type="submit" className="primary" style={{ flex: 1 }} disabled={loading}>
                                    {loading ? <RefreshCw className="animate-spin" size={16} /> : (editingEvent ? "Update" : "Create Event")}
                                </button>
                                {editingEvent && (
                                    <button type="button" className="secondary" onClick={() => {
                                        setEditingEvent(null);
                                        setEventName("");
                                        setEventDate("");
                                        setDescription("");
                                    }}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {activeTab === "recycle" && (
                <div className="glass-card" style={{ padding: "1.5rem" }}>
                    <h3>Archived Projects</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Deleted At</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deletedEvents.map(event => (
                                <tr key={event.id}>
                                    <td style={{ fontWeight: 500 }}>{event.name}</td>
                                    <td style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{event.deletedAt ? new Date(event.deletedAt).toLocaleDateString() : "N/A"}</td>
                                    <td style={{ textAlign: "right" }}>
                                        <button className="primary" onClick={() => handleRestore(event.id)} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                                            <RefreshCw size={16} /> Restore
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === "audit" && (
                <div className="glass-card" style={{ padding: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <h3>Full System Audit Trail</h3>
                        <button className="primary" onClick={exportAuditLogs} style={{ padding: "8px 16px", fontSize: "0.875rem" }}>
                            Download JSON Export
                        </button>
                    </div>
                    <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1rem" }}>
                        Showing latest sequence of enterprise-wide actions.
                    </p>
                    <table>
                        <thead>
                            <tr>
                                <th>Action</th>
                                <th>Model</th>
                                <th>User</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {auditLogs.map(log => (
                                <tr key={log.id}>
                                    <td><span style={{ padding: "4px 8px", background: "#f1f5f9", borderRadius: "4px", fontSize: "0.75rem", fontWeight: 600 }}>{log.action}</span></td>
                                    <td>{log.targetModel || log.model}</td>
                                    <td>{log.user?.name || log.userId}</td>
                                    <td style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>{new Date(log.timestamp || log.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Event History Modal */}
            {viewingHistory && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div className="glass-card" style={{ width: "700px", padding: "2.5rem", position: "relative" }}>
                        <button onClick={() => setViewingHistory(null)} style={{ position: "absolute", right: "1.5rem", top: "1.5rem", background: "transparent", border: "none" }}>
                            <X size={20} />
                        </button>
                        <h2 style={{ marginBottom: "0.5rem" }}>Project Audit Trail</h2>
                        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>History for: <strong>{viewingHistory.name}</strong></p>

                        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                            {eventHistory.length > 0 ? (
                                <table style={{ width: "100%" }}>
                                    <thead>
                                        <tr>
                                            <th>Action</th>
                                            <th>By User</th>
                                            <th>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {eventHistory.map(log => (
                                            <tr key={log.id}>
                                                <td><span style={{ fontSize: "0.75rem", fontWeight: 700 }}>{log.action}</span></td>
                                                <td>{log.user?.name}</td>
                                                <td style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{new Date(log.timestamp).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>No history found for this project.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventManagement;
