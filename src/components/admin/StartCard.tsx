import React from "react";

interface StartCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

const StartCard = ({ title, value, icon, color }: StartCardProps) => {
  return (
    <div
      className={`relative overflow-hidden p-5 rounded-2xl shadow-sm hover:shadow-lg flex items-center justify-between gap-4 transition-all duration-300 transform hover:scale-[1.03] hover:-translate-y-0.5 ${color}`}
    >
      {/* Decorative circle */}
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
      <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-white/5 rounded-full" />
      <div className="relative">
        <p className="text-xs text-white/70 font-medium uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{value}</h3>
      </div>
      <div className="relative flex items-center justify-center w-12 h-12 bg-white/15 backdrop-blur-sm rounded-xl text-white">
        {icon}
      </div>
    </div>
  );
};

export default StartCard;
