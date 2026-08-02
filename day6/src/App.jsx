import React, { useEffect } from 'react'
import axios from 'axios'

const App = () => {

  const fetchData = async ()=> {
    const res = await axios.get("https://dummyjson.com/products")
    const data = res.data

    console.log(data)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className='p-4'>
      
    </div>
  )
}

export default App