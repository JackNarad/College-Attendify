import React, { useState, useEffect } from "react";
import summaries from "../assets/summaries.png";
import search from '../assets/search.png';
import bookmark from '../assets/bookmark.png';
import filter from '../assets/filter.png';
import user from '../assets/user.png';
import course from '../assets/course.png';
import yearlevel from '../assets/yearlevel.png';
import status from '../assets/status.png';
import datetime from "../assets/datetime.png";
import action from "../assets/action.png";
import { db } from "../Firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

export const CReports = () => {
  const [events, setEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [students, setStudents] = useState([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [eventFilter, setEventFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [yearLevelFilter, setYearLevelFilter] = useState("all");
  const [todaySummary, setTodaySummary] = useState({ onTime: 0, late: 0, absent: 0, notMarked: 0 });
  const [attendanceSummary, setAttendanceSummary] = useState({ onTime: 0, late: 0, absent: 0, notMarked: 0 });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const eventsCollection = collection(db, "events");
    const querySnapshot = await getDocs(eventsCollection);
    const eventsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    let todayOnTimeCount = 0;
    let todayLateCount = 0;
    let todayAbsentCount = 0;
    let todayNotMarkedCount = 0;

    let totalOnTimeCount = 0;
    let totalLateCount = 0;
    let totalAbsentCount = 0;
    let totalNotMarkedCount = 0;

    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    await Promise.all(eventsData.map(async (event) => {
      const attendanceCollection = collection(db, "events", event.id, "attendance");
      const attendanceSnapshot = await getDocs(attendanceCollection);
      const attendanceData = attendanceSnapshot.docs.map((doc) => doc.data());

      const studentsCollection = collection(db, "students");
      const studentsQuery = query(
        studentsCollection,
        where("course", "in", event.course),
        where("yrlvl", "in", event.yearLevel)
      );
      const studentsSnapshot = await getDocs(studentsQuery);
      const studentsData = studentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      studentsData.forEach((student) => {
        const attendanceRecord = attendanceData.find((record) => record.studentId === student.id && record.timestamp.split('T')[0] === today);

        if (attendanceRecord) {
          if (attendanceRecord.status === "ontime") {
            totalOnTimeCount++;
            if (attendanceRecord.timestamp.split('T')[0] === today) {
              todayOnTimeCount++;
            }
          } else if (attendanceRecord.status === "late") {
            totalLateCount++;
            if (attendanceRecord.timestamp.split('T')[0] === today) {
              todayLateCount++;
            }
          } else if (attendanceRecord.status === "absent") {
            totalAbsentCount++;
            if (attendanceRecord.timestamp.split('T')[0] === today) {
              todayAbsentCount++;
            }
          }
        } else {
          totalNotMarkedCount++;
          todayNotMarkedCount++;
          
        }
      });
    }));

    setTodaySummary({ onTime: todayOnTimeCount, late: todayLateCount, absent: todayAbsentCount, notMarked: todayNotMarkedCount });
    setAttendanceSummary({ onTime: totalOnTimeCount, late: totalLateCount, absent: totalAbsentCount, notMarked: totalNotMarkedCount });
    setEvents(eventsData);
  };


  const handleOpenModal = async (event) => {
    setSelectedEvent(event);
    const attendanceCollection = collection(db, "events", event.id, "attendance");
    const attendanceSnapshot = await getDocs(attendanceCollection);
    const attendanceData = attendanceSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const studentsCollection = collection(db, "students");
    const studentsQuery = query(
      studentsCollection,
      where("course", "in", event.course),
      where("yrlvl", "in", event.yearLevel)
    );
    const studentsSnapshot = await getDocs(studentsQuery);
    const studentsData = studentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const updatedStudents = studentsData.map((student) => {
      const attendanceRecord = attendanceData.find((record) => record.studentId === student.id);
      if (attendanceRecord) {
        return { ...student, status: attendanceRecord.status };
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


  const handleEventFilterChange = (e) => {
    setEventFilter(e.target.value);
  };

  const handleCourseFilterChange = (e) => {
    setCourseFilter(e.target.value);
  };

  const handleYearLevelFilterChange = (e) => {
    setYearLevelFilter(e.target.value);
  };

  const filterEvents = (events) => {
    const now = new Date();
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      if (eventFilter === "today") {
        return eventDate.toDateString() === now.toDateString();
      } else if (eventFilter === "week") {
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(now.setDate(now.getDate() + 6));
        return eventDate >= weekStart && eventDate <= weekEnd;
      } else if (eventFilter === "month") {
        return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
      }
      return true;
    }).filter((event) => {
      if (courseFilter !== "all" && !event.course.includes(courseFilter)) {
        return false;
      }
      if (yearLevelFilter !== "all" && !event.yearLevel.includes(yearLevelFilter)) {
        return false;
      }
      return true;
    });
  };

  const filteredEvents = filterEvents(events).filter((event) =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-gray-100 p-6 select-none">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-poppins font-bold text-[#1F384C]">Reports</h1>
      </div>

      <div className="flex grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <div className="p-4 bg-white rounded-md shadow-md w-[500px]">
          <div className="flex mb-11">
            <img src={summaries} alt="" className="h-7 w-6 mr-2" />
            <h2 className="text-lg font-poppins font-bold text-green-600">Today's Summary</h2>
          </div>
          <div className="flex justify-center items-center text-center mb-4">
            <div className="flex flex-col">
              <p className="text-sm font-poppins text-[#ADADAD]">On Time</p>
              <p className="text-xl font-poppins font-bold">{todaySummary.onTime}</p>
            </div>
            <div className="border-r border-gray-300 h-10 mx-4"></div>
            <div className="flex flex-col">
              <p className="text-sm font-poppins text-[#ADADAD]">Late</p>
              <p className="text-xl font-poppins font-bold">{todaySummary.late}</p>
            </div>
            <div className="border-r border-gray-300 h-10 mx-4"></div>
            <div className="flex flex-col">
              <p className="text-sm font-poppins text-[#ADADAD]">Absent</p>
              <p className="text-xl font-poppins font-bold">{todaySummary.absent}</p>
            </div>
            <div className="border-r border-gray-300 h-10 mx-4"></div>
            <div className="flex flex-col">
              <p className="text-sm font-poppins text-[#ADADAD]">Not Marked</p>
              <p className="text-xl font-poppins font-bold">{todaySummary.notMarked}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white rounded-md shadow-md w-[654px]">
          <div className="flex mb-11">
            <img src={summaries} alt="" className="h-7 w-6 mr-2" />
            <h2 className="text-lg font-poppins font-bold text-red-600">Attendance Summary</h2>
          </div>
          <div className="flex justify-center items-center text-center mb-4">
            <div className="flex flex-col">
              <p className="text-sm font-poppins text-[#ADADAD]">On Time Students</p>
              <p className="text-xl font-poppins font-bold">{attendanceSummary.onTime}</p>
            </div>
            <div className="border-r border-gray-300 h-10 mx-4"></div>
            <div className="flex flex-col">
              <p className="text-sm font-poppins text-[#ADADAD]">Late Students</p>
              <p className="text-xl font-poppins font-bold">{attendanceSummary.late}</p>
            </div>
            <div className="border-r border-gray-300 h-10 mx-4"></div>
            <div className="flex flex-col">
              <p className="text-sm font-poppins text-[#ADADAD]">Absent Students</p>
              <p className="text-xl font-poppins font-bold">{attendanceSummary.absent}</p>
            </div>
            <div className="border-r border-gray-300 h-10 mx-4"></div>
            <div className="flex flex-col">
              <p className="text-sm font-poppins text-[#ADADAD]">Not Marked</p>
              <p className="text-xl font-poppins font-bold">{attendanceSummary.notMarked}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-4">
        <div className="relative w-[355px] h-8">
          <input
            type="text"
            placeholder="Search"
            className="w-full h-full bg-gray-200 rounded-md pl-4 pr-10 focus:outline-none font-poppins font-bold placeholder:font-poppins placeholder:font-bold"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <img
            src={search}
            alt="search-icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4"
          />
        </div>

                
        <div className="flex space-x-[-7px] pl-3 mr-[-7px]">
          <div className="flex items-center">
            <img src={bookmark} alt="" className="h-5 w-7 absolute pl-2" />
            <select
              className="border rounded-lg p-1 mb-4 md:mb-0 md:mr-4 h-8 bg-gray-200 w-[130px] font-poppins font-normal text-sm text-[#818181] pl-7 cursor-pointer"
              value={eventFilter}
              onChange={handleEventFilterChange}
            >
              <option value="all">All</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div className="flex items-center">
            <img src={filter} alt="" className="h-5 w-7 absolute pl-2" />
            <select
              className="border rounded-lg p-1 mb-4 md:mb-0 md:mr-4 h-8 bg-gray-200 w-[130px] font-poppins font-normal text-sm text-[#818181] pl-7 cursor-pointer"
              value={courseFilter}
              onChange={handleCourseFilterChange}
            >
              <option value="all">All Courses</option>
              <option value="BSIT">BSIT</option>
              <option value="BSCS">BSCS</option>
              <option value="BSCPE">BSCPE</option>
            </select>
          </div>
          <div className="relative flex items-center">
            <img src={filter} alt="filter-icon" className="absolute left-2 top-2 w-4 h-4" />
            <select
              value={yearLevelFilter}
              onChange={handleYearLevelFilterChange}
              className="border rounded-lg p-1 h-8 bg-gray-200 w-[160px] font-poppins font-normal text-sm text-[#818181] pl-7 cursor-pointer"
            >
              <option value="all">All Year Levels</option>
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
          </div>
        </div>

       
      </div>

            
      <div className="flex-grow overflow-x-auto">
        <div className="overflow-y-auto max-h-full scrollbar-hidden">
          <table className="bg-white border border-gray-300 w-full text-sm">
            <thead>
              <tr className="bg-gray-200 sticky top-0 z-10">
                <th className="px-4 py-2 text-left font-poppins font-bold min-w-[180px]">
                  <img src={user} alt="" className="inline w-3 h-3 mr-2 mb-1" /> Event Title
                </th>
                <th className="px-4 py-2 text-center font-poppins font-bold min-w-[150px]">
                  <img src={datetime} alt="" className="inline w-3 h-3 mr-2 mb-1" /> Date/Time
                </th>
                <th className="px-4 py-2 text-center font-poppins font-bold min-w-[150px]">
                  <img src={course} alt="" className="inline w-3 h-3 mr-2 mb-1" /> Course
                </th>
                <th className="px-4 py-2 text-center font-poppins font-bold min-w-[150px]">
                  <img src={yearlevel} alt="" className="inline w-3 h-3 mr-2 mb-1" /> Year Level
                </th>
                <th className="px-4 py-2 text-center font-poppins font-bold min-w-[150px]">
                  <img src={action} alt="" className="inline w-3 h-3 mr-2 mb-1" /> Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event, index) => (
                <tr key={index} className="border-b hover:bg-gray-100 cursor-pointer">
                  <td className="flex px-2 py-2 font-poppins font-normal text-left items-center">
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
      

      {isModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[95%] sm:w-[90%] md:w-[80%] lg:w-[70%] h-[90%] overflow-y-auto">
            <h1 className="flex text-custom-purple font-poppins font-bold text-[22px] mb-4 items-center">
              <img src={selectedEvent.image} alt="Event" className="w-14 h-14 rounded-full mr-2" />
              {selectedEvent.title}
            </h1>

            <h3 className="font-bold mt-4 text-[20px] font-poppins">Attendees</h3>
            <table className="min-w-full mt-2 border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-4 py-2 text-left font-poppins font-bold">Name</th>
                  <th className="px-4 py-2 text-center font-poppins font-bold">
                    <img src={course} alt="" className="inline w-4 h-4 mr-1 mb-1" /> Course
                  </th>
                  <th className="px-4 py-2 text-center font-poppins font-bold">
                    <img src={yearlevel} alt="" className="inline w-4 h-4 mr-1 mb-1" /> Year Level
                  </th>
                  <th className="px-4 py-2 text-center font-poppins font-bold">
                    <img src={status} alt="" className="inline w-4 h-4 mr-1 mb-1" /> Status
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
                      {student.status === "ontime" ? "On Time" :
                        student.status === "late" ? "Late" :
                          student.status === "absent" ? "Absent" : "Not Marked"}
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