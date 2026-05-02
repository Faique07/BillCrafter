import React from 'react'
import Navbar from '../components/Navbar.jsx'
import Hero from '../components/Hero.jsx'

const Home = () => {
  return (
    <div>
        <Navbar/>
        <main className="">
          <Hero/>
        </main>
    </div>
  )
}

export default Home