import React from 'react'
import ReactDOM from 'react-dom/client'
import Student from '/src/Student/Students.jsx'
import "/src/index.css"

let lst = [
    {
      name: "Hammad",
      id: 3
    },
    {
      name: "ali",
      id: 4
    },
    {
      name: "sewr",
      id: 5
    }
  ]

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Student lst={lst} />
  </React.StrictMode>
)
