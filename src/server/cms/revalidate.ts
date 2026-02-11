import { revalidateTag } from "next/cache";
import { CMS_CACHE_TAGS } from "@/server/cms/cache-tags";

export function revalidateCmsPublicContent() {
  revalidateTag(CMS_CACHE_TAGS.public);
  revalidateTag(CMS_CACHE_TAGS.posts);
  revalidateTag(CMS_CACHE_TAGS.pages);
  revalidateTag(CMS_CACHE_TAGS.events);
  revalidateTag(CMS_CACHE_TAGS.galleries);
  revalidateTag(CMS_CACHE_TAGS.taxonomy);
}

export function revalidateCmsMenu() {
  revalidateTag(CMS_CACHE_TAGS.menu);
  revalidateTag(CMS_CACHE_TAGS.public);
}
