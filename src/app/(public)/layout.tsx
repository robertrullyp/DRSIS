import { PropsWithChildren } from "react";
import PublicFooter from "@/components/public-footer";

export default function PublicLayout({ children }: PropsWithChildren) {
  return (
    <div>
      {children}
      <PublicFooter />
    </div>
  );
}

