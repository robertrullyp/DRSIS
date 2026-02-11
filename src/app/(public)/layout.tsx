import { PropsWithChildren } from "react";
import PublicFooter from "@/components/public-footer";
import PublicHeader from "@/components/public-header";

export default function PublicLayout({ children }: PropsWithChildren) {
  return (
    <div>
      <PublicHeader />
      {children}
      <PublicFooter />
    </div>
  );
}
