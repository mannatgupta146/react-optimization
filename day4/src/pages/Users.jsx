import React from "react";
import UserCard from "../component/UserCard";

const Users = () => {
  const users = [
    {
      id: 1,
      name: "Mannat Gupta",
      age: 21,
      city: "Udhampur",
      profession: "Full Stack Developer",
    },
    {
      id: 2,
      name: "Rahul Sharma",
      age: 24,
      city: "Delhi",
      profession: "Software Engineer",
    },
    {
      id: 3,
      name: "Priya Singh",
      age: 22,
      city: "Mumbai",
      profession: "UI/UX Designer",
    },
  ];

  return (
    <div className="flex flex-wrap gap-4 p-4">
      {users.map((user) => (
        <UserCard
          key={user.id}
          name={user.name}
          age={user.age}
          city={user.city}
          profession={user.profession}
        />
      ))}
    </div>
  );
};

export default Users;