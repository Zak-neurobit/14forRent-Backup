
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { signIn } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOMeta from "@/components/SEOMeta";
import { Label } from "@/components/ui/label";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Check for messages from signup page
    if (location.state?.message) {
      toast({
        title: "Welcome!",
        description: location.state.message,
        duration: 6000,
      });
      
      // Pre-fill email if provided
      if (location.state.email) {
        setEmail(location.state.email);
      }
    }

    // Check for email verification success
    const urlParams = new URLSearchParams(location.search);
    if (urlParams.get('verified') === 'true') {
      toast({
        title: "Email verified!",
        description: "Your account has been verified. You can now log in.",
        duration: 5000,
      });
    }
  }, [location.state, location.search, toast]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location.state]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    try {
      await signIn(email, password);
      
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
      
      // Redirect to intended page or home
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error("Login error:", error);
      let errorMessage = "Login failed. Please check your credentials and try again.";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Please check your email and verify your account before logging in.";
      } else if (error.message.includes("Too many requests")) {
        errorMessage = "Too many login attempts. Please wait a few minutes and try again.";
      }
      
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SEOMeta 
        title="14ForRent - Login | Access Your Rental Account"
        description="Sign in to your 14ForRent account to access your favorite properties, applications, and rental dashboard."
        keywords="login, sign in, rental account, property account, 14ForRent login"
        url="https://14forrent.com/login"
        type="website"
        canonical="https://14forrent.com/login"
      />
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md shadow-lg border-forrent-navy/10">
          <CardHeader className="bg-gradient-to-r from-forrent-navy to-forrent-lightNavy text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
            <CardDescription className="text-white/80">
              Sign in to your 14forRent account
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-50 p-4 rounded-md text-red-500 text-sm border border-red-200">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="border-forrent-navy/20"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="border-forrent-navy/20"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-forrent-navy hover:bg-forrent-lightNavy" 
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t pt-6">
            <p className="text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/signup" className="text-forrent-navy hover:text-forrent-lightNavy font-medium">
                Sign up
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
