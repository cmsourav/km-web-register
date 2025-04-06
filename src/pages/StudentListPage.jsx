import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/StudentList.css";

const StudentList = () => {
    const [students, setStudents] = useState([]);
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [saving, setSaving] = useState(false);


    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [courseFilter, setCourseFilter] = useState("");
    const [collegeFilter, setCollegeFilter] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const studentsPerPage = 8;

    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    const openDetailsModal = (student) => {
        setSelectedStudent(student);
        setShowDetailsModal(true);
    };

    const closeDetailsModal = () => {
        setShowDetailsModal(false);
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState(null);

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "students"));
                const studentList = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setStudents(studentList);
                setFilteredStudents(studentList);
            } catch (err) {
                console.error("Error fetching students:", err);
                setError("Failed to load student data.");
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, []);

    useEffect(() => {
        let filtered = students;

        if (searchTerm) {
            filtered = filtered.filter((s) =>
                s.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (statusFilter) {
            filtered = filtered.filter((s) => s.applicationStatus === statusFilter);
        }

        if (collegeFilter) {
            filtered = filtered.filter((s) =>
                s.college?.toLowerCase().includes(collegeFilter.toLowerCase())
            );
        }
        

        setFilteredStudents(filtered);
        setCurrentPage(1);
    }, [searchTerm, statusFilter, collegeFilter, students]);

    const confirmDeleteStudent = (studentId) => {
        setStudentToDelete(studentId);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteDoc(doc(db, "students", studentToDelete));
            setStudents((prev) => prev.filter((s) => s.id !== studentToDelete));
            setShowDeleteModal(false);
            alert("Student deleted successfully.");
        } catch (err) {
            console.error("Error deleting student:", err);
            alert("Failed to delete student.");
        }
    };

    const indexOfLast = currentPage * studentsPerPage;
    const indexOfFirst = indexOfLast - studentsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const openEditModal = (student) => {
        setSelectedStudent(student);
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setSelectedStudent(null);
        setShowEditModal(false);
    };

    const handleEditChange = (e) => {
        setSelectedStudent({
            ...selectedStudent,
            [e.target.name]: e.target.value,
        });
    };

    const updateStudent = async () => {
        setSaving(true);
        try {
            const studentRef = doc(db, "students", selectedStudent.id);
            await updateDoc(studentRef, selectedStudent);
            setStudents((prev) =>
                prev.map((s) => (s.id === selectedStudent.id ? selectedStudent : s))
            );
            closeEditModal();
        } catch (err) {
            console.error("Error updating student:", err);
            alert("Failed to update student.");
        } finally {
            setSaving(false);
        }
    };


    return (
        <div className="student-list-container">
            <h1>All Students</h1>

            <div className="filter-bar">
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="">Admission status</option>
                    <option value="Enquiry">Enquiry</option>
                    <option value="Confirmed">Confirmed</option>
                </select>
                <input
                    type="text"
                    placeholder="Filter by college..."
                    value={collegeFilter}
                    onChange={(e) => setCollegeFilter(e.target.value)}
                />
            </div>

            {loading && <p>Loading...</p>}
            {error && <p className="error">{error}</p>}
            {!loading && !error && currentStudents.length === 0 && (
                <p>No students found.</p>
            )}

            {!loading && !error && currentStudents.length > 0 && (
                <>
                    <div className="student-grid">
                        {currentStudents.map((s) => (
                            <div className="student-card" key={s.id} onClick={() => openDetailsModal(s)}>
                                <div className="card-header">
                                    <h3>{s.studentName}</h3>
                                    <span className={`status-badge ${s.applicationStatus === "Confirmed" ? "confirmed" : "enquiry"}`}>
                                        {s.applicationStatus}
                                    </span>
                                </div>
                                <p><strong>Course:</strong> {s.course}</p>
                                <p><strong>Phone:</strong> {s.studentNumber}</p>
                                <div className="card-actions">
                                    <button className="icon-btn edit-btn" onClick={(e) => { e.stopPropagation(); openEditModal(s); }} title="Edit Student">✏️</button>
                                    <button className="icon-btn delete-btn" onClick={(e) => { e.stopPropagation(); confirmDeleteStudent(s.id); }} title="Delete Student">🗑️</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pagination">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>◀ Prev</button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button key={i + 1} onClick={() => handlePageChange(i + 1)} className={currentPage === i + 1 ? "active" : ""}>{i + 1}</button>
                        ))}
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Next ▶</button>
                    </div>
                </>
            )}

            {showEditModal && selectedStudent && (
                <div className="modal-overlay">
                    <div className="edit-modal">
                        <h2>Edit Student</h2>
                        <select name="applicationStatus" value={selectedStudent.applicationStatus} onChange={handleEditChange}>
                            <option value="Enquiry">Enquiry</option>
                            <option value="Confirmed">Confirmed</option>
                        </select>
                        <input name="studentName" value={selectedStudent.studentName} onChange={handleEditChange} placeholder="Student Name" />
                        <input name="studentNumber" value={selectedStudent.studentNumber} onChange={handleEditChange} placeholder="Phone Number" />
                        <input name="course" value={selectedStudent.course} onChange={handleEditChange} placeholder="Course" />

                        {/* Only show full fields if Confirmed */}
                        {selectedStudent.applicationStatus === "Confirmed" && (
                            <>
                                <input name="college" value={selectedStudent.college || ""} onChange={handleEditChange} placeholder="College" />
                                <select
                                    name="gender"
                                    value={selectedStudent.gender || ""}
                                    onChange={handleEditChange}
                                >

                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>

                                <input name="fatherName" value={selectedStudent.fatherName || ""} onChange={handleEditChange} placeholder="Father's Name" />
                                <input name="fatherNumber" value={selectedStudent.fatherNumber || ""} onChange={handleEditChange} placeholder="Father's Number" />
                                <input name="place" value={selectedStudent.place || ""} onChange={handleEditChange} placeholder="Place" />
                                <input name="reference" value={selectedStudent.reference || ""} onChange={handleEditChange} placeholder="Reference" />
                                <input name="createdBy" value={selectedStudent.createdBy || ""} onChange={handleEditChange} placeholder="Created By" />
                            </>
                        )}

                        <div className="modal-buttons">
                            <button onClick={updateStudent} disabled={saving}>
                                {saving ? "Saving..." : "Save"}
                            </button>
                            <button onClick={closeEditModal} disabled={saving}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}


            {showDetailsModal && selectedStudent && (
                <div className="modal-overlay" onClick={closeDetailsModal}>
                    <div className="details-modal enhanced-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-btn" onClick={closeDetailsModal}>×</button>
                        <h2 className="modal-title">{selectedStudent.studentName}'s Details</h2>
                        <div className="details-grid">
                            <div><strong>ID:</strong> {selectedStudent.studentId}</div>
                            <div><strong>Phone:</strong> {selectedStudent.studentNumber}</div>
                            <div><strong>DOB:</strong> {selectedStudent.dob}</div>
                            <div><strong>Gender:</strong> {selectedStudent.gender}</div>
                            <div><strong>Course:</strong> {selectedStudent.course}</div>
                            <div><strong>College:</strong> {selectedStudent.college}</div>
                            <div><strong>Father:</strong> {selectedStudent.fatherName}</div>
                            <div><strong>Father No:</strong> {selectedStudent.fatherNumber}</div>
                            <div><strong>Place:</strong> {selectedStudent.place}</div>
                            <div><strong>Reference:</strong> {selectedStudent.reference}</div>
                            <div><strong>Status:</strong> {selectedStudent.applicationStatus}</div>
                            <div><strong>Created By:</strong> {selectedStudent.createdBy}</div>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Are you sure you want to delete this student?</h3>
                        <div className="modal-buttons">
                            <button onClick={handleDeleteConfirm}>Yes, Delete</button>
                            <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentList;