import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fid, username, displayName, pfpUrl, sobrietyStartDate } = body

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }

    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    // Check if user exists, if not create them
    let { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('fid', fid)
      .single()

    if (!user) {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          fid,
          username,
          display_name: displayName,
          pfp_url: pfpUrl,
          sobriety_start_date: sobrietyStartDate || today,
          total_points: 0,
          total_checkins: 0,
          current_streak: 0
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating user:', createError)
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
      }
      user = newUser
    }

    // Check if already checked in today
    const { data: existingCheckin } = await supabase
      .from('checkins')
      .select('*')
      .eq('fid', fid)
      .eq('checkin_date', today)
      .single()

    if (existingCheckin) {
      return NextResponse.json({ 
        error: 'Already checked in today',
        user,
        alreadyCheckedIn: true 
      }, { status: 200 })
    }

    // Create new check-in
    const pointsEarned = 10
    const { error: checkinError } = await supabase
      .from('checkins')
      .insert({
        user_id: user.id,
        fid,
        checkin_date: today,
        points_earned: pointsEarned
      })

    if (checkinError) {
      console.error('Error creating checkin:', checkinError)
      return NextResponse.json({ error: 'Failed to create checkin' }, { status: 500 })
    }

    // Update user stats
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        total_points: user.total_points + pointsEarned,
        total_checkins: user.total_checkins + 1,
        current_streak: user.current_streak + 1,
        username: username || user.username,
        display_name: displayName || user.display_name,
        pfp_url: pfpUrl || user.pfp_url,
        updated_at: new Date().toISOString()
      })
      .eq('fid', fid)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json({ error: 'Failed to update user stats' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      pointsEarned,
      user: updatedUser
    })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fid = searchParams.get('fid')

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 })
    }

    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]

    // Get user data
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('fid', fid)
      .single()

    if (!user) {
      return NextResponse.json({ user: null, checkedInToday: false })
    }

    // Check if checked in today
    const { data: todayCheckin } = await supabase
      .from('checkins')
      .select('*')
      .eq('fid', fid)
      .eq('checkin_date', today)
      .single()

    return NextResponse.json({
      user,
      checkedInToday: !!todayCheckin
    })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
