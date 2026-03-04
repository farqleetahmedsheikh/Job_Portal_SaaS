/** @format */

import {
  LayoutDashboard,
  Briefcase,
  Bookmark,
  User,
  Plus,
  Users,
  Building,
} from "lucide-react";
import { JSX } from "react/jsx-dev-runtime";

interface IconProps {
  name: string;
  size?: number;
}

export const Icon = ({ name, size = 18 }: IconProps) => {
  const icons: Record<string, JSX.Element> = {
    dashboard: <LayoutDashboard size={size} />,
    briefcase: <Briefcase size={size} />,
    bookmark: <Bookmark size={size} />,
    user: <User size={size} />,
    plus: <Plus size={size} />,
    users: <Users size={size} />,
    building: <Building size={size} />,
  };

  return icons[name] ?? null;
};
