export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  published: boolean;
  publishedAt: string | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
}

export interface BlogPostDetail extends BlogPostSummary {
  content: string;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlogComment {
  id: string;
  postId: string;
  userId: string;
  authorDisplayName: string;
  body: string;
  createdAt: string;
}

export interface BlogPostFormValues {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tags: string[];
  published: boolean;
}
