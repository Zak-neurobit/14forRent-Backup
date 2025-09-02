import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Link, ExternalLink, Trash2, Sparkles, FileText, CheckSquare, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface LinkItem {
  url: string;
  description: string;
}

interface SitemapLink {
  url: string;
  selected: boolean;
}

interface LinksKnowledgeTabProps {
  isUploadingKnowledge: boolean;
  onLinksChange: (links: LinkItem[]) => void;
  onScrapedContent?: (content: string) => void;
}

export const LinksKnowledgeTab = ({ 
  isUploadingKnowledge, 
  onLinksChange,
  onScrapedContent
}: LinksKnowledgeTabProps) => {
  const { toast } = useToast();
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [newLink, setNewLink] = useState<LinkItem>({url: "", description: ""});
  const [isLoading, setIsLoading] = useState(true);
  const [isScraping, setIsScraping] = useState(false);
  const [isFetchingSitemap, setIsFetchingSitemap] = useState(false);
  const [sitemapLinks, setSitemapLinks] = useState<SitemapLink[]>([]);
  const [showSitemapModal, setShowSitemapModal] = useState(false);
  const [selectedLinksCount, setSelectedLinksCount] = useState(0);
  const [maxLinks, setMaxLinks] = useState(50);
  const [activeTab, setActiveTab] = useState("all");
  const [showScrapeDialog, setShowScrapeDialog] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");

  // Fetch links
  useEffect(() => {
    const getLinks = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'knowledge_links')
          .maybeSingle();
          
        if (error) throw error;
        
        if (data) {
          try {
            const parsedLinks = JSON.parse(data.value);
            setLinks(Array.isArray(parsedLinks) ? parsedLinks : []);
          } catch (e) {
            console.error('Error parsing links:', e);
            setLinks([]);
          }
        }
      } catch (error) {
        console.error("Error fetching links:", error);
        toast({
          title: "Error loading knowledge links",
          description: "Please try again or check your connection",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    getLinks();
  }, [toast]);

  // Update links in parent component when changed
  useEffect(() => {
    onLinksChange(links);
  }, [links, onLinksChange]);

  // Count selected links
  useEffect(() => {
    const count = sitemapLinks.filter(link => link.selected).length;
    setSelectedLinksCount(count);
  }, [sitemapLinks]);

  const addLink = () => {
    if (!newLink.url.trim()) {
      toast({
        title: "Please enter a valid URL",
        description: "URL cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    // Basic URL validation
    try {
      new URL(newLink.url);
      setLinks([...links, newLink]);
      setNewLink({url: "", description: ""});
    } catch (e) {
      toast({
        title: "Please enter a valid URL",
        description: "The URL format is invalid",
        variant: "destructive",
      });
    }
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const fetchSitemap = async (url: string) => {
    setIsFetchingSitemap(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-website', {
        body: { url, action: 'fetch-sitemap' }
      });
      
      if (error) throw error;
      
      if (data && data.success && Array.isArray(data.links)) {
        // Convert to SitemapLink[] with selected = false
        const formattedLinks = data.links.map((url: string) => ({
          url,
          selected: false
        }));

        setSitemapLinks(formattedLinks);
        setShowSitemapModal(true);
        
        toast({
          title: "Sitemap fetched successfully",
          description: `Found ${formattedLinks.length} links`,
        });
      } else {
        throw new Error(data?.error || "Failed to fetch sitemap");
      }
    } catch (error) {
      console.error("Error fetching sitemap:", error);
      toast({
        title: "Failed to fetch sitemap",
        description: error instanceof Error ? error.message : "Please try again or check the URL",
        variant: "destructive",
      });
    } finally {
      setIsFetchingSitemap(false);
    }
  };

  const scrapeWebsite = async (url: string) => {
    setIsScraping(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-website', {
        body: { url, action: 'scrape-single' }
      });
      
      if (error) throw error;
      
      if (data && data.success) {
        toast({
          title: "Website scraped successfully",
        });
        
        // Send scraped content to parent component
        if (onScrapedContent) {
          const newContent = 
            `--- Content from ${url} ---\n` + 
            data.content + "\n" +
            "--- End of scraped content ---";
          onScrapedContent(newContent);
        }
      } else {
        throw new Error(data?.error || "Failed to scrape website");
      }
    } catch (error) {
      console.error("Error scraping website:", error);
      toast({
        title: "Failed to scrape website",
        description: error instanceof Error ? error.message : "Please try again or check the URL",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  const scrapeSelectedLinks = async () => {
    const selectedLinks = sitemapLinks.filter(link => link.selected).map(link => link.url);
    
    if (selectedLinks.length === 0) {
      toast({
        title: "No links selected",
        description: "Please select at least one link to scrape",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedLinks.length > 300) {
      toast({
        title: "Too many links selected",
        description: "Please select 300 or fewer links to scrape",
        variant: "destructive",
      });
      return;
    }
    
    setIsScraping(true);
    setShowSitemapModal(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-website', {
        body: { 
          urls: selectedLinks, 
          action: 'scrape-multiple'
        }
      });
      
      if (error) throw error;
      
      if (data && data.success) {
        toast({
          title: "Websites scraped successfully",
          description: `Scraped ${data.scrapedCount || selectedLinks.length} links`,
        });
        
        // Send scraped content to parent component
        if (onScrapedContent && data.combinedContent) {
          const newContent = 
            `--- Content from multiple sites (${selectedLinks.length} links) ---\n` + 
            data.combinedContent + "\n" +
            "--- End of scraped content ---";
          onScrapedContent(newContent);
        }
        
        // Add the links to saved links
        const newLinks: LinkItem[] = selectedLinks.map(url => ({
          url,
          description: "Scraped from sitemap"
        }));
        
        setLinks([...links, ...newLinks]);
      } else {
        throw new Error(data?.error || "Failed to scrape websites");
      }
    } catch (error) {
      console.error("Error scraping websites:", error);
      toast({
        title: "Failed to scrape websites",
        description: error instanceof Error ? error.message : "An error occurred during scraping",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  const toggleLinkSelection = (index: number) => {
    setSitemapLinks(links => 
      links.map((link, i) => 
        i === index ? { ...link, selected: !link.selected } : link
      )
    );
  };

  const selectAll = () => {
    setSitemapLinks(links => 
      links.map((link, i) => i < maxLinks ? { ...link, selected: true } : link)
    );
  };

  const deselectAll = () => {
    setSitemapLinks(links => 
      links.map(link => ({ ...link, selected: false }))
    );
  };

  const filterLinks = useCallback((tab: string) => {
    if (tab === "all") {
      return sitemapLinks;
    } else {
      // Filter by common patterns
      const patterns: Record<string, RegExp[]> = {
        "blog": [/\/blog\//i, /\/post\//i, /\/article\//i],
        "product": [/\/product\//i, /\/item\//i, /\/listing\//i],
        "other": [/\/about\//i, /\/contact\//i, /\/faq\//i, /\/help\//i]
      };
      
      return sitemapLinks.filter(link => {
        const patternGroup = patterns[tab] || [];
        return patternGroup.some(pattern => pattern.test(link.url));
      });
    }
  }, [sitemapLinks]);

  const handleOpenScrapeDialog = () => {
    setScrapeUrl(newLink.url);
    setShowScrapeDialog(true);
  };

  const handleCloseScrapeDialog = () => {
    setShowScrapeDialog(false);
  };

  const handleScrapeSubmit = async () => {
    if (!scrapeUrl) {
      toast({
        title: "Please enter a URL",
        description: "URL cannot be empty",
        variant: "destructive",
      });
      return;
    }

    try {
      new URL(scrapeUrl);
      await scrapeWebsite(scrapeUrl);
      handleCloseScrapeDialog();
    } catch (e) {
      toast({
        title: "Please enter a valid URL",
        description: "The URL format is invalid",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="h-32 flex items-center justify-center">Loading links...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="link-url">Add New Link</Label>
        <div className="flex flex-col gap-2">
          <Input
            id="link-url"
            placeholder="https://example.com"
            value={newLink.url}
            onChange={(e) => setNewLink({...newLink, url: e.target.value})}
            disabled={isUploadingKnowledge}
          />
          <Input
            id="link-description"
            placeholder="Description (what information this link contains)"
            value={newLink.description}
            onChange={(e) => setNewLink({...newLink, description: e.target.value})}
            disabled={isUploadingKnowledge}
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={addLink}
              type="button" 
              variant="outline"
              className="w-full"
              disabled={isUploadingKnowledge}
            >
              Add Link
            </Button>
            <Button 
              onClick={() => newLink.url && fetchSitemap(newLink.url)}
              type="button"
              variant="secondary"
              className="w-full"
              disabled={isFetchingSitemap || !newLink.url || isUploadingKnowledge}
            >
              {isFetchingSitemap ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Fetching Sitemap...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Fetch Sitemap
                </>
              )}
            </Button>
            <Button 
              onClick={handleOpenScrapeDialog}
              type="button"
              variant="secondary"
              className="w-full"
              disabled={!newLink.url || isUploadingKnowledge || isScraping}
            >
              {isScraping ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Scrape Webpage
                </>
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Add links to websites with information about your properties or services. You can also scrape the content directly or fetch the website's sitemap.
        </p>
      </div>
      
      {/* Saved Links Section */}
      <div className="space-y-2">
        <Label>Saved Links</Label>
        {links.length > 0 ? (
          <div className="space-y-2">
            {links.map((link, index) => (
              <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <div className="flex items-center">
                    <Link size={16} className="text-blue-500 mr-2" />
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate">
                      {link.url}
                    </a>
                  </div>
                  {link.description && (
                    <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => scrapeWebsite(link.url)}
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    disabled={isScraping || isUploadingKnowledge}
                  >
                    <ExternalLink size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLink(index)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    disabled={isUploadingKnowledge}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No links added yet</p>
        )}
      </div>

      {/* Web Scrape Dialog */}
      <Dialog open={showScrapeDialog} onOpenChange={setShowScrapeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scrape Website Content</DialogTitle>
            <DialogDescription>
              Enter the URL of the website you want to scrape. The content will be added to your knowledge base.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="scrape-url">Website URL</Label>
              <Input
                id="scrape-url"
                placeholder="https://example.com"
                value={scrapeUrl}
                onChange={(e) => setScrapeUrl(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseScrapeDialog}
            >
              Cancel
            </Button>
            <Button
              onClick={handleScrapeSubmit}
              disabled={isScraping}
            >
              {isScraping ? "Scraping..." : "Scrape Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sitemap Links Modal */}
      <Dialog 
        open={showSitemapModal} 
        onOpenChange={setShowSitemapModal}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Select Links to Scrape</DialogTitle>
            <DialogDescription>
              Found {sitemapLinks.length} links in the sitemap. Select up to 300 links to scrape.
            </DialogDescription>
          </DialogHeader>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button 
              onClick={selectAll} 
              variant="outline" 
              size="sm"
              disabled={maxLinks > sitemapLinks.length ? true : false}
            >
              <CheckSquare className="h-4 w-4 mr-1" /> 
              Select {maxLinks > sitemapLinks.length ? "All" : `First ${maxLinks}`}
            </Button>
            <Button 
              onClick={deselectAll} 
              variant="outline" 
              size="sm"
            >
              Deselect All
            </Button>
            
            <Badge className={selectedLinksCount > 300 ? "bg-red-500" : "bg-green-500"}>
              {selectedLinksCount} / 300 selected
            </Badge>

            <div className="ml-auto flex items-center gap-1">
              <Label htmlFor="max-links" className="text-sm whitespace-nowrap">Max Links:</Label>
              <Input 
                id="max-links" 
                type="number" 
                value={maxLinks} 
                onChange={(e) => setMaxLinks(parseInt(e.target.value) || 50)}
                min="1"
                max="300"
                className="w-20"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-2">
              <TabsTrigger value="all">All Links ({sitemapLinks.length})</TabsTrigger>
              <TabsTrigger value="blog">Blog</TabsTrigger>
              <TabsTrigger value="product">Products/Listings</TabsTrigger>
              <TabsTrigger value="other">Other Pages</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-0">
              <ScrollArea className="h-[400px] border rounded-md p-2">
                <div className="space-y-2">
                  {filterLinks(activeTab).map((link, index) => {
                    const actualIndex = sitemapLinks.findIndex(l => l.url === link.url);
                    return (
                      <div key={link.url} className="flex items-center p-2 hover:bg-gray-50 rounded">
                        <Checkbox 
                          id={`link-${actualIndex}`}
                          checked={link.selected}
                          onCheckedChange={() => toggleLinkSelection(actualIndex)}
                          className="mr-2"
                        />
                        <Label htmlFor={`link-${actualIndex}`} className="flex-1 cursor-pointer truncate">
                          {link.url}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end mt-4 gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowSitemapModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={scrapeSelectedLinks}
              disabled={selectedLinksCount === 0 || selectedLinksCount > 300}
            >
              Scrape {selectedLinksCount} Selected Links
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
