"use client";

interface AgentProfileCardProps {
  name: string;
  role: string;
  imageUrl: string;
  featured?: boolean;
  rotation?: number;
  size?: "small" | "medium" | "large";
  bgColor?: "light" | "dark";
}

export function AgentProfileCard({
  name,
  role,
  imageUrl,
  featured = false,
  rotation = 0,
  size = "medium",
  bgColor = "light",
}: AgentProfileCardProps) {
  const sizeClasses = {
    small: "w-32 h-40",
    medium: "w-40 h-48",
    large: "w-48 h-56",
  };

  const imageSizeClasses = {
    small: "w-12 h-12",
    medium: "w-16 h-16",
    large: "w-20 h-20",
  };

  const textSizeClasses = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
  };

  // Vary background colors - some light beige, some darker olive green
  const bgColors = featured 
    ? "bg-[#2d5016] text-white" 
    : bgColor === "dark"
      ? "bg-[#8B9A6B] text-white"
      : "bg-[#D9C7A3] text-black";

  return (
    <div
      className={`${bgColors} ${sizeClasses[size]} rounded-xl p-3 transition-all hover:scale-105 flex flex-col items-center justify-center text-center shadow-lg`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      <div className={`${imageSizeClasses[size]} rounded-full overflow-hidden mb-2 bg-white/20 flex-shrink-0 border-2 border-white/30`}>
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>
      <h3 className={`${textSizeClasses[size]} font-semibold mb-1 truncate w-full px-1`}>{name}</h3>
      <p className={`${textSizeClasses[size]} opacity-90 truncate w-full px-1`}>[{role}]</p>
    </div>
  );
}
