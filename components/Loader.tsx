import React from 'react';

const Loader = () => {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent border-solid rounded-full animate-spin"></div>
    </div>
  );
};

export default Loader;
