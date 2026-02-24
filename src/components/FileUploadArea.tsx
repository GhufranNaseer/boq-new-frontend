import React, { useState, useRef } from "react";
import { Upload, AlertCircle } from "lucide-react";

interface FileUploadAreaProps {
    onFileSelect: (file: File) => void;
    loading?: boolean;
    error?: string;
}

const FileUploadArea: React.FC<FileUploadAreaProps> = ({ onFileSelect, loading, error }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const allowedExtensions = ['.xlsx', '.xls', '.csv', '.docx', '.doc'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const validateAndSelect = (file: File) => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            alert(`Invalid file type. Only ${allowedExtensions.join(', ')} are supported.`);
            return;
        }
        if (file.size > maxSize) {
            alert("File is too large. Maximum size is 10MB.");
            return;
        }
        onFileSelect(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSelect(e.dataTransfer.files[0]);
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSelect(e.target.files[0]);
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`glass-card ${isDragging ? "dragging" : ""}`}
            style={{
                border: `2px dashed ${isDragging ? "var(--primary)" : "var(--border-color)"}`,
                padding: "3rem",
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s",
                background: isDragging ? "rgba(37, 99, 235, 0.05)" : "white",
                borderRadius: "1rem"
            }}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                className="hidden"
                accept={allowedExtensions.join(',')}
            />

            <div style={{ marginBottom: "1.5rem" }}>
                <div style={{
                    width: "64px", height: "64px", background: "var(--bg-primary)",
                    borderRadius: "50%", display: "flex", alignItems: "center",
                    justifyContent: "center", margin: "0 auto", color: "var(--primary)"
                }}>
                    <Upload size={32} />
                </div>
            </div>

            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.5rem" }}>
                {loading ? "Processing Document..." : "Upload BOQ or Project Schedule"}
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
                Drag and drop your file here, or click to browse.<br />
                Supported formats: XLSX, CSV, DOCX (Max 10MB)
            </p>

            {error && (
                <div style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    color: "var(--error)", background: "#fef2f2",
                    padding: "0.75rem 1rem", borderRadius: "0.5rem",
                    fontSize: "0.875rem", justifyContent: "center"
                }}>
                    <AlertCircle size={16} /> {error}
                </div>
            )}
        </div>
    );
};

export default FileUploadArea;
