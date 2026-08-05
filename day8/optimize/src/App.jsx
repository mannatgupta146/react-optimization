import { useQuery } from "@tanstack/react-query";
import React from "react";
import { fetchUsers } from "./api/api";

const App = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  if (isLoading) return <h1>Loading...</h1>;
  if (isError) return <h1>{error.message}</h1>;

  return (
    <div>
      {data.map((user) => (
        <div key={user.id}>
          <h1>{user.title}</h1>
          <img src={user.image} alt="" />
        </div>  
      ))}
    </div>
  );
};

export default App;