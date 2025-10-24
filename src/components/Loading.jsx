// src/components/Loading.jsx
import React from "react";

export default function Loading({ text = "Loading..." }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 mr-3" />
      <div className="text-gray-700">{text}</div>
    </div>
  );
}
