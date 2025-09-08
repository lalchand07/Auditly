import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { url, workspace_id } = await request.json()

  if (!url || !workspace_id) {
    return NextResponse.json(
      { error: 'Missing required fields: url and workspace_id' },
      { status: 400 }
    )
  }

  // Basic URL validation
  try {
    new URL(url)
  } catch (error) {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
  }

  // TODO: Add logic to check if the user is a member of the workspace.
  // For now, we trust the client sends a valid workspace_id the user has access to.

  // TODO: Add logic to check if the user has reached their scan limit based on their plan.

  const { data, error } = await supabase
    .from('scan_jobs')
    .insert([
      {
        url,
        workspace_id,
        status: 'pending',
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('Error creating scan job:', error)
    return NextResponse.json(
      { error: 'Failed to create scan job' },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}
