import React, { useState } from "react"
import About from "./component/About"

const App = () => {
  console.log("app rendering")

  const [count, setCount] = useState(0)
  const [users, setUsers] = useState({
    name: "Mannat",
    id: 1,
  })

  return (
    <div className="p-5 flex flex-col gap-2 items-baseline">
      <h1>count - {count}</h1>
      <button
        className="px-2 py-0.5 bg-blue-500"
        onClick={() => setCount(count + 1)}
      >
        Increment
      </button>
      <button
        className="px-2 py-0.5 bg-green-500"
        onClick={() => setUsers({ ...users, name: "John" })}
      >
        Change User
      </button>
      <About users={users} />
    </div>
  )
}

export default App
