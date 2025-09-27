import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CardNav from '../components/CardNav';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const items = [
    {
      label: "Marketplace",
      bgColor: "#0D0716",
      textColor: "#fff",
      links: [
        { label: "Browse Skills", href: "/marketplace", ariaLabel: "Browse Skills" },
        { label: "Categories", href: "/marketplace#categories", ariaLabel: "Categories" },
        { label: "Top Rated", href: "/marketplace#top-rated", ariaLabel: "Top Rated" }
      ]
    },
    {
      label: "Leaderboard", 
      bgColor: "#170D27",
      textColor: "#fff",
      links: [
        { label: "All-Time", href: "/leaderboard", ariaLabel: "All-Time Leaderboard" },
        { label: "Monthly", href: "/leaderboard/monthly", ariaLabel: "Monthly Leaderboard" },
        { label: "Weekly", href: "/leaderboard/weekly", ariaLabel: "Weekly Leaderboard" }
      ]
    },
    {
      label: isAuthenticated ? "My Skills" : "Account",
      bgColor: "#271E37",
      textColor: "#fff",
      links: isAuthenticated ? [
        { label: "My Learning", href: "/my-skills", ariaLabel: "My Learning" },
        { label: "Teaching", href: "/teaching", ariaLabel: "Teaching" },
        { label: "Progress", href: "/progress", ariaLabel: "Progress" },
        { label: "Logout", href: "#", ariaLabel: "Logout", onClick: handleLogout }
      ] : [
        { label: "Login", href: "/login", ariaLabel: "Login" },
        { label: "Sign Up", href: "/signup", ariaLabel: "Sign Up" }
      ]
    }
  ];

  return (
    <CardNav
      logo="https://i.ibb.co/7fBnwGg/Skillswap-03.png"
      logoAlt="SkillSwap Logo"
      items={items}
      baseColor="#fff"
      menuColor="#000"
      buttonBgCo lor="#111"
      buttonTextColor="#fff"
      ease="power3.out"
    />
  );
};

export default Navbar;