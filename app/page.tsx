"use client";

import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight, 
  Globe2, 
  Shield, 
  Truck, 
  Package, 
  CreditCard, 
  BarChart3,
  Search,
  ShoppingCart,
  FileCheck,
  MapPin,
  Building2,
  Boxes,
  Leaf,
  Gem,
  Cpu,
  Shirt,
  Utensils,
  Hammer
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const stats = [
  { value: "50+", label: "Countries" },
  { value: "10K+", label: "Suppliers" },
  { value: "$2B+", label: "Trade Volume" },
  { value: "99.5%", label: "Delivery Rate" },
];

const features = [
  {
    icon: Search,
    title: "Discover Verified Suppliers",
    description: "Browse thousands of verified manufacturers and wholesalers across Africa. Every supplier is vetted for quality and reliability.",
  },
  {
    icon: Shield,
    title: "Secure Trade Assurance",
    description: "Protected payments with escrow services. Your money is safe until you confirm delivery and product quality.",
  },
  {
    icon: Truck,
    title: "Cross-Border Logistics",
    description: "End-to-end shipping solutions handling customs, duties, and last-mile delivery across 50+ African countries.",
  },
  {
    icon: CreditCard,
    title: "Flexible Payment Options",
    description: "Pay in local currencies with multiple payment methods including mobile money, bank transfers, and trade credit.",
  },
  {
    icon: Package,
    title: "Quality Inspection",
    description: "Optional pre-shipment inspection services to ensure products meet your specifications before dispatch.",
  },
  {
    icon: BarChart3,
    title: "Trade Analytics",
    description: "Track orders, analyze spending patterns, and optimize your supply chain with powerful business intelligence.",
  },
];

const categories = [
  { icon: Boxes, name: "Raw Materials", count: "2.5K+ suppliers" },
  { icon: Leaf, name: "Agriculture", count: "1.8K+ suppliers" },
  { icon: Gem, name: "Mining & Minerals", count: "950+ suppliers" },
  { icon: Cpu, name: "Electronics", count: "1.2K+ suppliers" },
  { icon: Shirt, name: "Textiles & Fashion", count: "3.1K+ suppliers" },
  { icon: Utensils, name: "Food & Beverages", count: "2.3K+ suppliers" },
  { icon: Hammer, name: "Construction", count: "1.5K+ suppliers" },
  { icon: Building2, name: "Industrial Equipment", count: "890+ suppliers" },
];

const steps = [
  {
    step: "01",
    title: "Browse & Source",
    description: "Search our marketplace for products or post your requirements. Get quotes from multiple verified suppliers.",
    icon: Search,
  },
  {
    step: "02",
    title: "Order & Pay Securely",
    description: "Place orders with trade assurance protection. Pay securely with escrow-protected transactions.",
    icon: ShoppingCart,
  },
  {
    step: "03",
    title: "Quality Check",
    description: "Optional inspection services verify product quality and quantity before shipment.",
    icon: FileCheck,
  },
  {
    step: "04",
    title: "Ship & Track",
    description: "We handle customs, freight, and delivery. Track your shipment in real-time until it arrives.",
    icon: MapPin,
  },
];

