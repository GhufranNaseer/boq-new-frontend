import { useState, useEffect } from "react";
import axios from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    Users,
    UserPlus,
    UserMinus,
    Edit2,
    Trash2,
    Building2,
    ChevronLeft,
    RefreshCw,
    X,
    Search
} from "lucide-react";

const DepartmentManagement = () => {
    const { } = useAuth();
    const navigate = useNavigate();
    const [departments, setDepartments] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [name, setName] = useState("");
    const [editingDept, setEditingDept] = useState<any>(null);
    const [selectedDept, setSelectedDept] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchDepartments();
        fetchUsers();
    }, []);

    const fetchDepartments = async () => {
        try {
            const res = await axios.get("/departments");
            setDepartments(res.data);
        } catch (err) {
            setError("Failed to fetch departments");
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await axios.get("/users");
            setUsers(res.data);
        } catch (err) {
            setError("Failed to fetch users");
        }
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return setError("Department name is required");

        setLoading(true);
        setError("");
        setSuccess("");
        try {
            if (editingDept) {
                await axios.patch(`/departments/${editingDept.id}`, { name });
                setSuccess("Department updated successfully");
            } else {
                await axios.post("/departments", { name });
                setSuccess("Department created successfully");
            }
            setName("");
            setEditingDept(null);
            fetchDepartments();
        } catch (err: any) {
            setError(err.response?.data?.message || "Action failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this department?")) return;
        try {
            await axios.delete(`/departments/${id}`);
            setSuccess("Department deleted successfully");
            fetchDepartments();
        } catch (err) {
            setError("Delete failed");
        }
    };

    const handleAssignUser = async (userId: string) => {
        if (!selectedDept) return;
        try {
            await axios.post(`/departments/${selectedDept.id}/users/${userId}`);
            setSuccess("User assigned successfully");
            fetchDepartments();
            fetchUsers();
            const res = await axios.get(`/departments/${selectedDept.id}`);
            setSelectedDept(res.data);
        } catch (err) {
            setError("Assignment failed");
        }
    };

    const handleRemoveUser = async (userId: string) => {
        try {
            await axios.delete(`/departments/users/${userId}`);
            setSuccess("User removed successfully");
            fetchDepartments();
            fetchUsers();
            if (selectedDept) {
                const res = await axios.get(`/departments/${selectedDept.id}`);
                setSelectedDept(res.data);
            }
        } catch (err) {
            setError("Removal failed");
        }
    };

    return (
        <div>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.875rem", marginBottom: "0.25rem" }}>Department Management</h1>
                    <p style={{ color: "var(--text-muted)" }}>Manage organizational structure and personnel assignments.</p>
                </div>
                <button className="secondary" onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ChevronLeft size={18} /> Back
                </button>
            </header>

            {(error || success) && (
                <div style={{
                    padding: "1rem",
                    borderRadius: "0.5rem",
                    marginBottom: "1.5rem",
                    background: error ? "#fef2f2" : "#f0fdf4",
                    color: error ? "var(--error)" : "var(--success)",
                    border: `1px solid ${error ? "#fee2e2" : "#dcfce7"}`
                }}>
                    {error || success}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: selectedDept ? "1fr 400px" : "1fr 340px", gap: "2rem", transition: "all 0.3s ease" }}>
                <section className="glass-card" style={{ padding: "1.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                            <Building2 size={20} className="text-muted" /> Departments
                        </h3>
                        <div style={{ position: "relative" }}>
                            <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input placeholder="Filter departments..." style={{ width: "220px", paddingLeft: "32px", height: "36px" }} />
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Personnel</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {departments.map(dept => (
                                <tr key={dept.id} style={{ background: selectedDept?.id === dept.id ? "rgba(59, 130, 246, 0.05)" : "transparent" }}>
                                    <td style={{ fontWeight: 600 }}>{dept.name}</td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                                            <Users size={14} /> {dept.users?.length || 0}
                                        </div>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                        <button className="secondary" onClick={() => setSelectedDept(dept)} style={{ padding: "6px", marginRight: "8px" }} title="Manage Users">
                                            <UserPlus size={16} />
                                        </button>
                                        <button className="secondary" onClick={() => { setEditingDept(dept); setName(dept.name); }} style={{ padding: "6px", marginRight: "8px" }} title="Edit">
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="secondary" onClick={() => handleDelete(dept.id)} style={{ padding: "6px", color: "var(--error)" }} title="Delete">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <aside style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    <div className="glass-card" style={{ padding: "1.5rem" }}>
                        <h3 style={{ marginBottom: "1.25rem" }}>{editingDept ? "Update Dept" : "New Dept"}</h3>
                        <form onSubmit={handleCreateOrUpdate}>
                            <div style={{ marginBottom: "1.25rem" }}>
                                <input
                                    placeholder="e.g. Finance, IT, Logistics"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button type="submit" className="primary" style={{ flex: 1 }} disabled={loading}>
                                    {loading ? <RefreshCw className="animate-spin" size={16} /> : (editingDept ? "Update" : "Add Department")}
                                </button>
                                {editingDept && (
                                    <button type="button" className="secondary" onClick={() => { setEditingDept(null); setName(""); }}>
                                        Cancel
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {selectedDept && (
                        <div className="glass-card" style={{ padding: "1.5rem", position: "relative", border: "1px solid var(--primary)", boxShadow: "0 0 0 1px var(--primary)" }}>
                            <button
                                onClick={() => setSelectedDept(null)}
                                style={{ position: "absolute", right: "12px", top: "12px", padding: "4px", background: "transparent", color: "var(--text-muted)", border: "none" }}
                            >
                                <X size={18} />
                            </button>
                            <h3 style={{ marginBottom: "1rem", fontSize: "1.125rem" }}>Personnel in {selectedDept.name}</h3>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "280px", overflowY: "auto", marginBottom: "1.5rem", paddingRight: "4px" }}>
                                {selectedDept.users?.map((u: any) => (
                                    <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.75rem", background: "#f8fafc", borderRadius: "0.5rem", border: "1px solid #f1f5f9" }}>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: "0.875rem", margin: 0 }}>{u.name}</p>
                                            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>{u.role.replace("_", " ")}</p>
                                        </div>
                                        <button onClick={() => handleRemoveUser(u.id)} style={{ padding: "4px", color: "var(--error)", background: "transparent", border: "none" }} title="Remove from Department">
                                            <UserMinus size={16} />
                                        </button>
                                    </div>
                                ))}
                                {(!selectedDept.users || selectedDept.users.length === 0) && (
                                    <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--text-muted)", padding: "1.5rem 0" }}>No users assigned yet.</p>
                                )}
                            </div>

                            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "1.5rem" }}>
                                <h4 style={{ fontSize: "0.875rem", marginBottom: "0.75rem", fontWeight: 600 }}>Assign Personnel</h4>
                                <select
                                    onChange={(e) => e.target.value && handleAssignUser(e.target.value)}
                                    defaultValue=""
                                    style={{ background: "#f8fafc" }}
                                >
                                    <option value="" disabled>Select user to assign...</option>
                                    {users
                                        .filter(u => u.departmentId !== selectedDept.id)
                                        .map(u => (
                                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default DepartmentManagement;
