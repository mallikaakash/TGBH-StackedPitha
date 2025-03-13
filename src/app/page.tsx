import Link from 'next/link'
import React from 'react'

const page = () => {
  return (
    <div>
      Namma Yatri
      <div>
        <h1>
          Welcome to Namma Yatri
        </h1>
        
      </div>
      <p>
        Namma Yatri is a platform for booking buses in India.
      </p>
      <button>
        <Link href="/driver">
        Driver 
        </Link>
      </button>
    </div>
  )
}

export default page
