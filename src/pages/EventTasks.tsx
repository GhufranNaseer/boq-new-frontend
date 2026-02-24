import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import {
    ChevronLeft,
    Plus,
    Search,
    Clock,
    User as UserIcon,
    Building2,
    Edit2,
    Trash2,
    RotateCcw,
    X,
    RefreshCw,
    CheckCircle2,
    ArrowLeftCircle,
    Check,
    MessageCircle
} from "lucide-react";
import RemarksSection from "../components/RemarksSection";

/**
 * ARCHITECTURE NOTE:
 * EventTasks provides a centralized view for all tasks within an event.
 * FRF-6: Implementing a strict Approval Workflow with visual steppers and mandatory feedback.
 */

const STATUS_WORKFLOW = [
    { value: "NEW", label: "New", color: "#475569", bg: "#f1f5f9" },
    { value: "IN_PROGRESS", label: "In Progress", color: "#1e40af", bg: "#eff6ff" },
    { value: "COMPLETED", label: "Completed", color: "#166534", bg: "#f0fdf4" },
    { value: "DEPT_APPROVED", label: "Dept Approved", color: "#6b21a8", bg: "#faf5ff" },
    { value: "FINAL_APPROVED", label: "Final Approved", color: "#9d174d", bg: "#fdf2f7" },
    { value: "CLOSED", label: "Closed", color: "#64748b", bg: "#f8fafc" }
];

