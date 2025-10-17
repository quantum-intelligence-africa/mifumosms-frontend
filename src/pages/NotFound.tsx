import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-2 sm:p-3 lg:p-4 xl:p-6">
      <div className="text-center">
        <h1 className="mb-2 sm:mb-3 lg:mb-4 text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold">404</h1>
        <p className="mb-2 sm:mb-3 lg:mb-4 text-sm sm:text-base lg:text-xl text-gray-600">Oops! Page not found</p>
        <a href="/" className="text-xs sm:text-sm lg:text-base text-blue-500 underline hover:text-blue-700">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
