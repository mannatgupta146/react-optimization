import React from "react";

const UserCard = ({ name, age, city, profession }) => {
  return (
    <div className="border rounded-lg shadow-md p-4 w-72">
      <h2 className="text-xl font-bold">{name}</h2>
      <p>Age: {age}</p>
      <p>City: {city}</p>
      <p>Profession: {profession}</p>
    </div>
  );
};

export default UserCard;