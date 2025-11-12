"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Globe, TrendingUp, Shield, Zap, Users, BarChart3, Sparkles, ArrowRight, Star, Map, Brain, Clock, Play } from "lucide-react"
import { TypingAnimator } from "@/components/typing-animator"
import { AnimatedLinesBackground } from "@/components/animated-lines-background"

export default function LandingPage() {
  const router = useRouter()

  const features = [
    {
      icon: Globe,
      title: "Global Intelligence",
      description: "Real-time monitoring of geopolitical events across the world with AI-powered categorization."
    },
    {
      icon: TrendingUp,
      title: "Strategic Analysis",
      description: "AI-driven significance scoring to prioritize critical news that matters most to you."
    },
    {
      icon: Shield,
      title: "Source Verification",
      description: "Built-in reliability assessment to ensure information accuracy and credibility."
    },
    {
      icon: Zap,
      title: "Instant Insights",
      description: "Get immediate AI-generated strategic intelligence on any breaking news story."
    },
    {
      icon: Users,
      title: "Persona Analysis",
      description: "Evaluate news impact from specific country perspectives with tailored recommendations."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Visual dashboards with significance charts and regional breakdowns for data-driven decisions."
    }
  ]

  const stats = [
    { value: "100+", label: "News Sources" },
    { value: "24/7", label: "Real-time Updates" },
    { value: "AI", label: "Powered Analysis" },
  ]

  const testimonials = [
    {
      name: "Dr. Sarah Chen",
      role: "Senior Intelligence Analyst",
      company: "Global Strategic Institute",
      content: "The AI-driven analysis has transformed how we monitor geopolitical events. The strategic significance scoring is remarkably accurate.",
      avatar: "👩‍💼"
    },
    {
      name: "Michael Rodriguez",
      role: "Foreign Policy Advisor",
      company: "International Affairs Council",
      content: "Persona analysis feature is a game-changer. It helps us understand events from multiple national perspectives simultaneously.",
      avatar: "👨‍💼"
    },
    {
      name: "Dr. Priya Patel",
      role: "Research Director",
      company: "Advanced Analytics Group",
      content: "The visual dashboards and real-time updates keep our team ahead of emerging global trends. Highly recommend!",
      avatar: "👩‍🔬"
    }
  ]

  const useCases = [
    "Foreign Policy Analysis",
    "Strategic Planning",
    "Risk Assessment",
    "Market Intelligence",
    "Research & Academics",
    "Media Monitoring"
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative">
      {/* Floating action button */}
        <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 2 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <Button
          onClick={() => router.push("/login")}
          className="h-14 w-14 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-2xl shadow-emerald-500/50 hover:shadow-emerald-600/70 transition-all duration-300 group"
        >
          <ArrowRight className="h-6 w-6 group-hover:scale-110 group-hover:rotate-[-45deg] transition-transform" />
        </Button>
      </motion.div>

      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-emerald-500/30 rounded-full"
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
              opacity: 0,
            }}
            animate={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10  overflow-hidden">
        {/* Animated lines background */}

        <div className="container mx-auto px-4 py-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Globe className="h-8 w-8 text-emerald-400 animate-pulse" />
                <Sparkles className="h-4 w-4 text-emerald-300 absolute -top-1 -right-1 animate-ping" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  Strategic Intelligence Hub
                </h1>
                <p className="text-xs text-slate-400">AI-Powered Analysis</p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/login")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300"
            >
              Launch Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container mx-auto px-4 py-24">
        {/* Background with world map and animated lines */}
        <div className="absolute inset-0 overflow-hidden rounded-lg">
          <AnimatedLinesBackground />
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto relative z-10"
        >
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="relative"
            >
              <Globe className="h-20 w-20 text-emerald-400/20" />
              <Globe className="h-12 w-12 text-emerald-400 absolute top-4 left-4" />
            </motion.div>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Strategic Intelligence
            </span>
            <br />
            <span className="text-slate-100">At Your Fingertips</span>
          </h1>

          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Transform geopolitical news into actionable intelligence with AI-powered analysis,
            strategic significance scoring, and real-time global monitoring.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Button
              size="lg"
              onClick={() => router.push("/login")}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 px-8 py-6 text-lg group"
            >
              <Zap className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Try Demo
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-emerald-500 transition-all duration-300 px-8 py-6 text-lg"
            >
              Learn More
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              >
                <div className="text-4xl font-bold text-emerald-400 mb-2">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Everything you need to stay ahead of global events with intelligent analysis
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition-all duration-300 h-full p-6 group hover:shadow-lg hover:shadow-emerald-500/10">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-lg blur-xl group-hover:bg-emerald-500/40 transition-all duration-300" />
                    <feature.icon className="h-10 w-10 text-emerald-400 relative z-10 group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-100 mb-2">{feature.title}</h3>
                    <p className="text-slate-400 text-sm leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Demo Preview Section */}
      <section className="relative z-10 container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              See It In Action
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Explore the interactive intelligence dashboard with real-time geopolitical analysis
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-slate-900/50 border-slate-800 overflow-hidden relative group hover:border-emerald-500/50 transition-all duration-300">
            <div className="aspect-video bg-slate-900 relative overflow-hidden">
              {/* Video placeholdeer - You can replace this with an actual video */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                {/* You can add an actual video here */}
                {/* <video autoPlay loop muted className="w-full h-full object-cover">
                  <source src="/demo-video.mp4" type="video/mp4" />
                </video> */}

                {/* Placeholder content */}
                <div className="text-center z-10 relative">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="inline-block mb-6"
                  >
                    <div className="w-24 h-24 rounded-full bg-emerald-600/20 backdrop-blur-sm border border-emerald-500/30 flex items-center justify-center mx-auto">
                      <Play className="h-12 w-12 text-emerald-400" fill="currentColor" />
                    </div>
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">Demo Video</h3>
                  <p className="text-slate-400 max-w-md">
                    Watch how Strategic Intelligence Hub transforms news into actionable insights
                  </p>
                </div>
              </div>

              {/* Video overlay with feature badges */}
              <div className="absolute bottom-6 left-6 right-6 z-20 flex items-end justify-between gap-4">
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-lg">
                    <Brain className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-300 text-sm">AI Analysis</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-lg">
                    <Clock className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-300 text-sm">24/7 Updates</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm border border-emerald-500/30 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-300 text-sm">Real-time Tracking</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-950/50 border-t border-slate-800">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left">
                  <h4 className="text-xl font-semibold text-white mb-1">Live Demo Available</h4>
                  <p className="text-slate-400 text-sm">Experience the full power of Strategic Intelligence Hub</p>
                </div>
                <Button
                  onClick={() => router.push("/login")}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300 group"
                >
                  Launch Interactive Demo
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Trusted by Experts
            </span>
          </h2>
          <p className="text-slate-400 text-lg">
            See what intelligence professionals say about our platform
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition-all duration-300 h-full p-6">
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-emerald-400 text-emerald-400" />
                  ))}
                </div>
                <p className="text-slate-300 mb-4 italic">"{testimonial.content}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                  <div className="text-3xl">{testimonial.avatar}</div>
                  <div>
                    <p className="font-semibold text-slate-100">{testimonial.name}</p>
                    <p className="text-sm text-slate-400">{testimonial.role}</p>
                    <p className="text-xs text-slate-500">{testimonial.company}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Use Cases */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h3 className="text-3xl md:text-4xl font-bold mb-4 text-slate-100">
            Perfect For
          </h3>
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-full text-sm text-slate-300 hover:border-emerald-500/50 transition-all duration-300"
              >
                {useCase}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-emerald-500/20 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent" />
            <div className="relative p-12 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="inline-block mb-6"
              >
                <Globe className="h-16 w-16 text-emerald-400" />
              </motion.div>

              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  Ready to Get Started?
                </span>
              </h2>

              <p className="text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
                Experience the future of geopolitical intelligence. Launch our interactive demo
                and see how AI transforms news into strategic insights.
              </p>

              <Button
                size="lg"
                onClick={() => router.push("/login")}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 px-8 py-6 text-lg group"
              >
                Launch Strategic Intelligence Hub
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-2 transition-transform" />
              </Button>
            </div>
          </Card>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 bg-slate-950/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Globe className="h-6 w-6 text-emerald-400" />
              <div>
                <p className="text-sm font-semibold text-slate-200">Strategic Intelligence Hub</p>
                <p className="text-xs text-slate-500">AI-Powered Geopolitical Analysis</p>
              </div>
            </div>
            <p className="text-sm text-slate-500">
              © 2024 All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
