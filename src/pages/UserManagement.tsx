import { useState, useEffect } from "react";
import axios from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
    UserPlus,
    Edit2,
    Trash2,
    ChevronLeft,
    RefreshCw,
    X,
    Search,
    Mail,
    User as UserIcon,
    RotateCcw
} from "lucide-react";

/**
 * ARCHITECTURE NOTE:
 * This component manages User administration with RBAC.
 * Logic is centralized here for state management, but modals and table rows
 * could be extracted into separate components if complexity grows.
 */

const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    // State
    const [users, setUsers] = useState<any[]>([]);
    const [deletedUsers, setDeletedUsers] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"active" | "recycle">("active");
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "DEPARTMENT_USER",
        departmentId: ""
    });

    useEffect(() => {
        fetchUsers();
        fetchDeletedUsers();
        fetchDepartments();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get("/users");
            setUsers(res.data);
        } catch (err) {
            setError("Failed to fetch users");
        }
    };

    const fetchDeletedUsers = async () => {
        try {
            const res = await axios.get("/users/recycle-bin");
            setDeletedUsers(res.data);
        } catch (err) { }
    };

    const fetchDepartments = async () => {
        try {
            const res = await axios.get("/departments");
            setDepartments(res.data);
        } catch (err) { }
    };

    const handleOpenCreateModal = () => {
        setModalMode("create");
        setSelectedUser(null);
        setFormData({
            name: "",
            email: "",
            password: "",
            role: currentUser?.role === "MASTER_ADMIN" ? "ADMIN" : "DEPARTMENT_USER",
            departmentId: ""
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user: any) => {
        setModalMode("edit");
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: "", // Leave blank for edit unless changing
            role: user.role,
            departmentId: user.departmentId || ""
        });
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            if (modalMode === "create") {
                // Determine creation endpoint
                // Plan: Creation usually goes through auth or a dedicated admin create
                // Current backend seems to have @Post('users') in AuthController
                await axios.post("/auth/users", formData);
                setSuccess("User created successfully");
            } else {
                const updateData: any = { ...formData };
                if (!updateData.password) delete updateData.password;
                await axios.patch(`/users/${selectedUser.id}`, updateData);
                setSuccess("User updated successfully");
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (err: any) {
            setError(err.response?.data?.message || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Move this user to recycle bin?")) return;
        try {
            await axios.delete(`/users/${id}`);
            setSuccess("User moved to recycle bin");
            fetchUsers();
            fetchDeletedUsers();
        } catch (err: any) {
            setError(err.response?.data?.message || "Delete failed");
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await axios.post(`/users/${id}/restore`);
            setSuccess("User restored successfully");
            fetchUsers();
            fetchDeletedUsers();
        } catch (err: any) {
            setError(err.response?.data?.message || "Restore failed");
        }
    };

    // Filter Logic
    const filteredUsers = (activeTab === "active" ? users : deletedUsers).filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Permission Helpers
    const canManageUser = (targetUser: any) => {
        if (currentUser?.role === "MASTER_ADMIN") return true;
        if (currentUser?.role === "ADMIN") {
            // Admin can only manage non-Admins and non-MasterAdmins
            return targetUser.role === "DEPARTMENT_USER";
        }
        return false;
    };

    return (
        <div>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.875rem", marginBottom: "0.25rem" }}>User Management</h1>
                    <p style={{ color: "var(--text-muted)" }}>Control system access, roles, and departmental assignments.</p>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button className="secondary" onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <ChevronLeft size={18} /> Back
                    </button>
                    <button className="primary" onClick={handleOpenCreateModal} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <UserPlus size={18} /> Add User
                    </button>
                </div>
            </header>

            {(error || success) && (
                <div style={{
                    padding: "1rem", borderRadius: "0.5rem", marginBottom: "1.5rem",
                    background: error ? "#fef2f2" : "#f0fdf4",
                    color: error ? "var(--error)" : "var(--success)",
                    border: `1px solid ${error ? "#fee2e2" : "#dcfce7"}`
                }}>
                    {error || success}
                </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div className="glass-card" style={{ padding: "0.5rem", display: "inline-flex", gap: "4px" }}>
                    <button
                        onClick={() => setActiveTab("active")}
                        style={{
                            padding: "0.6rem 1.25rem", borderRadius: "0.5rem", border: "none",
                            background: activeTab === "active" ? "white" : "transparent",
                            color: activeTab === "active" ? "var(--primary)" : "var(--text-muted)",
                            fontWeight: 600, transition: "all 0.2s"
                        }}
                    >
                        Active Users
                    </button>
                </div>

                <div style={{ position: "relative" }}>
                    <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                        placeholder="Search by name or email..."
                        style={{ width: "320px", paddingLeft: "40px" }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <section className="glass-card" style={{ padding: "1.5rem" }}>
                <table>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Department</th>
                            <th>Joined</th>
                            <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u.id}>
                                <td>
                                    <div>
                                        <p style={{ fontWeight: 600, margin: 0 }}>{u.name}</p>
                                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>{u.email}</p>
                                    </div>
                                </td>
                                <td>
                                    <span style={{
                                        padding: "4px 8px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700,
                                        background: u.role === "MASTER_ADMIN" ? "#eff6ff" : u.role === "ADMIN" ? "#fdf2f7" : "#f0fdf4",
                                        color: u.role === "MASTER_ADMIN" ? "#1e40af" : u.role === "ADMIN" ? "#9d174d" : "#166534"
                                    }}>
                                        {u.role.replace("_", " ")}
                                    </span>
                                </td>
                                <td>{departments.find(d => d.id === u.departmentId)?.name || "N/A"}</td>
                                <td style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{new Date(u.createdAt || u.deletedAt).toLocaleDateString()}</td>
                                <td style={{ textAlign: "right" }}>
                                    {activeTab === "active" ? (
                                        <>
                                            <button
                                                className="secondary"
                                                onClick={() => handleOpenEditModal(u)}
                                                style={{ padding: "6px", marginRight: "8px" }}
                                                disabled={!canManageUser(u)}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="secondary"
                                                onClick={() => handleDelete(u.id)}
                                                style={{ padding: "6px", color: "var(--error)" }}
                                                disabled={!canManageUser(u) || u.id === currentUser?.id}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <button className="primary" onClick={() => handleRestore(u.id)} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                                            <RotateCcw size={16} /> Restore
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* User Form Modal */}
            {isModalOpen && (
                <div style={{
                    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
                    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
                }}>
                    <div className="glass-card" style={{ width: "500px", padding: "2rem", position: "relative" }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "transparent", color: "var(--text-muted)" }}>
                            <X size={20} />
                        </button>
                        <h2 style={{ marginBottom: "1.5rem" }}>{modalMode === "create" ? "Add New User" : "Update User Profile"}</h2>

                        <form onSubmit={handleFormSubmit}>
                            <div style={{ display: "grid", gap: "1.25rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Full Name</label>
                                    <div style={{ position: "relative" }}>
                                        <UserIcon size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                        <input
                                            placeholder="John Doe"
                                            style={{ paddingLeft: "40px" }}
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Email Address</label>
                                    <div style={{ position: "relative" }}>
                                        <Mail size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                                        <input
                                            type="email"
                                            placeholder="john@example.com"
                                            style={{ paddingLeft: "40px" }}
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                                        Password {modalMode === "edit" && "(Leave blank to keep current)"}
                                    </label>
                                    <input
                                        type="password"
                                        placeholder="Min 6 characters"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={modalMode === "create"}
                                        minLength={6}
                                    />
                                </div>

                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>System Role</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="DEPARTMENT_USER">Dept. User</option>
                                            {currentUser?.role === "MASTER_ADMIN" && <option value="ADMIN">Admin</option>}
                                            {currentUser?.role === "MASTER_ADMIN" && <option value="MASTER_ADMIN">Master Admin</option>}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Department</label>
                                        <select
                                            value={formData.departmentId}
                                            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                            required={formData.role === "DEPARTMENT_USER"}
                                        >
                                            <option value="">Select Dept...</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: "2rem", display: "flex", gap: "12px" }}>
                                <button type="submit" className="primary" style={{ flex: 1 }} disabled={loading}>
                                    {loading ? <RefreshCw className="animate-spin" size={18} /> : (modalMode === "create" ? "Create Account" : "Update Access")}
                                </button>
                                <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
