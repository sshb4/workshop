"use client";
import React, { useState } from 'react';

const SignOutModal: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        onClick={() => setOpen(true)}
      >
        Sign Out
      </button>
      {open && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-80 backdrop-blur-lg transition-all" style={{pointerEvents: 'auto'}}>
          <div className="bg-white rounded-xl p-4 w-64 max-w-full border border-gray-100 shadow-sm flex flex-col items-center">
            <h2 className="text-base font-medium text-gray-900 mb-1">Sign Out?</h2>
            <p className="text-xs text-gray-500 mb-3 text-center">Are you sure you want to sign out?</p>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <form action="/api/auth/signout" method="POST">
                <button
                  type="submit"
                  className="px-2 py-1 text-xs rounded bg-red-500 hover:bg-red-600 text-white border border-red-400"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SignOutModal;
