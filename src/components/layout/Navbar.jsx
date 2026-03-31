import { useAuthUser } from "../../hooks/useAuthUser";
import BXI_logo from "../../assets/BXI Listing LOGO.svg";
import Goback from "../../assets/Goback.svg";

const ADMIN_BASE_URL = (
  process.env.REACT_APP_ADMIN_URL || "https://development-admin.bxiworld.in"
).replace(/\/+$/, "");
const DASHBOARD_BASE_URL = (
  process.env.REACT_APP_DASHBOARD_URL || "https://dashboard.bxiworld.in"
).replace(/\/+$/, "");
const ADMIN_PANEL_URL = `${ADMIN_BASE_URL}/admindashboard/userdashboard`;
const USER_MARKETPLACE_HOME_URL = `${DASHBOARD_BASE_URL}/home`;

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
        type="button"
        onClick={() => {
          window.location.href = isAdmin
            ? ADMIN_PANEL_URL
            : USER_MARKETPLACE_HOME_URL;
        }}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#C64091] border border-[#C64091] border-2 rounded-md hover:bg-[#C64091] hover:text-white transition"
      >
        <img
          src={Goback}
          className="transition group-hover:brightness-0 group-hover:invert"
          alt=""
        />
        {isAdmin ? "Back to Admin Panel" : "Back to Marketplace"}
      </button>
    </div>

  </div>
</nav>
  );
}
