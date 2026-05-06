import { getAvatarColor, getInitials } from "../../utils/avatarColor";

interface AvatarProps {
  userId: string;
  name: string;
  className?: string;
}

export function Avatar({ userId, name, className = "" }: AvatarProps) {
  return (
    <div
      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium text-white ${getAvatarColor(userId)} ${className}`}
      aria-hidden="true"
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
