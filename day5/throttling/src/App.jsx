import React from 'react'

const App = () => {

  let lastClicked = 0

  const onClickedFn = () => {
    const date = Date.now()
    console.log(date)

    if(date - lastClicked >= 2000) {
      console.log("api calling =>")
      lastClicked = date
    }
  }

  return (
    <div className='p-4'>
      <button onClick={onClickedFn} className="btn px-2 py-1 bg-blue-300 rounded-md cursor-pointer">Button</button>
    </div>
  )
}

export default App