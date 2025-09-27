import React from 'react';
import CardNav from '../components/CardNav';

const Navbar = () => {
  const items = [
    {
      label: "Marketplace",
      bgColor: "#0D0716",
      textColor: "#fff",
      links: [
        { label: "Marketplace", href: "/marketplace", ariaLabel: "Marketplace" }
      ]
    },
    {
      label: "Leaderboard", 
      bgColor: "#170D27",
      textColor: "#fff",
      links: [
        { label: "Leaderboard All-Time", href: "/Leaderboard", ariaLabel: "Leaderboard" },
        { label: "Leaderboard Monthly", href: "/Leaderboard/monthly", ariaLabel: "Leaderboard Monthly" },
        { label: "Leaderboard Weekly", href: "/Leaderboard/weekly", ariaLabel: "Leaderboard Weekly" }
      ]
    },
    {
      label: "My Skills",
      bgColor: "#271E37", 
      textColor: "#fff",
      links: [
        { label: "My Skills", href: "/myskills", ariaLabel: "My Skills" },
        { label: "Teaching", href: "/myskills/teaching", ariaLabel: "Teaching" },
        { label: "Learning", href: "/myskills/learning", ariaLabel: "Learning" }
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