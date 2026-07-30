import React from "react"

const About = ({ users, changeUser }) => {
  console.log("About Rendering")

  return (
    <div className="border p-3">
      <h2>About Component</h2>

      <p>Name: {users.name}</p>
      <p>ID: {users.id}</p>

      <button
        className="px-3 py-1 bg-red-500 text-white"
        onClick={changeUser}
      >
        Change User
      </button>
    </div>
  )
}

export default React.memo(About, (prevProps, nextProps) => {
  return prevProps.users.id === nextProps.users.id
})