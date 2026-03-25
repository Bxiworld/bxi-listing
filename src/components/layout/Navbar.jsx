import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAuthUser } from "../../hooks/useAuthUser";
import BXI_logo from "../../assets/BXI Listing LOGO.svg";
import GoBackIcon from "../../assets/navbarBackIcon.svg";
import Goback from "../../assets/Goback.svg";
import { isAdmin } from "../../hooks/useAuthUser";

export default function TopNavbar() {
  const { user, companyAvatar, isAdmin } = useAuthUser();

  return (
    <nav className="w-full bg-[#f3f4f6] border-b border-gray-200 px-6 py-2">
  <div className="w-full flex items-center justify-between">

    {/* Left Section */}
    <div className="flex items-center gap-2">
      <img
        src={BXI_logo}
        alt="BXI Logo"
        className="w-12 h-12 object-contain"
      />
      <span className="text-gray-800 font-medium text-base">
        Barter Exchange of India
      </span>
    </div>

    {/* Right Section */}
    <div className="flex items-center gap-6">
      <span className="text-sm text-gray-600 font-medium">
        {user?.name}
      </span>
      {companyAvatar && (
        <div className="flex items-center gap-2">
          <img
            src={companyAvatar}
            alt="Company Logo"
            className="w-12 h-12 object-contain shadow-md rounded-full"
          />
        </div>
      )}

      <button
        onClick={() => isAdmin ? (window.location.href = "https://development-admin.bxiworld.in/admindashboard/userdashboard") : (window.location.href = "https://development-admin.bxiworld.in/home")}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#C64091] border border-[#C64091] border-2 rounded-md hover:bg-[#C64091] hover:text-white transition"
      >
        <img src={Goback}
        className="transition group-hover:brightness-0 group-hover:invert"
        />
        Back to Marketplace
      </button>
    </div>

  </div>
</nav>
  );
}
