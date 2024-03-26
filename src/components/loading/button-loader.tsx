const ButtonSkeleton = () => {
  return (
    <button className="inline-block cursor-not-allowed rounded-md bg-gray-300 px-16 py-5 text-lg font-semibold text-gray-300 opacity-50 transition-opacity duration-300 ease-in-out hover:opacity-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50">
      <span className="block h-full w-full animate-pulse" />
    </button>
  );
};

export default ButtonSkeleton;
