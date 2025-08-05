import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Typography, 
  Button, 
  Card, 
  CardBody, 
  CardHeader 
} from "@material-tailwind/react"
import { 
  Users, 
  Shield, 
  Zap, 
  Database 
} from 'lucide-react'

const Home = () => {
  const { user } = useAuth()

  const features = [
    {
      icon: <Users className="h-6 w-6" />,
      title: "User Management",
      description: "Complete user registration, authentication, and profile management system."
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Role-Based Access",
      description: "Admin and user roles with secure authentication and authorization."
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Modern UI",
      description: "Beautiful and responsive interface built with Material Tailwind React."
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: "MongoDB Integration",
      description: "Robust data storage with MongoDB and Mongoose ODM."
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="text-center py-20 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <Typography variant="h1" className="mb-4">
          Welcome to FullStack App
        </Typography>
        <Typography variant="lead" className="mb-8 max-w-2xl mx-auto">
          A modern full-stack application built with Express.js, MongoDB, React.js, and Material Tailwind.
        </Typography>
        <div className="flex gap-4 justify-center">
          {user ? (
            <Button size="lg" color="white" variant="filled">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button size="lg" color="white" variant="filled">
                <Link to="/register">Get Started</Link>
              </Button>
              <Button size="lg" color="white" variant="outlined">
                <Link to="/login">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <Typography variant="h2" className="text-center mb-12">
            Features
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardHeader className="flex justify-center">
                  <div className="p-3 bg-blue-500 rounded-full text-white">
                    {feature.icon}
                  </div>
                </CardHeader>
                <CardBody>
                  <Typography variant="h5" color="blue-gray" className="mb-2">
                    {feature.title}
                  </Typography>
                  <Typography>
                    {feature.description}
                  </Typography>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Tech Stack Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center px-4">
          <Typography variant="h2" className="mb-8">
            Built with Modern Technologies
          </Typography>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <Typography variant="h6" color="blue-gray" className="mb-2">
                Backend
              </Typography>
              <Typography variant="small" className="text-gray-600">
                Express.js, MongoDB, JWT
              </Typography>
            </div>
            <div className="text-center">
              <Typography variant="h6" color="blue-gray" className="mb-2">
                Frontend
              </Typography>
              <Typography variant="small" className="text-gray-600">
                React.js, Vite, Router
              </Typography>
            </div>
            <div className="text-center">
              <Typography variant="h6" color="blue-gray" className="mb-2">
                Styling
              </Typography>
              <Typography variant="small" className="text-gray-600">
                Material Tailwind, CSS
              </Typography>
            </div>
            <div className="text-center">
              <Typography variant="h6" color="blue-gray" className="mb-2">
                Tools
              </Typography>
              <Typography variant="small" className="text-gray-600">
                Axios, React Hook Form
              </Typography>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home 