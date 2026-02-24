import {
    ClipboardList,
    FileText,
    CheckCircle2,
    MessageSquare
} from "lucide-react";

const DepartmentUserDashboard = () => {

    const quickStats = [
        { label: "Assigned Tasks", count: 4, icon: <ClipboardList size={20} /> },
        { label: "Completed", count: 2, icon: <CheckCircle2 size={20} /> },
        { label: "Recent Remarks", count: 12, icon: <MessageSquare size={20} /> },
    ];

    return (
        <div>
            <header style={{ marginBottom: "2rem" }}>
                <h1 style={{ fontSize: "1.875rem", marginBottom: "0.25rem" }}>My Dashboard</h1>
                <p style={{ color: "var(--text-muted)" }}>View and manage your daily operational tasks.</p>
            </header>

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "1.5rem"
            }}>
                <section className="glass-card" style={{ padding: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.125rem", marginBottom: "1.25rem" }}>Daily Summary</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {quickStats.map(stat => (
                            <div key={stat.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", background: "#f8fafc", borderRadius: "0.75rem" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ color: "var(--primary)" }}>{stat.icon}</div>
                                    <span style={{ fontWeight: 500 }}>{stat.label}</span>
                                </div>
                                <span style={{ fontWeight: 600, fontSize: "1.125rem" }}>{stat.count}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="glass-card" style={{ padding: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.125rem", marginBottom: "1.25rem" }}>Required Actions</h2>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                        <div style={{ padding: "1rem", border: "1px solid var(--border)", borderRadius: "0.75rem" }}>
                            <p style={{ fontWeight: 600, margin: "0 0 4px 0" }}>BOQ Extract Ready</p>
                            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: 0 }}>System generated a new BOQ file for Event #203.</p>
                            <button className="secondary" style={{ marginTop: "12px", width: "100%", padding: "0.5rem" }}>
                                <FileText size={16} /> Download CSV
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default DepartmentUserDashboard;
