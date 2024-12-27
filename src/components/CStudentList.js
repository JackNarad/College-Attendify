import React, { useState, useEffect } from "react";
import search from "../assets/search.png";
import filter from "../assets/filter.png";
import createevent from "../assets/createevent.png";
import eventtitle from "../assets/eventtitle.png";
import datetime from "../assets/datetime.png";
import statustracker from "../assets/statustracker.png";
import action from "../assets/action.png";
import edit from "../assets/edit.png";
import trash from "../assets/trash.png";

import { doc, setDoc, collection, onSnapshot, getDoc, deleteDoc } from "firebase/firestore";
import { db } from "../Firebase"; // Adjust path based on your structure
import { storage } from "../Firebase"; // Import storage from Firebase.js
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

export const CStudentList = () => {
  const [studentList, setStudentList] = useState([]);
  const [filteredStudentList, setFilteredStudentList] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [studentData, setStudentData] = useState({
    profile: "",
    name: "",
    studentNumber: "",
    course: "",
    yrlvl: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourse, setFilterCourse] = useState("");
  const [filterYearLevel, setFilterYearLevel] = useState("");

  // Fetch student data from Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "students"), (snapshot) => {
      const students = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setStudentList(students);
      setFilteredStudentList(students);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filterStudents = () => {
      let filtered = studentList;

      if (searchTerm) {
        filtered = filtered.filter((student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.studentNumber.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (filterCourse) {
        filtered = filtered.filter((student) => student.course === filterCourse);
      }

      if (filterYearLevel) {
        filtered = filtered.filter((student) => student.yrlvl === filterYearLevel);
      }

      setFilteredStudentList(filtered);
    };

    filterStudents();
  }, [searchTerm, filterCourse, filterYearLevel, studentList]);


  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setIsEditing(false);
    setCurrentStudentId(null);
    setStudentData({ profile: "", name: "", studentNumber: "", course: "", yrlvl: "" });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        document.getElementById("profile-preview").src = reader.result;
      };
      reader.readAsDataURL(file);

      // Save the file for uploading later
      setStudentData((prev) => ({ ...prev, profile: file }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStudentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = "";

      if (studentData.profile instanceof File) {
        const storageRef = ref(storage, `student_profiles/${studentData.profile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, studentData.profile);

        // Wait for upload to complete
        imageUrl = await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              console.log(`Upload progress: ${(snapshot.bytesTransferred / snapshot.totalBytes) * 100}%`);
            },
            (error) => {
              console.error("Upload failed:", error);
              reject(error);
            },
            async () => {
              try {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                console.log("Image uploaded successfully. URL:", downloadURL);
                resolve(downloadURL);
              } catch (error) {
                console.error("Error getting download URL:", error);
                reject(error);
              }
            }
          );
        });
      } else {
        imageUrl = studentData.profile || "https://via.placeholder.com/150"; // Fallback URL if no image is uploaded
      }

      const studentDataToSave = {
        ...studentData,
        profile: imageUrl,
      };

      if (isEditing && currentStudentId) {
        const studentDocRef = doc(db, "students", currentStudentId);
        await setDoc(studentDocRef, studentDataToSave, { merge: true });
        alert("Student updated successfully!");
      } else {
        const studentCollectionRef = collection(db, "students");
        const studentDocRef = doc(studentCollectionRef); // Generate a new unique ID
        await setDoc(studentDocRef, studentDataToSave);
        alert("Student added successfully!");
      }

      setModalOpen(false);
      setStudentData({ profile: "", name: "", studentNumber: "", course: "", yrlvl: "" }); // Reset form
    } catch (error) {
      console.error("Error saving student data:", error);
      alert("Failed to save student.");
    }
  };

  const editStudent = async (studentId) => {
    try {
      const studentDocRef = doc(db, "students", studentId);
      const studentDoc = await getDoc(studentDocRef);

      if (studentDoc.exists()) {
        const studentData = studentDoc.data();
        setStudentData(studentData); // Populate the modal with existing data
        setCurrentStudentId(studentId);
        setIsEditing(true);
        setModalOpen(true); // Open the modal for editing
      } else {
        console.error("No such student!");
        alert("Student not found.");
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      alert("Failed to fetch student data.");
    }
  };

  const deleteStudent = async (studentId) => {
    try {
      const studentDocRef = doc(db, "students", studentId);
      await deleteDoc(studentDocRef);
      alert("Student deleted successfully!");
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student.");
    }
  };

  return (
    <div className="bg-gray-100 p-6 select-none">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-poppins font-bold text-[#1F384C]">Student List</h1>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-5 space-y-3 md:space-y-0">
        <div className="relative w-full max-w-xs md:max-w-sm h-8">
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-full bg-gray-200 rounded-md pl-4 pr-10 focus:outline-none font-poppins font-bold placeholder:font-poppins placeholder:font-bold"
          />
          <img
            src={search}
            alt="search-icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4"
          />
        </div>

        <div className="flex space-x-4 items-center">
          {/* Filter by Course */}
          <div className="relative">
            <img src={filter} alt="filter-icon" className="absolute left-2 top-2 w-4 h-4" />
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="border rounded-lg pl-8 pr-4 py-1 h-8 bg-gray-200 w-full text-sm font-poppins text-[#818181] cursor-pointer"
            >
              <option value="">All Courses</option>
              <option value="BSIT">BSIT</option>
              <option value="BSCS">BSCS</option>
              <option value="BSCPE">BSCPE</option>
            </select>
          </div>

          {/* Filter by Year Level */}
          <div className="relative">
            <img src={filter} alt="filter-icon" className="absolute left-2 top-2 w-4 h-4" />
            <select
              value={filterYearLevel}
              onChange={(e) => setFilterYearLevel(e.target.value)}
              className="border rounded-lg pl-8 pr-4 py-1 h-8 bg-gray-200 w-full text-sm font-poppins text-[#818181] cursor-pointer"
            >
              <option value="">All Year Levels</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>

          <button
            className="bg-[#480DBE] text-white px-4 md:px-6 py-2 rounded-lg w-auto h-12 font-poppins font-normal flex items-center"
            onClick={handleOpenModal}
          >
            <img src={createevent} alt="" className="h-4 w-4 mr-2" />
            Create Student
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden max-w-full relative" style={{ maxHeight: "400px" }}>
        <div className="overflow-y-auto scrollbar-hidden" style={{ maxHeight: "400px" }}>
          <table className="bg-white border border-gray-300 w-full text-sm sm:text-base">
            <thead>
              <tr className="bg-gray-200 sticky top-0 z-0">
                <th className="px-2 md:px-4 py-2 text-center font-poppins font-bold">
                  <img src={eventtitle} alt="" className="inline w-4 h-4 mr-1 mb-1" /> Student
                </th>
                <th className="px-2 md:px-4 py-2 text-center font-poppins font-bold">
                  <img src={datetime} alt="" className="inline w-4 h-4 mr-1 mb-1" /> Student Number
                </th>
                <th className="px-2 md:px-4 py-2 text-center font-poppins font-bold">
                  <img src={datetime} alt="" className="inline w-4 h-4 mr-1 mb-1" /> Course
                </th>
                <th className="px-2 md:px-4 py-2 text-center font-poppins font-bold">
                  <img src={statustracker} alt="" className="inline w-4 h-4 mr-1 mb-1" /> Year Level
                </th>
                <th className="px-2 md:px-4 py-2 text-center font-poppins font-bold">
                  <img src={action} alt="" className="inline w-4 h-4 mr-1 mb-1" /> Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudentList.map((student, index) => (
                <tr key={index}>
                  <td className="flex items-center px-2 md:px-4 py-2 font-poppins text-center">
                    <img src={student.profile} alt="Profile" className="w-8 md:w-10 h-8 md:h-10 rounded-full mr-3 md:mr-5" />
                    {student.name}
                  </td>
                  <td className="px-2 md:px-4 py-2 font-poppins text-center text-[#474747]">{student.studentNumber}</td>
                  <td className="px-2 md:px-4 py-2 font-poppins text-center text-[#474747]">{student.course}</td>
                  <td className="px-2 md:px-4 py-2 font-poppins text-center text-[#474747]">{student.yrlvl}</td>
                  <td className="px-2 md:px-4 py-2 font-poppins text-center">
                    <button
                      className="border px-3 py-2 text-red-600 rounded-[7px] hover:bg-gray-200 mr-2"
                      style={{ borderColor: "#D5D5D5" }}
                      onClick={() => editStudent(student.id)}
                    >
                      <img src={edit} alt="Edit" className="w-4 md:w-5 h-4 md:h-5" />
                    </button>
                    <button
                      className="border px-3 py-2 text-red-600 rounded-[7px] hover:bg-gray-200"
                      style={{ borderColor: "#D5D5D5" }}
                      onClick={() => deleteStudent(student.id)}
                    >
                      <img src={trash} alt="Delete" className="w-4 md:w-5 h-4 md:h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4">
          <div className="bg-white p-4 md:p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{isEditing ? "Edit Student Data" : "Create Student Data"}</h2>
            <form onSubmit={handleSaveStudent}>
              <div className="mb-4">
                <label className="flex items-center text-lg font-bold mb-2 justify-center">Profile Picture</label>
                <div className="flex items-center justify-center">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="profile-picture-input"
                    required
                    onChange={handleImageUpload}
                  />
                  <label
                    htmlFor="profile-picture-input"
                    className="cursor-pointer flex items-center justify-center bg-gray-200 w-24 h-24 rounded-full overflow-hidden"
                  >
                    <img
                      src={studentData.profile || "https://via.placeholder.com/150"}
                      alt="Profile Preview"
                      id="profile-preview"
                      className="w-full h-full object-cover"
                    />
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-lg font-bold mb-2">Student Name</label>
                <input
                  type="text"
                  name="name"
                  value={studentData.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter student fullname"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-lg font-bold mb-2">Student Number</label>
                <input
                  type="text"
                  name="studentNumber"
                  value={studentData.studentNumber}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter student number"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-lg font-bold mb-2">Course</label>
                <select
                  name="course"
                  value={studentData.course}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="" disabled>Select Course...</option>
                  <option value="BSIT">BSIT</option>
                  <option value="BSCS">BSCS</option>
                  <option value="BSCPE">BSCPE</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-lg font-bold mb-2">Year Level</label>
                <select
                  name="yrlvl"
                  value={studentData.yrlvl}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="" disabled>Select Year Levels...</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="bg-gray-200 px-4 py-2 rounded"
                  onClick={handleCloseModal}
                >
                  Cancel
                </button>
                <button type="submit" className="bg-[#480DBE] text-white px-4 py-2 rounded">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};