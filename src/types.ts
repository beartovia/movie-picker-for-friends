export interface Movie {
  id?: string;
  externalId: string;
  title: string;
  genre: string;
  imageUrl: string;
  suggestedBy: string;
  watched: boolean;
  createdAt: number;
}
