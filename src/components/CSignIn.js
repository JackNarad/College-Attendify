import React, { useState, useEffect } from "react";
import DYCIccs from '../assets/DYCIccs.png';
import bgImage from '../assets/auth_bg.jpg';
import { useNavigate } from "react-router-dom";
import { auth } from '../Firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

export const CSignIn = () => {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [failedAttempts, setFailedAttempts] = useState(0);
    const [lockoutTime, setLockoutTime] = useState(null); // Store lockout end time
    const [successMessage, setSuccessMessage] = useState(""); // Store success messages

    const handleSignIn = async (event) => {
        event.preventDefault();

        // Prevent login attempts during lockout period
        if (lockoutTime && new Date() < lockoutTime) {
            setError("Too many failed attempts. Please wait a few minutes before trying again.");
            return;
        }

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log('Sign-in successful!');
            navigate('/NDashboard');
        } catch (err) {
            console.error('Error during sign-in:', err);

            // Increment failed attempts
            setFailedAttempts((prev) => prev + 1);

            // Handle error messages
            if (err.code === 'auth/invalid-email') {
                setError("Invalid email address. Please check and try again.");
            } else if (err.code === 'auth/user-not-found') {
                setError("No user found with this email. Please sign up or try a different email.");
            } else if (err.code === 'auth/invalid-credential') {
                setError("Incorrect password. Please try again.");
            } else {
                setError(err.code);
            }
        }
    };

    // Handle password reset
    const handlePasswordReset = async () => {
        const email = document.getElementById('email').value;

        if (!email) {
            setError("Please enter your email address to reset your password.");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccessMessage("Password reset email sent. Please check your inbox.");
            setError(""); // Clear error message if any
        } catch (err) {
            console.error('Error sending password reset email:', err);
            if (err.code === 'auth/user-not-found') {
                setError("No user found with this email. Please check and try again.");
            } else if (err.code === 'auth/invalid-email') {
                setError("Invalid email address. Please check and try again.");
            } else {
                setError("Failed to send password reset email. Please try again later.");
            }
        }
    };

    // Lockout mechanism
    useEffect(() => {
        if (failedAttempts >= 3) {
            const lockoutDuration = 5 * 1000; // 5 seconds in milliseconds
            const lockoutEndTime = new Date(new Date().getTime() + lockoutDuration);
            setLockoutTime(lockoutEndTime);

            // Notify the user
            setError("Too many failed attempts. Please wait for few minutes before trying again.");

            // Reset failed attempts after the lockout period
            const timer = setTimeout(() => {
                setFailedAttempts(0);
                setLockoutTime(null);
                setError(""); // Clear the error message
            }, lockoutDuration);

            return () => clearTimeout(timer); // Cleanup timeout on component unmount
        }
    }, [failedAttempts]);

    const isLockedOut = lockoutTime && new Date() < lockoutTime;

    return (
        <div className="flex items-center justify-center min-h-screen bg-no-repeat bg-center bg-cover" style={{ backgroundImage: `url(${bgImage})` }}>
            <div className="bg-white bg-opacity-80 p-8 rounded-lg shadow-lg max-w-md w-full">
                <div className="flex items-center justify-center space-x-4">
                    <img src={DYCIccs} alt="Logo" className="w-12 h-12 mb-4" />
                    <div className="w-[150px] h-8 mb-4 pt-1">
                        <span className="text-custom-purple font-poppins font-bold">CCS - ATTENDIFY</span>
                    </div>
                </div>

                <form onSubmit={handleSignIn}>
                    <div className="mb-4">
                        <label htmlFor="email" className="block text-sm text-gray-700 font-poppins font-bold">Email</label>
                        <input
                            type="text"
                            id="email"
                            name="email"
                            required
                            disabled={isLockedOut}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 font-poppins p-2"
                            placeholder="Enter your email"
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-sm text-gray-700 font-poppins font-bold">Password</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            required
                            disabled={isLockedOut}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 font-poppins p-2"
                            placeholder="Enter your password"
                        />
                    </div>
                    {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                    {successMessage && <p className="text-green-500 text-sm mb-4">{successMessage}</p>}
                    <div className="flex justify-between mb-4">
                        <button
                            type="button"
                            onClick={handlePasswordReset}
                            className="text-sm text-blue-500 hover:underline font-poppins"
                        >
                            Forgot your password?
                        </button>
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-500 font-poppins"
                        disabled={isLockedOut} // Disable button during lockout
                    >
                        Log in
                    </button>
                </form>

                <div className="mt-4 text-center text-gray-600 font-poppins">
                    <span>Dr. Yanga's Colleges Inc. PH</span>
                </div>

                <div className="text-center text-gray-600 font-poppins">
                    <a href="NSignUp" className="text-sm text-blue-500 hover:underline font-poppins">Sign Up</a>
                </div>
            </div>
        </div>
    );
};