const EventTasks = () => {
    const { eventId } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    // State
    const [event, setEvent] = useState<any>(null);
    const [tasks, setTasks] = useState<any[]>([]);
    const [deletedTasks, setDeletedTasks] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<"active" | "recycle">("active");
    const [searchQuery, setSearchQuery] = useState("");
    const [showNeedsReviewOnly, setShowNeedsReviewOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit" | "status" | "details">("create");
    const [selectedTask, setSelectedTask] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        dueDate: "",
        departmentId: "",
        assignedToId: "",
        status: "NEW",
        remarks: ""
    });

    useEffect(() => {
        fetchInitialData();
    }, [eventId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [eventRes, tasksRes, recylceRes, usersRes, deptsRes] = await Promise.all([
                axios.get(`/events/${eventId}`),
                axios.get(`/tasks?eventId=${eventId}`),
                axios.get(`/tasks/recycle-bin?eventId=${eventId}`),
                axios.get("/users"),
                axios.get("/departments")
            ]);
            setEvent(eventRes.data);
            setTasks(tasksRes.data);
            setDeletedTasks(recylceRes.data);
            setUsers(usersRes.data);
            setDepartments(deptsRes.data);
        } catch (err) {
            setError("Failed to load task data");
        } finally {
            setLoading(false);
        }
    };

    const fetchTasks = async () => {
        try {
            const [activeRes, recycleRes] = await Promise.all([
                axios.get(`/tasks?eventId=${eventId}`),
                axios.get(`/tasks/recycle-bin?eventId=${eventId}`)
            ]);
            setTasks(activeRes.data);
            setDeletedTasks(recycleRes.data);
        } catch (err) { }
    };

    const handleOpenCreateModal = () => {
        setModalMode("create");
        setSelectedTask(null);
        setFormData({
            title: "",
            description: "",
            dueDate: "",
            departmentId: "",
            assignedToId: "",
            status: "NEW",
            remarks: ""
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (task: any) => {
        setModalMode("edit");
        setSelectedTask(task);
        setFormData({
            title: task.title,
            description: task.description || "",
            dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : "",
            departmentId: task.departmentId || "",
            assignedToId: task.assignedToId || "",
            status: task.status,
            remarks: ""
        });
        setIsModalOpen(true);
    };

    const handleOpenStatusModal = (task: any) => {
        setModalMode("status");
        setSelectedTask(task);

        // Find next possible status for default
        const currentIndex = STATUS_WORKFLOW.findIndex(s => s.value === task.status);
        const nextStatus = currentIndex < STATUS_WORKFLOW.length - 1 ? STATUS_WORKFLOW[currentIndex + 1].value : task.status;

        setFormData({
            ...formData,
            status: nextStatus,
            remarks: ""
        });
        setIsModalOpen(true);
    };

    const handleOpenDetailsModal = (task: any) => {
        setModalMode("details");
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        // Mandatory Remarks for Rejection (Backward Move)
        if (modalMode === "status") {
            const currentIndex = STATUS_WORKFLOW.findIndex(s => s.value === selectedTask.status);
            const nextIndex = STATUS_WORKFLOW.findIndex(s => s.value === formData.status);
            if (nextIndex < currentIndex && !formData.remarks.trim()) {
                setError("Remarks are mandatory when sending a task back for corrections.");
                return;
            }
        }

        try {
            if (modalMode === "create") {
                await axios.post("/tasks", { ...formData, eventId });
                setSuccess("Task created successfully");
            } else if (modalMode === "edit") {
                await axios.patch(`/tasks/${selectedTask.id}`, formData);
                setSuccess("Task updated successfully");
            } else if (modalMode === "status") {
                await axios.patch(`/tasks/${selectedTask.id}/status`, {
                    status: formData.status,
                    remarks: formData.remarks
                });
                setSuccess(`Task transitioned to ${formData.status.replace("_", " ")}`);
            }
            setIsModalOpen(false);
            fetchTasks();
        } catch (err: any) {
            setError(err.response?.data?.message || "Operation failed");
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Move task to recycle bin?")) return;
        try {
            await axios.delete(`/tasks/${id}`);
            setSuccess("Task moved to recycle bin");
            fetchTasks();
        } catch (err) {
            setError("Delete failed");
        }
    };

    const handleRestore = async (id: string) => {
        try {
            await axios.post(`/tasks/${id}/restore`);
            setSuccess("Task restored");
            fetchTasks();
        } catch (err) {
            setError("Restore failed");
        }
    };

    const getStatusStyle = (status: string) => {
        const s = STATUS_WORKFLOW.find(x => x.value === status);
        return s ? { bg: s.bg, text: s.color } : { bg: "#f1f5f9", text: "#475569" };
    };

    // Permission Helpers
    const canManageStatus = (task: any) => {
        if (currentUser?.role === "MASTER_ADMIN") return true;

        const userDeptId = currentUser?.departmentId;

        if (currentUser?.role === "ADMIN") {
            // Admin can manage status for any task in their department or any task they are assigned to
            // If they have no department, we'll allow them to manage unassigned-department tasks
            return (!userDeptId && !task.departmentId) || task.departmentId === userDeptId || task.assignedToId === currentUser.id;
        }
        // User can mark their own task or any unassigned task in their department
        return task.assignedToId === currentUser?.id || (!task.assignedToId && task.departmentId === userDeptId);
    };

    const needsReview = (task: any) => {
        if (!currentUser) return false;
        const userDeptId = currentUser.departmentId;

        // Dept User marked as COMPLETED -> Dept Head (Admin) or Master Admin needs to approve
        if (task.status === "COMPLETED") {
            return currentUser.role === "MASTER_ADMIN" || (currentUser.role === "ADMIN" && task.departmentId === userDeptId);
        }

        // Dept Approved -> Master Admin needs to approve
        if (task.status === "DEPT_APPROVED") {
            return currentUser.role === "MASTER_ADMIN";
        }

        // Final Approved -> Any Admin or Master Admin can Close (or Master Admin only?)
        if (task.status === "FINAL_APPROVED") {
            return currentUser.role === "MASTER_ADMIN";
        }

        // Assigned to user and NEW or IN_PROGRESS
        if (task.assignedToId === currentUser.id && (task.status === "NEW" || task.status === "IN_PROGRESS")) {
            return true;
        }

        return false;
    };

    const filteredTasks = (activeTab === "active" ? tasks : deletedTasks).filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesReview = !showNeedsReviewOnly || needsReview(t);
        return matchesSearch && matchesReview;
    });

    if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><RefreshCw className="animate-spin text-primary" size={32} /></div>;

    return (
        <div>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                        <Building2 size={16} /> Events / <span style={{ color: "var(--text)" }}>{event?.name}</span>
                    </div>
                    <h1 style={{ fontSize: "1.875rem" }}>Event Tasks</h1>
                    {event?.description && (
                        <p style={{ color: "var(--text-muted)", marginTop: "0.5rem", maxWidth: "600px" }}>
                            {event.description}
                        </p>
                    )}
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                    <button className="secondary" onClick={() => navigate("/events")} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <ChevronLeft size={18} /> Back to Events
                    </button>
                    {(currentUser?.role === "MASTER_ADMIN" || currentUser?.role === "ADMIN") && (
                        <button className="primary" onClick={handleOpenCreateModal} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Plus size={18} /> Create Task
                        </button>
                    )}
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
                <div style={{ display: "flex", gap: "1rem" }}>
                    <div className="glass-card" style={{ padding: "0.4rem", display: "inline-flex", gap: "4px" }}>
                        <button
                            onClick={() => setActiveTab("active")}
                            style={{
                                padding: "0.6rem 1.25rem", borderRadius: "0.5rem", border: "none",
                                background: activeTab === "active" ? "white" : "transparent",
                                color: activeTab === "active" ? "var(--primary)" : "var(--text-muted)",
                                fontWeight: 600, transition: "all 0.2s"
                            }}
                        >
                            Active Tasks
                        </button>
                        <button
                            onClick={() => setActiveTab("recycle")}
                            style={{
                                padding: "0.6rem 1.25rem", borderRadius: "0.5rem", border: "none",
                                background: activeTab === "recycle" ? "white" : "transparent",
                                color: activeTab === "recycle" ? "var(--primary)" : "var(--text-muted)",
                                fontWeight: 600, transition: "all 0.2s"
                            }}
                        >
                            Recycle Bin
                        </button>
                    </div>

                    <div className="glass-card" style={{ padding: "0.4rem", display: "inline-flex", gap: "4px" }}>
                        <button
                            onClick={() => setShowNeedsReviewOnly(!showNeedsReviewOnly)}
                            style={{
                                padding: "0.6rem 1.25rem", borderRadius: "0.5rem", border: "none",
                                background: showNeedsReviewOnly ? "var(--primary)" : "transparent",
                                color: showNeedsReviewOnly ? "white" : "var(--text-muted)",
                                fontWeight: 600, transition: "all 0.2s", display: "flex", alignItems: "center", gap: "8px"
                            }}
                        >
                            <CheckCircle2 size={16} /> {showNeedsReviewOnly ? "Showing Needs Review" : "Show Needs Review"}
                        </button>
                    </div>
                </div>

                <div style={{ position: "relative" }}>
                    <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                        placeholder="Search tasks..."
                        style={{ width: "280px", paddingLeft: "40px" }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <section className="glass-card" style={{ padding: "1.5rem" }}>
                <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
                    <thead>
                        <tr style={{ background: "transparent" }}>
                            <th style={{ padding: "1rem" }}>Task Details & Progress</th>
                            <th style={{ minWidth: "150px" }}>Assignee</th>
                            <th>Status Badge</th>
                            <th>Due Date</th>
                            <th style={{ textAlign: "right", paddingRight: "1.5rem" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTasks.map(task => {
                            const style = getStatusStyle(task.status);
                            const currentIdx = STATUS_WORKFLOW.findIndex(s => s.value === task.status);

                            return (
                                <tr key={task.id} className="glass-card" style={{ background: "white", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                                    <td style={{ padding: "1.25rem", borderRadius: "0.75rem 0 0 0.75rem" }}>
                                        <div
                                            style={{ marginBottom: "0.75rem", cursor: "pointer" }}
                                            onClick={() => handleOpenDetailsModal(task)}
                                        >
                                            <p style={{ fontWeight: 600, margin: 0, fontSize: "1rem" }}>{task.title}</p>
                                            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0.2rem 0 0" }}>{task.description || "No description"}</p>
                                        </div>
                                        {/* Status Stepper */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "2px", width: "100%" }}>
                                            {STATUS_WORKFLOW.map((s, idx) => (
                                                <div key={s.value} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                                                    <div
                                                        title={s.label}
                                                        style={{
                                                            height: "6px", flex: 1, borderRadius: "3px",
                                                            background: idx <= currentIdx ? s.color : "#e2e8f0",
                                                            opacity: idx <= currentIdx ? 1 : 0.4
                                                        }}
                                                    />
                                                    {idx < STATUS_WORKFLOW.length - 1 && <div style={{ width: "2px" }} />}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem" }}>
                                                <Building2 size={14} className="text-muted" />
                                                <span>{task.department?.name || "Unassigned Dept."}</span>
                                            </div>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                                <UserIcon size={12} />
                                                <span>{task.assignedTo?.name || "No User"}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <button
                                            onClick={() => canManageStatus(task) && handleOpenStatusModal(task)}
                                            disabled={!canManageStatus(task) || activeTab === "recycle"}
                                            style={{
                                                padding: "4px 10px", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700,
                                                background: style.bg, color: style.text, border: "none",
                                                cursor: canManageStatus(task) ? "pointer" : "default",
                                                textTransform: "uppercase", letterSpacing: "0.5px"
                                            }}
                                        >
                                            {task.status.replace("_", " ")}
                                        </button>
                                    </td>
                                    <td>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                                            <Clock size={14} />
                                            <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No Date"}</span>
                                        </div>
                                    </td>
                                    <td style={{ textAlign: "right", paddingRight: "1.5rem", borderRadius: "0 0.75rem 0.75rem 0" }}>
                                        {activeTab === "active" ? (
                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                                {canManageStatus(task) && (
                                                    <button
                                                        className="primary"
                                                        onClick={() => handleOpenStatusModal(task)}
                                                        style={{ padding: "6px 12px", fontSize: "0.80rem", height: "32px", display: "flex", alignItems: "center", gap: "6px", borderRadius: "8px" }}
                                                    >
                                                        <CheckCircle2 size={14} /> Workflow
                                                    </button>
                                                )}
                                                <button className="secondary" onClick={() => handleOpenDetailsModal(task)} style={{ padding: "6px", borderRadius: "8px" }} title="View Details & Remarks">
                                                    <MessageCircle size={16} />
                                                </button>
                                                <button className="secondary" onClick={() => handleOpenEditModal(task)} style={{ padding: "6px", borderRadius: "8px" }} title="Edit Task">
                                                    <Edit2 size={16} />
                                                </button>
                                                {(currentUser?.role === "MASTER_ADMIN" || (currentUser?.role === "ADMIN" && task.departmentId === currentUser.departmentId)) && (
                                                    <button className="secondary" onClick={() => handleDelete(task.id)} style={{ padding: "6px", color: "var(--error)", borderRadius: "8px" }} title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <button className="primary" onClick={() => handleRestore(task.id)} style={{ display: "inline-flex", alignItems: "center" }}>
                                                <RotateCcw size={16} style={{ marginRight: "6px" }} /> Restore
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredTasks.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                                    No tasks found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </section>

            {/* Modal for Workflow/Approval */}
            {isModalOpen && modalMode === "status" && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div className="glass-card" style={{ width: "500px", padding: "2rem", position: "relative" }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", right: "1.5rem", top: "1.5rem", background: "transparent", color: "var(--text-muted)" }}>
                            <X size={20} />
                        </button>

                        <h2 style={{ marginBottom: "0.5rem" }}>Manage Workflow</h2>
                        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                            Move task through the approval stages or send it back for corrections.
                        </p>

                        <div className="glass-card" style={{ background: "var(--bg-primary)", padding: "1rem", marginBottom: "1.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: "0.5rem" }}>
                                <span>Current: <strong>{selectedTask.status.replace("_", " ")}</strong></span>
                                <span>Target: <strong style={{ color: "var(--primary)" }}>{formData.status.replace("_", " ")}</strong></span>
                            </div>
                        </div>

                        <form onSubmit={handleFormSubmit}>
                            <div style={{ marginBottom: "1.5rem" }}>
                                <label style={{ display: "block", marginBottom: "0.6rem", fontSize: "0.875rem", fontWeight: 600 }}>Action</label>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    {/* Next Step Logic */}
                                    {(() => {
                                        const currentIdx = STATUS_WORKFLOW.findIndex(s => s.value === selectedTask.status);
                                        const next = STATUS_WORKFLOW[currentIdx + 1];

                                        return (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, status: next?.value || selectedTask.status })}
                                                    disabled={!next}
                                                    className={formData.status === next?.value ? "primary" : "secondary"}
                                                    style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "1rem", opacity: next ? 1 : 0.5 }}
                                                >
                                                    <Check size={20} style={{ marginBottom: "4px" }} />
                                                    <span style={{ fontSize: "0.8rem" }}>Approve to</span>
                                                    <span style={{ fontWeight: 700 }}>{next?.label || "End"}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, status: "IN_PROGRESS" })} // Default send back to in progress
                                                    disabled={currentIdx < 2 || currentUser?.role === "DEPARTMENT_USER"} // Cannot send back if NEW/IN_PROGRESS or if low rank
                                                    className={formData.status === "IN_PROGRESS" && selectedTask.status !== "IN_PROGRESS" ? "primary" : "secondary"}
                                                    style={{
                                                        display: "flex", flexDirection: "column", alignItems: "center", padding: "1rem",
                                                        color: "var(--error)", borderColor: "var(--error)",
                                                        opacity: (currentIdx >= 2 && currentUser?.role !== "DEPARTMENT_USER") ? 1 : 0.5
                                                    }}
                                                >
                                                    <ArrowLeftCircle size={20} style={{ marginBottom: "4px" }} />
                                                    <span style={{ fontSize: "0.8rem" }}>Send Back</span>
                                                    <span style={{ fontWeight: 700 }}>Reject</span>
                                                </button>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div style={{ marginBottom: "1.5rem" }}>
                                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", fontWeight: 600 }}>
                                    Remarks {STATUS_WORKFLOW.findIndex(s => s.value === formData.status) < STATUS_WORKFLOW.findIndex(s => s.value === selectedTask.status) ? "(Mandatory)" : "(Optional)"}
                                </label>
                                <textarea
                                    placeholder="Provide feedback or notes here..."
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                    rows={3}
                                    style={{ background: "white" }}
                                />
                            </div>

                            <button type="submit" className="primary" style={{ width: "100%", padding: "1rem" }}>
                                Confirm Workflow Transition
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal for Create/Edit */}
            {isModalOpen && (modalMode === "create" || modalMode === "edit") && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div className="glass-card" style={{ width: "550px", padding: "2rem", position: "relative" }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", right: "1.5rem", top: "1.5rem", background: "transparent", color: "var(--text-muted)" }}>
                            <X size={20} />
                        </button>

                        <form onSubmit={handleFormSubmit}>
                            <h2 style={{ marginBottom: "1.5rem" }}>{modalMode === "create" ? "Create New Task" : "Edit Task Details"}</h2>

                            <div style={{ display: "grid", gap: "1.25rem" }}>
                                <div>
                                    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.875rem", fontWeight: 600 }}>Task Title</label>
                                    <input
                                        placeholder="e.g. Set up stage lighting"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.875rem", fontWeight: 600 }}>Description</label>
                                    <textarea
                                        placeholder="Detailed task requirements..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                    />
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.875rem", fontWeight: 600 }}>Due Date</label>
                                        <input
                                            type="date"
                                            value={formData.dueDate}
                                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.875rem", fontWeight: 600 }}>Initial Status</label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            disabled={modalMode === "edit"}
                                        >
                                            <option value="NEW">New</option>
                                            <option value="IN_PROGRESS">In Progress</option>
                                            <option value="COMPLETED">Completed</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.875rem", fontWeight: 600 }}>Department</label>
                                        <select
                                            value={formData.departmentId}
                                            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value, assignedToId: "" })}
                                        >
                                            <option value="">Unassigned</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: "block", marginBottom: "0.4rem", fontSize: "0.875rem", fontWeight: 600 }}>Assignee</label>
                                        <select
                                            value={formData.assignedToId}
                                            onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                                        >
                                            <option value="">Unassigned</option>
                                            {users
                                                .filter(u => !formData.departmentId || u.departmentId === formData.departmentId)
                                                .map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", gap: "12px", marginTop: "2rem" }}>
                                <button type="submit" className="primary" style={{ flex: 1 }}>{modalMode === "create" ? "Create Task" : "Save Changes"}</button>
                                <button type="button" className="secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal for Details & Remarks */}
            {isModalOpen && modalMode === "details" && selectedTask && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div className="glass-card" style={{ width: "800px", padding: "2.5rem", position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
                        <button onClick={() => setIsModalOpen(false)} style={{ position: "absolute", right: "1.5rem", top: "1.5rem", background: "transparent", color: "var(--text-muted)" }}>
                            <X size={20} />
                        </button>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "2rem" }}>
                            <div>
                                <h4 style={{ color: "var(--primary)", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "1px", marginBottom: "0.5rem" }}>Task Detail View</h4>
                                <h2 style={{ marginBottom: "1rem" }}>{selectedTask.title}</h2>
                                <p style={{ color: "var(--text)", lineHeight: 1.6, marginBottom: "2rem" }}>{selectedTask.description || "No detailed description provided."}</p>

                                <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "2rem 0" }} />

                                <RemarksSection taskId={selectedTask.id} />
                            </div>

                            <aside>
                                <div className="glass-card" style={{ padding: "1.25rem", background: "rgba(0,0,0,0.02)" }}>
                                    <h5 style={{ margin: "0 0 1rem 0" }}>Properties</h5>

                                    <div style={{ display: "grid", gap: "1rem" }}>
                                        <div>
                                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Status</div>
                                            <div style={{
                                                display: "inline-block", padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: 700,
                                                background: getStatusStyle(selectedTask.status).bg, color: getStatusStyle(selectedTask.status).text
                                            }}>
                                                {selectedTask.status.replace("_", " ")}
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Department</div>
                                            <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{selectedTask.department?.name || "Unassigned"}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Current Owner</div>
                                            <div style={{ fontSize: "0.875rem", fontWeight: 600 }}>{selectedTask.assignedTo?.name || "No User Assigned"}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Deadline</div>
                                            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--error)" }}>
                                                {selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : "Flexible"}
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        className="primary"
                                        onClick={() => handleOpenStatusModal(selectedTask)}
                                        style={{ width: "100%", marginTop: "1.5rem", padding: "10px" }}
                                    >
                                        Update Workflow
                                    </button>
                                </div>
                            </aside>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EventTasks;
