import Sidebar from "./Sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "var(--background)" }}>
            <Sidebar />
            <main style={{
                flex: 1,
                marginLeft: "280px",
                padding: "2rem 3rem",
                width: "calc(100% - 280px)"
            }}>
                <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default Layout;
