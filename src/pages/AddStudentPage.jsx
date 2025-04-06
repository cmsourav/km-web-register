import { useEffect, useState } from "react";
import "../styles/AddStudent.css";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const AddStudent = () => {
  const [student, setStudent] = useState({
    studentId: "",
    studentName: "",
    applicationStatus: "",
    studentNumber: "",
    dob: "",
    gender: "",
    course: "",
    college: "",
    fatherName: "",
    fatherNumber: "",
    place: "",
    reference: "",
    createdBy: "",
  });

  const [formErrors, setFormErrors] = useState({});
  const [isVerified, setIsVerified] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const enquiryFields = [
    "studentId", "applicationStatus", "studentName", "studentNumber", "dob", "course", "college", "reference"
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setIsAuth(!!user);
    });
    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setStudent((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleVerify = async () => {
    const trimmedId = student.studentId.trim();
    if (!trimmedId) {
      setFormErrors({ studentId: "Please enter a Student ID to verify." });
      return;
    }

    if (!/^\d+$/.test(trimmedId)) {
      setFormErrors({ studentId: "Student ID should be a number." });
      return;
    }

    const studentRef = doc(db, "students", trimmedId);
    const docSnap = await getDoc(studentRef);

    if (docSnap.exists()) {
      navigate(`/student-list/${trimmedId}`);
    } else {
      setIsVerified(true);
      setCurrentStep(2);
    }
  };

  const validate = () => {
    const errors = {};
    const isEnquiry = student.applicationStatus === "Enquiry";
    const isConfirmed = student.applicationStatus === "Confirmed";

    const requiredFields = isEnquiry
      ? enquiryFields
      : isConfirmed
      ? Object.keys(student).filter((key) => key !== "createdBy")
      : [];

    requiredFields.forEach((key) => {
      if (!student[key]) {
        errors[key] = "This field is required.";
      }
    });

    if (student.studentId && !/^\d+$/.test(student.studentId)) {
      errors.studentId = "Student ID should contain only numbers.";
    }

    if (student.studentNumber && !/^\d{10}$/.test(student.studentNumber)) {
      errors.studentNumber = "Enter a valid 10-digit number.";
    }

    if (isConfirmed && student.fatherNumber && !/^\d{10}$/.test(student.fatherNumber)) {
      errors.fatherNumber = "Enter a valid 10-digit number.";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      alert("User not authenticated");
      return;
    }

    let studentData = {};
    const isEnquiry = student.applicationStatus === "Enquiry";
    const isConfirmed = student.applicationStatus === "Confirmed";

    if (isEnquiry) {
      enquiryFields.forEach((key) => {
        studentData[key] = student[key];
      });
      studentData.createdBy = user.email;
      studentData.fatherName = "";
      studentData.fatherNumber = "";
      studentData.gender = "";
      studentData.place = "";
    } else if (isConfirmed) {
      studentData = {
        ...student,
        createdBy: user.email,
      };
    }

    try {
      const studentRef = doc(db, "students", student.studentId);
      await setDoc(studentRef, studentData);
      toast.success("Student added successfully!");

      setStudent({
        studentId: "",
        studentName: "",
        applicationStatus: "",
        studentNumber: "",
        dob: "",
        gender: "",
        course: "",
        college: "",
        fatherName: "",
        fatherNumber: "",
        place: "",
        reference: "",
        createdBy: "",
      });
      setIsVerified(false);
      setCurrentStep(1);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error adding student:", error);
      toast.error("Failed to add student.");
    }
  };

  return (
    <div className="add-student-container">
      <h2>Add Student</h2>
      {isAuth ? (
        <form className="student-form" onSubmit={handleSubmit}>
          <div className="stepper">
            <div className={`step ${currentStep === 1 ? "active" : ""}`}>
              <div className="circle">1</div>
              <span>Verify</span>
            </div>
            <div className={`step ${currentStep === 2 ? "active" : ""}`}>
              <div className="circle">2</div>
              <span>Details</span>
            </div>
          </div>

          {currentStep === 1 && (
            <>
              <div className="form-group">
                <label htmlFor="studentId">Student ID</label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  value={student.studentId}
                  onChange={handleChange}
                />
                {formErrors.studentId && <span className="error-text">{formErrors.studentId}</span>}
              </div>
              <div className="form-footer center">
                <button type="button" className="submit-btn" onClick={handleVerify}>Verify</button>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="form-group">
                <label htmlFor="applicationStatus">Application Status</label>
                <select
                  id="applicationStatus"
                  name="applicationStatus"
                  value={student.applicationStatus}
                  onChange={handleChange}
                >
                  <option value="">Select Status</option>
                  <option value="Enquiry">Enquiry</option>
                  <option value="Confirmed">Confirmed</option>
                </select>
                {formErrors.applicationStatus && (
                  <span className="error-text">{formErrors.applicationStatus}</span>
                )}
              </div>

              {Object.keys(student).map((key) => {
                if (["studentId", "applicationStatus", "createdBy"].includes(key)) return null;
                if (student.applicationStatus === "Enquiry" && !enquiryFields.includes(key)) return null;

                return (
                  <div className="form-group" key={key}>
                    <label htmlFor={key}>
                      {key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                    </label>
                    {key === "gender" ? (
                      <select
                        id={key}
                        name={key}
                        value={student[key]}
                        onChange={handleChange}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <input
                        type={key === "dob" ? "date" : "text"}
                        id={key}
                        name={key}
                        value={student[key]}
                        onChange={handleChange}
                      />
                    )}
                    {formErrors[key] && <span className="error-text">{formErrors[key]}</span>}
                  </div>
                );
              })}

              <div className="form-footer">
                <button type="submit" className="submit-btn">Submit</button>
              </div>
            </>
          )}
        </form>
      ) : (
        <p>Please log in to add a student.</p>
      )}
    </div>
  );
};

export default AddStudent;