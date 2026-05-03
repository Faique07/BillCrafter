import React from 'react'
import Navbar from '../components/Navbar.jsx'
import Hero from '../components/Hero.jsx'
import Features from '../components/Features.jsx'

const Home = () => {
  return (
    <div>
        <Navbar/>
        <main className="">
          <Hero/>
          <div className="">
            <Features/>
          </div>
        </main>
    </div>
  )
}

export default Home