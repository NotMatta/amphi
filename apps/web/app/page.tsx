import Link from "next/link";
import { ArrowRight, BookOpen, MessageSquare, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Communities",
    description: "Public and private spaces for courses, cohorts, and campus groups.",
    icon: Users,
    href: "/communities",
    cta: "Explore communities",
  },
  {
    title: "Discussions",
    description: "Posts, threaded comments, and reactions to keep conversations organized.",
    icon: MessageSquare,
    href: "/communities",
    cta: "Join the conversation",
  },
  {
    title: "Study resources",
    description: "Share and discover module materials in one place.",
    icon: BookOpen,
    href: "/resources",
    cta: "Browse resources",
  },
];

export default function Home() {
  return (
    <div className="space-y-16 py-4 sm:py-8">
      <section className="relative overflow-hidden rounded-2xl border bg-card px-6 py-12 shadow-sm sm:px-10 sm:py-16">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
            <Shield className="h-3.5 w-3.5 text-primary" />
            Built for students and professors
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
            A central place for your university community
          </h1>
          <p className="text-pretty text-lg text-muted-foreground">
            Amphi brings course communities, discussions, and study resources together — a focused alternative to scattered group chats.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button size="lg" asChild>
              <Link href="/register">Get started <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/communities">Browse communities</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">Everything in one platform</h2>
          <p className="text-muted-foreground">Simple tools for collaboration, learning, and campus life.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} className="group transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="px-0 text-primary hover:bg-transparent hover:text-primary/80" asChild>
                    <Link href={feature.href}>{feature.cta} <ArrowRight className="ml-1 h-4 w-4" /></Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
