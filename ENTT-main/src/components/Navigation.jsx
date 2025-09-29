import { Link, useLocation } from 'react-router-dom'
import { Button } from './ui/button'
export default function Navigation() {
  const location = useLocation()
  const isActive = (path) => {
    return location.pathname.startsWith(path)
  }
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-2xl font-bold text-primary">
              TalentFlow
            </Link>
            <div className="flex space-x-1">
              <Link to="/jobs">
                <Button
                  variant={isActive('/jobs') ? 'default' : 'ghost'}
                >
                  Jobs
                </Button>
              </Link>
              <Link to="/candidates">
                <Button
                  variant={isActive('/candidates') ? 'default' : 'ghost'}
                >
                  Candidates
                </Button>
              </Link>
              <Link to="/assessments">
                <Button
                  variant={isActive('/assessments') ? 'default' : 'ghost'}
                >
                  Assessments
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              HR Dashboard
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
}
