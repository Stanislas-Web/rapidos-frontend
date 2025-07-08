import React from "react";

interface StartCardProps {
  title: string;
  value: string;
  icon: React.ReactNode; // ✅ Pour autoriser les icônes React (et non des strings)
  color: string;
}

const StartCard = ({ title, value, icon, color }: StartCardProps) => {
  return (
    <div
      className={`p-6 rounded-2xl shadow-lg flex items-center justify-between gap-4 transition-transform transform hover:scale-105 ${color}`}
    >
      <div>
        <p className="text-sm text-white/80 font-light">{title}</p>
        <h3 className="text-3xl font-bold text-white">{value}</h3>
      </div>
      <div className="text-white text-4xl">{icon}</div>
    </div>
  );
};

export default StartCard;
