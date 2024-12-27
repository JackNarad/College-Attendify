import React from "react";
import { useState } from "react";
import DYCIccs from "../assets/DYCIccs.png";
import bgImage from "../assets/auth_bg.jpg";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../Firebase";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export const CSignUp = () => {
    const navigate = useNavigate();
    const [errors, setErrors] = useState({});

    const validateForm = (fullname, email, password, confirmPassword) => {
        const errors = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!fullname) errors.fullname = "Full name is required.";

        if (!email) {
            errors.email = "Email is required.";
        } else if (!emailRegex.test(email)) {
            errors.email = "Enter a valid email address.";
        } else if (!email.endsWith("@dyci.edu.ph")) {
            errors.email = "Only @dyci.edu.ph email accounts are allowed.";
        }

        if (!password) {
            errors.password = "Password is required.";
        } else if (password.length < 6) {
            errors.password = "Password must be at least 6 characters.";
        }

        if (!confirmPassword) {
            errors.confirmPassword = "Confirm password is required.";
        } else if (password !== confirmPassword) {
            errors.confirmPassword = "Passwords do not match.";
        }

        return errors;
    };

    const handleRegister = async (event) => {
        event.preventDefault();
        const fullname = document.getElementById("fullname").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm-password").value;

        // Validate inputs
        const validationErrors = validateForm(fullname, email, password, confirmPassword);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await sendEmailVerification(user);

            alert("A verification email has been sent to your email address. Please verify your email before proceeding.");

            // Check if the email is verified before saving data
            const interval = setInterval(async () => {
                await user.reload(); // Reload user data
                if (user.emailVerified) {
                    clearInterval(interval); // Stop checking once verified
                    
                    const userRef = doc(db, "users", user.uid);
                    await setDoc(userRef, { fullname, email });

                    console.log("Registration successful!");
                    navigate("/NDashboard");
                }
            }, 1000); // Check every 1 second
        } catch (error) {
            console.error("Error during registration:", error);
            setErrors({ general: "Failed to register. Please try again." });
        }
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-no-repeat bg-center bg-cover"
            style={{ backgroundImage: `url(${bgImage})` }}
        >
            <div className="bg-white bg-opacity-80 p-8 rounded-lg shadow-lg max-w-md w-full">
                <div className="flex items-center justify-center space-x-4">
                    <img src={DYCIccs} alt="Logo" className="w-12 h-12 mb-4" />
                    <div className="w-[150px] h-8 mb-4 pt-1">
                        <span className="text-custom-purple font-poppins font-bold">CCS - ATTENDIFY</span>
                    </div>
                </div>
                <form onSubmit={handleRegister}>
                    <div className="mb-4">
                        <label
                            htmlFor="fullname"
                            className="block text-sm text-gray-700 font-poppins font-bold"
                        >
                            Fullname
                        </label>
                        <input
                            type="text"
                            id="fullname"
                            name="fullname"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 font-poppins p-2"
                            placeholder="Enter your fullname"
                        />
                        {errors.fullname && <p className="text-red-500 text-sm">{errors.fullname}</p>}
                    </div>
                    <div className="mb-4">
                        <label
                            htmlFor="email"
                            className="block text-sm text-gray-700 font-poppins font-bold"
                        >
                            Email
                        </label>
                        <input
                            type="text"
                            id="email"
                            name="email"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 font-poppins p-2"
                            placeholder="Enter your email"
                        />
                        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                    </div>
                    <div className="mb-4">
                        <label
                            htmlFor="password"
                            className="block text-sm text-gray-700 font-poppins font-bold"
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 font-poppins p-2"
                            placeholder="Enter your password"
                        />
                        {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
                    </div>
                    <div className="mb-4">
                        <label
                            htmlFor="confirm-password"
                            className="block text-sm text-gray-700 font-poppins font-bold"
                        >
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            id="confirm-password"
                            name="confirm-password"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 font-poppins p-2"
                            placeholder="Confirm your password"
                        />
                        {errors.confirmPassword && (
                            <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                        )}
                    </div>
                    {errors.general && <p className="text-red-500 text-sm mb-4">{errors.general}</p>}
                    <button
                        className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-500 font-poppins"
                        type="submit"
                    >
                        Register
                    </button>
                </form>
                <div className="mt-4 text-center text-gray-600 font-poppins">
                    <span>Dr. Yanga's Colleges Inc. PH</span>
                </div>
                <div className="text-center text-gray-600 font-poppins">
                    <a href="NSignIn" className="text-sm text-blue-500 hover:underline font-poppins">
                        Back to Sign In
                    </a>
                </div>
            </div>
        </div>
    );
};