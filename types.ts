export interface GroundingSource {
    uri: string;
    title: string;
}

export interface OptimizedAdResponse {
  optimizedTitle: string;
  optimizedDescription: string;
  improvements: string[];
  persuasionScore: string;
  clarityScore: string;
  imageSuggestion: string;
  sources?: GroundingSource[];
}
