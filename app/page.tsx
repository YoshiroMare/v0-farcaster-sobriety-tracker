"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trophy, Star, Users, Home, Medal, Crown, CalendarDays, MapPin, BookOpen, ExternalLink } from 'lucide-react'
import { sdk, type Context } from "@farcaster/miniapp-sdk"

interface CheckinData {
  lastCheckin: string | null
  currentStreak: number
  totalPoints: number
  totalCheckins: number
  checkinDates: string[]
  sobrietyStartDate: string | null // Added sobriety start date
  isSetupComplete: boolean // Added setup completion flag
}

interface LeaderboardUser {
  id: string
  username: string
  currentStreak: number
  totalPoints: number
  rank: number
  isCurrentUser?: boolean
}

type View = "tracker" | "leaderboard"

export default function SobrietyTracker() {
  const [currentView, setCurrentView] = useState<View>("tracker")
  const [checkinData, setCheckinData] = useState<CheckinData>({
    lastCheckin: null,
    currentStreak: 0,
    totalPoints: 0,
    totalCheckins: 0,
    checkinDates: [],
    sobrietyStartDate: null, // Initialize new fields
    isSetupComplete: false,
  })
  const [isCheckedInToday, setIsCheckedInToday] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [setupMode, setSetupMode] = useState<"choose" | "start-today" | "custom-date">("choose")
  const [customStartDate, setCustomStartDate] = useState("")
  const [celebrationParticles, setCelebrationParticles] = useState<Array<{ id: number; delay: number }>>([])
  const [userContext, setUserContext] = useState<Context.FrameContext | null>(null)

  // Mock leaderboard data
  const generateLeaderboard = (): LeaderboardUser[] => {
    const mockUsers = [
      { id: "user1", username: "SoberWarrior", currentStreak: 127, totalPoints: 1850 },
      { id: "user2", username: "DayByDay", currentStreak: 89, totalPoints: 1340 },
      { id: "user3", username: "StrongMind", currentStreak: 76, totalPoints: 1180 },
      { id: "user4", username: "NewBeginning", currentStreak: 45, totalPoints: 720 },
      { id: "user5", username: "OneStepAhead", currentStreak: 34, totalPoints: 580 },
      { id: "user6", username: "FreshStart", currentStreak: 28, totalPoints: 450 },
      { id: "user7", username: "Determined", currentStreak: 21, totalPoints: 350 },
      { id: "user8", username: "RisingUp", currentStreak: 15, totalPoints: 280 },
    ]

    // Add current user to leaderboard
    const currentUser: LeaderboardUser = {
      id: "current",
      username: "You",
      currentStreak: checkinData.currentStreak,
      totalPoints: checkinData.totalPoints,
      rank: 0,
      isCurrentUser: true,
    }

    // Combine and sort by streak first, then by points
    const allUsers = [...mockUsers, currentUser].sort((a, b) => {
      if (a.currentStreak !== b.currentStreak) {
        return b.currentStreak - a.currentStreak
      }
      return b.totalPoints - a.totalPoints
    })

    // Assign ranks
    return allUsers.map((user, index) => ({
      ...user,
      rank: index + 1,
    }))
  }

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem("sobriety-tracker-data")
    if (savedData) {
      const parsed = JSON.parse(savedData)
      setCheckinData(parsed)

      // Check if already checked in today
      const today = new Date().toISOString().split("T")[0]
      setIsCheckedInToday(parsed.lastCheckin === today)
    }
  }, [])

  useEffect(() => {
    // Call SDK ready after the app is fully loaded and ready to display
    const initializeFarcasterSDK = async () => {
      try {
        const context = await sdk.context
        setUserContext(context)
        await sdk.actions.ready()
      } catch (error) {
        console.error("Failed to initialize Farcaster SDK:", error)
      }
    }

    initializeFarcasterSDK()
  }, [])

  useEffect(() => {
    localStorage.setItem("sobriety-tracker-data", JSON.stringify(checkinData))
  }, [checkinData])

  const calculateStreakFromStartDate = (startDate: string, checkinDates: string[]) => {
    const start = new Date(startDate)
    const today = new Date()
    const diffTime = today.getTime() - start.getTime()
    const totalDaysSinceStart = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // If they haven't checked in today, subtract 1
    const todayStr = today.toISOString().split("T")[0]
    const hasCheckedInToday = checkinDates.includes(todayStr)

    return hasCheckedInToday ? totalDaysSinceStart + 1 : totalDaysSinceStart
  }

  const canCheckinToday = () => {
    const today = new Date().toISOString().split("T")[0]
    return checkinData.lastCheckin !== today
  }

  const calculateStreak = (checkinDates: string[], newDate: string) => {
    if (checkinData.sobrietyStartDate) {
      return calculateStreakFromStartDate(checkinData.sobrietyStartDate, [...checkinDates, newDate])
    }

    // Original streak calculation for users who started fresh
    const sortedDates = [...checkinDates, newDate].sort().reverse()
    let streak = 0
    let currentDate = new Date(newDate)

    for (const dateStr of sortedDates) {
      const checkinDate = new Date(dateStr)
      const diffTime = currentDate.getTime() - checkinDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === streak) {
        streak++
        currentDate = checkinDate
      } else {
        break
      }
    }

    return streak
  }

  const handleStartToday = () => {
    const today = new Date().toISOString().split("T")[0]
    const newData: CheckinData = {
      ...checkinData,
      sobrietyStartDate: today,
      isSetupComplete: true,
      currentStreak: 0,
    }
    setCheckinData(newData)
  }

  const handleCustomStartDate = () => {
    if (!customStartDate) return

    const startDate = new Date(customStartDate)
    const today = new Date()

    if (startDate > today) {
      alert("Start date cannot be in the future")
      return
    }

    const initialStreak = calculateStreakFromStartDate(customStartDate, [])
    const estimatedPoints = Math.floor(initialStreak * 10) // Rough estimate

    const newData: CheckinData = {
      ...checkinData,
      sobrietyStartDate: customStartDate,
      isSetupComplete: true,
      currentStreak: initialStreak,
      totalPoints: estimatedPoints,
    }
    setCheckinData(newData)
  }

  const handleCheckin = async () => {
    if (!canCheckinToday()) return

    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const today = new Date().toISOString().split("T")[0]
    const newCheckinDates = [...checkinData.checkinDates, today]
    const newStreak = calculateStreak(checkinData.checkinDates, today)
    const pointsEarned = 10

    const newData: CheckinData = {
      ...checkinData,
      lastCheckin: today,
      currentStreak: newStreak,
      totalPoints: checkinData.totalPoints + pointsEarned,
      totalCheckins: checkinData.totalCheckins + 1,
      checkinDates: newCheckinDates,
    }

    setCheckinData(newData)
    setIsCheckedInToday(true)
    setIsLoading(false)
    setShowCelebration(true)

    const particles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      delay: Math.random() * 1000,
    }))
    setCelebrationParticles(particles)

    setTimeout(() => {
      setShowCelebration(false)
      setCelebrationParticles([])
    }, 3000)
  }

  const getMotivationalMessage = () => {
    const messages = [
      "Every day is a victory! Keep going strong.",
      "You're building something amazing, one day at a time.",
      "Your strength inspires others. Well done!",
      "Progress, not perfection. You're doing great!",
      "Each day sober is a day closer to your goals.",
      "You're proving to yourself that you can do this!",
      "Consistency is key, and you're nailing it!",
      "Your future self will thank you for today's choice.",
    ]

    if (checkinData.currentStreak === 0) {
      return "Welcome! Today is the first day of your journey."
    }

    return messages[checkinData.currentStreak % messages.length]
  }

  const getStreakBadge = () => {
    if (checkinData.currentStreak >= 1825) return { text: "5+ Year Legend", variant: "default" as const }
    if (checkinData.currentStreak >= 1460) return { text: "4 Year Master", variant: "default" as const }
    if (checkinData.currentStreak >= 1095) return { text: "3 Year Warrior", variant: "default" as const }
    if (checkinData.currentStreak >= 730) return { text: "2 Year Champion", variant: "default" as const }
    if (checkinData.currentStreak >= 365) return { text: "1 Year Champion", variant: "default" as const }
    if (checkinData.currentStreak >= 180) return { text: "6 Months Strong", variant: "default" as const }
    if (checkinData.currentStreak >= 90) return { text: "90 Days Strong", variant: "default" as const }
    if (checkinData.currentStreak >= 60) return { text: "2 Months", variant: "secondary" as const }
    if (checkinData.currentStreak >= 30) return { text: "One Month", variant: "secondary" as const }
    if (checkinData.currentStreak >= 15) return { text: "Two Weeks", variant: "secondary" as const }
    if (checkinData.currentStreak >= 7) return { text: "One Week", variant: "secondary" as const }
    if (checkinData.currentStreak >= 3) return { text: "3 Days Strong", variant: "outline" as const }
    if (checkinData.currentStreak >= 1) return { text: "Getting Started", variant: "outline" as const }
    return null
  }

  const formatLastCheckin = () => {
    if (!checkinData.lastCheckin) return "Never"
    const date = new Date(checkinData.lastCheckin)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />
    return <span className="text-muted-foreground font-semibold">#{rank}</span>
  }

  const getAllAchievements = () => {
    const achievements = []

    // Streak-based achievements
    const streakBadge = getStreakBadge()
    if (streakBadge) achievements.push(streakBadge)

    // Milestone achievements
    if (checkinData.currentStreak >= 100) achievements.push({ text: "Century Club", variant: "default" as const })
    if (checkinData.currentStreak >= 500) achievements.push({ text: "500 Day Hero", variant: "default" as const })
    if (checkinData.currentStreak >= 1000) achievements.push({ text: "1000 Day Legend", variant: "default" as const })
    if (checkinData.currentStreak >= 1500) achievements.push({ text: "1500 Day Master", variant: "default" as const })

    // Consistency achievements
    if (checkinData.totalCheckins >= 10) achievements.push({ text: "Consistent", variant: "secondary" as const })
    if (checkinData.totalCheckins >= 50) achievements.push({ text: "Dedicated", variant: "secondary" as const })
    if (checkinData.totalCheckins >= 100) achievements.push({ text: "Committed", variant: "secondary" as const })

    // Special achievements
    if (checkinData.currentStreak >= 365 && checkinData.totalCheckins >= 300) {
      achievements.push({ text: "Sobriety Champion", variant: "default" as const })
    }

    return achievements
  }

  const getLevel = () => {
    if (checkinData.currentStreak >= 1825)
      return { level: 10, title: "Sobriety Master", nextLevel: null, daysToNext: 0 }
    if (checkinData.currentStreak >= 1460)
      return { level: 9, title: "Legendary", nextLevel: 10, daysToNext: 1825 - checkinData.currentStreak }
    if (checkinData.currentStreak >= 1095)
      return { level: 8, title: "Champion", nextLevel: 9, daysToNext: 1460 - checkinData.currentStreak }
    if (checkinData.currentStreak >= 730)
      return { level: 7, title: "Warrior", nextLevel: 8, daysToNext: 1095 - checkinData.currentStreak }
    if (checkinData.currentStreak >= 365)
      return { level: 6, title: "Hero", nextLevel: 7, daysToNext: 730 - checkinData.currentStreak }
    if (checkinData.currentStreak >= 180)
      return { level: 5, title: "Strong", nextLevel: 6, daysToNext: 365 - checkinData.currentStreak }
    if (checkinData.currentStreak >= 90)
      return { level: 4, title: "Committed", nextLevel: 5, daysToNext: 180 - checkinData.currentStreak }
    if (checkinData.currentStreak >= 60)
      return { level: 3, title: "Steady", nextLevel: 4, daysToNext: 90 - checkinData.currentStreak }
    if (checkinData.currentStreak >= 30)
      return { level: 2, title: "Rising", nextLevel: 3, daysToNext: 60 - checkinData.currentStreak }
    if (checkinData.currentStreak >= 7)
      return { level: 1, title: "Starter", nextLevel: 2, daysToNext: 30 - checkinData.currentStreak }
    return { level: 0, title: "Beginning", nextLevel: 1, daysToNext: 7 - checkinData.currentStreak }
  }

  const leaderboard = generateLeaderboard()

  if (!checkinData.isSetupComplete) {
    if (setupMode === "choose") {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <img src="/images/sober-logo.png" alt="Sober" className="h-24 w-auto object-contain" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground retro-text-shadow">Welcome!</h1>
                <p className="text-muted-foreground text-lg">Let's set up your sobriety tracking</p>
              </div>
            </div>

            <div className="retro-card rounded-xl p-1">
              <Card className="border-0 bg-transparent">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-xl">
                    <CalendarDays className="h-6 w-6 text-accent" />
                    <span>When did you start?</span>
                  </CardTitle>
                  <CardDescription className="text-base">Choose how you'd like to begin tracking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <button
                    className="retro-button w-full h-16 rounded-lg text-primary-foreground font-semibold text-lg transition-all duration-200 hover:scale-105 hover:retro-glow"
                    onClick={() => setSetupMode("start-today")}
                  >
                    <div className="text-center relative z-10">
                      <div className="font-bold">Start Today</div>
                      <div className="text-sm opacity-90">Begin your journey now</div>
                    </div>
                  </button>

                  <button
                    className="w-full h-16 rounded-lg border-2 border-accent bg-secondary/50 text-secondary-foreground font-semibold text-lg transition-all duration-200 hover:scale-105 hover:bg-secondary/70 hover:border-accent/80"
                    onClick={() => setSetupMode("custom-date")}
                  >
                    <div className="text-center">
                      <div className="font-bold">I Already Started</div>
                      <div className="text-sm opacity-70">Enter my actual start date</div>
                    </div>
                  </button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )
    }

    if (setupMode === "start-today") {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <img src="/images/sober-logo.png" alt="Sober" className="h-24 w-auto object-contain" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground retro-text-shadow">Starting Today</h1>
                <p className="text-muted-foreground text-lg">Your journey begins now!</p>
              </div>
            </div>

            <div className="retro-card rounded-xl p-1 retro-glow">
              <Card className="border-0 bg-gradient-to-br from-accent/10 to-primary/10">
                <CardContent className="pt-6 text-center space-y-4">
                  <Trophy className="h-16 w-16 text-primary mx-auto drop-shadow-lg" />
                  <div>
                    <div className="text-2xl font-bold text-primary retro-text-shadow">Day 0</div>
                    <div className="text-base text-muted-foreground">Ready to start your sobriety journey</div>
                  </div>
                  <button
                    className="retro-button w-full h-12 rounded-lg text-primary-foreground font-bold text-lg transition-all duration-200 hover:scale-105"
                    onClick={handleStartToday}
                  >
                    <span className="relative z-10">Begin My Journey</span>
                  </button>
                </CardContent>
              </Card>
            </div>

            <Button variant="outline" onClick={() => setSetupMode("choose")} className="w-full">
              Back to Options
            </Button>
          </div>
        </div>
      )
    }

    if (setupMode === "custom-date") {
      return (
        <div className="min-h-screen bg-background p-4">
          <div className="max-w-md mx-auto space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <img src="/images/sober-logo.png" alt="Sober" className="h-24 w-auto object-contain" />
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground retro-text-shadow">Your Start Date</h1>
                <p className="text-muted-foreground text-lg">When did you begin your sobriety journey?</p>
              </div>
            </div>

            <div className="retro-card rounded-xl p-1">
              <Card className="border-0 bg-transparent">
                <CardHeader>
                  <CardTitle className="text-xl">Enter Your Sobriety Start Date</CardTitle>
                  <CardDescription className="text-base">
                    We'll calculate your current streak from this date
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-base font-semibold">
                      Start Date
                    </Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="h-12 text-base border-2 border-border focus:border-accent"
                    />
                  </div>

                  {customStartDate && (
                    <div className="retro-card rounded-lg p-1 retro-glow">
                      <Card className="border-0 bg-gradient-to-br from-accent/10 to-primary/10">
                        <CardContent className="pt-4">
                          <div className="text-center">
                            <div className="text-3xl font-bold text-primary retro-text-shadow">
                              {calculateStreakFromStartDate(customStartDate, [])}
                            </div>
                            <div className="text-sm text-muted-foreground">Days since you started</div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  <button
                    className="retro-button w-full h-12 rounded-lg text-primary-foreground font-bold text-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleCustomStartDate}
                    disabled={!customStartDate}
                  >
                    <span className="relative z-10">Continue with This Date</span>
                  </button>
                </CardContent>
              </Card>
            </div>

            <Button variant="outline" onClick={() => setSetupMode("choose")} className="w-full">
              Back to Options
            </Button>
          </div>
        </div>
      )
    }
  }

  if (currentView === "leaderboard") {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <img src="/images/sober-logo.png" alt="Sober" className="h-20 w-auto object-contain" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground retro-text-shadow flex items-center justify-center space-x-2">
                <Trophy className="h-8 w-8 text-primary drop-shadow-lg" />
                <span>Leaderboard</span>
              </h1>
              <p className="text-muted-foreground text-lg">Community champions</p>
            </div>
          </div>

          {userContext?.user && (
            <div className="retro-card rounded-xl p-1">
              <Card className="border-0 bg-transparent">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {userContext.user.pfpUrl && (
                        <img 
                          src={userContext.user.pfpUrl || "/placeholder.svg"} 
                          alt={userContext.user.displayName || userContext.user.username || "User"} 
                          className="w-10 h-10 rounded-full border-2 border-accent"
                        />
                      )}
                      <div>
                        <div className="font-bold text-lg text-foreground">
                          {userContext.user.displayName || userContext.user.username || "Anonymous"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          @{userContext.user.username || "unknown"}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      FID: {userContext.user.fid}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {leaderboard.find((u) => u.isCurrentUser) && (
            <div className="retro-card rounded-xl p-1 retro-glow">
              <Card className="border-0 bg-gradient-to-br from-accent/10 to-primary/10">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getRankIcon(leaderboard.find((u) => u.isCurrentUser)!.rank)}
                      <div>
                        <div className="font-bold text-lg text-accent-foreground">Your Rank</div>
                        <div className="text-sm text-muted-foreground">
                          {leaderboard.find((u) => u.isCurrentUser)!.currentStreak} days •{" "}
                          {leaderboard.find((u) => u.isCurrentUser)!.totalPoints} points
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      #{leaderboard.find((u) => u.isCurrentUser)!.rank}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="retro-card rounded-xl p-1">
            <Card className="border-0 bg-transparent">
              <CardHeader>
                <CardTitle className="text-xl">Top Performers</CardTitle>
                <CardDescription className="text-base">Ranked by current streak and total points</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary retro-text-shadow">{leaderboard.length}</div>
                    <div className="text-sm text-muted-foreground">Active Members</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-accent retro-text-shadow">
                      {Math.round(leaderboard.reduce((sum, user) => sum + user.currentStreak, 0) / leaderboard.length)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Streak</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="retro-card rounded-xl p-1">
            <Card className="border-0 bg-transparent">
              <CardHeader>
                <CardTitle className="text-xl">Community Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-3xl font-bold text-primary retro-text-shadow">{leaderboard.length}</div>
                    <div className="text-sm text-muted-foreground">Active Members</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-accent retro-text-shadow">
                      {Math.round(leaderboard.reduce((sum, user) => sum + user.currentStreak, 0) / leaderboard.length)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg Streak</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center space-x-4 pt-4">
            <button
              onClick={() => setCurrentView("tracker")}
              className="retro-button px-6 py-3 rounded-lg text-primary-foreground font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span className="relative z-10">Back to Tracker</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img src="/images/sober-logo.png" alt="Sober" className="h-24 w-auto object-contain" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground retro-text-shadow">Sobriety Tracker</h1>
            <p className="text-muted-foreground text-lg">One day at a time</p>
          </div>
        </div>

        {showCelebration && (
          <>
            <div className="retro-card rounded-xl p-1 retro-glow animate-bounce">
              <Card className="border-0 bg-gradient-to-r from-accent to-primary text-accent-foreground">
                <CardContent className="pt-6 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Star className="h-6 w-6 animate-spin text-yellow-300" />
                    <span className="font-bold text-lg retro-text-shadow animate-pulse">
                      🎉 Congratulations! Day {checkinData.currentStreak} complete! 🎉
                    </span>
                    <Star className="h-6 w-6 animate-spin text-yellow-300" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
              {celebrationParticles.map((particle) => (
                <div
                  key={particle.id}
                  className="absolute animate-ping"
                  style={{
                    left: `${20 + particle.id * 10}%`,
                    top: `${30 + (particle.id % 3) * 20}%`,
                    animationDelay: `${particle.delay}ms`,
                    animationDuration: "2s",
                  }}
                >
                  <div className="text-2xl">
                    {particle.id % 4 === 0 ? "🌟" : particle.id % 4 === 1 ? "✨" : particle.id % 4 === 2 ? "🎊" : "💫"}
                  </div>
                </div>
              ))}
            </div>

            <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40">
              <div className="animate-bounce text-4xl font-bold text-primary retro-text-shadow">+10 Points!</div>
            </div>
          </>
        )}

        <div className="retro-card rounded-xl p-1 retro-glow">
          <Card className="border-0 bg-transparent text-center">
            <CardHeader>
              <CardTitle className="text-7xl text-primary retro-text-shadow flex items-center justify-center space-x-3">
                <Trophy className="h-16 w-16 drop-shadow-lg" />
                <span>{checkinData.currentStreak}</span>
              </CardTitle>
              <CardDescription className="text-xl font-semibold">Days Sober</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-center justify-center space-x-3 mb-1">
                  <Star className="h-5 w-5 text-accent" />
                  <span className="text-2xl font-bold text-accent retro-text-shadow">Level {getLevel().level}</span>
                  <Star className="h-5 w-5 text-accent" />
                </div>
                <div className="text-base font-semibold text-muted-foreground mb-1">{getLevel().title}</div>
                {getLevel().nextLevel && (
                  <div className="text-xs text-muted-foreground">
                    {getLevel().daysToNext} days to Level {getLevel().nextLevel}
                  </div>
                )}
              </div>
              <div className="flex justify-center items-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent retro-text-shadow">{checkinData.totalCheckins}</div>
                  <div className="text-sm text-muted-foreground">Check-ins</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="retro-card rounded-xl p-1">
          <Card className="border-0 bg-gradient-to-br from-accent/10 to-primary/10">
            <CardContent className="pt-6">
              <blockquote className="text-center italic text-foreground text-lg font-medium retro-text-shadow">
                "{getMotivationalMessage()}"
              </blockquote>
            </CardContent>
          </Card>
        </div>

        <div className="retro-card rounded-xl p-1 retro-glow">
          <Card className="border-0 bg-transparent">
            <CardContent className="pt-6 text-center">
              {canCheckinToday() ? (
                <button
                  onClick={handleCheckin}
                  disabled={isLoading}
                  className="retro-button w-full h-16 rounded-lg text-primary-foreground font-bold text-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>Checking In...</span>
                      </>
                    ) : (
                      <>
                        <Trophy className="h-6 w-6" />
                        <span>Check In Today!</span>
                      </>
                    )}
                  </span>
                </button>
              ) : (
                <div className="w-full h-16 rounded-lg bg-black text-white font-bold text-xl flex items-center justify-center space-x-2 border-2 border-accent">
                  <Trophy className="h-6 w-6" />
                  <span>Checked In Today!</span>
                </div>
              )}
              <div className="mt-3 text-sm text-muted-foreground">Last check-in: {formatLastCheckin()}</div>
            </CardContent>
          </Card>
        </div>

        <div className="retro-card rounded-xl p-1">
          <Card className="border-0 bg-transparent">
            <CardHeader>
              <CardTitle className="text-xl">Achievements</CardTitle>
              <CardDescription className="text-base">{getAllAchievements().length} achievements earned</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {getAllAchievements().map((achievement, index) => (
                  <Badge key={index} variant={achievement.variant} className="text-sm px-3 py-1 font-semibold">
                    {achievement.text}
                  </Badge>
                ))}
                {checkinData.currentStreak < 15 && (
                  <Badge variant="outline" className="text-sm px-3 py-1 font-semibold opacity-50">
                    Two Weeks (Coming Soon)
                  </Badge>
                )}
                {checkinData.currentStreak >= 15 && checkinData.currentStreak < 30 && (
                  <Badge variant="outline" className="text-sm px-3 py-1 font-semibold opacity-50">
                    One Month (Coming Soon)
                  </Badge>
                )}
                {checkinData.currentStreak >= 30 && checkinData.currentStreak < 60 && (
                  <Badge variant="outline" className="text-sm px-3 py-1 font-semibold opacity-50">
                    Two Months (Coming Soon)
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-center space-y-4 pt-4">
          <button
            onClick={() => setCurrentView("leaderboard")}
            className="px-4 py-2 rounded-lg border-2 border-accent bg-secondary/50 text-secondary-foreground font-semibold transition-all duration-200 hover:scale-105 flex items-center space-x-2"
          >
            <Users className="h-4 w-4" />
            <span>Leaderboard</span>
          </button>

          <div className="flex flex-col space-y-3 w-full max-w-sm">
            <button
              onClick={() => window.open("https://na.org/meetingsearch/", "_blank")}
              className="w-full px-6 py-3 rounded-lg border-2 border-accent bg-secondary/50 text-secondary-foreground font-semibold transition-all duration-200 hover:scale-105 hover:bg-secondary/70 flex items-center justify-center space-x-2"
            >
              <MapPin className="h-4 w-4" />
              <span>Find a Support Group Near You</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </button>
            <button
              onClick={() => window.open("https://paragraph.com/@yoshiromare/is-addiction-really-a-disease", "_blank")}
              className="w-full px-6 py-3 rounded-lg border-2 border-accent bg-secondary/50 text-secondary-foreground font-semibold transition-all duration-200 hover:scale-105 hover:bg-secondary/70 flex items-center justify-center space-x-2"
            >
              <BookOpen className="h-4 w-4" />
              <span>Is Addiction Really a Disease?</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
