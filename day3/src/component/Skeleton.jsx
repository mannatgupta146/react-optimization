import React from "react";

const Skeleton = () => {
  return (
    <div className="w-72 rounded-lg border p-4 shadow animate-pulse bg-white">
      <div className="h-6 w-40 rounded bg-slate-400 mb-4"></div>
      <div className="h-4 w-24 rounded bg-slate-400 mb-2"></div>
      <div className="h-4 w-32 rounded bg-slate-400 mb-2"></div>
      <div className="h-4 w-36 rounded bg-slate-400"></div>
    </div>
  );
};

export default Skeleton;