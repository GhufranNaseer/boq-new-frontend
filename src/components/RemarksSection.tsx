import { useState, useEffect } from "react";
import axios from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import {
    MessageSquare,
    Send,
    Trash2,
    Edit2,
    Clock,
    AlertCircle
} from "lucide-react";

interface Remark {
    id: string;
    content: string;
    createdAt: string;
    user: {
        name: string;
        email: string;
    };
}

interface RemarksSectionProps {
    taskId?: string;
    eventId?: string;
}

const RemarksSection: React.FC<RemarksSectionProps> = ({ taskId, eventId }) => {
    const { user } = useAuth();
    const [remarks, setRemarks] = useState<Remark[]>([]);
    const [newRemark, setNewRemark] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchRemarks = async () => {
        try {
            const endpoint = taskId ? `/remarks/task/${taskId}` : `/remarks/event/${eventId}`;
            const res = await axios.get(endpoint);
            setRemarks(res.data);
        } catch (err) {
            console.error("Failed to fetch remarks", err);
        }
    };

    useEffect(() => {
        fetchRemarks();
    }, [taskId, eventId]);

    const handleAddRemark = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRemark.trim()) return;

        setLoading(true);
        setError("");
        try {
            const endpoint = taskId ? `/remarks/task/${taskId}` : `/remarks/event/${eventId}`;
            await axios.post(endpoint, { content: newRemark });
            setNewRemark("");
            fetchRemarks();
        } catch (err) {
            setError("Failed to post remark");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRemark = async (id: string) => {
        if (!editContent.trim()) return;
        setLoading(true);
        try {
            await axios.patch(`/remarks/${id}`, { content: editContent });
            setEditingId(null);
            fetchRemarks();
        } catch (err) {
            setError("Failed to update remark");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRemark = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this remark?")) return;
        try {
            await axios.delete(`/remarks/${id}`);
            fetchRemarks();
        } catch (err) {
            alert("Failed to delete remark");
        }
    };

    const formatTime = (ts: string) => {
        return new Date(ts).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div style={{ marginTop: "2rem", animation: "fadeIn 0.3s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.5rem" }}>
                <MessageSquare size={20} className="text-primary" />
                <h3 style={{ margin: 0 }}>Discussion & Remarks</h3>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.05)", padding: "2px 8px", borderRadius: "10px" }}>
                    Internal Only
                </span>
            </div>

            {/* Add Remark Form */}
            <form onSubmit={handleAddRemark} style={{ marginBottom: "2rem", position: "relative" }}>
                <textarea
                    value={newRemark}
                    onChange={(e) => setNewRemark(e.target.value)}
                    placeholder="Write a note or update..."
                    disabled={loading || !!editingId}
                    style={{
                        width: "100%", height: "100px", borderRadius: "12px", padding: "1rem",
                        border: "1px solid var(--border-color)", background: "white", outline: "none",
                        fontSize: "0.9rem", resize: "none"
                    }}
                />
                <button
                    type="submit"
                    disabled={loading || !newRemark.trim() || !!editingId}
                    style={{
                        position: "absolute", bottom: "12px", right: "12px",
                        background: "var(--primary)", color: "white", border: "none",
                        padding: "8px 16px", borderRadius: "8px", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "8px", fontWeight: 600,
                        opacity: (!newRemark.trim() || !!editingId) ? 0.5 : 1
                    }}
                >
                    {loading && !editingId ? <Clock size={16} className="animate-spin" /> : <Send size={16} />}
                    Post
                </button>
            </form>

            {error && (
                <div style={{ color: "var(--error)", fontSize: "0.8rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            {/* Remarks List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {remarks.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", background: "rgba(0,0,0,0.02)", borderRadius: "12px", border: "1px dashed var(--border-color)" }}>
                        No remarks yet. Start the conversation.
                    </div>
                ) : (
                    remarks.map(remark => {
                        const isEditing = editingId === remark.id;
                        return (
                            <div key={remark.id} className="remark-card" style={{
                                padding: "1rem", borderRadius: "12px", background: "rgba(255,255,255,0.7)",
                                border: "1px solid rgba(0,0,0,0.05)", position: "relative"
                            }}>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800 }}>
                                            {remark.user.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.8rem", fontWeight: 700 }}>{remark.user.name}</div>
                                            <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                                                <Clock size={10} /> {formatTime(remark.createdAt)}
                                            </div>
                                        </div>
                                    </div>

                                    {user?.role === "MASTER_ADMIN" && (
                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                onClick={() => {
                                                    setEditingId(remark.id);
                                                    setEditContent(remark.content);
                                                }}
                                                style={{ background: "transparent", border: "none", color: "var(--primary)", cursor: "pointer", padding: "4px" }}
                                                title="Edit Remark"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRemark(remark.id)}
                                                style={{ background: "transparent", border: "none", color: "var(--error)", cursor: "pointer", padding: "4px" }}
                                                title="Delete Remark"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div style={{ animation: "popIn 0.2s" }}>
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            style={{
                                                width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid var(--primary)",
                                                fontSize: "0.9rem", outline: "none", resize: "none"
                                            }}
                                        />
                                        <div style={{ display: "flex", gap: "8px", marginTop: "8px", justifyContent: "flex-end" }}>
                                            <button onClick={() => setEditingId(null)} className="secondary" style={{ padding: "4px 12px", fontSize: "0.75rem" }}>Cancel</button>
                                            <button onClick={() => handleUpdateRemark(remark.id)} className="primary" style={{ padding: "4px 12px", fontSize: "0.75rem" }}>Save</button>
                                        </div>
                                    </div>
                                ) : (
                                    <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--text)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                                        {remark.content}
                                    </p>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default RemarksSection;
