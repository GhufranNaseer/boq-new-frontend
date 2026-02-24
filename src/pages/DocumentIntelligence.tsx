import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axiosConfig";
import FileUploadArea from "../components/FileUploadArea";
import DocumentPreviewTable from "../components/DocumentPreviewTable";
import {
    ChevronLeft,
    Database,
    CheckCircle2,
    RefreshCw,
    AlertCircle,
    Plus,
    Undo2,
    Save,
    MoreHorizontal,
    CheckSquare,
    X
} from "lucide-react";

interface PreviewDataRow {
    title: string;
    description: string;
    departmentName: string;
    assigneeEmail: string;
    exists?: boolean;
    suggestedAction?: 'APPEND' | 'UPDATE';
}

const DocumentIntelligence = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();

    // State
    const [event, setEvent] = useState<any>(null);
    const [step, setStep] = useState<1 | 2>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0);

    // Workspace Data
    const [previewData, setPreviewData] = useState<PreviewDataRow[]>([]);
    const [decisions, setDecisions] = useState<Record<number, 'APPEND' | 'UPDATE' | 'SKIP'>>({});
    const [history, setHistory] = useState<PreviewDataRow[][]>([]);

    // Selection State (FRF-12)
    const [selectedRows, setSelectedRows] = useState<number[]>([]);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await axios.get(`/events/${eventId}`);
                setEvent(res.data);
            } catch (err) {
                setError("Failed to load event context");
            }
        };
        fetchEvent();
    }, [eventId]);

    const saveToHistory = (currentData: PreviewDataRow[]) => {
        setHistory(prev => [...prev.slice(-9), [...currentData]]); // Keep last 10 versions
    };

    const handleFileSelect = async (file: File) => {
        setLoading(true);
        setError("");
        setUploadProgress(20);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("eventId", eventId!);

        try {
            setUploadProgress(50);
            const res = await axios.post("/documents/preview", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            setUploadProgress(100);

            const fetchedData = res.data.previewData || [];
            setPreviewData(fetchedData);

            const initialDecisions: Record<number, 'APPEND' | 'UPDATE' | 'SKIP'> = {};
            fetchedData.forEach((row: any, idx: number) => {
                initialDecisions[idx] = row.suggestedAction || (row.exists ? 'UPDATE' : 'APPEND');
            });
            setDecisions(initialDecisions);
            setStep(2);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to process document");
        } finally {
            setLoading(false);
        }
    };

    const handleDataChange = (index: number, field: string, value: any) => {
        saveToHistory(previewData);
        setPreviewData(prev => {
            const newData = [...prev];
            newData[index] = { ...newData[index], [field]: value };
            return newData;
        });
    };

    const handleRowDelete = (index: number) => {
        saveToHistory(previewData);
        setPreviewData(prev => prev.filter((_, i) => i !== index));
        setDecisions(prev => {
            const newDecisions: Record<number, 'APPEND' | 'UPDATE' | 'SKIP'> = {};
            Object.entries(prev).forEach(([key, val]) => {
                const k = parseInt(key);
                if (k < index) newDecisions[k] = val;
                if (k > index) newDecisions[k - 1] = val;
            });
            return newDecisions;
        });
        setSelectedRows(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    };

    const handleAddRow = () => {
        saveToHistory(previewData);
        const newIndex = previewData.length;
        setPreviewData(prev => [...prev, {
            title: "",
            description: "",
            departmentName: "",
            assigneeEmail: ""
        }]);
        setDecisions(prev => ({ ...prev, [newIndex]: 'APPEND' }));
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const lastVersion = history[history.length - 1];
        setPreviewData(lastVersion);
        setHistory(prev => prev.slice(0, -1));
    };

    const handleDecisionChange = (index: number, action: 'APPEND' | 'UPDATE' | 'SKIP') => {
        setDecisions(prev => ({ ...prev, [index]: action }));
    };

    // FRF-12 Bulk Actions
    const toggleSelection = (index: number) => {
        setSelectedRows(prev =>
            prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
        );
    };

    const toggleSelectAll = () => {
        setSelectedRows(prev =>
            prev.length === previewData.length ? [] : previewData.map((_, i) => i)
        );
    };

    const applyBulkAction = (action: 'APPEND' | 'UPDATE' | 'SKIP') => {
        const newDecisions = { ...decisions };
        selectedRows.forEach(idx => {
            newDecisions[idx] = action;
        });
        setDecisions(newDecisions);
        setSelectedRows([]);
    };

    const handleSync = async () => {
        // Confirmation for Updates
        const hasUpdates = Object.values(decisions).some(d => d === 'UPDATE');
        if (hasUpdates && !window.confirm("Some records are marked for UPDATE. This will overwrite existing task data. Proceed?")) {
            return;
        }

        setLoading(true);
        setError("");

        try {
            const syncPayload = previewData.map((row, idx) => ({
                ...row,
                action: decisions[idx] || 'APPEND'
            })).filter((_, idx) => decisions[idx] !== 'SKIP');

            await axios.post(`/documents/sync-json`, {
                eventId,
                tasks: syncPayload
            });

            setSuccess(`Successfully synchronized ${syncPayload.length} tasks.`);
            setTimeout(() => navigate(`/events/${eventId}/tasks`), 2000);
        } catch (err: any) {
            setError(err.response?.data?.message || "Sync failed. Ensure all required fields are filled.");
        } finally {
            setLoading(false);
        }
    };

    // Validation
    const titles = previewData.map((r, idx) => decisions[idx] !== 'SKIP' ? r.title?.toLowerCase().trim() : null).filter(Boolean);
    const hasDuplicates = titles.length !== new Set(titles).size;
    const isDataValid = previewData.length > 0 &&
        previewData.every((r, idx) => decisions[idx] === 'SKIP' || r.title?.trim()) &&
        !hasDuplicates;

    return (
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <header style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                        <Database size={16} /> Intelligence / <span style={{ color: "var(--text)" }}>Admin Control Workspace</span>
                    </div>
                    <h1 style={{ fontSize: "1.875rem" }}>BOQ Governance</h1>
                    <p style={{ color: "var(--text-muted)", margin: 0 }}>Project context: <strong>{event?.name}</strong></p>
                </div>
                <button className="secondary" onClick={() => navigate(-1)} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ChevronLeft size={18} /> Back
                </button>
            </header>

            {(error || success) && (
                <div style={{
                    padding: "1rem", borderRadius: "0.5rem", marginBottom: "2rem",
                    background: error ? "#fef2f2" : "#f0fdf4",
                    color: error ? "var(--error)" : "var(--success)",
                    border: `1px solid ${error ? "#fee2e2" : "#dcfce7"}`,
                    display: "flex", alignItems: "center", gap: "10px",
                    animation: "fadeIn 0.3s"
                }}>
                    {error ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
                    {error || success}
                </div>
            )}

            {step === 1 ? (
                <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                    <FileUploadArea
                        onFileSelect={handleFileSelect}
                        loading={loading}
                        error={error}
                    />

                    {loading && (
                        <div style={{ marginTop: "2rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.875rem" }}>
                                <span>Schema Mapping in progress...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div style={{ height: "8px", background: "var(--bg-primary)", borderRadius: "4px", overflow: "hidden" }}>
                                <div style={{
                                    height: "100%", background: "var(--primary)", width: `${uploadProgress}%`,
                                    transition: "width 0.3s ease-in-out"
                                }} />
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div style={{ animation: "slideRight 0.3s ease-out" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <button className="secondary" onClick={handleAddRow} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Plus size={16} /> Add Task
                            </button>
                            <button
                                className="secondary"
                                onClick={handleUndo}
                                disabled={history.length === 0}
                                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                            >
                                <Undo2 size={16} /> Undo
                            </button>

                            {selectedRows.length > 0 && (
                                <div style={{
                                    marginLeft: "20px", display: "flex", alignItems: "center", gap: "12px",
                                    padding: "4px 12px", background: "rgba(var(--primary-rgb), 0.1)",
                                    borderRadius: "20px", border: "1px solid var(--primary-light)",
                                    animation: "popIn 0.2s"
                                }}>
                                    <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--primary)" }}>{selectedRows.length} Selected</span>
                                    <div style={{ width: "1px", height: "16px", background: "var(--primary-light)" }} />
                                    <button onClick={() => applyBulkAction('SKIP')} className="text-muted" style={{ background: "transparent", border: "none", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>Bulk Skip</button>
                                    <button onClick={() => applyBulkAction('APPEND')} className="text-success" style={{ background: "transparent", border: "none", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>Bulk Append</button>
                                    <button onClick={() => applyBulkAction('UPDATE')} className="text-primary" style={{ background: "transparent", border: "none", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }}>Bulk Update</button>
                                    <button onClick={() => setSelectedRows([])} style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex" }}><X size={14} /></button>
                                </div>
                            )}
                        </div>
                        <div style={{ fontSize: "0.875rem", color: isDataValid ? "var(--success)" : "var(--error)", fontWeight: 600 }}>
                            {isDataValid ?
                                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><CheckSquare size={16} /> Safety Check Passed</span> :
                                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><AlertCircle size={16} /> Resolve Conflicts to Sync</span>
                            }
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem" }}>
                        <DocumentPreviewTable
                            data={previewData}
                            onDataChange={handleDataChange}
                            onRowDelete={handleRowDelete}
                            onDecisionChange={handleDecisionChange}
                            decisions={decisions}
                            selectedRows={selectedRows}
                            onToggleSelection={toggleSelection}
                            onToggleSelectAll={toggleSelectAll}
                        />

                        <aside>
                            <div className="glass-card" style={{ padding: "1.5rem", position: "sticky", top: "2rem" }}>
                                <MoreHorizontal size={24} className="text-primary" style={{ marginBottom: "1rem" }} />
                                <h4 style={{ marginBottom: "0.5rem" }}>Governance Summary</h4>
                                <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
                                    Final counts before project timeline injection.
                                </p>

                                <div style={{ display: "grid", gap: "12px", marginBottom: "2rem" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                                        <span>Total Analyzed:</span>
                                        <span style={{ fontWeight: 700 }}>{previewData.length}</span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                                        <span>New Tasks:</span>
                                        <span style={{ color: "var(--success)", fontWeight: 700 }}>
                                            {Object.values(decisions).filter(d => d === 'APPEND').length}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                                        <span>Merging (Update):</span>
                                        <span style={{ color: "#d97706", fontWeight: 700 }}>
                                            {Object.values(decisions).filter(d => d === 'UPDATE').length}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }}>
                                        <span>Discarded (Skip):</span>
                                        <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>
                                            {Object.values(decisions).filter(d => d === 'SKIP').length}
                                        </span>
                                    </div>
                                </div>

                                <button
                                    className="primary"
                                    onClick={handleSync}
                                    disabled={loading || !isDataValid}
                                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", height: "48px" }}
                                >
                                    {loading ? <RefreshCw className="animate-spin" size={20} /> : <><Save size={20} /> Finalize Timeline</>}
                                </button>

                                <button
                                    className="secondary"
                                    onClick={() => setStep(1)}
                                    disabled={loading}
                                    style={{ width: "100%", marginTop: "12px" }}
                                >
                                    Cancel and Re-upload
                                </button>

                                {!isDataValid && (
                                    <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "var(--error)", textAlign: "center", lineHeight: 1.4 }}>
                                        * Review highlighted rows. Duplicates or missing titles must be corrected or skipped.
                                    </p>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentIntelligence;
