import React, { useState, useEffect } from "react";
import search from "../assets/search.png";
import filterIcon from "../assets/filter.png";
import eventtitle from "../assets/eventtitle.png";
import datetime from "../assets/datetime.png";
import statustracker from "../assets/statustracker.png";
import action from "../assets/action.png";

import { db } from "../Firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { doc, setDoc, getDoc, deleteDoc, updateDoc, collection as subCollection } from "firebase/firestore";

export const CAttendance = () => {
  const [attendanceEvents, setAttendanceEvents] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [selectedYearLevel, setSelectedYearLevel] = useState("All");

  useEffect(() => {
    const fetchEvents = async () => {
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const todayEnd = new Date(now.setHours(23, 59, 59, 999));

      const eventsCollection = collection(db, "events");
      const eventsQuery = query(
        eventsCollection,
        where("startDate", "<=", todayEnd.toISOString().split("T")[0]),
        where("startDate", ">=", todayStart.toISOString().split("T")[0])
      );
      const querySnapshot = await getDocs(eventsQuery);
      const eventsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAttendanceEvents(eventsData);
    };

    fetchEvents();
  }, []);

  const handleMarkAttendance = async (student, event) => {
    const now = new Date();
    const eventStartTime = new Date(`${event.startDate}T${event.startTime}`);
    const eventEndTime = new Date(`${event.endDate}T${event.endTime}`);
    const lateThreshold = new Date(eventStartTime.getTime() + 10 * 60000); // 10 minutes after start time
  
    const attendanceDocRef = doc(subCollection(db, "events", event.id, "attendance"), student.id);
    const docSnapshot = await getDoc(attendanceDocRef);
  
    if (docSnapshot.exists()) {
      // Remove the mark if it already exists
      await deleteDoc(attendanceDocRef);
      const updatedStudents = students.map((s) =>
        s.id === student.id ? { ...s, checkedIn: false, status: null } : s
      );
      setStudents(updatedStudents);
    } else {
      // Mark the student
      let status = "absent";
      if (now <= eventEndTime) {
        if (now <= lateThreshold) {
          status = "ontime";
        } else {
          status = "late";
        }
      }
  
      await setDoc(attendanceDocRef, {
        studentId: student.id,
        status: status,
        timestamp: now.toISOString(),
      });
  
      const updatedStudents = students.map((s) =>
        s.id === student.id ? { ...s, checkedIn: true, status: status } : s
      );
      setStudents(updatedStudents);
    }
  
    // Fetch the latest attendance records to update the tracker
    const attendanceCollection = subCollection(db, "events", event.id, "attendance");
    const attendanceSnapshot = await getDocs(attendanceCollection);
    const attendanceData = attendanceSnapshot.docs.map((doc) => doc.data());
  
    // Update the tracker data in the event
    const attendedStudents = attendanceData.filter(s => s.status === "ontime" || s.status === "late").length;
    const totalStudents = students.length;
    const tracker = (attendedStudents / totalStudents) * 100; // Compute as percentage
  
    const eventDocRef = doc(db, "events", event.id);
    await updateDoc(eventDocRef, { tracker });
  };
  
  useEffect(() => {
    const now = new Date();
    attendanceEvents.forEach(event => {
      const eventEndTime = new Date(`${event.endDate}T${event.endTime}`);
      if (now > eventEndTime) {
        students.forEach(async (student) => {
          const attendanceDocRef = doc(subCollection(db, "events", event.id, "attendance"), student.id);
          const docSnapshot = await getDoc(attendanceDocRef);
          if (!docSnapshot.exists()) {
            await setDoc(attendanceDocRef, {
              studentId: student.id,
              status: "absent",
              timestamp: now.toISOString(),
            });
            const updatedStudents = students.map((s) =>
              s.id === student.id ? { ...s, checkedIn: true, status: "absent" } : s
            );
            setStudents(updatedStudents);

            // Update the tracker data in the event
            const attendedStudents = updatedStudents.filter(s => s.status === "ontime" || s.status === "late").length;
            const totalStudents = updatedStudents.length;
            const tracker = (attendedStudents / totalStudents) * 100; // Compute as percentage

            const eventDocRef = doc(db, "events", event.id);
            await updateDoc(eventDocRef, { tracker });
          }
        });
      }
    });
  }, [attendanceEvents, students]);


  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
  };

  const handleYearLevelChange = (e) => {
    setSelectedYearLevel(e.target.value);
  };

  const handleOpenModal = async (event) => {
    setSelectedEvent(event);
    const studentsCollection = collection(db, "students");
    const studentsQuery = query(
      studentsCollection,
      where("course", "in", event.course),
      where("yrlvl", "in", event.yearLevel)
    );
    const querySnapshot = await getDocs(studentsQuery);
    const studentsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Fetch attendance records and update students' status
    const attendanceCollection = subCollection(db, "events", event.id, "attendance");
    const attendanceSnapshot = await getDocs(attendanceCollection);
    const attendanceData = attendanceSnapshot.docs.reduce((acc, doc) => {
      acc[doc.id] = doc.data();
      return acc;
    }, {});

    const updatedStudents = studentsData.map((student) => {
      const attendanceRecord = attendanceData[student.id];
      if (attendanceRecord) {
        return { ...student, checkedIn: true, status: attendanceRecord.status };
      }
      return student;
    });

    setStudents(updatedStudents);
    setModalOpen(true);
  };
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedEvent(null);
    setStudents([]);
  };

  const filteredEvents = attendanceEvents.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = selectedCourse === "All" || event.course.includes(selectedCourse);
    const matchesYearLevel = selectedYearLevel === "All" || event.yearLevel.includes(selectedYearLevel);

    return matchesSearch && matchesCourse && matchesYearLevel;
  });

  return (
    <div className="bg-gray-100 p-6 select-none">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-poppins font-bold text-[#1F384C]"> Attendance Marking</h1>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-4 space-y-2 md:space-y-0">
        <div className="relative w-full md:w-[355px] h-8">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full h-full bg-gray-200 rounded-md pl-4 pr-10 focus:outline-none font-poppins font-bold placeholder:font-poppins placeholder:font-bold"
          />
          <img
            src={search}
            alt="search-icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4"
          />
        </div>
        <div className="flex space-x-3">
          <div className="relative flex items-center">
            <img src={filterIcon} alt="filter-icon" className="absolute left-2 top-2 w-4 h-4" />
            <select
              value={selectedCourse}
              onChange={handleCourseChange}
              className="border rounded-lg p-1 h-8 bg-gray-200 w-[130px] font-poppins font-normal text-sm text-[#818181] pl-7 cursor-pointer"
            >
              <option value="All">All Courses</option>
              <option value="BSIT">BSIT</option>
              <option value="BSCS">BSCS</option>
              <option value="BSCPE">BSCPE</option>
            </select>
          </div>
          <div className="relative flex items-center">
            <img src={filterIcon} alt="filter-icon" className="absolute left-2 top-2 w-4 h-4" />
            <select
              value={selectedYearLevel}
              onChange={handleYearLevelChange}
              className="border rounded-lg p-1 h-8 bg-gray-200 w-[130px] font-poppins font-normal text-sm text-[#818181] pl-7 cursor-pointer"
            >
              <option value="All">All Year Levels</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-hidden" style={{ maxHeight: "400px" }}>
        <div className="overflow-y-auto scrollbar-hidden" style={{ maxHeight: "400px" }}>
          <table className="bg-white border border-gray-300 w-full">
            <thead>
              <tr className="bg-gray-200 sticky top-[-1px] z-2">
                <th className="px-4 py-2 text-left font-poppins font-bold w-[267px]">
                  <img src={eventtitle} alt="" className="inline w-4 h-4 mr-1 mb-1" /> Event Title
                </th>
                <th className="px-4 py-2 text-center font-poppins font-bold w-[260px]">
                  <img src={datetime} alt="" className="inline w-4 h-4 mr-1 mb-1" /> Date/Time
                </th>
                <th className="px-4 py-2 text-center font-poppins font-bold w-[170px]">
                  <img src={datetime} alt="" className="inline w-4 h-4 mr-1 mb-1" /> Course
                </th>
                <th className="px-4 py-2 text-center font-poppins font-bold w-[180px]">
                  <img src={statustracker} alt="" className="inline w-4 h-4 mr-1 mb-1" /> Year Level
                </th>
                <th className="px-4 py-2 text-center font-poppins font-bold w-[160px]">
                  <img src={action} alt="" className="inline w-4 h-4 mr-1 mb-1" /> Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event, index) => (
                <tr key={index}>
                  <td className="flex items-center px-2 py-2 font-poppins font-normal text-left">
                    <img src={event.image} alt="Event" className="w-10 h-10 rounded-full mr-2" />
                    {event.title}
                  </td>
                  <td className="px-4 py-2 font-poppins font-normal text-center text-[#6B6B6B]">
                    {event.startDate} | {event.endDate} - {event.startTime} | {event.endTime}
                  </td>
                  <td className="px-4 py-2 font-poppins font-normal text-center">
                    {event.course.join(", ")}
                  </td>
                  <td className="px-4 py-2 font-poppins font-normal text-center">
                    {event.yearLevel.join(", ")}
                  </td>
                  <td className="px-4 py-2 font-poppins font-normal text-center">
                    <button
                      className="border px-5 py-1 bg-gray-200"
                      style={{ borderColor: "#D5D5D5" }}
                      onClick={() => handleOpenModal(event)}
                    >
                      Attendees
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Attendees */}
      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[95%] sm:w-[90%] md:w-[80%] lg:w-[70%] h-[90%] overflow-y-auto">
            <h1 className="flex text-custom-purple font-poppins font-bold text-[22px] mb-4 items-center">
              <img src={selectedEvent.image} alt="Event" className="w-14 h-14 rounded-full mr-2" />
              {selectedEvent.title}
            </h1>

            {/* Attendees Table */}
            <h3 className="font-bold mt-4 text-[20px] font-poppins">Attendees</h3>
            <table className="min-w-full mt-2 border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left font-poppins font-bold">Name</th>
                  <th className="px-4 py-2 text-center font-poppins font-bold">
                    <img src={datetime} alt="" className="inline w-4 h-4 mr-1 mb-1" />Course
                  </th>
                  <th className="px-4 py-2 text-center font-poppins font-bold">
                    <img src={statustracker} alt="" className="inline w-4 h-4 mr-1 mb-1" />Year
                    Level
                  </th>
                  <th className="px-4 py-2 text-center font-poppins font-bold">
                    <img src={action} alt="" className="inline w-4 h-4 mr-1 mb-1" />Checked In
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={index} className="border-b">
                    <td className="flex items-center px-4 py-2 text-left font-poppins font-normal">
                      <img
                        src={student.profile}
                        alt="Student"
                        className="w-10 h-10 rounded-full mr-2"
                      />
                      {student.name}
                    </td>
                    <td className="px-4 py-2 text-center font-poppins font-normal">
                      {student.course}
                    </td>
                    <td className="px-4 py-2 text-center font-poppins font-normal">
                      {student.yrlvl}
                    </td>
                    <td className="px-4 py-2 text-center font-poppins font-normal">
                      <button
                        className={`px-4 py-2 rounded ${student.status === "ontime" ? "bg-green-400" :
                            student.status === "late" ? "bg-yellow-400" :
                              student.status === "absent" ? "bg-red-400" : "bg-gray-400"
                          }`}
                        onClick={() => handleMarkAttendance(student, selectedEvent)}
                      >
                        {student.status === "ontime" ? "On Time" :
                          student.status === "late" ? "Late" :
                            student.status === "absent" ? "Absent" : "Mark"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="button"
                className="bg-gray-200 px-4 py-2 rounded"
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};