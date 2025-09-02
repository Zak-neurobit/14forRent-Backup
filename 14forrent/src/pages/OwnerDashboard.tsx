
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserPropertyStats from '@/components/owner/UserPropertyStats';
import UserShowings from '@/components/user/UserShowings';

const OwnerDashboard = () => {
  const [currentTab, setCurrentTab] = useState('stats');
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 py-10 bg-gray-50">
        <div className="forrent-container">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Owner Dashboard</h1>
          
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="stats">Property Stats</TabsTrigger>
              <TabsTrigger value="showings">My Showings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats">
              <UserPropertyStats />
            </TabsContent>
            
            <TabsContent value="showings">
              <UserShowings />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default OwnerDashboard;
