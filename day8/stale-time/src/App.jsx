import { useQuery } from "@tanstack/react-query";
import React from "react";
import { fetchUsers } from "./api/api";

const App = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    gcTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) return <h1>Loading...</h1>;
  if (isError) return <h1>{error.message}</h1>;

  return (
    <div>
      {data.map((user) => (
        <h1 key={user.id}>{user.name}</h1>
      ))}
    </div>
  );
};

export default App;