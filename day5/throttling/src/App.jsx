import React, { useEffect, useState } from 'react'

const App = () => {

  const [search, setSearch] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("api calling => ", search)
    }, 5000)

    return ()=> {
      clearTimeout(timer)
    }
  }, [search])
  

  return (
    <div>
      <input 
        className='m-4 p-2 border rounded-lg' 
        onChange={(e)=> { setSearch(e.target.value)}} 
        type="text"
        placeholder='search'
      />
    </div>
  )
}

export default App