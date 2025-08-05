import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Navbar as MTNavbar, 
  Typography, 
  Button, 
  IconButton, 
  Collapse 
} from "@material-tailwind/react"
import { 
  UserCircle, 
  LogOut, 
  Menu, 
  X, 
  Shield 
} from 'lucide-react'
import { useState } from 'react'

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth()
  const [openNav, setOpenNav] = useState(false)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    setOpenNav(false)
  }

  const navList = (
    <ul className="mt-2 mb-4 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
      <Typography as="li" variant="small" color="blue-gray" className="flex items-center gap-x-2 p-1 font-medium">
        <Link to="/" className="flex items-center hover:text-blue-500 transition-colors">
          Home
        </Link>
      </Typography>
      {user && (
        <>
          <Typography as="li" variant="small" color="blue-gray" className="flex items-center gap-x-2 p-1 font-medium">
            <Link to="/dashboard" className="flex items-center hover:text-blue-500 transition-colors">
              Dashboard
            </Link>
          </Typography>
          {isAdmin && (
            <Typography as="li" variant="small" color="blue-gray" className="flex items-center gap-x-2 p-1 font-medium">
              <Link to="/admin" className="flex items-center hover:text-blue-500 transition-colors">
                <Shield className="h-4 w-4 mr-1" />
                Admin
              </Link>
            </Typography>
          )}
        </>
      )}
    </ul>
  )

  return (
    <MTNavbar className="mx-auto max-w-screen-xl px-4 py-2">
      <div className="flex items-center justify-between text-blue-gray-900">
        <Typography
          as={Link}
          to="/"
          className="mr-4 cursor-pointer py-1.5 font-medium"
        >
          FullStack App
        </Typography>
        <div className="flex items-center gap-4">
          <div className="mr-4 hidden lg:block">
            {navList}
          </div>
          <div className="flex items-center gap-x-1">
            {user ? (
              <>
                <Button
                  variant="text"
                  size="sm"
                  className="hidden lg:inline-block"
                  onClick={() => navigate('/profile')}
                >
                  <UserCircle className="h-4 w-4 mr-1" />
                  Profile
                </Button>
                <Button
                  variant="text"
                  size="sm"
                  className="hidden lg:inline-block"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="text"
                  size="sm"
                  className="hidden lg:inline-block"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
                <Button
                  variant="filled"
                  size="sm"
                  className="hidden lg:inline-block"
                  onClick={() => navigate('/register')}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
          <IconButton
            variant="text"
            className="ml-auto h-6 w-6 text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent lg:hidden"
            ripple={false}
            onClick={() => setOpenNav(!openNav)}
          >
            {openNav ? (
              <X className="h-6 w-6" strokeWidth={2} />
            ) : (
              <Menu className="h-6 w-6" strokeWidth={2} />
            )}
          </IconButton>
        </div>
      </div>
      <Collapse open={openNav}>
        <div className="container mx-auto">
          <ul className="mt-2 mb-4 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
            <Typography as="li" variant="small" color="blue-gray" className="flex items-center gap-x-2 p-1 font-medium">
              <Link to="/" className="flex items-center hover:text-blue-500 transition-colors">
                Home
              </Link>
            </Typography>
            {user && (
              <>
                <Typography as="li" variant="small" color="blue-gray" className="flex items-center gap-x-2 p-1 font-medium">
                  <Link to="/dashboard" className="flex items-center hover:text-blue-500 transition-colors">
                    Dashboard
                  </Link>
                </Typography>
                {isAdmin && (
                  <Typography as="li" variant="small" color="blue-gray" className="flex items-center gap-x-2 p-1 font-medium">
                    <Link to="/admin" className="flex items-center hover:text-blue-500 transition-colors">
                      <Shield className="h-4 w-4 mr-1" />
                      Admin
                    </Link>
                  </Typography>
                )}
              </>
            )}
          </ul>
          <div className="flex items-center gap-x-1">
            {user ? (
              <>
                <Button
                  fullWidth
                  variant="text"
                  size="sm"
                  onClick={() => {
                    navigate('/profile')
                    setOpenNav(false)
                  }}
                >
                  <UserCircle className="h-4 w-4 mr-1" />
                  Profile
                </Button>
                <Button
                  fullWidth
                  variant="text"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button
                  fullWidth
                  variant="text"
                  size="sm"
                  onClick={() => {
                    navigate('/login')
                    setOpenNav(false)
                  }}
                >
                  Sign In
                </Button>
                <Button
                  fullWidth
                  variant="filled"
                  size="sm"
                  onClick={() => {
                    navigate('/register')
                    setOpenNav(false)
                  }}
                >
                  Sign Up
                </Button>
              </>
            )}
          </div>
        </div>
      </Collapse>
    </MTNavbar>
  )
}

export default Navbar 