import React, { useEffect, useState, useRef } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/Dashboard.css";

const Dashboard = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const sidebarRef = useRef(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "students"));
                const studentList = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setStudents(studentList);
            } catch (err) {
                console.error("Error fetching students:", err);
                setError("Failed to load student data.");
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    const handleOutsideClick = (e) => {
        if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
            setIsSidebarOpen(false);
        }
    };

    useEffect(() => {
        if (isSidebarOpen) {
            document.addEventListener("mousedown", handleOutsideClick);
        } else {
            document.removeEventListener("mousedown", handleOutsideClick);
        }
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, [isSidebarOpen]);

    const confirmedCount = students.filter(s => s.applicationStatus === "Confirmed").length;
    const enquiryCount = students.filter(s => s.applicationStatus === "Enquiry").length;

    return (
        // <div className="dashboard">
        //     {/* Hamburger Icon */}
        //     <div className="menu-icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
        //         <svg width="28" height="28" viewBox="0 0 100 80" fill="#333">
        //             <rect width="100" height="10" />
        //             <rect y="30" width="100" height="10" />
        //             <rect y="60" width="100" height="10" />
        //         </svg>
        //     </div>

        //     {/* Overlay */}
        //     {isSidebarOpen && <div className="overlay"></div>}

        //     <aside
        //         className={`sidebar ${isSidebarOpen ? "open" : ""}`}
        //         ref={sidebarRef}
        //     >
        //         <div className="sidebar-logo">KM Foundation</div>
        //         <nav className="sidebar-menu">
        //             <a href="/dashboard" className="active" onClick={() => setIsSidebarOpen(false)}>Dashboard</a>
        //             <a href="/add-student" onClick={() => setIsSidebarOpen(false)}>Add Student</a>
        //             <a href="/student-list" onClick={() => setIsSidebarOpen(false)}>View Students</a>
        //             <a href="#" onClick={() => setIsSidebarOpen(false)}>Settings</a>
        //             <a href="#" onClick={() => setIsSidebarOpen(false)}>Logout</a>
        //         </nav>
        //     </aside>

            <main className="main-content">
                <header className="dashboard-header">
                    <h1>Welcome Admin</h1>
                </header>

                <section className="cards">
                    <div className="card">
                        <h3>Total Students</h3>
                        <p>{loading ? "..." : students.length}</p>
                    </div>
                    <div className="card">
                        <h3>Confirmed</h3>
                        <p>{loading ? "..." : confirmedCount}</p>
                    </div>
                    <div className="card">
                        <h3>Enquiries</h3>
                        <p>{loading ? "..." : enquiryCount}</p>
                    </div>
                </section>

                <section className="student-table">
                    <h2>Recent Students</h2>

                    {loading && <p>Loading students...</p>}
                    {error && <p className="error">{error}</p>}
                    {!loading && !error && students.length === 0 && (
                        <p>No students found.</p>
                    )}

                    {!loading && !error && students.length > 0 && (
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Status</th>
                                    <th>Course</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((s) => (
                                    <tr key={s.id}>
                                        <td>{s.studentId || s.id}</td>
                                        <td>{s.studentName}</td>
                                        <td>{s.applicationStatus}</td>
                                        <td>{s.course}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </main>
        // </div>
    );
};

export default Dashboard;
