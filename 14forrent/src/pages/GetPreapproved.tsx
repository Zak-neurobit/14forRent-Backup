
import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Shield, Clock, Star, ArrowRight, FileText, Users, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import ScreeningInProgressOverlay from '@/components/ScreeningInProgressOverlay';
import ScreeningCompletionModal from '@/components/ScreeningCompletionModal';
import PopupBlockedModal from '@/components/PopupBlockedModal';

const GetPreapproved = () => {
  const [showOverlay, setShowOverlay] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showPopupBlockedModal, setShowPopupBlockedModal] = useState(false);
  const [currentService, setCurrentService] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [popupRef, setPopupRef] = useState<Window | null>(null);

  useEffect(() => {
    // Set tracking in sessionStorage for return detection
    sessionStorage.setItem('14ForRent-preapproval-visit', 'true');
    
    // Check if mobile device
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const openScreeningPopup = (url: string, serviceName: string) => {
    // Store which service user chose
    sessionStorage.setItem('screeningService', serviceName);
    sessionStorage.setItem('screeningStartTime', Date.now().toString());
    
    if (isMobile) {
      // On mobile, use redirect with tracking
      sessionStorage.setItem('mobileScreeningFlow', 'true');
      window.location.href = url;
      return;
    }
    
    // Desktop: Open popup window
    const popup = window.open(
      url,
      'screening_window',
      'width=1024,height=768,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=yes'
    );
    
    if (!popup) {
      // Popup blocked - show fallback
      setCurrentUrl(url);
      setShowPopupBlockedModal(true);
      return;
    }
    
    // Center the popup
    const left = (screen.width - 1024) / 2;
    const top = (screen.height - 768) / 2;
    popup.moveTo(left, top);
    
    setPopupRef(popup);
    setCurrentService(serviceName);
    
    // Monitor popup closure
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        handlePopupClosed(serviceName);
      }
    }, 1000);
    
    // Show overlay on main page
    setShowOverlay(true);
  };

  const handlePopupClosed = (serviceName: string) => {
    setShowOverlay(false);
    setShowCompletionModal(true);
    setCurrentService(serviceName);
  };

  const handleCancelScreening = () => {
    if (popupRef && !popupRef.closed) {
      popupRef.close();
    }
    setShowOverlay(false);
    setPopupRef(null);
  };

  const handleTryAgain = () => {
    // No longer used - keeping for interface compatibility
    setShowCompletionModal(false);
  };

  const benefits = [
    {
      icon: <Clock className="h-6 w-6 text-forrent-orange" />,
      title: "Save Time",
      description: "Complete your screening once and apply to multiple properties instantly"
    },
    {
      icon: <Shield className="h-6 w-6 text-forrent-orange" />,
      title: "Build Trust",
      description: "Stand out to landlords with verified income and background information"
    },
    {
      icon: <Star className="h-6 w-6 text-forrent-orange" />,
      title: "Get Priority",
      description: "Pre-approved tenants often get first consideration from property owners"
    },
    {
      icon: <FileText className="h-6 w-6 text-forrent-orange" />,
      title: "Streamlined Process",
      description: "Skip repetitive paperwork and focus on finding your perfect home"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Choose Your Service",
      description: "Select from our trusted screening partners below"
    },
    {
      number: "02",
      title: "Complete in New Window",
      description: "Your spot here is saved while you screen - return automatically when done"
    },
    {
      number: "03",
      title: "Start Applying",
      description: "Use your pre-approval to apply to any property on 14ForRent"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-[#1A2954] text-white py-16 lg:py-24">
          <div className="forrent-container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6">
                Get Pre-Approved for Your Next Rental
              </h1>
              <p className="text-xl lg:text-2xl text-blue-100 mb-8">
                Complete your tenant screening once and apply to multiple properties with confidence
              </p>
              <div className="flex items-center justify-center gap-2 text-forrent-orange">
                <Users className="h-5 w-5" />
                <span className="text-lg">Join thousands of pre-approved renters</span>
              </div>
              {isMobile && (
                <div className="mt-4 flex items-center justify-center gap-2 text-blue-200 text-sm">
                  <Smartphone className="h-4 w-4" />
                  <span>On mobile, you'll be redirected to complete screening</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Screening Options */}
        <section className="py-16 bg-forrent-gray">
          <div className="forrent-container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-forrent-darkGray mb-4">
                Choose Your Screening Service
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Complete your tenant screening with our trusted partner
              </p>
            </div>

            <div className="max-w-xl mx-auto">
              {/* RentSpree Card */}
              <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold text-forrent-navy flex items-center gap-2">
                    <Shield className="h-6 w-6 text-forrent-orange" />
                    Complete Screening with RentSpree
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Credit & Background Check</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>Income Verification</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span>30-Day Application Reuse</span>
                    </div>
                  </div>
                  <Button 
                    onClick={() => openScreeningPopup('https://apply.link/46ZeIhP?source=14ForRent&return=true', 'RentSpree')}
                    className="w-full bg-forrent-orange hover:bg-forrent-lightOrange text-white"
                    size="lg"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Start with RentSpree
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Why Get Pre-Approved */}
        <section className="py-16">
          <div className="forrent-container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-forrent-darkGray mb-4">
                Why Get Pre-Approved?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Pre-approval gives you a competitive edge in today's rental market
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-forrent-darkGray mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-forrent-gray">
          <div className="forrent-container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-forrent-darkGray mb-4">
                How It Works
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Get pre-approved in three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {steps.map((step, index) => (
                <div key={index} className="text-center relative">
                  <div className="w-16 h-16 bg-forrent-orange text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold text-forrent-darkGray mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600">
                    {step.description}
                  </p>
                  {index < steps.length - 1 && (
                    <ArrowRight className="hidden md:block absolute top-8 -right-4 h-6 w-6 text-forrent-orange" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="forrent-container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-forrent-darkGray mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">How long does the screening process take?</h3>
                  <p className="text-gray-600">Most screenings are completed within 24-48 hours. Some may be processed instantly depending on the service provider.</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">Can I use my pre-approval for any property?</h3>
                  <p className="text-gray-600">Yes! Once pre-approved, you can use your screening results to apply to any property on 14ForRent that accepts your chosen screening service.</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">What information do I need to provide?</h3>
                  <p className="text-gray-600">You'll typically need to provide income documentation, employment verification, and consent for credit and background checks.</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2">Is my information secure?</h3>
                  <p className="text-gray-600">Yes, all our screening partners use bank-level encryption and follow strict data protection standards to keep your information safe.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#1A2954] text-white">
          <div className="forrent-container mx-auto px-4 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of renters who have streamlined their apartment search with pre-approval
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-forrent-orange hover:bg-forrent-lightOrange text-white">
                <Link to="/available-units">Browse Properties</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-[#1A2954]">
                <Link to="/contact">Questions? Contact Us</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Modals and Overlays */}
      {showOverlay && (
        <ScreeningInProgressOverlay 
          serviceName={currentService}
          onCancel={handleCancelScreening}
        />
      )}

      {showCompletionModal && (
        <ScreeningCompletionModal 
          serviceName={currentService}
          onTryAgain={handleTryAgain}
          onClose={() => setShowCompletionModal(false)}
        />
      )}

      {showPopupBlockedModal && (
        <PopupBlockedModal 
          url={currentUrl}
          onClose={() => setShowPopupBlockedModal(false)}
        />
      )}
    </div>
  );
};

export default GetPreapproved;
