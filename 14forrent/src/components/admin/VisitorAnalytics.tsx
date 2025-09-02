import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { LiveVisitorCard } from "./LiveVisitorCard";
import { StatCard } from "./StatCard";
import { AnalyticsService } from "@/services/analyticsService";
import { cn } from "@/lib/utils";

export const VisitorAnalytics: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyVisitors, setDailyVisitors] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    fetchDailyVisitors(selectedDate);
  }, [selectedDate]);

  const fetchDailyVisitors = async (date: Date) => {
    try {
      setLoading(true);
      const count = await AnalyticsService.getDailyVisitorCount(date);
      setDailyVisitors(count);
    } catch (error) {
      console.error('Failed to fetch daily visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          Visitor Analytics
        </h3>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Live Visitors Card */}
        <LiveVisitorCard />

        {/* Daily Visitors Card with Date Selector */}
        <Card className="p-4 lg:p-6 border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm lg:text-base font-medium text-gray-600 leading-tight">
              {isToday ? "Today's Visitors" : "Visitors"}
            </h4>
            <div className="flex items-center gap-2">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "MMM dd") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date > new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold text-gray-900">
            {loading ? (
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                <span className="text-sm text-gray-400">Loading...</span>
              </div>
            ) : (
              <span className="tabular-nums">{dailyVisitors}</span>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {isToday ? "Active today" : format(selectedDate, "MMMM dd, yyyy")}
          </div>
        </Card>

        {/* Quick Stats Card */}
        <StatCard
          title="This Week"
          value="--"
          icon="TrendingUp"
          iconColor="text-purple-500"
          loading={false}
          className="opacity-75"
        />
      </div>

      {/* Quick Date Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={isToday ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedDate(new Date())}
          className="text-xs"
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            setSelectedDate(yesterday);
          }}
          className="text-xs"
        >
          Yesterday
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            setSelectedDate(weekAgo);
          }}
          className="text-xs"
        >
          7 Days Ago
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            setSelectedDate(monthAgo);
          }}
          className="text-xs"
        >
          30 Days Ago
        </Button>
      </div>

      {/* Analytics Summary */}
      {!loading && (
        <Card className="p-4 lg:p-6 border-gray-200 shadow-sm bg-gray-50">
          <div className="text-sm text-gray-600">
            <strong>{dailyVisitors}</strong> unique visitors on{" "}
            <strong>{format(selectedDate, "MMMM dd, yyyy")}</strong>
            {isToday && " (and counting)"}
          </div>
        </Card>
      )}
    </div>
  );
};