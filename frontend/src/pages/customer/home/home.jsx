import React from "react";

const UserHome = () => {
  return (
    <div className="relative min-h-screen overflow-hidden font-sans">
      {/* Dynamic Moving Background */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-yellow-100 via-red-200 to-yellow-200 bg-[length:200%_200%] animate-background-motion z-0" />
    </div>
  );
};

export default UserHome;