const countries = [
  "Nigeria", "Kenya", "South Africa", "Ghana", "Egypt", 
  "Morocco", "Tanzania", "Ethiopia", "Rwanda", "Senegal",
  "Côte d'Ivoire", "Uganda"
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Globe2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">AfriConnect</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/explore" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Marketplace
            </Link>
            <Link href="#categories" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Categories
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm">Sign In</Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button size="sm">Get Started</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 hero-gradient pattern-overlay overflow-hidden">
        <div className="container mx-auto px-4 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="flex flex-col gap-6 opacity-0 animate-slide-up">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-primary bg-primary/10 px-4 py-2 rounded-full w-fit">
                <Globe2 className="h-4 w-4" />
                Africa&apos;s Largest B2B Trade Platform
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
                Source Products.{" "}
                <span className="text-primary">Ship Anywhere.</span>{" "}
                Grow Together.
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Connect with verified suppliers across Africa. From sourcing to doorstep delivery, 
                we handle cross-border logistics, customs, and secure payments—so you can focus on growing your business.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <SignedOut>
                  <SignInButton mode="modal">
                    <Button size="lg" className="gap-2 text-base px-8">
                      Start Sourcing
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/marketplace">
                    <Button size="lg" className="gap-2 text-base px-8">
                      Browse Marketplace
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </SignedIn>
                <Link href="/explore">
                  <Button size="lg" variant="outline" className="text-base px-8">
                    Explore Products
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Stats Card */}
            <div className="relative opacity-0 animate-slide-up animation-delay-200">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-3xl blur-3xl animate-pulse-glow" />
              <Card className="relative bg-card/80 backdrop-blur-sm border-2 shadow-2xl">
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 gap-8">
                    {stats.map((stat, index) => (
                      <div 
                        key={stat.label} 
                        className={`text-center p-4 rounded-xl ${index % 2 === 0 ? 'bg-primary/5' : 'bg-accent/10'}`}
                      >
                        <div className="text-3xl md:text-4xl font-bold text-primary">{stat.value}</div>
                        <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 pt-6 border-t">
                    <p className="text-sm text-muted-foreground text-center">
                      Trusted by businesses in {countries.length}+ countries
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4 justify-center">
                      {countries.slice(0, 6).map((country) => (
                        <span 
                          key={country} 
                          className="text-xs bg-secondary px-3 py-1.5 rounded-full font-medium"
                        >
                          {country}
                        </span>
                      ))}
                      <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
                        +{countries.length - 6} more
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <path 
              d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" 
              className="fill-background"
            />
          </svg>
        </div>
      </section>

      {/* Categories Section */}
      <section id="categories" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 opacity-0 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Explore Product Categories
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Source from thousands of verified suppliers across diverse industries
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
            {categories.map((category, index) => (
              <Link 
                key={category.name} 
                href="/explore"
                className={`group opacity-0 animate-slide-up`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card className="h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:-translate-y-1 cursor-pointer">
                  <CardContent className="p-6 flex flex-col items-center text-center">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <category.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-semibold text-base">{category.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{category.count}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link href="/explore">
              <Button variant="outline" size="lg" className="gap-2">
                View All Categories
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 opacity-0 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              How AfriConnect Works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              From discovery to delivery, we simplify cross-border B2B trade
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((item, index) => (
              <div 
                key={item.step} 
                className={`relative opacity-0 animate-slide-up`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/40 to-transparent" />
                )}
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                      <item.icon className="h-10 w-10 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 opacity-0 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Everything You Need to Trade
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful tools and services to streamline your cross-border procurement
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className={`group transition-all duration-300 hover:shadow-lg hover:border-primary/30 opacity-0 animate-slide-up`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <feature.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 pattern-overlay opacity-20" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center opacity-0 animate-slide-up">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Ready to Scale Your Business Across Africa?
            </h2>
            <p className="mt-6 text-lg opacity-90 max-w-xl mx-auto">
              Join thousands of businesses already sourcing products and expanding their reach 
              across the continent. Get started for free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="lg" variant="secondary" className="gap-2 text-base px-8">
                    Create Free Account
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/dashboard">
                  <Button size="lg" variant="secondary" className="gap-2 text-base px-8">
                    Go to Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </SignedIn>
              <Button size="lg" variant="outline" className="text-base px-8 border-primary-foreground/30 hover:bg-primary-foreground/10">
                Talk to Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-muted/30 border-y">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">Trade Assurance</div>
                <div className="text-sm text-muted-foreground">100% Payment Protection</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">Global Shipping</div>
                <div className="text-sm text-muted-foreground">50+ Countries Covered</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileCheck className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">Verified Suppliers</div>
                <div className="text-sm text-muted-foreground">All Sellers Vetted</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-8 w-8 text-primary" />
              <div>
                <div className="font-semibold">Secure Payments</div>
                <div className="text-sm text-muted-foreground">Multiple Options</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                  <Globe2 className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">AfriConnect</span>
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Africa&apos;s leading B2B marketplace connecting businesses across borders 
                with seamless trade, logistics, and payment solutions.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Marketplace</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="/explore" className="hover:text-foreground transition-colors">Browse Products</Link></li>
                <li><Link href="#categories" className="hover:text-foreground transition-colors">Categories</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Verified Suppliers</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Trade Shows</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Trade Assurance</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Logistics & Shipping</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Payment Solutions</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Quality Inspection</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Blog</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AfriConnect. All rights reserved.
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
