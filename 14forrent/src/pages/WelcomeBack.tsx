
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Star, Home, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const WelcomeBack = () => {
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [completionSource, setCompletionSource] = useState<'mobile' | 'popup' | 'unknown'>('unknown');

  useEffect(() => {
    // Check if user is returning from screening services
    const urlParams = new URLSearchParams(window.location.search);
    const hasReturnParam = urlParams.get('return') === 'true' || urlParams.get('source') === '14forrent';
    const hasSessionVisit = sessionStorage.getItem('14forrent-preapproval-visit') === 'true';
    const referrerFromPartners = document.referrer.includes('rentspree') || 
                                document.referrer.includes('zumper') || 
                                document.referrer.includes('apply.link');
    const screeningCompleted = sessionStorage.getItem('screening-completed') === 'true';
    const mobileFlow = sessionStorage.getItem('mobileScreeningFlow') === 'true';

    if (hasReturnParam || hasSessionVisit || referrerFromPartners || screeningCompleted) {
      setIsReturningUser(true);
      
      // Determine completion source
      if (screeningCompleted) {
        setCompletionSource('popup');
      } else if (mobileFlow || hasReturnParam || referrerFromPartners) {
        setCompletionSource('mobile');
      }
      
      // Clear the session storage flags
      sessionStorage.removeItem('14forrent-preapproval-visit');
      sessionStorage.removeItem('screening-completed');
      sessionStorage.removeItem('mobileScreeningFlow');
    }
  }, []);

  const nextSteps = [
    {
      icon: <Home className="h-6 w-6 text-forrent-orange" />,
      title: "Browse Available Properties",
      description: "Explore our curated selection of rental properties with your pre-approval advantage"
    },
    {
      icon: <User className="h-6 w-6 text-forrent-orange" />,
      title: "Complete Your Profile",
      description: "Add additional details to make your applications even stronger"
    },
    {
      icon: <Star className="h-6 w-6 text-forrent-orange" />,
      title: "Apply with Confidence",
      description: "Use your pre-approval to stand out to property owners and landlords"
    }
  ];

  const getWelcomeMessage = () => {
    switch (completionSource) {
      case 'popup':
        return "Thanks for completing your screening! You're now pre-approved and ready to apply.";
      case 'mobile':
        return "Welcome back from your screening! You're now pre-approved and ready to apply.";
      default:
        return "Congratulations! You're now pre-approved and ready to apply to any property on 14ForRent with confidence.";
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-green-50 to-green-100 py-16 lg:py-24">
          <div className="forrent-container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-forrent-darkGray mb-6">
                Welcome Back! 🎉
              </h1>
              <div className="bg-green-500 text-white px-6 py-3 rounded-full inline-block mb-6">
                <span className="text-lg font-semibold">Your Screening is Complete</span>
              </div>
              <p className="text-xl lg:text-2xl text-gray-700 mb-8">
                {getWelcomeMessage()}
              </p>
              <div className="flex items-center justify-center gap-2 text-forrent-orange">
                <Star className="h-5 w-5" />
                <span className="text-lg font-medium">You now have a competitive advantage in the rental market</span>
              </div>
            </div>
          </div>
        </section>

        {/* Success Message */}
        <section className="py-12 bg-white">
          <div className="forrent-container mx-auto px-4">
            <Card className="max-w-3xl mx-auto border-green-200 bg-green-50">
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-forrent-darkGray mb-4">
                  Pre-Approval Status: ✅ APPROVED
                </h2>
                <p className="text-lg text-gray-700 mb-6">
                  Your tenant screening has been successfully completed. Property owners will see that you're a verified, 
                  pre-screened applicant, giving you priority consideration for rental applications.
                </p>
                <div className="bg-white p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Next Step:</strong> Start browsing properties and apply with your pre-approval advantage!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Next Steps */}
        <section className="py-16 bg-forrent-gray">
          <div className="forrent-container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-forrent-darkGray mb-4">
                What's Next?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Make the most of your pre-approval with these next steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {nextSteps.map((step, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow duration-300">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-forrent-darkGray mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Buttons */}
        <section className="py-16">
          <div className="forrent-container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-forrent-darkGray mb-8">
              Ready to Find Your Perfect Home?
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Button asChild size="lg" className="bg-forrent-orange hover:bg-forrent-lightOrange text-white flex-1">
                <Link to="/available-units" className="flex items-center justify-center gap-2">
                  Browse Properties
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-forrent-navy text-forrent-navy hover:bg-forrent-navy hover:text-white flex-1">
                <Link to="/signup" className="flex items-center justify-center gap-2">
                  Update Profile
                  <User className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="py-16 bg-blue-50">
          <div className="forrent-container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold text-forrent-darkGray mb-8 text-center">
                Pro Tips for Pre-Approved Applicants
              </h2>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Mention your pre-approval status</p>
                      <p className="text-sm text-gray-600">When contacting property owners, lead with your pre-approved status</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Apply quickly to hot properties</p>
                      <p className="text-sm text-gray-600">Pre-approval lets you move fast on properties you love</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Keep your screening current</p>
                      <p className="text-sm text-gray-600">Most screenings are valid for 30 days, so apply within this window</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default WelcomeBack;
