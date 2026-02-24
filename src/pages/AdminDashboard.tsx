import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosConfig";
import StatsCard from "../components/StatsCard";
import {
    ClipboardList,
    Calendar,
    CheckCircle2,
    RefreshCw,
    LayoutDashboard,
    AlertCircle,
    UserCheck,
    Briefcase,
    Users
} from "lucide-react";

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchStats = async () => {
        try {
            const res = await axios.get("/dashboard/dept");
            setStats(res.data);
        } catch (err) {
            setError("Failed to fetch department metrics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div style={{ display: "center", justifyContent: "center", padding: "4rem" }}><RefreshCw className="animate-spin text-primary" size={32} /></div>;

    const taskColors: any = {
        NEW: "#64748b",
        IN_PROGRESS: "#3b82f6",
        COMPLETED: "#10b981",
        DEPT_APPROVED: "#8b5cf6",
        FINAL_APPROVED: "#ec4899",
        CLOSED: "#1e293b"
    };

    return (
        <div>
            <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--primary)", marginBottom: "0.5rem" }}>
                        <Briefcase size={20} />
                        <span style={{ fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "1px" }}>Department Console</span>
                    </div>
                    <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Management Overview</h1>
                    <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 0" }}>Control center for your assigned department and team efficiency.</p>
                </div>
                <button className="secondary" onClick={fetchStats} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <RefreshCw size={16} /> Refresh
                </button>
            </header>

            {error && (
                <div style={{ padding: "1rem", background: "#fef2f2", color: "var(--error)", borderRadius: "12px", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "10px" }}>
                    <AlertCircle size={20} /> {error}
                </div>
            )}

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.5rem",
                marginBottom: "2.5rem"
            }}>
                <StatsCard
                    title="Assigned Events"
                    value={stats?.activeEvents || 0}
                    icon={Calendar}
                    color="#3b82f6"
                    onClick={() => navigate("/events")}
                />
                <StatsCard
                    title="Department Tasks"
                    value={stats?.totalTasks || 0}
                    icon={ClipboardList}
                    color="#10b981"
                    onClick={() => navigate("/events")}
                />
                <StatsCard
                    title="Pending Reviews"
                    value={stats?.pendingApprovals || 0}
                    icon={UserCheck}
                    color="#f59e0b"
                    description="Tasks waiting for approval"
                    onClick={() => navigate("/events")}
                />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "1.5rem" }}>
                <section className="glass-card" style={{ padding: "2rem" }}>
                    <h3 style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "10px" }}>
                        <LayoutDashboard size={20} className="text-primary" /> Task Progress
                    </h3>

                    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        {Object.entries(taskColors).map(([status, color]: [any, any]) => {
                            const count = stats?.tasksByStatus?.[status] || 0;
                            const percentage = stats?.totalTasks > 0 ? (count / stats.totalTasks) * 100 : 0;

                            return (
                                <div key={status}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                                        <span style={{ fontWeight: 600 }}>{status.replace("_", " ")}</span>
                                        <span style={{ color: "var(--text-muted)" }}>{count}</span>
                                    </div>
                                    <div style={{ height: "8px", background: "rgba(0,0,0,0.05)", borderRadius: "4px", overflow: "hidden" }}>
                                        <div style={{
                                            width: `${percentage}%`,
                                            height: "100%",
                                            background: color,
                                            transition: "width 0.5s ease-out"
                                        }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                <aside>
                    <div className="glass-card" style={{ padding: "1.5rem" }}>
                        <h4 style={{ margin: "0 0 1rem 0" }}>Quick Actions</h4>
                        <div style={{ display: "grid", gap: "0.75rem" }}>
                            <button
                                onClick={() => navigate("/events")}
                                className="primary"
                                style={{ padding: "12px", borderRadius: "8px", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "10px" }}
                            >
                                <CheckCircle2 size={16} /> Review Tasks
                            </button>
                            <button
                                onClick={() => navigate("/departments")}
                                className="secondary"
                                style={{ padding: "12px", borderRadius: "8px", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "10px" }}
                            >
                                <Users size={16} /> Team Members
                            </button>
                        </div>
                    </div>

                    <div style={{ marginTop: "1.5rem", padding: "1.5rem", borderRadius: "12px", background: "rgba(0,0,0,0.02)", border: "1px dashed var(--border-color)" }}>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center" }}>
                            System is polling for real-time updates every 30 seconds.
                        </p>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default AdminDashboard;
