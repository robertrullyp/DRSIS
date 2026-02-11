export const CMS_CACHE_TAGS = {
  menu: "cms-menu",
  public: "cms-public",
  posts: "cms-public-posts",
  pages: "cms-public-pages",
  events: "cms-public-events",
  galleries: "cms-public-galleries",
  taxonomy: "cms-public-taxonomy",
} as const;

export const CMS_PUBLIC_CACHE_TAGS = [
  CMS_CACHE_TAGS.public,
  CMS_CACHE_TAGS.posts,
  CMS_CACHE_TAGS.pages,
  CMS_CACHE_TAGS.events,
  CMS_CACHE_TAGS.galleries,
  CMS_CACHE_TAGS.taxonomy,
] as const;
