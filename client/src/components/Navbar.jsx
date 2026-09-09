import React from "react";
import { FaSearch, FaBell } from "react-icons/fa";
import "./Navbar.css";

function Navbar({ onSearch, searchQuery = "" }) {
    const storedUser = localStorage.getItem("user");
    let user = { name: "Learner", userType: "Student", email: "" };
    if (storedUser) {
        try {
            user = JSON.parse(storedUser);
        } catch {
            // fallback
        }
    }

    const firstLetter = (user.name || "U").charAt(0).toUpperCase();

    return (
        <header className="app-navbar">
            <div className="navbar-left">
                <div className="navbar-search">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search skills, topics, roadmaps..."
                        value={searchQuery}
                        onChange={(e) => onSearch && onSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="navbar-right">
                <span className="role-tag">
                    {user.userType || "Student"}
                </span>

                <button className="nav-action-btn" title="Notifications">
                    <FaBell />
                    <span className="notif-dot" />
                </button>

                <div className="user-profile-badge">
                    <div className="user-avatar">
                        {firstLetter}
                    </div>
                    <div className="user-info-text">
                        <span className="user-name">{user.name || "Student"}</span>
                        <span className="user-sub">{user.userType || "Learner"}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}

export default Navbar;
