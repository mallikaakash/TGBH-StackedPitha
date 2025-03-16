import Link from 'next/link'
import React from 'react'

const Page = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      {/* Header with Logo and Connect Button */}
      <div className="w-full max-w-md flex justify-between items-center p-4 bg-white rounded-lg shadow-sm mb-4">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center text-white mr-2">
            <span className="text-xl">🚌</span>
          </div>
          <h1 className="text-xl font-bold">Namma Yatri </h1>
        </div>
        {/* <button className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
          Connect
        </button> */}
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        {/* Card Header */}
        <div className="bg-green-600 p-4 text-white">
          <div className="flex items-center justify-between">
            
          </div>
          <h2 className="text-xl font-bold mt-4">Driver Dashboard </h2>
        </div>

        {/* Card Content */}
        <div className="p-6">
          <h3 className="font-semibold text-lg mb-4">Making travel easier</h3>
          
          <p className="text-gray-800 mb-6">
            Namma Yatri helps you find and book the cabs and autos at ZERO commission. No middle man, no hidden charges, Just trust and transparency and Savings.
            Convenient, affordable, and reliable transportation at your fingertips.
          </p>
          
          <div className="flex flex-col space-y-4 mb-6">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mr-3">
                <span>🔍</span>
              </div>
              <span className="text-gray-700">Help Drivers match "desirable" rides</span>
            </div>
            
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mr-3">
                <span>📍</span>
              </div>
              <span className="text-gray-700">Predictive Modelling enabled for peak-hour demand management</span>
            </div>
          </div>
          
          {/* Action Button */}
          <button className="w-full bg-black text-white py-3 rounded-lg font-medium">
            <Link href="/driver"> Driver DashBoard</Link>
            
          </button>
        </div>
      </div>

     
    </div>
  )
}

export default Page
