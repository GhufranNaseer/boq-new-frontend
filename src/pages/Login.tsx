import { useState } from "react";
import axios from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Lock, Loader2 } from "lucide-react";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes("@")) return setError("Please enter a valid email address");
        if (password.length < 6) return setError("Password must be at least 6 characters");

        setError("");
        setLoading(true);
        try {
            const res = await axios.post("/auth/login", { email, password });
            login(res.data.user, res.data.accessToken);

            if (res.data.user.role === "MASTER_ADMIN") navigate("/master-admin");
            else if (res.data.user.role === "ADMIN") navigate("/admin");
            else navigate("/department-user");
        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
            padding: "20px"
        }}>
            <div className="glass-card" style={{
                width: "100%",
                maxWidth: "440px",
                padding: "2.5rem",
                textAlign: "center"
            }}>
                <div style={{
                    display: "inline-flex",
                    padding: "12px",
                    background: "var(--primary)",
                    borderRadius: "12px",
                    color: "white",
                    marginBottom: "1.5rem"
                }}>
                    <ShieldCheck size={32} />
                </div>

                <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>Welcome Back</h1>
                <p style={{ color: "var(--text-muted)", marginBottom: "2rem" }}>Enter your credentials to access the BOQ Suite</p>

                {error && (
                    <div style={{
                        background: "#fef2f2",
                        color: "var(--error)",
                        padding: "0.75rem",
                        borderRadius: "0.5rem",
                        fontSize: "0.875rem",
                        marginBottom: "1.5rem",
                        textAlign: "left",
                        border: "1px solid #fee2e2"
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ textAlign: "left" }}>
                    <div style={{ marginBottom: "1.25rem" }}>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Email Address</label>
                        <div style={{ position: "relative" }}>
                            <Mail size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input
                                type="email"
                                placeholder="name@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ paddingLeft: "40px" }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: "2rem" }}>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, marginBottom: "0.5rem" }}>Password</label>
                        <div style={{ position: "relative" }}>
                            <Lock size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingLeft: "40px" }}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="primary"
                        disabled={loading}
                        style={{
                            width: "100%",
                            height: "44px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px"
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : "Sign In"}
                    </button>
                </form>

                <p style={{ marginTop: "2rem", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                    Enterprise BOQ & Task Management Platform
                </p>
            </div>
        </div>
    );
};

export default Login;
