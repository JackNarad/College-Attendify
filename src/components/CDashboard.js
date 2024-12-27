import React, { useEffect, useState } from "react";
import { Line, Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  ArcElement,
  PieController,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";

import { db } from "../Firebase";
import { collection, getDocs } from "firebase/firestore";

// Register the Chart.js components
ChartJS.register(
  LineElement,
  BarElement,
  ArcElement,
  PieController,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

export const CDashboard = () => {
  const [courseAttendance, setCourseAttendance] = useState([]);
  const [yearLevelAttendance, setYearLevelAttendance] = useState([]);
  const [lineData, setLineData] = useState({ labels: [], datasets: [] });
  const [todayAttendance, setTodayAttendance] = useState([]);

  useEffect(() => {
    const fetchTodayAttendanceTable = async () => {
      const today = new Date().toISOString().split('T')[0];
      const eventsCollection = collection(db, "events");
      const eventsSnapshot = await getDocs(eventsCollection);
      const eventsData = eventsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const todayEvent = eventsData.filter(event => event.startDate === today);

      const studentsCollection = collection(db, "students");
      const studentsSnapshot = await getDocs(studentsCollection);
      const studentsData = studentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const todayAttendance = [];

      await Promise.all(
        todayEvent.map(async (event) => {
          const attendanceCollection = collection(db, "events", event.id, "attendance");
          const attendanceSnapshot = await getDocs(attendanceCollection);
          const attendanceRecords = attendanceSnapshot.docs.map((doc) => doc.data());

          attendanceRecords.forEach((record) => {
            const student = studentsData.find((s) => s.id === record.studentId);
            if (student) {
              todayAttendance.push({
                id: student.studentNumber,
                name: student.name,
                course: student.course,
                yrlvl: student.yrlvl,
                time: new Date(record.timestamp).toLocaleTimeString(),
                status: record.status,
              });
            }
          });
        })
      );

      setTodayAttendance(todayAttendance);
    };

    fetchTodayAttendanceTable();
  }, []);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      const eventsCollection = collection(db, "events");
      const eventsSnapshot = await getDocs(eventsCollection);
      const eventsData = eventsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const studentsCollection = collection(db, "students");
      const studentsSnapshot = await getDocs(studentsCollection);
      const studentsData = studentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const attendanceData = {};
      const totalStudents = {};

      studentsData.forEach((student) => {
        if (!totalStudents[student.course]) {
          totalStudents[student.course] = { total: 0, yearLevels: {} };
        }
        totalStudents[student.course].total += 1;
        if (!totalStudents[student.course].yearLevels[student.yrlvl]) {
          totalStudents[student.course].yearLevels[student.yrlvl] = 0;
        }
        totalStudents[student.course].yearLevels[student.yrlvl] += 1;
      });

      await Promise.all(
        eventsData.map(async (event) => {
          const attendanceCollection = collection(db, "events", event.id, "attendance");
          const attendanceSnapshot = await getDocs(attendanceCollection);
          const attendanceRecords = attendanceSnapshot.docs.map((doc) => doc.data());

          attendanceRecords.forEach((record) => {
            const student = studentsData.find((s) => s.id === record.studentId);
            if (student) {
              if (!attendanceData[student.course]) {
                attendanceData[student.course] = { attended: 0, yearLevels: {} };
              }
              attendanceData[student.course].attended += 1;
              if (!attendanceData[student.course].yearLevels[student.yrlvl]) {
                attendanceData[student.course].yearLevels[student.yrlvl] = 0;
              }
              attendanceData[student.course].yearLevels[student.yrlvl] += 1;
            }
          });
        })
      );

      const courseAttendanceData = Object.keys(totalStudents).map((course) => ({
        course,
        percentage: ((attendanceData[course]?.attended || 0) / totalStudents[course].total ) * 100,
      }));

      const yearLevelAttendanceData = ["1st Year", "2nd Year", "3rd Year", "4th Year"].map((yearLevel) => {
        const total = Object.keys(totalStudents).reduce((sum, course) => {
          return sum + (totalStudents[course].yearLevels[yearLevel] || 0);
        }, 0);
        const attended = Object.keys(attendanceData).reduce((sum, course) => {
          return sum + (attendanceData[course]?.yearLevels[yearLevel] || 0);
        }, 0);
        return {
          yearLevel,
          percentage: (total > 0 ? (attended / total ) * 100 : 0), // Ensure no division by zero
        };
      });

      const lineLabels = eventsData.map(event => event.startDate);
      const today = new Date().toISOString().split('T')[0];
      const todayEvent = eventsData.filter(event => event.startDate === today);

      const allEventsData = eventsData.map(event => {
        const totalStudentsForEvent = event.course.reduce((sum, course) => {
          return sum + (totalStudents[course]?.total || 0);
        }, 0);
        const attendedForEvent = event.course.reduce((sum, course) => {
          return sum + (attendanceData[course]?.attended || 0);
        }, 0);
        return (totalStudentsForEvent > 0 ? (totalStudentsForEvent / attendedForEvent  ) * 100 : 0);
      });

      const todayEventData = todayEvent.map(event => {
        const totalStudentsForEvent = event.course.reduce((sum, course) => {
          return sum + (totalStudents[course]?.total || 0);
        }, 0);
        const attendedForEvent = event.course.reduce((sum, course) => {
          return sum + (attendanceData[course]?.attended || 0);
        }, 0);
        return (totalStudentsForEvent > 0 ? ( totalStudentsForEvent / attendedForEvent) * 100 : 0);
      });

      setCourseAttendance(courseAttendanceData);
      setYearLevelAttendance(yearLevelAttendanceData);
      setLineData({
        labels: lineLabels,
        datasets: [
          {
            label: "All Events",
            data: allEventsData,
            borderColor: "#4A3AFF",
            backgroundColor: "transparent",
            borderWidth: 3,
            pointBackgroundColor: "#4A3AFF",
            pointBorderColor: "#fff",
            pointHoverRadius: 6,
            pointRadius: 4,
            tension: 0,
          },
          {
            label: "Today's Event",
            data: todayEventData,
            borderColor: "#C893FD",
            backgroundColor: "transparent",
            borderWidth: 3,
            pointBackgroundColor: "#C893FD",
            pointBorderColor: "#fff",
            pointHoverRadius: 6,
            pointRadius: 4,
            tension: 0,
          },
        ],
      });
    };

    fetchAttendanceData();
  }, []);

  const barData = {
    labels: ["1st Year", "2nd Year", "3rd Year", "4th Year"],
    datasets: [
      {
        label: "Attendance",
        data: yearLevelAttendance.map((data) => data.percentage),
        backgroundColor: ["#4A3AFF", "#C893FD", "#2FBFDE", "#F99C30"],
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };

  const pieData = {
    labels: courseAttendance.map((data) => data.course),
    datasets: [
      {
        label: "Course Attendance",
        data: courseAttendance.map((data) => data.percentage),
        backgroundColor: ["#2FBFDE", "#4EC95C", "#F99C30"],
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: "Poppins",
            size: 12,
          },
          color: "#9291A5",
        },
      },
      y: {
        grid: {
          color: "#E5E5E5",
          lineWidth: 1,
          borderDash: [4, 4],
        },
        ticks: {
          font: {
            family: "Poppins",
            size: 12,
          },
          color: "#9291A5",
          stepSize: 20,
          callback: function (value) {
            return `${value}%`;
          },
        },
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false, // Hide the legend
      },
    },
  };

  return (
    <div className="select-none">
      <h1 className="text-xl font-poppins font-bold pl-6 pt-6 text-[#1F384C]">Dashboard</h1>
      <section className="grid grid-cols-3 gap-1 mt-3 mb-[-11px]">
        {/* Main Graph */}
        <div className="col-span-2 pt-3 pl-4 pr-4 pb-2 bg-white rounded-md shadow-md h-[285px]">
          <h2 className="text-md font-poppins font-normal text-[#9291A5]">Line Graph Statistics</h2>
          <div className="flex justify-between">
            <h2 className="text-[20px] font-poppins font-bold mb-4 text-[#1E1B39]">Attendance Record</h2>
            <div className="flex justify-between mt-[-15px]">
              <div className="flex items-center justify-center w-[200px] text-[#615E83] font-poppins text-sm">
                <div className="bg-[#4A3AFF] rounded-full w-3 h-3 mr-2"></div>
                Events Attendance
              </div>
            </div>
          </div>
          <div className="w-full h-[195px] rounded-md">
            <Line data={lineData} options={barOptions} />
          </div>
        </div>

        {/* Pie Chart */}
        <div className="pt-3 pl-4 pr-4 pb-2 bg-white rounded-md shadow-md h-[285px]">
          <h2 className="text-lg font-poppins font-bold text-[#1E1B39]">Colleges Attendance</h2>
          <h2 className="text-sm font-poppins font-normal text-[#9291A5] mb-3">Pie Graph Statistics</h2>
          <div className="w-full h-[175px] flex items-center justify-center">
            <Pie data={pieData} options={pieOptions} />
          </div>
          <div className="flex justify-between mt-2">
            <div className="flex items-center justify-center w-[120px] text-[#121212] font-poppins text-sm">
              <div className="bg-[#2FBFDE] rounded-full w-3 h-3 mr-2"></div>
              BSIT
            </div>
            <div className="flex items-center justify-center w-[150px] text-[#121212] font-poppins text-sm">
              <div className="bg-[#4EC95C] rounded-full w-3 h-3 mr-2"></div>
              BSCS
            </div>
            <div className="flex items-center justify-center w-[150px] text-[#121212] font-poppins text-sm">
              <div className="bg-[#F99C30] rounded-full w-3 h-3 mr-2"></div>
              BSCPE
            </div>
          </div>
        </div>

        {/* Attendance List */}
        <div className="col-span-2 flex flex-col pt-3 pl-4 pr-4 pb-2 bg-white rounded-md shadow-md h-full">
          <h2 className="text-lg font-poppins font-bold text-[#1E1B39]">Attendance Today</h2>
          <h2 className="text-sm font-poppins font-normal text-[#9291A5] mb-3">Today Attendance Table</h2>
          <div className="overflow-y-auto scrollbar-hidden flex-grow">
            <table className="w-full h-auto rounded-md">
              <thead>
                <tr>
                  <th className="pt-1 text-left text-[15px] font-poppins">Student Number</th>
                  <th className="pt-1 text-left text-[15px] font-poppins">Student Name</th>
                  <th className="pt-1 text-left text-[15px] font-poppins">Course</th>
                  <th className="pt-1 text-left text-[15px] font-poppins">Year Level</th>
                  <th className="pt-1 text-left text-[15px] font-poppins">Time In</th>
                  <th className="pt-1 text-left text-[15px] font-poppins">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayAttendance.map((student, index) => (
                  <tr key={index}>
                    <td className="pt-1 text-left text-[13px] font-poppins">{student.id}</td>
                    <td className="pt-1 text-left text-[13px] font-poppins">{student.name}</td>
                    <td className="pt-1 text-left text-[13px] font-poppins">{student.course}</td>
                    <td className="pt-1 text-left text-[13px] font-poppins">{student.yrlvl}</td>
                    <td className="pt-1 text-left text-[13px] font-poppins">{student.time}</td>
                    <td className="pt-1 text-left text-[13px] font-poppins">
                      <span className={`px-2 py-1 rounded-full ${student.status === 'ontime' ? 
                      'bg-green-200 text-green-800' : student.status === 'late' ? 
                      'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Year Level Stats */}
        <div className="flex flex-col pt-3 pl-4 pr-4 pb-2 bg-white rounded-md shadow-md h-full">
          <h2 className="text-md font-poppins font-normal text-[#9291A5]">Bar Chart Statistics</h2>
          <h2 className="text-lg font-poppins font-bold mb-3 text-[#1E1B39] mt-[-4px]">Year Level</h2>
          <div className="w-full flex-grow">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </section>
    </div>
  );
};