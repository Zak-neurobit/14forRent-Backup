
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { searchListingsWithAI } from "@/services/ai/search";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, Search } from "lucide-react";

const AISearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    
    try {
      toast.info("🤖 AI is analyzing your search...", {
        description: `Understanding: "${searchQuery}"`
      });

      // Enhanced AI search with natural language processing
      try {
        console.log("Starting intelligent AI search for:", searchQuery);
        const result = await searchListingsWithAI(searchQuery, {
          useSemanticSearch: true,
          analyzeIntent: true
        });
        
        if (result.matches && result.matches.length > 0) {
          console.log("AI Search found results:", result.matches.length);

          // Navigate to search page with the query and results
          const searchParams = new URLSearchParams();
          searchParams.set("query", searchQuery);
          searchParams.set("advanced", "true"); // Flag to indicate advanced search
          navigate(`/search?${searchParams.toString()}`);
          
          // Show contextual success message based on search intent
          if (result.analyzedQuery) {
            const { analyzedQuery } = result;
            let description = `Found ${result.matches.length} properties`;
            
            if (analyzedQuery.petFriendly) {
              description += " that are pet-friendly";
            }
            if (analyzedQuery.bedrooms) {
              description += ` with ${analyzedQuery.bedrooms} bedrooms`;
            }
            if (analyzedQuery.amenities?.length) {
              description += ` with ${analyzedQuery.amenities.slice(0, 2).join(", ")}`;
            }
            
            toast.success("🎯 Smart search completed!", {
              description: description
            });
          } else {
            const exactMatches = result.matches.filter(m => m.similarity > 0.7).length;
            
            if (exactMatches > 0) {
              toast.success("🔥 Perfect matches found!", {
                description: `Found ${exactMatches} properties that perfectly match your criteria`
              });
            } else {
              toast.success("✨ Good matches found!", {
                description: `Found ${result.matches.length} properties that match your search`
              });
            }
          }
        } else {
          console.log("AI Search found no results");
          navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
          toast.info("🔍 No exact matches found", {
            description: "Try adjusting your search terms or browse all properties"
          });
        }
      } catch (aiError) {
        console.error("AI search error:", aiError);
        if (isAdmin) {
          toast.error("AI search error", {
            description: "API key may not be configured. Check admin settings."
          });
        }
        // Fall back to regular search
        navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
        toast.info("Using basic search", {
          description: "AI search unavailable, showing all matching properties"
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Search failed", {
        description: "Please try again with different terms"
      });

      // Still navigate to search with the raw query for fallback
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSearch} className="relative">
        <div 
          id="search-bar"
          className="glassmorphism-search relative rounded-3xl overflow-hidden border border-white/30 flex items-center px-3 min-h-12 transition-all duration-300"
        >
          <Search className="text-white/70 mr-3" size={20} />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Try 'Pet-friendly 2BR with pool near downtown' or 'Modern luxury apartment under $2000'"
            className="flex-1 border-none outline-none bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-white/60 text-base py-2.5 px-3"
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '1rem'
            }}
          />
          <div className="pl-2">
            <Button
              type="submit"
              disabled={isSearching}
              className={`rounded-full w-10 h-10 p-0 bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200
                ${isSearching ? 'animate-pulse bg-purple-700 scale-105' : ''}`}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </form>
      <div className="text-center mt-2">
        <p className="text-xs text-gray-300/80">
          Advanced search finds exactly what you need
        </p>
      </div>
    </div>
  );
};

export default AISearch;
