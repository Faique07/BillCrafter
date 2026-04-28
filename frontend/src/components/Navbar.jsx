import React from 'react'
import {navbarStyles} from '../assets/dummyStyles'
import logo from '../assets/invoice.png'
import {Link, useNavigate} from 'react-router-dom'
import { useAuth, useClerk, useUser, SignedOut} from '@clerk/clerk-react'
import { useState, useRef } from 'react'

const Navbar = () => {

    const [open, setOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);

    const {user} = useUser();
    const {getToken, isSignedIn} = useAuth();
    const clerk = useClerk();
    const navigate = useNavigate();
    const profileRef = useRef(null);
    const TOKEN_KEY = "token";

    //to open logn model
    function openSignIn(){
        try {
            if(clerk && typeof clerk.openSignIn === "function"){
                clerk.openSignIn();
            }
            else{
                navigate("/login")
            }
        }
        
        catch (e) {
            console.error("openSignIn failed: ", e);
            navigate("/login");
        }
    }

  return (
    <header className={navbarStyles.header}>
         <div className={navbarStyles.container}>
            <nav className={navbarStyles.nav}>
                <div className={navbarStyles.logoSection}>
                    <Link to='/' className={navbarStyles.logoLink}>
                    <img src={logo} alt="logo"  className={navbarStyles.logoImage}/>
                    <span className={navbarStyles.logoText}>BillCrafter</span>
                    </Link>

                    <div className={navbarStyles.desktopNav}>
                        <a href="#features" className={navbarStyles.navLink}>
                            Features
                        </a>
                        <a href="#pricing" className={navbarStyles.navLinkInactive}>
                            Pricing
                        </a>
                    </div>
                </div>
                <div className='flex items-center gap-4'>
                    <div className={navbarStyles.authSection}>
                        <SignedOut>
                            <button
                                onClick={openSignIn}
                                className={navbarStyles.signInButton}
                                type='button'
                            >
                            Sign in</button>
                        </SignedOut>
                    </div>
                </div>
            </nav>
         </div>
    </header>
  )
}

export default Navbar