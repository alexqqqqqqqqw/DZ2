import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-heading text-4xl">Такой страницы нет</h1>
      <p className="mt-3 text-sm text-muted-foreground">Проверьте адрес или вернитесь к рационам.</p>
      <Link className={cn(buttonVariants(), "mt-6 h-11")} href="/rations">
        К рационам
      </Link>
    </div>
  );
}
