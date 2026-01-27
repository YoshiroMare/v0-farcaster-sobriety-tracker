import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()

    // Get top 50 users ordered by total points
    const { data: leaderboard, error } = await supabase
      .from('users')
      .select('fid, username, display_name, pfp_url, total_points, total_checkins, current_streak, sobriety_start_date')
      .order('total_points', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }

    // Calculate days sober for each user
    const leaderboardWithDays = leaderboard.map((user, index) => {
      let daysSober = 0
      if (user.sobriety_start_date) {
        const startDate = new Date(user.sobriety_start_date)
        const today = new Date()
        daysSober = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      }
      
      return {
        rank: index + 1,
        fid: user.fid,
        username: user.username || 'Anonymous',
        displayName: user.display_name || user.username || 'Anonymous',
        pfpUrl: user.pfp_url,
        totalPoints: user.total_points,
        totalCheckins: user.total_checkins,
        currentStreak: user.current_streak,
        daysSober
      }
    })

    return NextResponse.json({ leaderboard: leaderboardWithDays })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
