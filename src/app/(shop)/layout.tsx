import { Suspense } from "react";

import { Shell } from "@/components/shell";
import { LoadingBlock } from "@/components/states";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<LoadingBlock label="Открываем Норму" />}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
