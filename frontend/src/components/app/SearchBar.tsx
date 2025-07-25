// src/components/SearchBar.tsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { InstantSearch, SearchBox, Hits, Highlight, Configure } from 'react-instantsearch';
import algoliasearch from 'algoliasearch/lite';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Hash, BookOpen } from 'lucide-react';
import type { Hit } from 'instantsearch.js';

// Algolia credentials
const searchClient = algoliasearch(
  'HGICPYYNHI', // Application ID
  'da13d5dcb40e36f9dc74e6e3b6d589fe' // Search-Only API Key
);

interface SearchHit {
  objectID: string;
  title: string;
  content?: string;
  contentSnippet?: string;
  author?: string;
  subject?: string;
  type?: string;
  createdAt?: string;
}

interface HitProps {
  hit: Hit<SearchHit>;
}

const Hit: React.FC<HitProps> = ({ hit }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'note': return BookOpen;
      case 'post': return FileText;
      default: return FileText;
    }
  };

  const IconComponent = getIcon(hit.type || 'note');

  return (
    <Card className="mb-4 hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <IconComponent className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-foreground">
                <Highlight attribute="title" hit={hit} />
              </h3>
              {hit.type && (
                <Badge variant="secondary" className="text-xs capitalize">
                  {hit.type}
                </Badge>
              )}
            </div>
            
            {(hit.content || hit.contentSnippet) && (
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                <Highlight 
                  attribute={hit.content ? "content" : "contentSnippet"} 
                  hit={hit} 
                />
              </p>
            )}
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {hit.author && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  by {hit.author}
                </span>
              )}
              {hit.subject && (
                <Badge variant="outline" className="text-xs">
                  {hit.subject}
                </Badge>
              )}
              {hit.createdAt && (
                <span>
                  {new Date(hit.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SearchBar: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Search</h1>
          <p className="text-muted-foreground">
            Search through notes and posts across EdLoop
          </p>
        </div>

        <InstantSearch 
          searchClient={searchClient} 
          indexName="notes"
          initialUiState={{
            notes: {
              query: initialQuery,
            },
          }}
        >
          <Configure 
            hitsPerPage={10} 
            filters="type:note OR type:post"
          />
          
          <div className="mb-8">
            <SearchBox
              placeholder="Search for notes and posts..."
              classNames={{
                root: 'relative',
                form: 'relative',
                input: 'w-full h-12 px-4 pr-12 text-base border-2 border-input bg-background rounded-md focus:border-primary focus:outline-none transition-colors placeholder:text-muted-foreground',
                submit: 'absolute right-3 top-1/2 transform -translate-y-1/2 p-0 border-0 bg-transparent cursor-pointer',
                submitIcon: 'w-5 h-5 text-muted-foreground hover:text-foreground transition-colors',
                reset: 'absolute right-10 top-1/2 transform -translate-y-1/2 p-0 border-0 bg-transparent cursor-pointer',
                resetIcon: 'w-4 h-4 text-muted-foreground hover:text-foreground transition-colors',
                loadingIndicator: 'absolute right-3 top-1/2 transform -translate-y-1/2',
                loadingIcon: 'w-5 h-5 text-muted-foreground animate-spin'
              }}
            />
          </div>

          <div className="space-y-4">
            <Hits 
              hitComponent={Hit}
              classNames={{
                root: '',
                list: 'space-y-4',
                item: ''
              }}
            />
          </div>
        </InstantSearch>
      </div>
    </div>
  );
};

export default SearchBar;
