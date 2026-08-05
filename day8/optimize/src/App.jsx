import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "./api/api";

const App = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <h1 className="text-xl font-semibold">Loading...</h1>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <h1 className="text-red-500">{error.message}</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="mx-auto w-[90%] max-w-7xl">
        <h1 className="mb-8 text-3xl font-bold text-gray-800">
          Products
        </h1>

        <div className="flex flex-wrap justify-center gap-8">
          {data.map((user) => (
            <div
              key={user.id}
              className="w-95 rounded-xl bg-white p-6 shadow-md transition duration-300 hover:shadow-lg"
            >
              <div className="flex h-64 items-center justify-center">
                <img
                  loading="lazy"
                  src={user.image}
                  alt={user.title}
                  className="h-52 object-contain"
                />
              </div>

              <h2 className="mt-5 text-xl font-semibold text-gray-800 line-clamp-2">
                {user.title}
              </h2>

              <p className="mt-3 text-gray-600 line-clamp-4">
                {user.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;