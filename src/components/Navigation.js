import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DYCIccs from '../assets/DYCIccs.png';

import ACTIVEdashboard from '../assets/ACTIVEdashboard.png';
import ACTIVEreports from '../assets/ACTIVEreports.png';
import ACTIVEsheets from '../assets/ACTIVEsheets.png';
import ACTIVEstudentList from '../assets/ACTIVEaccounts.png';
import ACTIVEattendance from '../assets/ACTIVEattendance.png';

import INACTIVEdashboard from '../assets/INACTIVEdashboard.png';
import INACTIVEreports from '../assets/INACTIVEreports.png';
import INACTIVEsheets from '../assets/INACTIVEsheets.png';
import INACTIVEstudentList from '../assets/INACTIVEaccounts.png';
import INACTIVEattendance from '../assets/INACTIVEattendance.png';

export const Navigation = () => {
  const [selected, setSelected] = useState('dashboard'); // Active state
  const navigate = useNavigate();
  const location = useLocation(); // To get the current location (route)

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Update the selected state based on the current location
  useEffect(() => {
    const section = location.pathname.replace('/N', '').toLowerCase();
    if (section) {
      setSelected(section); // Set the selected state based on the route
    }
  }, [location]);

  const handleClick = (section) => {
    setSelected(section); // Update the selected section
    navigate(`/N${section}`); // Navigate to the appropriate section
  };

  const getImageSrc = (section) => {
    return selected === section
      ? {
        dashboard: ACTIVEdashboard,
        reports: ACTIVEreports,
        sheets: ACTIVEsheets,
        students: ACTIVEstudentList,
        attendance: ACTIVEattendance,

      }[section]
      : {
        dashboard: INACTIVEdashboard,
        reports: INACTIVEreports,
        sheets: INACTIVEsheets,
        students: INACTIVEstudentList,
        attendance: INACTIVEattendance,

      }[section];
  };

  return (
    <div className="flex min-h-screen bg-gray-100 select-none">
      <aside className="w-full sm:w-64 bg-white shadow-md">
        <div className="p-4">
          {/* Logo Section */}
          <div className="flex items-center space-x-4 mb-4">
            <img src={DYCIccs} alt="Logo" className="w-10 h-10" />
            <span className="text-custom-purple font-poppins font-bold text-sm sm:text-base">CCS - ATTENDIFY</span>
          </div>
          <div className="border-b border-gray-300" />

          {/* Navigation Menu */}
          <nav className="space-y-4 pt-6">
            <h3 className="uppercase text-sm font-semibold text-[#082431] opacity-50">Menu</h3>
            <ul className="space-y-3">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'reports', label: 'Reports' },
                { id: 'sheets', label: 'Manage Sheets' },
                { id: 'students', label: 'Student List' },
                { id: 'attendance', label: 'Attendance' },
              ].map((item) => (
                <button
                  key={item.id}
                  className={`w-full h-11 rounded-md text-left px-4 flex items-center space-x-2 transition-all duration-200 
                ${selected === item.id
                      ? 'bg-gray-300 text-custom-purple'
                      : 'bg-white hover:bg-gray-200 hover:text-custom-purple text-opacity-50 text-[#273240]'}`}
                  onClick={() => handleClick(item.id)}
                >
                  <img src={getImageSrc(item.id)} alt={item.label} className="w-5 h-5 mr-1" />
                  <h1 className="font-poppins text-sm sm:text-base">{item.label}</h1>
                </button>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </div>
  );
};