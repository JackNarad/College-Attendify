import React, { useState, useEffect, useRef } from 'react';
import chevronDOWN from '../assets/chevronDOWN.png';
import chevronUP from '../assets/chevronUP.png';
import logout from '../assets/logout.png';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../Firebase';
import { doc, onSnapshot } from 'firebase/firestore'; // Import Firestore methods


export const Header = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setDropdownOpen] = useState(false); // State to toggle profile dropdown visibility
  const [isNotificationDropdownOpen, setNotificationDropdownOpen] = useState(false); // State for notification dropdown
  const [userName, setUserName] = useState(''); // State to store the user's name


  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userRef = doc(db, 'users', user.uid); // Reference to the user's document
        const unsubscribe = onSnapshot(userRef, (doc) => {
          if (doc.exists()) {
            setUserName(doc.data().fullname); // Set the fullname if found
          }
        });
        return unsubscribe; // Return the unsubscribe function
      }
    };

    fetchUserData();
  }, []); 

  
  // Refs to detect clicks outside
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  // Toggle profile dropdown
  const toggleDropdown = () => {
    setDropdownOpen(!isDropdownOpen);
    if (isNotificationDropdownOpen) {
      setNotificationDropdownOpen(false); // Close notification dropdown if open
    }
  };



  // Close dropdowns if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        notificationRef.current && !notificationRef.current.contains(event.target)
      ) {
        setDropdownOpen(false); // Close profile dropdown
        setNotificationDropdownOpen(false); // Close notification dropdown
      }
    };

    // Add event listener on mount
    document.addEventListener('mousedown', handleClickOutside);

    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="select-none">
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-2 bg-white shadow-sm">
        {/* Placeholder for search bar */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm">
          {/* Add search input here if needed */}
        </div>

        {/* Profile Section */}
        <div className="flex items-center space-x-4">
          <span
            className="hidden lg:inline-block w-36 lg:w-48 font-poppins font-normal text-lg lg:text-base text-[#1F384C] truncate text-left"
          >
            {userName}
          </span>
          <div className="relative">
            <img
              src={isDropdownOpen ? chevronUP : chevronDOWN}
              alt="Chevron"
              className="w-6 h-6 sm:w-8 sm:h-8 cursor-pointer"
              onClick={toggleDropdown}
            />
          </div>
        </div>
      </header>

      {/* Profile Dropdown */}
      {isDropdownOpen && (
        <div className="absolute top-12 right-4 bg-gray-300 shadow-lg rounded-md w-48 sm:w-60 p-2 z-50">
          <button
            className="flex w-full text-left py-2 px-3 rounded-md text-sm sm:text-base font-poppins font-bold hover:bg-gray-400"
            onClick={() => navigate('/NSignIn')}
          >
            <img src={logout} alt="Logout Icon" className="w-5 h-5 mr-2" />
            Log Out
          </button>
        </div>
      )}
      <div className="border-b border-gray-300" />
    </div>

  );
};
