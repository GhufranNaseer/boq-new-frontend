import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import StatsCard from "../components/StatsCard";
import {
    Users,
    Building2,
    Calendar,
    CheckCircle2,
    RefreshCw,
    LayoutDashboard,
    ArrowRight,
    AlertCircle,
    FileText
} from "lucide-react";

const MasterAdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchStats = async () => {
        try {
            const res = await axios.get("/dashboard/master");
            setStats(res.data);
        } catch (err) {
            setError("Failed to fetch dashboard metrics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
        // Polling every 30 seconds
        const interval = setInterval(fetchStats, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><RefreshCw className="animate-spin text-primary" size={32} /></div>;

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
                        <LayoutDashboard size={20} />
                        <span style={{ fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "1px" }}>Command Center</span>
                    </div>
                    <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>System Overview</h1>
                    <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 0" }}>Welcome, {user?.name}. Real-time performance metrics across all departments.</p>
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
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "1.5rem",
                marginBottom: "2.5rem"
            }}>
                <StatsCard
                    title="Active Events"
                    value={stats?.activeEvents || 0}
                    icon={Calendar}
                    description={`${stats?.totalEvents || 0} Total Events`}
                    color="#3b82f6"
                    onClick={() => navigate("/events")}
                />
                <StatsCard
                    title="Total Tasks"
                    value={stats?.totalTasks || 0}
                    icon={CheckCircle2}
                    color="#10b981"
                    onClick={() => navigate("/events")}
                />
                <StatsCard
                    title="Departments"
                    value={stats?.totalDepts || 0}
                    icon={Building2}
                    color="#8b5cf6"
                    onClick={() => navigate("/departments")}
                />
                <StatsCard
                    title="Active Users"
                    value={stats?.totalUsers || 0}
                    icon={Users}
                    color="#f59e0b"
                    onClick={() => navigate("/users")}
                />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 350px", gap: "1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <section className="glass-card" style={{ padding: "2rem" }}>
                        <h3 style={{ marginBottom: "2rem", display: "flex", alignItems: "center", gap: "10px" }}>
                            <FileText size={20} className="text-primary" /> Task Status Distribution
                        </h3>

                        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                            {Object.entries(taskColors).map(([status, color]: [any, any]) => {
                                const count = stats?.tasksByStatus?.[status] || 0;
                                const percentage = stats?.totalTasks > 0 ? (count / stats.totalTasks) * 100 : 0;

                                return (
                                    <div key={status}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                                            <span style={{ fontWeight: 600 }}>{status.replace("_", " ")}</span>
                                            <span style={{ color: "var(--text-muted)" }}>{count} ({Math.round(percentage)}%)</span>
                                        </div>
                                        <div style={{ height: "10px", background: "rgba(0,0,0,0.05)", borderRadius: "5px", overflow: "hidden" }}>
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

                    {/* FRF-13: Event Growth Trend Chart */}
                    <section className="glass-card" style={{ padding: "2rem" }}>
                        <h3 style={{ marginBottom: "1rem" }}>Project Volume Trend</h3>
                        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "2rem" }}>Last 6 months of corporate project ingestion.</p>

                        <div style={{ height: "200px", position: "relative", padding: "0 20px" }}>
                            <svg width="100%" height="100%" viewBox="0 0 500 150" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d={`M 0 150 ${stats?.eventTrend?.map((t: any, i: number) =>
                                        `L ${i * 100} ${140 - (t.count * 10)}`
                                    ).join(' ')} L 500 150 Z`}
                                    fill="url(#trendGradient)"
                                />
                                <polyline
                                    fill="none"
                                    stroke="var(--primary)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    points={stats?.eventTrend?.map((t: any, i: number) =>
                                        `${i * 100},${140 - (t.count * 10)}`
                                    ).join(' ')}
                                />
                                {stats?.eventTrend?.map((t: any, i: number) => (
                                    <circle key={i} cx={i * 100} cy={140 - (t.count * 10)} r="4" fill="var(--primary)" />
                                ))}
                            </svg>
                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", color: "var(--text-muted)", fontSize: "0.75rem" }}>
                                {stats?.eventTrend?.map((t: any) => <span key={t.month}>{t.month}</span>)}
                            </div>
                        </div>
                    </section>
                </div>

                <aside style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div className="glass-card" style={{ padding: "1.5rem", background: "linear-gradient(135deg, var(--primary) 0%, #4338ca 100%)", color: "white" }}>
                        <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.125rem" }}>Quick Navigation</h4>
                        <p style={{ fontSize: "0.8rem", opacity: 0.8, marginBottom: "1.5rem" }}>Access key system modules directly.</p>

                        <div style={{ display: "grid", gap: "0.75rem" }}>
                            <button
                                onClick={() => navigate("/events")}
                                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "10px", borderRadius: "8px", textAlign: "left", fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                            >
                                BOQ & Events <ArrowRight size={14} />
                            </button>
                            <button
                                onClick={() => navigate("/departments")}
                                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "10px", borderRadius: "8px", textAlign: "left", fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                            >
                                Departments <ArrowRight size={14} />
                            </button>
                            <button
                                onClick={() => navigate("/audit-trail")}
                                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "white", padding: "10px", borderRadius: "8px", textAlign: "left", fontSize: "0.875rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}
                            >
                                Audit Logs <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="glass-card" style={{ padding: "1.5rem" }}>
                        <h4 style={{ margin: "0 0 1rem 0" }}>System Integrity</h4>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></div>
                            <span style={{ fontSize: "0.875rem" }}>Database Operational</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1rem" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></div>
                            <span style={{ fontSize: "0.875rem" }}>Auth Services Healthy</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></div>
                            <span style={{ fontSize: "0.875rem" }}>Worker Procs Active</span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default MasterAdminDashboard;
