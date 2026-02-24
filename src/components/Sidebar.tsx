import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    LayoutDashboard,
    Calendar,
    Layers,
    LogOut,
    ClipboardList,
    ShieldCheck,
    Users,
    Trash2
} from "lucide-react";

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const menuItems = [
        {
            name: "Dashboard",
            path: user?.role === "MASTER_ADMIN" ? "/master-admin" : user?.role === "ADMIN" ? "/admin" : "/department-user",
            icon: <LayoutDashboard size={20} />,
            roles: ["MASTER_ADMIN", "ADMIN", "DEPARTMENT_USER"]
        },
        {
            name: "Event Management",
            path: "/events",
            icon: <Calendar size={20} />,
            roles: ["MASTER_ADMIN", "ADMIN"]
        },
        {
            name: "Departments",
            path: "/departments",
            icon: <Layers size={20} />,
            roles: ["MASTER_ADMIN", "ADMIN"]
        },
        {
            name: "Users",
            path: "/users",
            icon: <Users size={20} />,
            roles: ["MASTER_ADMIN", "ADMIN"]
        },
        {
            name: "Audit Trail",
            path: "/audit-trail",
            icon: <ShieldCheck size={20} />,
            roles: ["MASTER_ADMIN"]
        },
        {
            name: "Recycle Bin",
            path: "/recycle-bin",
            icon: <Trash2 size={20} />,
            roles: ["MASTER_ADMIN", "ADMIN", "DEPARTMENT_USER"]
        },
        // Placeholder for future modules
        {
            name: "Tasks",
            path: "#",
            icon: <ClipboardList size={20} />,
            roles: ["MASTER_ADMIN", "ADMIN", "DEPARTMENT_USER"]
        }
    ];

    const allowedItems = menuItems.filter(item => item.roles.includes(user?.role || ""));

    return (
        <div style={{
            width: "280px",
            height: "100vh",
            background: "var(--secondary)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            position: "fixed",
            left: 0,
            top: 0,
            padding: "2rem 1.5rem"
        }}>
            <div style={{ marginBottom: "3rem", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "var(--primary)", padding: "8px", borderRadius: "8px" }}>
                    <ShieldCheck size={24} />
                </div>
                <h2 style={{ color: "white", margin: 0, fontSize: "1.25rem", letterSpacing: "0.02em" }}>BOQ Suite</h2>
            </div>

            <nav style={{ flex: 1 }}>
                <ul style={{ listStyle: "none" }}>
                    {allowedItems.map((item) => (
                        <li key={item.name} style={{ marginBottom: "0.5rem" }}>
                            <Link
                                to={item.path}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "0.75rem 1rem",
                                    borderRadius: "0.75rem",
                                    color: location.pathname === item.path ? "white" : "#94a3b8",
                                    background: location.pathname === item.path ? "rgba(255,255,255,0.1)" : "transparent",
                                    transition: "all 0.2s"
                                }}
                            >
                                {item.icon}
                                <span style={{ fontWeight: 500 }}>{item.name}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>

            <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "1.5rem" }}>
                    <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "var(--primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold"
                    }}>
                        {user?.name?.[0].toUpperCase()}
                    </div>
                    <div>
                        <p style={{ fontSize: "0.875rem", fontWeight: 600, margin: 0 }}>{user?.name}</p>
                        <p style={{ fontSize: "0.75rem", color: "#94a3b8", margin: 0 }}>{user?.role.replace("_", " ")}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                        padding: "0.75rem",
                        borderRadius: "0.75rem"
                    }}
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
