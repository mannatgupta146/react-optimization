import React, { useState, useCallback, useMemo } from "react"
import About from "./component/About"

const App = () => {
  console.log("App Rendering")

  const [count, setCount] = useState(0)

  const [users, setUsers] = useState({
    name: "Mannat",
    id: 1,
  })

  // Expensive calculation
  const expensiveCalculation = (num) => {
    console.log("Calculating...")
    let result = 0

    for (let i = 0; i < 100000000; i++) {
      result += num
    }

    return result
  }

  // Memoize calculation
  const calculatedValue = useMemo(() => {
    return expensiveCalculation(count)
  }, [count])

  // Memoize function
  const changeUser = useCallback(() => {
    setUsers((prev) => ({
      ...prev,
      name: prev.name === "Mannat" ? "John" : "Mannat",
    }))
  }, [])

  const increment = useCallback(() => {
    setCount((prev) => prev + 1)
  }, [])

  return (
    <div className="p-5 flex flex-col gap-3 items-baseline">
      <h1>Count: {count}</h1>

      <button
        className="px-3 py-1 bg-blue-500 text-white"
        onClick={increment}
      >
        Increment
      </button>

      <button
        className="px-3 py-1 bg-green-500 text-white"
        onClick={changeUser}
      >
        Change User
      </button>

      <h2>Calculation: {calculatedValue}</h2>

      <About users={users} changeUser={changeUser} />
    </div>
  )
}

export default App