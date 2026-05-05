import React from 'react'
import Navbar from '../components/Navbar.jsx'
import Hero from '../components/Hero.jsx'
import Features from '../components/Features.jsx'
import Pricing from '../components/Pricing.jsx'

const Home = () => {
  return (
    <div>
        <Navbar/>
        <main className="">
          <Hero/>
          <div className="">
            <Features/>
          </div>
          <Pricing/>
        </main>
    </div>
  )
}

export default Home