import React, { useState, useEffect } from "react";
import { db, storage } from "../Firebase";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import search from "../assets/search.png";
import filter from "../assets/filter.png";
import createevent from "../assets/createevent.png";
import eventtitle from "../assets/eventtitle.png";
import datetime from "../assets/datetime.png";
import statustracker from "../assets/statustracker.png";
import action from "../assets/action.png";
import edit from "../assets/edit.png";
import trash from "../assets/trash.png";

export const CManageSheets = () => {
  const [isModalOpen, setModalOpen] = useState(false);
  const [isViewModalOpen, setViewModalOpen] = useState(false);
  const [viewEvent, setViewEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    image: "",
    title: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    course: [],
    yearLevel: [],
    tracker: 0,
    description: "",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOption, setFilterOption] = useState("All");
  const [isEditing, setIsEditing] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const querySnapshot = await getDocs(collection(db, "events"));
    const eventsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    eventsData.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    setEvents(eventsData);
  };

  const handleOpenModal = () => {
    setModalOpen(true);
  };

  const handleViewMore = (event) => {
    setViewEvent(event);
    setViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setViewModalOpen(false);
    setViewEvent(null);
  };


  const handleCloseModal = () => {
    setModalOpen(false);
    setIsEditing(false);
    setCurrentEventId(null);
    setNewEvent({
      image: "",
      title: "",
      startDate: "",
      endDate: "",
      startTime: "",
      endTime: "",
      course: [],
      yearLevel: [],
      tracker: 0,
      description: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value, options } = e.target;
    let valueArray = [];
    if (options) {
      for (let i = 0, l = options.length; i < l; i++) {
        if (options[i].selected) {
          valueArray.push(options[i].value);
        }
      }
    } else {
      valueArray = value;
    }
    setNewEvent((prevEvent) => ({
      ...prevEvent,
      [name]: valueArray,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById("event-image-preview").src = event.target.result;
      };
      reader.readAsDataURL(file);
      setNewEvent((prevEvent) => ({
        ...prevEvent,
        image: file,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let imageUrl = "";
    if (newEvent.image) {
      const imageRef = ref(storage, `events/${newEvent.image.name}`);
      await uploadBytes(imageRef, newEvent.image);
      imageUrl = await getDownloadURL(imageRef);
    }

    const eventData = {
      ...newEvent,
      image: imageUrl,
    };

    if (isEditing && currentEventId) {
      const eventDocRef = doc(db, "events", currentEventId);
      await updateDoc(eventDocRef, eventData);
      alert("Event updated successfully!");
    } else {
      await addDoc(collection(db, "events"), eventData);
      alert("Event added successfully!");
    }

    fetchEvents();
    handleCloseModal();
  };

  const handleEdit = async (eventId) => {
    try {
      const eventDocRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventDocRef);

      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        setNewEvent(eventData); // Populate the modal with existing data
        setCurrentEventId(eventId);
        setIsEditing(true);
        setModalOpen(true); // Open the modal for editing
        if (eventData.image) {
          document.getElementById("event-image-preview").src = eventData.image;
        }
      } else {
        console.error("No such event!");
        alert("Event not found.");
      }
    } catch (error) {
      console.error("Error fetching event data:", error);
      alert("Failed to fetch event data.");
    }
  };

  const handleDelete = async (id) => {
    const eventDoc = doc(db, "events", id);
    await deleteDoc(eventDoc);
    fetchEvents();
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (e) => {
    setFilterOption(e.target.value);
  };

  const filterEvents = (events) => {
    const today = new Date();
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      if (filterOption === "Today") {
        return eventDate.toDateString() === today.toDateString();
      } else if (filterOption === "Week") {
        const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
        const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        return eventDate >= weekStart && eventDate <= weekEnd;
      } else if (filterOption === "Month") {
        return eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear();
      } else {
        return true;
      }
    });
  };

  const filteredEvents = filterEvents(events).filter((event) =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-100 p-4 sm:p-6 select-none relative">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl md:text-2xl font-poppins font-bold text-[#1F384C]">Manage Sheets</h1>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-4 sm:space-y-0">
        <div className="flex space-x-4 items-center w-full max-w-sm">
          <div className="relative w-full h-8">
            <input
              type="text"
              placeholder="Search"
              className="w-full h-full bg-gray-200 rounded-md pl-4 pr-10 focus:outline-none font-poppins font-bold placeholder:font-poppins placeholder:font-bold"
              value={searchTerm}
              onChange={handleSearch}
            />
            <img
              src={search}
              alt="search-icon"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4"
            />
          </div>
          <div className="relative">
            <img src={filter} alt="Filter" className="absolute left-2 top-2 w-4 h-4" />
            <select className="border rounded-lg pl-8 pr-4 py-1 h-8 bg-gray-200 w-full text-sm font-poppins text-[#818181] cursor-pointer" value={filterOption} onChange={handleFilterChange}>
              <option value="All">All</option>
              <option value="Today">Today</option>
              <option value="Week">This Week</option>
              <option value="Month">This Month</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            className="bg-[#480DBE] text-white px-4 sm:px-6 py-2 rounded-lg font-poppins font-normal"
            onClick={handleOpenModal}
          >
            <div className="flex items-center">
              <img src={createevent} alt="Create Event" className="h-4 w-4 mr-2" />
              Create Event
            </div>
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden max-w-full relative" style={{ maxHeight: "400px" }}>
        <div className="overflow-y-auto scrollbar-hidden" style={{ maxHeight: "400px" }}>
          <table className="bg-white border border-gray-300 w-full text-sm sm:text-base">
            <thead>
              <tr className="bg-gray-200 sticky top-0 z-0">
                <th className="px-2 sm:px-4 py-2 text-left font-poppins font-bold">
                  <img src={eventtitle} alt="Event Title" className="inline w-4 h-4 mr-1 mb-1" /> Event Title
                </th>
                <th className="px-2 sm:px-4 py-2 text-center font-poppins font-bold">
                  <img src={datetime} alt="Date/Time" className="inline w-4 h-4 mr-1 mb-1" /> Date/Time
                </th>
                <th className="px-2 sm:px-4 py-2 text-center font-poppins font-bold">
                  <img src={statustracker} alt="Status Tracker" className="inline w-4 h-4 mr-1 mb-1" /> Status Tracker
                </th>
                <th className="px-2 sm:px-4 py-2 text-center font-poppins font-bold">
                  Details
                </th>
                <th className="px-2 sm:px-4 py-2 text-center font-poppins font-bold">
                  <img src={action} alt="Action" className="inline w-4 h-4 mr-1 mb-1" /> Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event, index) => (
                <tr key={index}>
                  <td className="flex items-center px-2 sm:px-4 py-2 font-poppins text-left">
                    <img src={event.image} alt="Profile" className="w-8 sm:w-10 h-8 sm:h-10 rounded-full mr-2" />
                    {event.title}
                  </td>
                  <td className="px-2 sm:px-4 py-2 font-poppins text-center text-[#6B6B6B]">
                    {event.startDate} | {event.endDate} - {event.startTime} | {event.endTime}
                  </td>
                  <td className="px-2 sm:px-4 py-2 font-poppins text-center">
                    <div
                      className="flex items-center justify-center border-2 rounded-lg h-9 w-[100px] sm:w-[120px] bg-gray-200 text-[#3AB600]"
                      style={{ borderColor: "#3AB600" }}
                    >
                      <div className="bg-[#3AB600] rounded-full w-2.5 h-2.5 sm:w-3 sm:h-3 mr-2"></div>
                      Over {event.tracker.toFixed(0)}%
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-2 font-poppins text-center">
                    <button className="border px-3 sm:px-5 py-1 bg-gray-200 text-sm sm:text-base" style={{ borderColor: "#D5D5D5" }} onClick={() => handleViewMore(event)}>
                      View More
                    </button>
                  </td>
                  <td className="px-2 sm:px-4 py-2 font-poppins text-center">
                    <button className="border px-3 py-2 text-red-600 rounded-lg hover:bg-gray-200 mr-2" style={{ borderColor: "#D5D5D5" }} onClick={() => handleEdit(event.id)}>
                      <img src={edit} alt="Edit" className="w-4 sm:w-5 h-4 sm:h-5" />
                    </button>
                    <button className="border px-3 py-2 text-red-600 rounded-lg hover:bg-gray-200" style={{ borderColor: "#D5D5D5" }} onClick={() => handleDelete(event.id)}>
                      <img src={trash} alt="Delete" className="w-4 sm:w-5 h-4 sm:h-5" />
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md max-h-full overflow-y-auto">
            {/* Modal Content */}
            <h2 className="text-lg font-bold mb-4">{isEditing ? "Edit Event" : "Create Event"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Event Image</label>
                <input type="file" className="w-full p-2 border rounded" accept="image/*" onChange={handleImageChange} />
                <img id="event-image-preview" className="w-full mt-2 rounded" alt="Event Preview" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Event Title</label>
                <input type="text" name="title" className="w-full p-2 border rounded" placeholder="Enter event title" onChange={handleInputChange} value={newEvent.title} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Start Date</label>
                <input type="date" name="startDate" className="w-full p-2 border rounded" onChange={handleInputChange} value={newEvent.startDate} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">End Date</label>
                <input type="date" name="endDate" className="w-full p-2 border rounded" onChange={handleInputChange} value={newEvent.endDate} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Start Time</label>
                <input type="time" name="startTime" className="w-full p-2 border rounded" onChange={handleInputChange} value={newEvent.startTime} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">End Time</label>
                <input type="time" name="endTime" className="w-full p-2 border rounded" onChange={handleInputChange} value={newEvent.endTime} />
              </div>
              <div className="mb-4">
                <label className="block text-lg font-bold mb-2">Course</label>
                <select name="course" className="w-full p-2 border rounded" onChange={handleInputChange} multiple required value={newEvent.course}>
                  <option value="BSIT">BSIT</option>
                  <option value="BSCS">BSCS</option>
                  <option value="BSCPE">BSCPE</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-lg font-bold mb-2">Year Level</label>
                <select name="yearLevel" className="w-full p-2 border rounded" onChange={handleInputChange} multiple required value={newEvent.yearLevel}>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-bold mb-2">Description</label>
                <textarea name="description" className="w-full p-2 border rounded" rows="3" placeholder="Enter description (optional)" onChange={handleInputChange} value={newEvent.description}></textarea>
              </div>
              <div className="flex justify-end space-x-2">
                <button type="button" className="bg-gray-200 px-4 py-2 rounded" onClick={handleCloseModal}>
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

      {isViewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md max-h-full overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Event Details</h2>
            {viewEvent && (
              <div>
                <img src={viewEvent.image} alt="Event" className="w-full mt-2 rounded" />
                <p className="mt-4"><strong>Title:</strong> {viewEvent.title}</p>
                <p><strong>Start Date:</strong> {viewEvent.startDate}</p>
                <p><strong>End Date:</strong> {viewEvent.endDate}</p>
                <p><strong>Start Time:</strong> {viewEvent.startTime}</p>
                <p><strong>End Time:</strong> {viewEvent.endTime}</p>
                <p><strong>Course:</strong> {viewEvent.course.join(", ")}</p>
                <p><strong>Year Level:</strong> {viewEvent.yearLevel.join(", ")}</p>
                <p><strong>Description:</strong> {viewEvent.description}</p>
              </div>
            )}
            <div className="flex justify-end space-x-2 mt-4">
              <button className="bg-gray-200 px-4 py-2 rounded" onClick={handleCloseViewModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};