import { useAuthUser } from "../../hooks/useAuthUser";
import BXI_logo from "../../assets/BXI Listing LOGO.svg";
import Goback from "../../assets/Goback.svg";
import GoBackWhite from "../../assets/GoBackWhite.svg";
import { Link } from "react-router-dom";

const ADMIN_BASE_URL = (
  process.env.REACT_APP_ADMIN_URL || "https://development-admin-coagb.ondigitalocean.app"
).replace(/\/+$/, "");
const DASHBOARD_BASE_URL = (
  process.env.REACT_APP_DASHBOARD_URL || "https://bxi-dashboard-skrsv.ondigitalocean.app"
).replace(/\/+$/, "");
const ADMIN_PANEL_URL = `${ADMIN_BASE_URL}/admindashboard/userdashboard`;
const USER_MARKETPLACE_HOME_URL = `${DASHBOARD_BASE_URL}/home`;

export default function TopNavbar() {
  const { user, companyAvatar, isAdmin } = useAuthUser(); 

  return (
    <nav className="w-full bg-[#f3f4f6] border-b border-gray-200 px-3 py-2 sm:px-6">
      <div className="mx-auto flex w-full max-w-full items-center justify-between gap-2">
        {/* Left Section */}
        <Link to="/sellerhub" className="shrink-0">
          <div className="flex min-w-0 items-center gap-2">
            <img
              src={BXI_logo}
              alt="BXI Logo"
              className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12"
            />
            <span className="hidden text-base font-medium text-gray-800 sm:inline">
              Barter Exchange of India
            </span>
          </div>
        </Link>

        {/* Right Section */}
        <div className="flex min-w-0 shrink-0 items-center justify-end gap-2 sm:gap-6">
          <span className="hidden text-sm font-medium text-gray-600 sm:inline">
            {user?.name}
          </span>
          {companyAvatar && (
            <div className="flex shrink-0 items-center gap-2">
              <img
                src={companyAvatar}
                alt="Company Logo"
                className="h-10 w-10 rounded-full object-contain shadow-md sm:h-12 sm:w-12"
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
            className="group flex shrink-0 items-center justify-center gap-1 rounded-md border-2 border-[#C64091] px-2 py-2 text-xs font-medium text-[#C64091] transition hover:bg-[#C64091] hover:text-white sm:gap-2 sm:px-4 sm:text-sm"
          >
            <img
              src={Goback}
              className="block w-4 h-4 object-contain group-hover:hidden"
              alt=""
            />

            <img
              src={GoBackWhite}
              className="hidden w-4 h-4 object-contain group-hover:block"
              alt=""
            />
            <span className="whitespace-nowrap">Back to Home</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
