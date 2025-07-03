export default function Loading() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-800 mx-auto mb-4"></div>
        <p className="text-gray-800 text-lg font-medium">Loading shipments...</p>
      </div>
    </div>
  );
}
