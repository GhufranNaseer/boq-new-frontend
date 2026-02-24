import { useState, useEffect } from "react";
import axios from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import {
    Trash2,
    RefreshCcw,
    AlertTriangle,
    Search,
    Filter,
    Calendar,
    Briefcase,
    Users,
    ClipboardList,
    Clock,
    UserX,
    CheckCircle
} from "lucide-react";

interface BinnedItem {
    id: string;
    name?: string; // for events, depts, users
    title?: string; // for tasks
    deletedAt: string;
    type: 'event' | 'task' | 'department' | 'user';
    [key: string]: any;
}

const RecycleBin = () => {
    const { user } = useAuth();
    const [items, setItems] = useState<BinnedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [restoreModal, setRestoreModal] = useState<{ isOpen: boolean; item: BinnedItem | null }>({
        isOpen: false,
        item: null
    });

    const fetchBinnedItems = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/recycle-bin");
            const allItems: BinnedItem[] = [
                ...(res.data.events || []).map((i: any) => ({ ...i, type: 'event' })),
                ...(res.data.tasks || []).map((i: any) => ({ ...i, type: 'task' })),
                ...(res.data.departments || []).map((i: any) => ({ ...i, type: 'department' })),
                ...(res.data.users || []).map((i: any) => ({ ...i, type: 'user' }))
            ];
            setItems(allItems.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()));
        } catch (err: any) {
            setError("Failed to load recycle bin items");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBinnedItems();
    }, []);

    const handleRestore = async () => {
        if (!restoreModal.item) return;
        try {
            await axios.post(`/recycle-bin/${restoreModal.item.type}/${restoreModal.item.id}/restore`);
            setRestoreModal({ isOpen: false, item: null });
            fetchBinnedItems();
            // Optional: Success toast
        } catch (err) {
            setError("Failed to restore item. It may have expired.");
        }
    };

    const handlePermanentDelete = async (item: BinnedItem) => {
        if (!window.confirm("ARE YOU SURE? This action is IRREVERSIBLE and will permanently delete the item from the database.")) return;
        try {
            await axios.delete(`/recycle-bin/${item.type}/${item.id}`);
            fetchBinnedItems();
        } catch (err) {
            setError("Failed to permanently delete item.");
        }
    };

    const getRemainingDays = (deletedAt: string) => {
        const deletedDate = new Date(deletedAt);
        const expiryDate = new Date(deletedDate);
        expiryDate.setDate(deletedDate.getDate() + 10);
        const now = new Date();
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'event': return <Calendar size={18} />;
            case 'task': return <ClipboardList size={18} />;
            case 'department': return <Briefcase size={18} />;
            case 'user': return <Users size={18} />;
            default: return <Trash2 size={18} />;
        }
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = (item.name || item.title || "").toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === "all" || item.type === typeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <div style={{ animation: "fadeIn 0.3s ease-in-out" }}>
            <header style={{ marginBottom: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--primary)", marginBottom: "0.5rem" }}>
                    <Trash2 size={20} />
                    <span style={{ fontWeight: 700, fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "1px" }}>Data Recovery</span>
                </div>
                <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Recycle Bin</h1>
                <p style={{ color: "var(--text-muted)", margin: "0.25rem 0 0" }}>Manage soft-deleted items. Restoration is available for 10 days post-deletion.</p>
            </header>

            <div className="glass-card" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
                <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                        <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={18} />
                        <input
                            type="text"
                            placeholder="Search deleted items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingLeft: "40px", width: "100%" }}
                        />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <Filter size={18} className="text-muted" />
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            style={{ padding: "10px", borderRadius: "8px" }}
                        >
                            <option value="all">All Types</option>
                            <option value="event">Events</option>
                            <option value="task">Tasks</option>
                            <option value="department">Departments</option>
                            <option value="user">Users</option>
                        </select>
                    </div>
                    <button className="secondary" onClick={fetchBinnedItems} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <RefreshCcw size={16} /> Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ padding: "1rem", background: "#fef2f2", color: "var(--error)", borderRadius: "12px", marginBottom: "2rem", display: "flex", alignItems: "center", gap: "10px" }}>
                    <AlertTriangle size={20} /> {error}
                </div>
            )}

            <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ textAlign: "left", background: "rgba(0,0,0,0.02)" }}>
                            <th style={{ padding: "1.25rem" }}>Item Name</th>
                            <th>Type</th>
                            <th>Deleted On</th>
                            <th>Expiry</th>
                            <th style={{ textAlign: "right", paddingRight: "1.25rem" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: "3rem", textAlign: "center" }}><RefreshCcw className="animate-spin text-primary" /></td></tr>
                        ) : filteredItems.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>No items found in Recycle Bin.</td></tr>
                        ) : (
                            filteredItems.map(item => {
                                const remainingDays = getRemainingDays(item.deletedAt);
                                const isCritical = remainingDays <= 2;

                                return (
                                    <tr key={`${item.type}-${item.id}`} style={{ borderTop: "1px solid var(--border-color)", transition: "background 0.2s" }}>
                                        <td style={{ padding: "1.25rem" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <div style={{ padding: "8px", borderRadius: "8px", background: "rgba(0,0,0,0.03)", color: "var(--text-muted)" }}>
                                                    {getIcon(item.type)}
                                                </div>
                                                <span style={{ fontWeight: 600 }}>{item.name || item.title}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                fontSize: "0.75rem",
                                                background: "rgba(var(--primary-rgb), 0.1)",
                                                color: "var(--primary)",
                                                padding: "4px 8px",
                                                borderRadius: "4px",
                                                textTransform: "uppercase",
                                                fontWeight: 800
                                            }}>{item.type}</span>
                                        </td>
                                        <td style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
                                            {new Date(item.deletedAt).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: isCritical ? "var(--error)" : "var(--text-muted)" }}>
                                                <Clock size={14} />
                                                <span style={{ fontSize: "0.875rem", fontWeight: isCritical ? 700 : 400 }}>
                                                    {remainingDays} days left
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{ textAlign: "right", paddingRight: "1.25rem" }}>
                                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                                <button
                                                    className="secondary"
                                                    onClick={() => setRestoreModal({ isOpen: true, item })}
                                                    title="Restore"
                                                    style={{ padding: "8px", borderRadius: "8px" }}
                                                >
                                                    <RefreshCcw size={16} />
                                                </button>
                                                {user?.role === 'MASTER_ADMIN' && (
                                                    <button
                                                        onClick={() => handlePermanentDelete(item)}
                                                        title="Permanently Delete"
                                                        style={{ padding: "8px", borderRadius: "8px", color: "var(--error)", background: "rgba(239, 68, 68, 0.05)" }}
                                                    >
                                                        <UserX size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Restore Confirmation Modal */}
            {restoreModal.isOpen && (
                <div className="modal-overlay">
                    <div className="glass-card" style={{ maxWidth: "450px", width: "90%", padding: "2rem", textAlign: "center" }}>
                        <div style={{ width: "64px", height: "64px", background: "rgba(16, 185, 129, 0.1)", color: "#10b981", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
                            <CheckCircle size={32} />
                        </div>
                        <h2 style={{ marginBottom: "0.5rem" }}>Restore Item?</h2>
                        <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>
                            Are you sure you want to restore <strong>{restoreModal.item?.name || restoreModal.item?.title}</strong>?
                            It will be returned to its original collection immediately.
                        </p>
                        <div style={{ display: "flex", gap: "1rem" }}>
                            <button className="secondary" onClick={() => setRestoreModal({ isOpen: false, item: null })} style={{ flex: 1 }}>Cancel</button>
                            <button className="primary" onClick={handleRestore} style={{ flex: 1 }}>Restore Now</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecycleBin;
